import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { auth } from './src/lib/server/auth/auth.config.ts';

async function createTestUser() {
	try {
		console.log('Creating test user...');
		const result = await auth.api.signUpEmail({
			body: {
				email: 'test@student.com',
				password: 'password123',
				name: 'Test Student'
			}
		});
		console.log('Test user created successfully!', result);
	} catch (error) {
		console.error('Failed to create test user:', error);
	}
}

createTestUser();
