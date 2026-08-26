/**
 * Verification Test: Teacher Certification Management Lifecycle
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

async function testTeacherCertifications() {
  console.log('=== TESTING TEACHER CERTIFICATION MANAGEMENT ===\n');

  // 1. Find an instructor
  const teachers = await sql`
    SELECT id, name, role FROM users WHERE role = 'teacher' LIMIT 1
  `;
  if (teachers.length === 0) throw new Error('No teacher found');
  const teacher = teachers[0];
  console.log(`1. Testing as Teacher: ${teacher.name} (${teacher.id})`);

  // 2. Create a test certification asset & assessment test
  const certId = 'test_cert_' + Math.random().toString(36).substring(2, 8);
  const testId = 'test_assess_' + Math.random().toString(36).substring(2, 8);
  console.log(`2. Creating certification: ${certId}...`);

  await sql`
    INSERT INTO assets (id, slug, title, type, owner_id, status, price_paise, currency)
    VALUES (${certId}, ${certId}, 'Certified Advanced Penetration Tester', 'cert_test', ${teacher.id}, 'draft', 150000, 'INR')
  `;

  await sql`
    INSERT INTO assessment_tests (id, asset_id, passing_percent, max_attempts)
    VALUES (${testId}, ${certId}, 75, 3)
  `;
  console.log('   ✓ Certification & Assessment Test created');

  // 3. Add an MCQ question with options
  console.log('3. Adding MCQ question with options...');
  const qId = 'test_q_' + Math.random().toString(36).substring(2, 8);
  await sql`
    INSERT INTO assessment_questions (id, test_id, type, content, points, sort_order)
    VALUES (${qId}, ${testId}, 'mcq', 'Which protocol provides end-to-end encryption for DNS queries?', 1, 0)
  `;

  const opt1 = 'test_opt_1_' + Math.random().toString(36).substring(2, 8);
  const opt2 = 'test_opt_2_' + Math.random().toString(36).substring(2, 8);
  await sql`
    INSERT INTO assessment_options (id, question_id, content, is_correct, sort_order)
    VALUES 
      (${opt1}, ${qId}, 'DNS-over-HTTPS (DoH)', true, 0),
      (${opt2}, ${qId}, 'Plaintext UDP 53', false, 1)
  `;
  console.log('   ✓ MCQ Question & Options inserted');

  // 4. Verify teacher's certifications query
  console.log('4. Querying teacher certifications...');
  const certs = await sql`
    SELECT a.id, a.title, a.status, a.price_paise, at.passing_percent
    FROM assets a
    JOIN assessment_tests at ON at.asset_id = a.id
    WHERE a.type = 'cert_test' AND a.owner_id = ${teacher.id} AND a.deleted_at IS NULL
    ORDER BY a.created_at DESC
  `;
  console.log(`   ✓ Found ${certs.length} certifications for ${teacher.name}`);
  const found = certs.find(c => c.id === certId);
  if (!found) throw new Error('Created certification not found in query');
  console.log(`   ✓ Verified: "${found.title}" status: ${found.status}, price: ₹${found.price_paise / 100}, passing: ${found.passing_percent}%`);

  // 5. Toggle publish status
  console.log('5. Publishing certification...');
  await sql`UPDATE assets SET status = 'published' WHERE id = ${certId}`;
  const [published] = await sql`SELECT status FROM assets WHERE id = ${certId}`;
  console.log(`   ✓ Status is now: ${published.status}`);

  // Cleanup test certification
  await sql`DELETE FROM assessment_options WHERE question_id = ${qId}`;
  await sql`DELETE FROM assessment_questions WHERE id = ${qId}`;
  await sql`DELETE FROM assessment_tests WHERE id = ${testId}`;
  await sql`DELETE FROM assets WHERE id = ${certId}`;
  console.log('   ✓ Test cleanup completed');

  console.log('\n=== TEACHER CERTIFICATION TEST PASSED ===\n');
}

testTeacherCertifications().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
