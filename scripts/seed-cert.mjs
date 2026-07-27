import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

async function run() {
  const sql = neon(process.env.DATABASE_URL);
  
  const users = await sql`SELECT id, name FROM users LIMIT 1`;
  const tests = await sql`SELECT id FROM assessment_tests LIMIT 1`;
  const templates = await sql`SELECT id FROM certificate_templates LIMIT 1`;

  const userId = users[0].id;
  const userName = users[0].name || 'Test User';
  const testId = tests[0].id;
  const templateId = templates[0].id;

  // Insert fake attempt
  const attemptId = 'fake-attempt-123';
  await sql`
    INSERT INTO assessment_attempts (id, test_id, user_id, status, score, max_score, passed)
    VALUES (${attemptId}, ${testId}, ${userId}, 'evaluated', 18, 20, true)
    ON CONFLICT DO NOTHING
  `;

  // Insert certificate
  const certId = 'cert-test-xyz';
  await sql`
    INSERT INTO certificates (id, template_id, test_id, user_id, attempt_id, verify_url, metadata)
    VALUES (${certId}, ${templateId}, ${testId}, ${userId}, ${attemptId}, '/certificates/cert-test-xyz', '{"studentName": "Test User", "testName": "Cybersecurity Fundamentals", "score": 90, "date": "2026-07-26"}')
    ON CONFLICT (id) DO UPDATE SET metadata = EXCLUDED.metadata
  `;

  console.log('Certificate seeded with ID: cert-test-xyz');
}
run();
