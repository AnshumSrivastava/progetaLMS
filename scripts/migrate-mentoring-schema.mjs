import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Migrating mentoring schema...');

  const statements = [
    // 0. Clean legacy tables if any
    `DROP TABLE IF EXISTS mentoring_bookings CASCADE;`,
    `DROP TABLE IF EXISTS mentoring_slots CASCADE;`,

    // 1. identity_profiles updates
    `ALTER TABLE identity_profiles ADD COLUMN IF NOT EXISTS mentoring_suspended BOOLEAN NOT NULL DEFAULT FALSE;`,
    `ALTER TABLE identity_profiles ADD COLUMN IF NOT EXISTS mentoring_price_bounds JSONB;`,

    // 2. mentoring_availability
    `CREATE TABLE IF NOT EXISTS mentoring_availability (
      id TEXT PRIMARY KEY,
      instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      date TEXT NOT NULL,
      window_start TEXT NOT NULL,
      window_end TEXT NOT NULL,
      allowed_durations INTEGER[] NOT NULL,
      meeting_url TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'active',
      cancelled_by TEXT REFERENCES users(id),
      cancel_reason TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
    );`,
    `CREATE INDEX IF NOT EXISTS m_avail_instructor_idx ON mentoring_availability(instructor_id);`,
    `CREATE INDEX IF NOT EXISTS m_avail_date_idx ON mentoring_availability(date);`,
    `CREATE INDEX IF NOT EXISTS m_avail_status_date_idx ON mentoring_availability(status, date);`,

    // 3. mentoring_duration_prices
    `CREATE TABLE IF NOT EXISTS mentoring_duration_prices (
      id TEXT PRIMARY KEY,
      instructor_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      duration_mins INTEGER NOT NULL,
      price_paise INTEGER NOT NULL DEFAULT 0,
      updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT m_prices_instructor_duration_uq UNIQUE (instructor_id, duration_mins)
    );`,
    `CREATE INDEX IF NOT EXISTS m_prices_instructor_idx ON mentoring_duration_prices(instructor_id);`,

    // 4. mentoring_bookings
    `CREATE TABLE IF NOT EXISTS mentoring_bookings (
      id TEXT PRIMARY KEY,
      availability_id TEXT NOT NULL REFERENCES mentoring_availability(id) ON DELETE CASCADE,
      student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      instructor_id TEXT NOT NULL REFERENCES users(id),
      starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
      ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
      duration_mins INTEGER NOT NULL,
      price_paise INTEGER NOT NULL DEFAULT 0,
      coupon_id TEXT REFERENCES commerce_coupons(id),
      discount_paise INTEGER NOT NULL DEFAULT 0,
      order_id TEXT REFERENCES commerce_orders(id),
      notes TEXT,
      status TEXT NOT NULL DEFAULT 'pending_payment',
      reminder_sent BOOLEAN NOT NULL DEFAULT FALSE,
      cancelled_by_role TEXT,
      created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
      CONSTRAINT m_bookings_avail_start_uq UNIQUE (availability_id, starts_at)
    );`,
    `CREATE INDEX IF NOT EXISTS m_bookings_student_idx ON mentoring_bookings(student_id);`,
    `CREATE INDEX IF NOT EXISTS m_bookings_instructor_idx ON mentoring_bookings(instructor_id);`,
    `CREATE INDEX IF NOT EXISTS m_bookings_avail_idx ON mentoring_bookings(availability_id);`,
    `CREATE INDEX IF NOT EXISTS m_bookings_status_starts_idx ON mentoring_bookings(status, starts_at);`,
    `CREATE INDEX IF NOT EXISTS m_bookings_reminder_idx ON mentoring_bookings(reminder_sent, starts_at);`
  ];

  for (const statement of statements) {
    try {
      if (sql.query) {
        await sql.query(statement);
      } else {
        await sql.raw(statement);
      }
      console.log('Executed:', statement.substring(0, 60).replace(/\n/g, ' ') + '...');
    } catch (err) {
      console.error('Migration error on statement:', statement.substring(0, 80).replace(/\n/g, ' '), err.message);
    }
  }

  console.log('Mentoring schema migration complete.');
}

run();
