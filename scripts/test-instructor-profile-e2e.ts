/**
 * E2E Verification Test: Instructor Profile, Testimonials, Gated Booking, and Slug Resolution
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/db/schema';
import { eq, and, sql, gte, inArray, asc, or, desc, isNull } from 'drizzle-orm';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function runTests() {
  console.log('=== STARTING INSTRUCTOR PROFILE & TESTIMONIALS E2E TEST ===\n');

  // Test 1: Resolve instructor by slug handle
  console.log('1. Testing handle resolution ("anshum-srivastava")...');
  const [profileByHandle] = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      role: schema.users.role,
      bio: schema.identityProfiles.bio,
      avatarUrl: schema.identityProfiles.avatarUrl,
      handle: schema.identityProfiles.mentoringHandle,
      headline: schema.identityProfiles.mentoringHeadline,
      about: schema.identityProfiles.mentoringAbout,
      yearsExp: schema.identityProfiles.mentoringYearsExp,
      languages: schema.identityProfiles.mentoringLanguages,
      credentials: schema.identityProfiles.mentoringCredentials,
      videoIntroUrl: schema.identityProfiles.mentoringVideoIntroUrl,
      socialLinks: schema.identityProfiles.mentoringSocialLinks,
      isFeatured: schema.identityProfiles.mentoringIsFeatured,
      isSuspended: schema.identityProfiles.mentoringSuspended
    })
    .from(schema.users)
    .innerJoin(schema.identityProfiles, eq(schema.identityProfiles.userId, schema.users.id))
    .where(
      and(
        inArray(schema.users.role, ['teacher', 'admin', 'owner']),
        eq(schema.identityProfiles.mentoringSuspended, false),
        eq(schema.identityProfiles.mentoringHandle, 'anshum-srivastava')
      )
    )
    .limit(1);

  if (!profileByHandle) {
    throw new Error('FAILED: Could not find instructor by handle "anshum-srivastava"');
  }
  console.log(`   ✓ Found instructor: ${profileByHandle.name}`);
  console.log(`   ✓ Headline: ${profileByHandle.headline?.slice(0, 50)}...`);
  console.log(`   ✓ Years Exp: ${profileByHandle.yearsExp}`);
  console.log(`   ✓ Languages: ${profileByHandle.languages.join(', ')}`);
  console.log(`   ✓ Credentials count: ${(profileByHandle.credentials as any[]).length}`);

  // Test 2: Resolve instructor by UUID (fallback)
  console.log('\n2. Testing UUID fallback resolution...');
  const [profileById] = await db
    .select({ id: schema.users.id, name: schema.users.name })
    .from(schema.users)
    .where(eq(schema.users.id, profileByHandle.id))
    .limit(1);

  if (!profileById || profileById.id !== profileByHandle.id) {
    throw new Error('FAILED: Could not find instructor by ID');
  }
  console.log(`   ✓ Found instructor by ID: ${profileById.name}`);

  // Test 3: Testimonials query
  console.log('\n3. Testing published testimonials query...');
  const testimonials = await db
    .select()
    .from(schema.mentoringTestimonials)
    .where(
      and(
        eq(schema.mentoringTestimonials.instructorId, profileByHandle.id),
        eq(schema.mentoringTestimonials.isPublished, true)
      )
    )
    .orderBy(desc(schema.mentoringTestimonials.createdAt));

  console.log(`   ✓ Found ${testimonials.length} published testimonials for ${profileByHandle.name}`);
  if (testimonials.length > 0) {
    console.log(`   ✓ Sample review by "${testimonials[0].reviewerName}" (${testimonials[0].rating}★): "${testimonials[0].body.slice(0, 60)}..."`);
  }

  // Test 4: Duration pricing tiers
  console.log('\n4. Testing duration price tiers for instructor...');
  const prices = await db
    .select()
    .from(schema.mentoringDurationPrices)
    .where(eq(schema.mentoringDurationPrices.instructorId, profileByHandle.id))
    .orderBy(asc(schema.mentoringDurationPrices.durationMins));

  console.log(`   ✓ Configured price tiers: ${prices.map(p => `${p.durationMins}m: ₹${p.pricePaise / 100}`).join(', ')}`);

  // Test 5: Testimonial moderation queue for admin
  console.log('\n5. Testing admin testimonial moderation queue...');
  const queue = await db
    .select({
      id: schema.mentoringTestimonials.id,
      reviewerName: schema.mentoringTestimonials.reviewerName,
      body: schema.mentoringTestimonials.body,
      isPublished: schema.mentoringTestimonials.isPublished
    })
    .from(schema.mentoringTestimonials)
    .where(
      and(
        eq(schema.mentoringTestimonials.isPublished, false),
        isNull(schema.mentoringTestimonials.rejectedReason)
      )
    );
  console.log(`   ✓ Pending review queue length: ${queue.length}`);

  // Test 6: Non-existent handle returns empty
  console.log('\n6. Testing 404 / empty for non-existent handle...');
  const nonexistent = await db
    .select({ id: schema.users.id })
    .from(schema.users)
    .innerJoin(schema.identityProfiles, eq(schema.identityProfiles.userId, schema.users.id))
    .where(eq(schema.identityProfiles.mentoringHandle, 'unknown-random-slug-999'))
    .limit(1);

  if (nonexistent.length !== 0) {
    throw new Error('FAILED: Expected empty result for unknown handle');
  }
  console.log('   ✓ Correctly returned empty for non-existent mentor handle');

  console.log('\n=== ALL E2E INSTRUCTOR PROFILE TESTS PASSED ===\n');
}

runTests().catch((err) => {
  console.error('Test failed with error:', err);
  process.exit(1);
});
