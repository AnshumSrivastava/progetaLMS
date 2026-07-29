import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

import { auth } from '../src/lib/server/auth/auth.config.ts';
import { db } from '../src/lib/server/db/client.ts';
import { users, identityProfiles } from '../src/lib/server/db/schema/identity.schema.ts';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';

const action = process.argv[2];
const email = process.argv[3];
const password = process.argv[4];

async function main() {
    if (action === 'create') {
        try {
            console.log('Creating instructor test user...');
            const name = 'Test Instructor';

            const result = await auth.api.signUpEmail({
                body: {
                    email,
                    password,
                    name
                }
            });

            if (result.user) {
                // Update role to instructor
                await db.update(users).set({ role: 'teacher', emailVerified: true }).where(eq(users.id, result.user.id));
                
                // Try to update or insert identity profile with password preference
                const existingProfile = await db.select().from(identityProfiles).where(eq(identityProfiles.userId, result.user.id));
                if (existingProfile.length > 0) {
                    await db.update(identityProfiles).set({ loginPreference: 'password' }).where(eq(identityProfiles.userId, result.user.id));
                } else {
                    await db.insert(identityProfiles).values({
                        id: crypto.randomUUID(),
                        userId: result.user.id,
                        loginPreference: 'password'
                    });
                }

                console.log('Instructor user created successfully!', email);
            } else {
                console.error('Signup failed', result);
            }
        } catch (error) {
            console.error('Failed to create instructor user:', error);
        }
    } else if (action === 'delete') {
        try {
            console.log('Deleting instructor test user...');
            const userRecords = await db.select().from(users).where(eq(users.email, email));
            if (userRecords.length > 0) {
                const userId = userRecords[0].id;
                await db.delete(users).where(eq(users.id, userId));
                console.log('User deleted successfully!');
            } else {
                console.log('User not found.');
            }
        } catch (error) {
            console.error('Failed to delete user:', error);
        }
    }
    process.exit(0);
}

main();
