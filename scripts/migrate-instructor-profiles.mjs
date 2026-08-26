/**
 * Migration: Instructor Profile Fields + Testimonials Table
 *
 * Adds:
 *  - mentoring_handle, mentoring_headline, mentoring_about,
 *    mentoring_years_exp, mentoring_languages, mentoring_credentials,
 *    mentoring_video_intro_url, mentoring_social_links, mentoring_is_featured
 *    to identity_profiles
 *  - mentoring_testimonials table
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log('=== RUNNING INSTRUCTOR PROFILE MIGRATION ===\n');

  // --- 1. Add new columns to identity_profiles (all nullable/have defaults, safe for zero downtime) ---
  console.log('1. Adding profile columns to identity_profiles...');
  await sql`ALTER TABLE identity_profiles
    ADD COLUMN IF NOT EXISTS mentoring_handle         text UNIQUE,
    ADD COLUMN IF NOT EXISTS mentoring_headline        text,
    ADD COLUMN IF NOT EXISTS mentoring_about           text,
    ADD COLUMN IF NOT EXISTS mentoring_years_exp       integer,
    ADD COLUMN IF NOT EXISTS mentoring_languages       text[]  NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS mentoring_credentials     jsonb   NOT NULL DEFAULT '[]',
    ADD COLUMN IF NOT EXISTS mentoring_video_intro_url text,
    ADD COLUMN IF NOT EXISTS mentoring_social_links    jsonb   NOT NULL DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS mentoring_is_featured     boolean NOT NULL DEFAULT false
  `;
  console.log('   → Profile columns added.');

  // Index on handle for slug resolution
  await sql`CREATE INDEX IF NOT EXISTS ip_handle_idx ON identity_profiles (mentoring_handle)`;
  console.log('   → Handle index created.');

  // --- 2. Create mentoring_testimonials table ---
  console.log('\n2. Creating mentoring_testimonials table...');
  await sql`
    CREATE TABLE IF NOT EXISTS mentoring_testimonials (
      id               text PRIMARY KEY,
      instructor_id    text NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      booking_id       text REFERENCES mentoring_bookings(id) ON DELETE SET NULL,
      student_id       text REFERENCES users(id) ON DELETE SET NULL,
      reviewer_name    text NOT NULL,
      reviewer_role    text,
      reviewer_avatar  text,
      rating           integer NOT NULL DEFAULT 5,
      body             text NOT NULL,
      is_published     boolean NOT NULL DEFAULT false,
      rejected_reason  text,
      created_at       timestamptz NOT NULL DEFAULT now(),
      updated_at       timestamptz NOT NULL DEFAULT now()
    )
  `;
  console.log('   → Table created.');

  await sql`CREATE INDEX IF NOT EXISTS m_testimonials_instructor_idx ON mentoring_testimonials (instructor_id)`;
  await sql`CREATE INDEX IF NOT EXISTS m_testimonials_published_idx ON mentoring_testimonials (is_published, instructor_id)`;
  console.log('   → Indexes created.');

  // --- 3. Verify ---
  const cols = await sql`
    SELECT column_name
    FROM information_schema.columns
    WHERE table_name = 'identity_profiles'
    AND column_name LIKE 'mentoring_%'
    ORDER BY column_name
  `;
  console.log('\n3. Verified new identity_profiles columns:');
  cols.forEach(c => console.log(`   → ${c.column_name}`));

  const tables = await sql`
    SELECT table_name FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'mentoring_testimonials'
  `;
  console.log(`\n4. mentoring_testimonials exists: ${tables.length > 0}`);

  console.log('\n=== MIGRATION COMPLETE ===');
}

migrate().catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
