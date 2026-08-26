import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { createId } from '@paralleldrive/cuid2';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Seeding mentoring availability and pricing...');

  // 1. Find instructors or admins
  const instructors = await sql`SELECT id, name, email, role FROM users WHERE role IN ('teacher', 'admin', 'owner') ORDER BY created_at ASC;`;
  console.log(`Found ${instructors.length} instructors/admins.`);

  if (instructors.length === 0) {
    console.log('No instructors found to seed.');
    return;
  }

  // 2. Add rich profiles for instructors
  for (const inst of instructors) {
    let bio = 'Senior Security Engineer & Cloud Architect | AWS & Kubernetes Security | 8+ yrs experience';
    if (inst.email.includes('admin')) {
      bio = 'Principal Security Practitioner & Lead Architect | Threat Modeling & AppSec';
    }

    await sql`
      INSERT INTO identity_profiles (id, user_id, display_name, bio, timezone, mentoring_suspended, created_at, updated_at)
      VALUES (${createId()}, ${inst.id}, ${inst.name || 'Instructor'}, ${bio}, 'Asia/Kolkata', false, NOW(), NOW())
      ON CONFLICT (user_id) DO UPDATE SET
        bio = EXCLUDED.bio,
        mentoring_suspended = false,
        updated_at = NOW();
    `;

    // 3. Duration pricing: 30 min (₹800), 45 min (₹1,200), 60 min (₹1,500)
    await sql`
      INSERT INTO mentoring_duration_prices (id, instructor_id, duration_mins, price_paise, updated_at)
      VALUES 
        (${createId()}, ${inst.id}, 30, 80000, NOW()),
        (${createId()}, ${inst.id}, 45, 120000, NOW()),
        (${createId()}, ${inst.id}, 60, 150000, NOW())
      ON CONFLICT (instructor_id, duration_mins) DO UPDATE SET
        price_paise = EXCLUDED.price_paise,
        updated_at = NOW();
    `;

    // 4. Create availability windows for today, tomorrow, and future days
    const now = new Date();
    for (let dayOffset = 0; dayOffset <= 7; dayOffset++) {
      const targetDate = new Date(now.getTime() + dayOffset * 24 * 60 * 60 * 1000);
      const dateStr = targetDate.toISOString().split('T')[0];

      // Window 1: Morning 10:00 - 14:00
      await sql`
        INSERT INTO mentoring_availability (id, instructor_id, date, window_start, window_end, allowed_durations, meeting_url, status, created_at)
        VALUES (
          ${createId()},
          ${inst.id},
          ${dateStr},
          '10:00',
          '14:00',
          ARRAY[30, 45, 60]::INTEGER[],
          'https://meet.google.com/pro-mentoring-room',
          'active',
          NOW()
        );
      `;

      // Window 2: Evening 18:00 - 21:00
      await sql`
        INSERT INTO mentoring_availability (id, instructor_id, date, window_start, window_end, allowed_durations, meeting_url, status, created_at)
        VALUES (
          ${createId()},
          ${inst.id},
          ${dateStr},
          '18:00',
          '21:00',
          ARRAY[30, 60]::INTEGER[],
          'https://meet.google.com/pro-mentoring-evening',
          'active',
          NOW()
        );
      `;
    }

    // 5. Create a promo coupon for this instructor
    await sql`
      INSERT INTO commerce_coupons (id, code, type, value, max_uses, uses_count, min_amount_paise, created_by, is_active, created_at)
      VALUES (${createId()}, 'MENTOR50', 'percent', 50, 20, 0, 0, ${inst.id}, true, NOW())
      ON CONFLICT (code) DO NOTHING;
    `;
    await sql`
      INSERT INTO commerce_coupons (id, code, type, value, max_uses, uses_count, min_amount_paise, created_by, is_active, created_at)
      VALUES (${createId()}, 'FREEMENTOR', 'percent', 100, 10, 0, 0, ${inst.id}, true, NOW())
      ON CONFLICT (code) DO NOTHING;
    `;
  }

  console.log('Mentoring data seeded successfully!');
}

run();
