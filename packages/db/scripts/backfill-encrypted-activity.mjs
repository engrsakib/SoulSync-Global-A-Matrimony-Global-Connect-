/**
 * Idempotent backfill: encrypt legacy plaintext UserActivityLog + AuditEvent payloads.
 * Requires BIODATA_MASTER_KEY and DATABASE_URL in the environment.
 *
 * Usage: node packages/db/scripts/backfill-encrypted-activity.mjs
 */
import { createCipheriv, createHmac, randomBytes } from 'node:crypto';
import { PrismaClient } from '@prisma/client';

const BATCH = 200;
const SEARCH_CONTEXT = 'soulsync:activity-log:search:v1';

function resolveMasterKey() {
  const raw = process.env.BIODATA_MASTER_KEY;
  if (!raw) {
    throw new Error('BIODATA_MASTER_KEY is required');
  }
  const key = Buffer.from(raw, 'base64url');
  if (key.length !== 32) {
    throw new Error('BIODATA_MASTER_KEY must decode to 32 bytes');
  }
  return key;
}

function deriveSearchKey(master) {
  return createHmac('sha256', master).update(SEARCH_CONTEXT).digest();
}

function tokenize(text) {
  return [
    ...new Set(
      text
        .toLowerCase()
        .normalize('NFKD')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .map((w) => w.trim())
        .filter((w) => w.length >= 2),
    ),
  ];
}

function blindTokens(payload, searchKey) {
  const parts = [payload.title, payload.body ?? ''].filter(Boolean);
  const meta = payload.metadata ?? {};
  for (const key of ['sectionId', 'communityName', 'communitySlug']) {
    if (typeof meta[key] === 'string') {
      parts.push(meta[key]);
    }
  }
  const words = tokenize(parts.join(' '));
  return [...new Set(words.map((w) => createHmac('sha256', searchKey).update(w).digest('hex')))];
}

function encryptJson(envelope, masterKey) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', masterKey, iv);
  const plain = JSON.stringify(envelope);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, tag, enc]).toString('base64url');
  return { _encrypted: `enc:v1:${packed}` };
}

async function main() {
  const master = resolveMasterKey();
  const searchKey = deriveSearchKey(master);
  const prisma = new PrismaClient();

  let activityDone = 0;
  for (;;) {
    const rows = await prisma.userActivityLog.findMany({
      where: { payloadEnc: null, title: { not: null } },
      take: BATCH,
      orderBy: { id: 'asc' },
    });
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      const envelope = {
        title: row.title,
        body: row.body,
        linkPath: row.linkPath ?? '/dashboard',
        metadata: row.metadata,
        schemaVersion: 1,
      };
      const payloadEnc = encryptJson(envelope, master);
      const searchTokens = blindTokens(envelope, searchKey);
      await prisma.userActivityLog.update({
        where: { id: row.id },
        data: { payloadEnc, searchTokens, title: null, body: null, linkPath: null, metadata: null },
      });
      activityDone += 1;
    }
    console.log(`UserActivityLog backfilled: ${activityDone}`);
  }

  let auditDone = 0;
  for (;;) {
    const rows = await prisma.auditEvent.findMany({
      where: {
        payloadEnc: null,
        OR: [{ linkPath: { not: null } }, { metadata: { not: null } }, { ipAddress: { not: null } }],
      },
      take: BATCH,
      orderBy: { id: 'asc' },
    });
    if (rows.length === 0) {
      break;
    }
    for (const row of rows) {
      const envelope = {
        title: row.type.replaceAll('_', ' ').toLowerCase(),
        linkPath: row.linkPath ?? '/dashboard',
        metadata: row.metadata,
        ipAddress: row.ipAddress,
        userAgent: row.userAgent,
        schemaVersion: 1,
      };
      const payloadEnc = encryptJson(envelope, master);
      const searchTokens = blindTokens(envelope, searchKey);
      await prisma.auditEvent.update({
        where: { id: row.id },
        data: {
          payloadEnc,
          searchTokens,
          linkPath: null,
          metadata: null,
          ipAddress: null,
          userAgent: null,
        },
      });
      auditDone += 1;
    }
    console.log(`AuditEvent backfilled: ${auditDone}`);
  }

  await prisma.$disconnect();
  console.log('Backfill complete', { activityDone, auditDone });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
