import { config } from 'dotenv';
import { createHmac } from 'node:crypto';
import { resolve } from 'node:path';
import bcrypt from 'bcryptjs';
import { formatLoginCode, generateLoginCode, normalizeLoginCode } from '@soulsync/shared-types';
import {
  createPrismaClient,
  Religion,
  UserBadgeType,
  UserRole,
  UserStatus,
} from './index';

config({ path: resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = createPrismaClient(connectionString);

const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

function loginCodePepper(): string {
  return process.env.LOGIN_CODE_PEPPER ?? process.env.JWT_SECRET ?? 'dev-login-code-pepper-min-16';
}

function loginCodeFingerprint(code: string): string {
  return createHmac('sha256', loginCodePepper()).update(normalizeLoginCode(code)).digest('hex');
}

async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS);
}

async function hashLoginCode(code: string): Promise<string> {
  return bcrypt.hash(normalizeLoginCode(code), BCRYPT_ROUNDS);
}

async function main() {
  const tenant = await prisma.tenant.upsert({
    where: { slug: 'demo' },
    update: {},
    create: {
      slug: 'demo',
      name: 'SoulSync Demo Community',
      supportedReligions: [Religion.ISLAM, Religion.HINDUISM, Religion.CHRISTIANITY],
      defaultLocale: 'en',
      currency: 'USD',
      settings: { theme: 'default' },
    },
  });

  const adminEmail = 'admin@soulsync.local';
  const passwordHash = await hashPassword('ChangeMe123!');
  const adminLoginCode = generateLoginCode();
  const loginCodeFingerprintValue = loginCodeFingerprint(adminLoginCode);
  const loginCodeHash = await hashLoginCode(adminLoginCode);

  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: adminEmail,
      },
    },
    update: {
      username: 'admin',
      loginCodeFingerprint: loginCodeFingerprintValue,
      loginCodeHash,
    },
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      username: 'admin',
      loginCodeFingerprint: loginCodeFingerprintValue,
      loginCodeHash,
      role: UserRole.TENANT_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
      credential: {
        create: {
          passwordHash,
        },
      },
      twoFactor: {
        create: {
          isEnabled: false,
        },
      },
      badges: {
        create: {
          badgeType: UserBadgeType.PROFILE_VERIFIED,
          isGranted: true,
          verifiedAt: new Date(),
        },
      },
    },
  });

  await prisma.userCredential.upsert({
    where: { userId: admin.id },
    update: { passwordHash },
    create: {
      userId: admin.id,
      passwordHash,
    },
  });

  await prisma.userTwoFactor.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      isEnabled: false,
    },
  });

  await prisma.creditWallet.upsert({
    where: { userId: admin.id },
    update: {},
    create: {
      userId: admin.id,
      tenantId: tenant.id,
      balance: 100,
      currency: 'USD',
    },
  });

  console.log(`Seeded tenant "${tenant.slug}" and admin ${adminEmail}`);
  console.log(`Admin login code (save securely): ${formatLoginCode(adminLoginCode)}`);
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
