const { Client } = require('pg');

async function main() {
	const client = new Client({
		connectionString: 'postgresql://neondb_owner:npg_ofZTuJjdO04B@ep-calm-haze-ay9a3yr4.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require'
	});
	
	try {
		await client.connect();
		console.log('Connected to DB');

		console.log('Creating table cohort_suggested_assets...');
		await client.query(`
			CREATE TABLE IF NOT EXISTS "cohort_suggested_assets" (
				"id" text PRIMARY KEY NOT NULL,
				"cohort_id" text NOT NULL,
				"asset_id" text NOT NULL,
				"created_at" timestamp with time zone DEFAULT now() NOT NULL
			);
		`);

		console.log('Adding indexes...');

		await client.query(`
			CREATE INDEX IF NOT EXISTS "cohort_suggested_assets_cohort_idx" ON "cohort_suggested_assets" ("cohort_id");
		`);

		await client.query(`
			CREATE UNIQUE INDEX IF NOT EXISTS "cohort_suggested_assets_unique" ON "cohort_suggested_assets" ("cohort_id", "asset_id");
		`);

		console.log('Done!');
		process.exit(0);
	} catch (error) {
		console.error('Error creating table:', error);
		process.exit(1);
	} finally {
		await client.end();
	}
}

main();
