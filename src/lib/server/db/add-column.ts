import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';

const sqlDb = neon(process.env.DATABASE_URL!);
const db = drizzle(sqlDb);

async function addColumn() {
	console.log('Adding login_preference column...');
	try {
		await sqlDb`ALTER TABLE identity_profiles ADD COLUMN IF NOT EXISTS login_preference text DEFAULT 'otp' NOT NULL`;
		
		await sqlDb`ALTER TABLE commerce_coupons ADD COLUMN IF NOT EXISTS cohort_id text`;
		
		console.log('✅ Columns added successfully.');
	} catch (e) {
		console.error('❌ Failed:', e);
	}
}

addColumn()
	.then(() => process.exit(0))
	.catch((e) => {
		console.error(e);
		process.exit(1);
	});
