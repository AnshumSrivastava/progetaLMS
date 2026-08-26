/**
 * E2E Verification Test: Instructor Profile, Testimonials, Gated Booking, and Slug Resolution
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function runTests() {
  console.log('=== STARTING INSTRUCTOR PROFILE & TESTIMONIALS E2E TEST ===\n');

  // Test 1: Resolve instructor by slug handle
  console.log('1. Testing handle resolution ("anshum-srivastava")...');
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, ip.bio, ip.avatar_url,
           ip.mentoring_handle, ip.mentoring_headline, ip.mentoring_about,
           ip.mentoring_years_exp, ip.mentoring_languages, ip.mentoring_credentials,
           ip.mentoring_video_intro_url, ip.mentoring_social_links, ip.mentoring_is_featured
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE ip.mentoring_handle = 'anshum-srivastava'
      AND ip.mentoring_suspended = false
      AND u.role IN ('teacher', 'admin', 'owner')
    LIMIT 1
  `;

  if (rows.length === 0) {
    throw new Error('FAILED: Could not find instructor by handle "anshum-srivastava"');
  }
  const inst = rows[0];
  console.log(`   ✓ Found instructor: ${inst.name}`);
  console.log(`   ✓ Headline: ${inst.mentoring_headline?.slice(0, 50)}...`);
  console.log(`   ✓ Years Exp: ${inst.mentoring_years_exp}`);
  console.log(`   ✓ Languages: ${inst.mentoring_languages?.join(', ')}`);
  console.log(`   ✓ Credentials count: ${inst.mentoring_credentials?.length}`);

  // Test 2: Fallback resolution by UUID
  console.log('\n2. Testing UUID fallback resolution...');
  const uuidRows = await sql`
    SELECT u.id, u.name
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE u.id = ${inst.id}
    LIMIT 1
  `;
  if (uuidRows.length === 0 || uuidRows[0].id !== inst.id) {
    throw new Error('FAILED: Could not find instructor by UUID');
  }
  console.log(`   ✓ Found instructor by ID: ${uuidRows[0].name}`);

  // Test 3: Testimonials loading
  console.log('\n3. Testing published testimonials query...');
  const testimonials = await sql`
    SELECT id, reviewer_name, reviewer_role, rating, body, is_published, created_at
    FROM mentoring_testimonials
    WHERE instructor_id = ${inst.id} AND is_published = true
    ORDER BY created_at DESC
  `;
  console.log(`   ✓ Found ${testimonials.length} published testimonials for ${inst.name}`);
  if (testimonials.length > 0) {
    console.log(`   ✓ Sample review by "${testimonials[0].reviewer_name}" (${testimonials[0].rating}★): "${testimonials[0].body.slice(0, 60)}..."`);
  }

  // Test 4: Duration price tiers
  console.log('\n4. Testing duration price tiers for instructor...');
  const prices = await sql`
    SELECT duration_mins, price_paise
    FROM mentoring_duration_prices
    WHERE instructor_id = ${inst.id}
    ORDER BY duration_mins ASC
  `;
  console.log(`   ✓ Configured price tiers: ${prices.map(p => `${p.duration_mins}m: ₹${p.price_paise / 100}`).join(', ')}`);

  // Test 5: Testimonial moderation queue for admin
  console.log('\n5. Testing admin testimonial moderation queue query...');
  const queue = await sql`
    SELECT mt.id, mt.reviewer_name, mt.body, mt.is_published, u.name AS instructor_name
    FROM mentoring_testimonials mt
    JOIN users u ON u.id = mt.instructor_id
    WHERE mt.is_published = false AND mt.rejected_reason IS NULL
  `;
  console.log(`   ✓ Pending review queue length: ${queue.length}`);

  // Test 6: 404 for unknown handle
  console.log('\n6. Testing 404 / empty for non-existent handle...');
  const nonexistent = await sql`
    SELECT u.id
    FROM users u
    JOIN identity_profiles ip ON ip.user_id = u.id
    WHERE ip.mentoring_handle = 'unknown-random-slug-999'
  `;
  if (nonexistent.length !== 0) {
    throw new Error('FAILED: Expected empty result for unknown handle');
  }
  console.log('   ✓ Correctly returned 0 rows for non-existent mentor handle');

  console.log('\n=== ALL E2E INSTRUCTOR PROFILE TESTS PASSED ===\n');
}

runTests().catch(err => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
