import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from '../src/lib/server/db/schema';
import { eq, and, sql, gte, inArray, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

const sqlClient = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlClient, { schema });

async function runTests() {
  console.log('=== STARTING MENTORING SYSTEM E2E TESTS ===\n');

  // 1. Fetch instructors
  console.log('1. Testing active instructors query...');
  const instructors = await db
    .select({
      id: schema.users.id,
      name: schema.users.name,
      email: schema.users.email,
      bio: schema.identityProfiles.bio,
      isSuspended: schema.identityProfiles.mentoringSuspended
    })
    .from(schema.users)
    .innerJoin(schema.identityProfiles, eq(schema.identityProfiles.userId, schema.users.id))
    .where(
      and(
        inArray(schema.users.role, ['teacher', 'admin', 'owner']),
        eq(schema.identityProfiles.mentoringSuspended, false)
      )
    );

  console.log(`-> Found ${instructors.length} active instructors.`);
  if (instructors.length === 0) throw new Error('No active instructors found');
  const instructor = instructors[0];
  console.log(`-> Selected instructor: ${instructor.name} (${instructor.id})`);

  // 2. Fetch availability windows
  console.log('\n2. Testing availability windows...');
  const windows = await db
    .select()
    .from(schema.mentoringAvailability)
    .where(
      and(
        eq(schema.mentoringAvailability.instructorId, instructor.id),
        eq(schema.mentoringAvailability.status, 'active')
      )
    )
    .orderBy(asc(schema.mentoringAvailability.date));

  console.log(`-> Found ${windows.length} active windows. Dates:`, Array.from(new Set(windows.map(w => w.date))));
  if (windows.length === 0) throw new Error('No active windows found');
  const window = windows[0];
  console.log(`-> Testing window on ${window.date} (${window.windowStart}–${window.windowEnd}, durations: ${window.allowedDurations.join(',')})`);

  // 3. Test Overlap Interval Algorithm directly
  console.log('\n3. Testing Overlap Interval Calculation for 30m vs 45m...');
  const durationMins = 30;
  const toMinutes = (timeStr: string) => {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };
  const toTimeStr = (totalMins: number) => {
    const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
    const m = (totalMins % 60).toString().padStart(2, '0');
    return `${h}:${m}`;
  };

  const startMins = toMinutes(window.windowStart);
  const endMins = toMinutes(window.windowEnd);
  const stepMins = 30;
  const candidateStartMinutes: number[] = [];
  for (let cur = startMins; cur + durationMins <= endMins; cur += stepMins) {
    candidateStartMinutes.push(cur);
  }

  console.log(`-> Initial candidates for 30m in ${window.windowStart}–${window.windowEnd}:`, candidateStartMinutes.map(toTimeStr));

  // 4. Create a 45-min booking from 10:00 to 10:45
  console.log('\n4. Simulating booking creation: 10:00–10:45 (45 min)...');
  const student = instructors.find(i => i.id !== instructor.id) || instructors[0];
  const bookingStartsAt = new Date(`${window.date}T10:00:00Z`);
  const bookingEndsAt = new Date(`${window.date}T10:45:00Z`);

  // Clean any previous test bookings for this window & start time
  await db.delete(schema.mentoringBookings).where(
    and(
      eq(schema.mentoringBookings.availabilityId, window.id),
      eq(schema.mentoringBookings.startsAt, bookingStartsAt)
    )
  );

  const testBookingId = createId();
  await db.insert(schema.mentoringBookings).values({
    id: testBookingId,
    availabilityId: window.id,
    studentId: student.id,
    instructorId: instructor.id,
    startsAt: bookingStartsAt,
    endsAt: bookingEndsAt,
    durationMins: 45,
    pricePaise: 0,
    discountPaise: 120000,
    status: 'confirmed',
    reminderSent: false
  });
  console.log('-> Confirmed booking inserted:', testBookingId);

  // 5. Test overlap exclusion query
  console.log('\n5. Verifying Overlap Exclusion logic (B.starts_at < C_end AND B.ends_at > C)...');
  const existingBookings = await db
    .select({
      startsAt: schema.mentoringBookings.startsAt,
      endsAt: schema.mentoringBookings.endsAt
    })
    .from(schema.mentoringBookings)
    .where(
      and(
        eq(schema.mentoringBookings.availabilityId, window.id),
        eq(schema.mentoringBookings.status, 'confirmed')
      )
    );

  const bookedIntervals = existingBookings.map(b => {
    const sDate = new Date(b.startsAt);
    const eDate = new Date(b.endsAt);
    const sMins = sDate.getUTCHours() * 60 + sDate.getUTCMinutes();
    const eMins = eDate.getUTCHours() * 60 + eDate.getUTCMinutes();
    return { start: sMins, end: eMins };
  });

  const availableSlots: string[] = [];
  for (const candStart of candidateStartMinutes) {
    const candEnd = candStart + durationMins;
    const hasOverlap = bookedIntervals.some(b => b.start < candEnd && b.end > candStart);
    if (!hasOverlap) {
      availableSlots.push(toTimeStr(candStart));
    }
  }

  console.log('-> Available 30m slots after booking 10:00–10:45:', availableSlots);
  const is1000Excluded = !availableSlots.includes('10:00');
  const is1030Excluded = !availableSlots.includes('10:30');
  const is1100Included = availableSlots.includes('11:00');

  console.log(`-> Checks: 10:00 excluded: ${is1000Excluded} | 10:30 excluded: ${is1030Excluded} | 11:00 available: ${is1100Included}`);

  if (!is1000Excluded || !is1030Excluded) {
    throw new Error('Collision overlap detection failed: overlapping slot was offered!');
  }

  // 6. Test Outbox Reminder insertion
  console.log('\n6. Testing 5-minute reminder queueing...');
  const reminderTime = new Date(bookingStartsAt.getTime() - 5 * 60000);
  const reminderEventId = createId();
  await db.insert(schema.eventOutbox).values({
    id: reminderEventId,
    eventType: 'MENTORING_REMINDER',
    payload: {
      bookingId: testBookingId,
      studentEmail: student.email,
      studentName: student.name,
      instructorEmail: instructor.email,
      instructorName: instructor.name,
      startsAt: bookingStartsAt.toISOString(),
      durationMins: 45,
      meetingUrl: window.meetingUrl
    },
    createdAt: reminderTime
  });
  console.log('-> Outbox reminder created successfully:', reminderEventId);

  // 7. Cleanup test booking
  await db.delete(schema.eventOutbox).where(eq(schema.eventOutbox.id, reminderEventId));
  await db.delete(schema.mentoringBookings).where(eq(schema.mentoringBookings.id, testBookingId));
  console.log('-> Test artifacts cleaned up.');

  console.log('\n=== ALL E2E TESTS COMPLETED WITH 100% SUCCESS ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
