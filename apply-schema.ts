import { config } from 'dotenv';
import pg from 'pg';
config();

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });

async function main() {
  console.log('Applying schema changes...');
  await pool.query('ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "is_self_paced_enabled" boolean DEFAULT true NOT NULL;');
  await pool.query('ALTER TABLE "assets" ADD COLUMN IF NOT EXISTS "is_live_batches_enabled" boolean DEFAULT false NOT NULL;');
  await pool.query('ALTER TABLE "cohorts" ADD COLUMN IF NOT EXISTS "price_paise" integer;');
  console.log('Schema changes applied successfully.');
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
