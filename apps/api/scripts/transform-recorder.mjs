import fs from 'node:fs';

const path =
  'E:/@web devlopment/jobs/peronal works/SoulSync Global/apps/api/src/activity-log/activity-log.recorder.ts';
let s = fs.readFileSync(path, 'utf8');

if (!s.includes("activityPayload")) {
  s = s.replace(
    "import type { ActivityLogWriteEntry, AuditLogWriteEntry } from './activity-log.types';",
    "import type { ActivityLogWriteEntry, AuditLogWriteEntry } from './activity-log.types';\nimport { activityPayload } from './activity-log.recorder.helpers';",
  );
}

s = s.replace(
  /const merged: AuditLogWriteEntry = ctx[\s\S]*?this\.publisher\.record/,
  `const auditEntry: AuditLogWriteEntry = ctx
      ? {
          ...audit,
          payload: {
            ...audit.payload,
            ipAddress: ctx.ipAddress ?? audit.payload.ipAddress,
            userAgent: ctx.userAgent ?? audit.payload.userAgent,
          },
        }
      : audit;
    this.publisher.record`,
);

function transformEntryObject(objText) {
  if (objText.includes('payload:')) {
    return objText;
  }
  const title = objText.match(/\n\s+title: ([^\n]+),/)?.[1];
  const body = objText.match(/\n\s+body: ([^\n]+),/)?.[1];
  const linkPath = objText.match(/\n\s+linkPath: ([^\n]+),/)?.[1];
  if (!title || !linkPath) {
    return objText;
  }
  let payloadInner = `title: ${title}, linkPath: ${linkPath}`;
  if (body) {
    payloadInner += `, body: ${body}`;
  }
  const metadata = objText.match(/\n\s+metadata: ([^\n]+),/);
  if (metadata) {
    payloadInner += `, metadata: ${metadata[1]}`;
  }
  let out = objText
    .replace(/\n\s+title: [^\n]+,\n/, `\n        payload: activityPayload({ ${payloadInner} }),\n`)
    .replace(/\n\s+body: [^\n]+,\n/, '')
    .replace(/\n\s+linkPath: [^\n]+,\n/, '')
    .replace(/\n\s+metadata: [^\n]+,\n/, '');
  return out;
}

// Member/audit entry objects inside arrays
s = s.replace(/\{\n(\s+tenantId:[\s\S]*?\n\s+\},)/g, (full) => {
  if (!full.includes('type: UserActivityType') && !full.includes('type: input.type')) {
    return full;
  }
  return transformEntryObject(full);
});

function transformAuditCall(block) {
  if (block.includes('payload:')) {
    return block;
  }
  const linkPath = block.match(/\n\s+linkPath: ([^\n]+),/)?.[1];
  const metadata = block.match(/\n\s+metadata: ([^\n]+),/)?.[1];
  const typeMatch = block.match(/\n\s+type: (AuditEventType\.[^\n]+|userActivityToAuditType\([^\n]+\)),/);
  if (!typeMatch) {
    return block;
  }
  let title = "'Audit event'";
  if (block.includes('AUTH_LOGIN')) title = "'Signed in'";
  else if (block.includes('AUTH_LOGIN_FAILED')) title = "'Sign-in failed'";
  else if (block.includes('AUTH_REFRESH')) title = "'Session refreshed'";
  else if (block.includes('AUTH_REFRESH_FAILED')) title = "'Session refresh failed'";
  else if (block.includes('BIODATA_VIEWED')) title = "'Biodata viewed'";
  else if (block.includes('BIODATA_PRIVACY')) title = "'Updated biodata privacy settings'";

  let payloadInner = `title: ${title}`;
  if (linkPath) payloadInner += `, linkPath: ${linkPath}`;
  if (metadata) payloadInner += `, metadata: ${metadata}`;

  let out = block
    .replace(/\n\s+linkPath: [^\n]+,\n/, `\n        payload: activityPayload({ ${payloadInner} }),\n`)
    .replace(/\n\s+metadata: [^\n]+,\n/, '');
  if (!out.includes('payload:')) {
    out = out.replace(
      /(\n\s+type: [^\n]+,\n)/,
      `$1        payload: activityPayload({ ${payloadInner} }),\n`,
    );
  }
  return out;
}

s = s.replace(
  /\{\n\s+tenantId:[\s\S]*?\n\s+type: AuditEventType[\s\S]*?\n\s+\}/g,
  (m) => transformAuditCall(m),
);

s = s.replace(
  /\{\n\s+tenantId:[\s\S]*?\n\s+type: userActivityToAuditType[\s\S]*?\n\s+\}/g,
  (m) => transformAuditCall(m),
);

fs.writeFileSync(path, s);
console.log('done');
