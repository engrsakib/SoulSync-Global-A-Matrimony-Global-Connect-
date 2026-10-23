import { config } from 'dotenv';
import { resolve } from 'node:path';
import pg from 'pg';

config({ path: resolve(import.meta.dirname, '../../../.env') });

const connectionString =
  process.env.DATABASE_URL ??
  'postgresql://soulsync:soulsync_dev@localhost:5432/soulsync?schema=public';

const client = new pg.Client({ connectionString });
await client.connect();
const result = await client.query(
  `SELECT migration_name, checksum, finished_at
   FROM "_prisma_migrations"
   WHERE migration_name LIKE '20261023%'
   ORDER BY finished_at`,
);
console.log(JSON.stringify(result.rows, null, 2));
await client.end();
