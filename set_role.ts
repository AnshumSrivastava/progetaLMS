import 'dotenv/config';
import pg from 'pg';
const { Client } = pg;

async function main() {
	const client = new Client({
		connectionString: process.env.DATABASE_URL
	});
	
	try {
		await client.connect();
		const result = await client.query(`UPDATE users SET role = 'teacher' WHERE email = 'test@student.com'`);
		console.log(`Updated ${result.rowCount} users.`);
	} catch (e) {
		console.error(e);
	} finally {
		await client.end();
	}
}
main();
