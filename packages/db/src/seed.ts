import { config } from 'dotenv';
import { resolve } from 'node:path';
import { createHash } from 'node:crypto';
import { createPrismaClient, Religion, UserRole, UserStatus } from './index';

config({ path: resolve(__dirname, '../../../.env') });

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL is required for seeding');
}

const prisma = createPrismaClient(connectionString);

function hashPassword(plain: string): string {
  return createHash('sha256').update(plain).digest('hex');
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
  const admin = await prisma.user.upsert({
    where: {
      tenantId_email: {
        tenantId: tenant.id,
        email: adminEmail,
      },
    },
    update: {},
    create: {
      tenantId: tenant.id,
      email: adminEmail,
      passwordHash: hashPassword('ChangeMe123!'),
      role: UserRole.TENANT_ADMIN,
      status: UserStatus.ACTIVE,
      emailVerifiedAt: new Date(),
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
}

main()
  .catch((error: unknown) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
