import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';

async function main() {
    const sql = neon(process.env.DATABASE_URL!);
    console.log('Adding currency column to assets...');
    await sql`ALTER TABLE assets ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'INR'`;
    console.log('Success!');
}

main().catch(console.error);
