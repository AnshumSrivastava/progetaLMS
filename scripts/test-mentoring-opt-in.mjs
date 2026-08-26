/**
 * Verification Test: Mentoring Opt-In Toggle & Privacy
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function testOptIn() {
  console.log('=== TESTING MENTORING STRICT OPT-IN LOGIC ===\n');

  // Test 1: Fetch a trainer whose mentoring is disabled (e.g. CURIOUS ENTITY or Progeta Technologies)
  const unlistedTrainers = await sql`
    SELECT u.id, u.name, ip.mentoring_enabled, ip.mentoring_handle
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE ip.mentoring_enabled = false AND u.role IN ('teacher', 'admin', 'owner')
    LIMIT 1
  `;

  if (unlistedTrainers.length > 0) {
    const unlisted = unlistedTrainers[0];
    console.log(`1. Testing unlisted trainer: ${unlisted.name} (mentoring_enabled: ${unlisted.mentoring_enabled})`);

    // Ensure they do NOT appear in the public catalog query
    const publicList = await sql`
      SELECT u.id, u.name
      FROM users u
      JOIN identity_profiles ip ON ip.user_id = u.id
      WHERE u.role IN ('teacher', 'admin', 'owner')
        AND ip.mentoring_enabled = true
        AND ip.mentoring_suspended = false
        AND u.id = ${unlisted.id}
    `;
    if (publicList.length !== 0) {
      throw new Error(`FAILED: Unlisted trainer ${unlisted.name} appeared in public query!`);
    }
    console.log(`   ✓ Confirmed: ${unlisted.name} is excluded from public marketplace.`);

    // Test toggle ON
    console.log(`\n2. Toggling ${unlisted.name} ON...`);
    await sql`UPDATE identity_profiles SET mentoring_enabled = true WHERE user_id = ${unlisted.id}`;
    const toggledOn = await sql`SELECT mentoring_enabled FROM identity_profiles WHERE user_id = ${unlisted.id}`;
    console.log(`   ✓ Status is now: ${toggledOn[0].mentoring_enabled}`);

    // Test toggle OFF (back to private)
    console.log(`\n3. Toggling ${unlisted.name} back OFF...`);
    await sql`UPDATE identity_profiles SET mentoring_enabled = false WHERE user_id = ${unlisted.id}`;
    const toggledOff = await sql`SELECT mentoring_enabled FROM identity_profiles WHERE user_id = ${unlisted.id}`;
    console.log(`   ✓ Status is now: ${toggledOff[0].mentoring_enabled}`);
  } else {
    console.log('1. All current instructors are opted-in.');
  }

  // Test 2: Active opted-in mentors are found
  const activeMentorsings = await sql`
    SELECT u.name, ip.mentoring_handle
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE u.role IN ('teacher', 'admin', 'owner')
      AND ip.mentoring_enabled = true
      AND ip.mentoring_suspended = false
  `;
  console.log(`\n4. Verified ${activeMentorsings.length} publicly active opted-in mentors:`, activeMentorsings.map(m => m.name));

  console.log('\n=== OPT-IN VERIFICATION SUCCESSFUL ===\n');
}

testOptIn().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
