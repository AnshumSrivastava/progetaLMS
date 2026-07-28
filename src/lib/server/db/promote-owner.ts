import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import * as schema from './schema/index';
import { eq } from 'drizzle-orm';

const sql = neon(process.env.DATABASE_URL!);
const db = drizzle(sql, { schema });

async function promote() {
	const email = 'anshumsrivastava1@gmail.com';
	console.log(`Promoting ${email} to owner...`);
	
	const result = await db.update(schema.users)
		.set({ role: 'owner' })
		.where(eq(schema.users.email, email))
		.returning({ id: schema.users.id, role: schema.users.role });
		
	if (result.length > 0) {
		console.log(`✅ Successfully promoted user ${result[0].id} to ${result[0].role}`);
	} else {
		console.log(`❌ User not found with email: ${email}`);
	}
}

promote()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
