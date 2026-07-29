import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function main() {
	console.log('Migrating user roles from instructor to teacher...');
	
	const client = new Client({
		connectionString: process.env.DATABASE_URL
	});
	
	try {
		await client.connect();
		const result = await client.query(`UPDATE users SET role = 'teacher' WHERE role = 'instructor'`);
			
		console.log(`Migration completed successfully. Updated ${result.rowCount} users.`);
	} catch (e) {
		console.error('Migration failed:', e);
	} finally {
		await client.end();
	}
}

main();
