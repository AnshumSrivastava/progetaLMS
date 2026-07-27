import { neon } from '@neondatabase/serverless';

async function main() {
  const sql = neon("postgresql://neondb_owner:npg_ofZTuJjdO04B@ep-calm-haze-ay9a3yr4.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require");
  
  try {
    console.log("Creating platform_settings...");
    await sql`
      CREATE TABLE IF NOT EXISTS platform_settings (
          id TEXT PRIMARY KEY,
          enable_catalog BOOLEAN NOT NULL DEFAULT true,
          enable_mentoring BOOLEAN NOT NULL DEFAULT true,
          enable_certifications BOOLEAN NOT NULL DEFAULT true,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Creating email_templates...");
    await sql`
      CREATE TABLE IF NOT EXISTS email_templates (
          id TEXT PRIMARY KEY,
          subject TEXT NOT NULL,
          body TEXT NOT NULL,
          updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      );
    `;
    console.log("Done!");
  } catch(e) {
    console.error(e);
  }
}
main();
