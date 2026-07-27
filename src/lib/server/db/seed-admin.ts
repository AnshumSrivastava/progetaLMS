import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { auth } from '../auth/auth.config';
import { db } from './client';
import { users } from './schema/identity.schema';
import { eq } from 'drizzle-orm';

async function seedAdmin() {
	console.log('🌱 Seeding Super Admin...');

	const email = 'admin@progetalms.com';
	const password = 'changeme123';
	const name = 'Super Admin';

	try {
		// Check if admin already exists
		const existingAdmin = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existingAdmin.length > 0) {
			console.log('✅ Super Admin already exists.');
			
			// Ensure role is admin
			if (existingAdmin[0].role !== 'admin') {
				await db.update(users).set({ role: 'admin' }).where(eq(users.id, existingAdmin[0].id));
				console.log('🔄 Updated existing user to admin role.');
			}
			process.exit(0);
		}

		console.log('Creating Admin with Email & Password plugin...');
		
		// Use Better Auth API to sign up, which handles password hashing
		const result = await auth.api.signUpEmail({
			headers: new Headers(),
			body: {
				email,
				password,
				name
			}
		});

		if (result && result.user) {
			// Update the user's role to admin
			await db.update(users).set({ role: 'admin' }).where(eq(users.id, result.user.id));
			console.log(`✅ Super Admin created successfully. Email: ${email}, Password: ${password}`);
		} else {
			console.error('❌ Failed to create user via Better Auth', result);
		}

	} catch (error) {
		console.error('❌ Error seeding admin:', error);
	}
	
	process.exit(0);
}

seedAdmin();
