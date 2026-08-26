/**
 * Migration: Add mentoring_enabled column (default false) to identity_profiles
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('=== RUNNING MENTORING OPT-IN MIGRATION ===\n');

  console.log('1. Adding mentoring_enabled column to identity_profiles...');
  await sql`
    ALTER TABLE identity_profiles
    ADD COLUMN IF NOT EXISTS mentoring_enabled boolean NOT NULL DEFAULT false
  `;
  await sql`CREATE INDEX IF NOT EXISTS ip_mentoring_enabled_idx ON identity_profiles (mentoring_enabled)`;
  console.log('   → mentoring_enabled column & index added.');

  // Set mentoring_enabled = true for instructors who have configured handles (Anshum Srivastava, Mananpreet Kaur, Anmol Madan)
  console.log('\n2. Enabling mentoring for trainers who have active availability & profiles...');
  const updated = await sql`
    UPDATE identity_profiles
    SET mentoring_enabled = true
    WHERE mentoring_handle IN ('anshum-srivastava', 'mananpreet-kaur', 'anmol-madan')
    RETURNING user_id, mentoring_handle, mentoring_enabled
  `;
  console.log(`   → Enabled mentoring for ${updated.length} active practitioners:`, updated.map(u => u.mentoring_handle));

  console.log('\n=== MIGRATION COMPLETE ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
