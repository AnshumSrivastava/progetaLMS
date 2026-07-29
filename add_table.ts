import { db } from './src/lib/server/db/client';
import { sql } from 'drizzle-orm';

async function main() {
	try {
		console.log('Creating table cohort_suggested_assets...');
		await db.execute(sql`
			CREATE TABLE IF NOT EXISTS "cohort_suggested_assets" (
				"id" text PRIMARY KEY NOT NULL,
				"cohort_id" text NOT NULL,
				"asset_id" text NOT NULL,
				"created_at" timestamp with time zone DEFAULT now() NOT NULL
			);
		`);

		console.log('Adding foreign key constraints...');
		
		await db.execute(sql`
			DO $$ BEGIN
				ALTER TABLE "cohort_suggested_assets" ADD CONSTRAINT "cohort_suggested_assets_cohort_id_cohorts_id_fk" FOREIGN KEY ("cohort_id") REFERENCES "cohorts"("id") ON DELETE cascade ON UPDATE no action;
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`);

		await db.execute(sql`
			DO $$ BEGIN
				ALTER TABLE "cohort_suggested_assets" ADD CONSTRAINT "cohort_suggested_assets_asset_id_assets_id_fk" FOREIGN KEY ("asset_id") REFERENCES "assets"("id") ON DELETE cascade ON UPDATE no action;
			EXCEPTION
				WHEN duplicate_object THEN null;
			END $$;
		`);

		console.log('Adding indexes...');

		await db.execute(sql`
			CREATE INDEX IF NOT EXISTS "cohort_suggested_assets_cohort_idx" ON "cohort_suggested_assets" ("cohort_id");
		`);

		await db.execute(sql`
			CREATE UNIQUE INDEX IF NOT EXISTS "cohort_suggested_assets_unique" ON "cohort_suggested_assets" ("cohort_id", "asset_id");
		`);

		console.log('Done!');
		process.exit(0);
	} catch (error) {
		console.error('Error creating table:', error);
		process.exit(1);
	}
}

main();
