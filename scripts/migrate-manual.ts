import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });
import { neon } from '@neondatabase/serverless';

async function migrate() {
    const sql = neon(process.env.DATABASE_URL!);
    console.log("Running manual migration...");
    
    try {
        await sql`
            ALTER TABLE users 
            ADD COLUMN IF NOT EXISTS role text NOT NULL DEFAULT 'student',
            ADD COLUMN IF NOT EXISTS banned boolean NOT NULL DEFAULT false,
            ADD COLUMN IF NOT EXISTS ban_reason text,
            ADD COLUMN IF NOT EXISTS ban_expires timestamp with time zone;
        `;
        console.log("Migration successful.");
    } catch (e) {
        console.error("Migration failed:", e);
    }
}

migrate();
