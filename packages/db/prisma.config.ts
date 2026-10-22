import { config } from 'dotenv';
import { resolve } from 'node:path';
import { defineConfig } from 'prisma/config';

config({ path: resolve(__dirname, '../../.env') });

/** Prisma CLI needs a URL at config load time; `generate` does not connect. */
const databaseUrl =
  process.env.DATABASE_URL ??
  'postgresql://soulsync:soulsync_dev@localhost:5432/soulsync?schema=public';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: databaseUrl,
  },
});
