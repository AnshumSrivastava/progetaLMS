/**
 * Automated Verification: Batch Question Parser & Database Insertion
 */
import 'dotenv/config';
import { neon } from '@neondatabase/serverless';
import { 
  parseQuestionBatch, 
  generateSampleCsvTemplate, 
  formatQuestionsAsTsv,
  resolveCorrectIndex
} from '../src/lib/shared/parsers/questionBatchParser.ts';

const sql = neon(process.env.DATABASE_URL);

async function runBatchQuestionTests() {
  console.log('=== TESTING BATCH QUESTION PARSER & UPLOADER ===\n');

  // ── 1. TEST PARSER LOGIC ───────────────────────────────────────
  console.log('1. Testing TSV Parser (Excel Clipboard format)...');
  const sampleExcelPaste = `Question\tOption A\tOption B\tOption C\tOption D\tCorrect Option\tExplanation\tPoints
What is the primary role of a Reverse Proxy?\tLoad balancing and TLS termination\tDatabase schema migration\tCSS stylesheet compiling\tDNS registrar lookup\tA\tReverse proxies sit in front of web servers\t2
Which OSI layer is responsible for routing packets?\tPhysical\tData Link\tNetwork\tApplication\t3\tLayer 3 handles IP routing\t1
What does CORS stand for in web security?\tCross-Origin Resource Sharing\tCross-Object Request Socket\tCentralized Origin Routing Server\tCertified Open Relay Service\tCross-Origin Resource Sharing\tCORS is a browser security mechanism\t1`;

  const parsedTsv = parseQuestionBatch(sampleExcelPaste);
  console.log(`   ✓ Parsed ${parsedTsv.totalParsed} questions from TSV (Valid: ${parsedTsv.validCount}, Invalid: ${parsedTsv.invalidCount})`);
  if (parsedTsv.validCount !== 3) throw new Error('Expected 3 valid questions from TSV');

  // Check correct option resolutions:
  // Q1: 'A' -> idx 0
  if (parsedTsv.questions[0].correctOptionIndex !== 0) throw new Error('Q1 correct option index should be 0');
  // Q2: '3' -> idx 2 ('Network')
  if (parsedTsv.questions[1].correctOptionIndex !== 2) throw new Error('Q2 correct option index should be 2');
  // Q3: 'Cross-Origin Resource Sharing' -> text match -> idx 0
  if (parsedTsv.questions[2].correctOptionIndex !== 0) throw new Error('Q3 correct option index should be 0');
  console.log('   ✓ Verified letter, numeric, and text-based correct option resolution');

  // ── 2. TEST CSV PARSER ─────────────────────────────────────────
  console.log('\n2. Testing CSV Template Parser...');
  const csvTemplate = generateSampleCsvTemplate();
  const parsedCsv = parseQuestionBatch(csvTemplate);
  console.log(`   ✓ Parsed ${parsedCsv.totalParsed} questions from sample CSV (Valid: ${parsedCsv.validCount})`);
  if (parsedCsv.validCount < 5) throw new Error('Expected 5 valid questions from CSV template');

  // ── 3. TEST DATABASE BATCH INSERTION ──────────────────────────
  console.log('\n3. Testing Database Batch Insertion...');
  const teachers = await sql`SELECT id, name FROM users WHERE role = 'teacher' LIMIT 1`;
  if (teachers.length === 0) throw new Error('No teacher found');
  const teacher = teachers[0];

  const testCertId = 'test_batch_cert_' + Math.random().toString(36).substring(2, 8);
  const testId = 'test_batch_assess_' + Math.random().toString(36).substring(2, 8);

  await sql`
    INSERT INTO assets (id, slug, title, type, owner_id, status, price_paise, currency)
    VALUES (${testCertId}, ${testCertId}, 'Test Batch Certification', 'cert_test', ${teacher.id}, 'draft', 0, 'INR')
  `;
  await sql`
    INSERT INTO assessment_tests (id, asset_id, passing_percent)
    VALUES (${testId}, ${testCertId}, 70)
  `;
  console.log(`   ✓ Created test certification: ${testCertId}`);

  // Batch insert all 5 questions from CSV
  const insertedQuestionIds = [];
  for (let i = 0; i < parsedCsv.questions.length; i++) {
    const q = parsedCsv.questions[i];
    const qId = 'batch_q_' + i + '_' + Math.random().toString(36).substring(2, 8);
    insertedQuestionIds.push(qId);

    await sql`
      INSERT INTO assessment_questions (id, test_id, type, content, explanation, points, sort_order)
      VALUES (${qId}, ${testId}, 'mcq', ${q.content}, ${q.explanation || null}, ${q.points || 1}, ${i})
    `;

    for (let optIdx = 0; optIdx < q.options.length; optIdx++) {
      const opt = q.options[optIdx];
      const optId = 'batch_opt_' + i + '_' + optIdx + '_' + Math.random().toString(36).substring(2, 8);
      await sql`
        INSERT INTO assessment_options (id, question_id, content, is_correct, sort_order)
        VALUES (${optId}, ${qId}, ${opt.content}, ${opt.isCorrect}, ${optIdx})
      `;
    }
  }

  console.log(`   ✓ Successfully batch-inserted ${insertedQuestionIds.length} questions into DB`);

  // Verify in DB
  const dbQuestions = await sql`
    SELECT id, content FROM assessment_questions WHERE test_id = ${testId} ORDER BY sort_order
  `;
  console.log(`   ✓ Verified: DB contains ${dbQuestions.length} questions for assessment`);
  if (dbQuestions.length !== 5) throw new Error('DB question count mismatch');

  const dbOptions = await sql`
    SELECT ao.id, ao.content, ao.is_correct
    FROM assessment_options ao
    JOIN assessment_questions aq ON ao.question_id = aq.id
    WHERE aq.test_id = ${testId} AND ao.is_correct = true
  `;
  console.log(`   ✓ Verified: ${dbOptions.length} questions have correct answers marked`);
  if (dbOptions.length !== 5) throw new Error('Every question must have exactly 1 correct answer');

  // Cleanup test records
  for (const qId of insertedQuestionIds) {
    await sql`DELETE FROM assessment_options WHERE question_id = ${qId}`;
    await sql`DELETE FROM assessment_questions WHERE id = ${qId}`;
  }
  await sql`DELETE FROM assessment_tests WHERE id = ${testId}`;
  await sql`DELETE FROM assets WHERE id = ${testCertId}`;
  console.log('   ✓ Test cleanup completed');

  console.log('\n=== ALL BATCH QUESTION UPLOAD TESTS PASSED ===\n');
}

runBatchQuestionTests().catch(err => {
  console.error('Test failed:', err);
  process.exit(1);
});
