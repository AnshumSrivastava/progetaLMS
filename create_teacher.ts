import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { auth } from './src/lib/server/auth/auth.config.ts';
import { db } from './src/lib/server/db/client.ts';
import { users } from './src/lib/server/db/schema/identity.schema.ts';
import { eq } from 'drizzle-orm';

async function createTeacher() {
	try {
		console.log('Creating test teacher...');
		const result = await auth.api.signUpEmail({
			body: {
				email: 'teacher@test.com',
				password: 'password123',
				name: 'Test Teacher'
			}
		});
		
		console.log('Updating role to teacher...');
		await db.update(users).set({ role: 'teacher' }).where(eq(users.email, 'teacher@test.com'));
		
		console.log('Test teacher created successfully!');
	} catch (error) {
		console.error('Failed to create test user:', error);
	}
	process.exit(0);
}

createTeacher();
