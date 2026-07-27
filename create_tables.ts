import { db } from './src/lib/server/db/client';
import { sql } from 'drizzle-orm';

async function main() {
    try {
        console.log("Creating platform_settings table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS platform_settings (
                id TEXT PRIMARY KEY,
                enable_catalog BOOLEAN NOT NULL DEFAULT true,
                enable_mentoring BOOLEAN NOT NULL DEFAULT true,
                enable_certifications BOOLEAN NOT NULL DEFAULT true,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Created platform_settings");

        console.log("Creating email_templates table...");
        await db.execute(sql`
            CREATE TABLE IF NOT EXISTS email_templates (
                id TEXT PRIMARY KEY,
                subject TEXT NOT NULL,
                body TEXT NOT NULL,
                updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
            );
        `);
        console.log("Created email_templates");

        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

main();
