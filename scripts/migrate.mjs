import { neon } from '@neondatabase/serverless';
import 'dotenv/config';
import fs from 'fs';

const sql = neon(process.env.DATABASE_URL);
const queries = fs.readFileSync('src/lib/server/db/migrations/0000_spotty_bulldozer.sql', 'utf8')
  .split('--> statement-breakpoint')
  .map(q => q.trim())
  .filter(q => q.length > 0);

async function run() {
  console.log(`Running ${queries.length} statements...`);
  for (const query of queries) {
    try {
      if (sql.query) {
         await sql.query(query);
      } else {
         await sql(query, []);
      }
    } catch (err) {
      console.error('Error on query:', query.substring(0, 100), err.message);
    }
  }
  console.log('Migration complete');
}
run();
