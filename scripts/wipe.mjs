import { neon } from '@neondatabase/serverless';
import 'dotenv/config';

const sql = neon(process.env.DATABASE_URL);

async function run() {
  console.log('Wiping database...');
  try {
     if (sql.query) {
        await sql.query('DROP SCHEMA public CASCADE;');
        await sql.query('CREATE SCHEMA public;');
     } else {
        await sql('DROP SCHEMA public CASCADE;', []);
        await sql('CREATE SCHEMA public;', []);
     }
     console.log('Success');
  } catch(e) {
     console.error(e.message);
  }
}
run();
