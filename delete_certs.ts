import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function deleteCerts() {
	const client = new Client({ connectionString: process.env.DATABASE_URL });
	await client.connect();

	// 1. Delete from assessment_tests first (because of foreign keys)
	console.log('Deleting assessment_tests related to certs...');
	await client.query(`
		DELETE FROM assessment_tests
		WHERE asset_id IN (SELECT id FROM assets WHERE type = 'cert_test' OR type = 'certificate')
	`);
	
	// Skip asset_progress since table does not exist yet

	// 3. Delete asset_ownership related to certs
	console.log('Deleting asset_ownership related to certs...');
	await client.query(`
		DELETE FROM asset_ownership
		WHERE asset_id IN (SELECT id FROM assets WHERE type = 'cert_test' OR type = 'certificate')
	`);

	// 4. Delete the actual cert_test assets
	console.log('Deleting cert_test assets...');
	const res = await client.query(`
		DELETE FROM assets WHERE type = 'cert_test' OR type = 'certificate'
	`);

	console.log(`Deleted ${res.rowCount} certifications.`);
	await client.end();
}

deleteCerts().catch(console.error);
