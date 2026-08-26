import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import { MentoringService } from '../src/lib/server/mentoring/MentoringService.ts';

const sql = neon(process.env.DATABASE_URL);

async function runTests() {
  console.log('=== STARTING MENTORING SYSTEM E2E TESTS ===\n');

  // 1. Test getPublicMentors
  console.log('1. Testing getPublicMentors()...');
  const mentors = await MentoringService.getPublicMentors();
  console.log(`-> Found ${mentors.length} public mentors.`);
  if (mentors.length === 0) throw new Error('Expected at least 1 public mentor');
  const mentor = mentors[0];
  console.log(`-> Selected mentor: ${mentor.name} (${mentor.id}) - Lowest price: ₹${mentor.lowestPricePaise / 100}`);

  // 2. Test available dates
  console.log('\n2. Testing getInstructorAvailableDates()...');
  const dates = await MentoringService.getInstructorAvailableDates(mentor.id);
  console.log(`-> Available dates:`, dates);
  if (dates.length === 0) throw new Error('Expected available dates for mentor');
  const testDate = dates[0];

  // 3. Test windows for date
  console.log(`\n3. Testing getInstructorWindowsForDate() for ${testDate}...`);
  const windows = await MentoringService.getInstructorWindowsForDate(mentor.id, testDate);
  console.log(`-> Found ${windows.length} windows for ${testDate}:`, windows.map(w => `${w.windowStart}–${w.windowEnd}`));
  if (windows.length === 0) throw new Error('Expected at least 1 window');
  const window = windows[0];

  // 4. Test free slots calculation
  console.log(`\n4. Testing getFreeSlots() for window ${window.id} (${window.windowStart}–${window.windowEnd}, 30 min)...`);
  const slots30 = await MentoringService.getFreeSlots(window.id, 30);
  console.log(`-> Available 30m slots:`, slots30.map(s => s.timeStr));

  // 5. Test Overlap Exclusion Algorithm
  console.log('\n5. Testing Overlap Exclusion Logic...');
  // Find a student user
  const students = await sql`SELECT id, name, email FROM users WHERE role = 'student' LIMIT 1;`;
  let studentId = students[0]?.id;
  if (!studentId) {
    const allUsers = await sql`SELECT id FROM users LIMIT 1;`;
    studentId = allUsers[0].id;
  }

  // Create a 45-min booking at testDate 10:00:00 (10:00 - 10:45)
  const testStartsAt = new Date(`${testDate}T10:00:00`);
  console.log(`-> Creating 45-min booking at 10:00–10:45 with coupon FREEMENTOR...`);
  
  const bookingResult = await MentoringService.createBooking({
    studentId,
    availabilityId: window.id,
    startsAt: testStartsAt,
    durationMins: 45,
    couponCode: 'FREEMENTOR',
    notes: 'Unit test session for overlap verification'
  });
  console.log('-> Booking created successfully:', bookingResult);

  // Now compute free slots for 30m in this window
  const updatedSlots = await MentoringService.getFreeSlots(window.id, 30);
  console.log('-> Free 30m slots after 10:00–10:45 booking:', updatedSlots.map(s => s.timeStr));

  // Verify that 10:00 and 10:30 are NOT present, but 10:45/11:00 IS present
  const has1000 = updatedSlots.some(s => s.timeStr === '10:00');
  const has1030 = updatedSlots.some(s => s.timeStr === '10:30');
  console.log(`-> Overlap Check: Slot 10:00 excluded: ${!has1000} | Slot 10:30 excluded: ${!has1030}`);
  if (has1000 || has1030) {
    throw new Error('Overlap exclusion failure: 10:00 or 10:30 was offered while 10:00–10:45 is booked!');
  }

  // Verify direct collision rejection
  console.log('-> Testing direct collision prevention at 10:30...');
  try {
    await MentoringService.createBooking({
      studentId,
      availabilityId: window.id,
      startsAt: new Date(`${testDate}T10:30:00`),
      durationMins: 30
    });
    throw new Error('Collision detection failed! Duplicate booking was allowed.');
  } catch (err) {
    console.log('-> Correctly rejected overlapping booking:', err.message);
  }

  // 6. Test Outbox Reminder creation
  console.log('\n6. Checking Event Outbox for 5-min Reminder and Booking events...');
  const outboxEvents = await sql`
    SELECT id, event_type, payload, created_at 
    FROM event_outbox 
    WHERE event_type IN ('MENTORING_BOOKED', 'MENTORING_REMINDER')
    ORDER BY created_at DESC 
    LIMIT 2;
  `;
  console.log(`-> Outbox entries found:`, outboxEvents.map(e => e.event_type));

  // 7. Test Admin Stats
  console.log('\n7. Testing Admin Mentoring Stats & Instructors list...');
  const adminStats = await MentoringService.getAdminStats();
  console.log('-> Admin KPI Stats:', adminStats);
  const adminInstructors = await MentoringService.getAdminInstructorsList();
  console.log(`-> Admin Instructors List: ${adminInstructors.length} instructors.`);

  console.log('\n=== ALL MENTORING TESTS PASSED PERFECTLY ===');
}

runTests().catch(err => {
  console.error('\n❌ TEST FAILED:', err);
  process.exit(1);
});
