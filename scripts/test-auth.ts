import { auth } from '../src/lib/server/auth/auth.config';
import { db } from '../src/lib/server/db/client';
import { users } from '../src/lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

async function main() {
    try {
        console.log("Checking if user exists...");
        const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@progetalms.com')).limit(1);
        if (existingAdmin.length === 0) {
            console.log("Creating user...");
            const result = await auth.api.signUpEmail({
                headers: new Headers(),
                body: {
                    email: 'admin@progetalms.com',
                    password: 'changeme123',
                    name: 'Super Admin'
                }
            });
            console.log("Result:", result);
            if (result?.user) {
                await db.update(users).set({ role: 'admin' }).where(eq(users.id, result.user.id));
                console.log("Success");
            }
        } else {
            console.log("User already exists:", existingAdmin[0]);
        }
    } catch (e: any) {
        console.error("Error:", e.message || e);
    }
    process.exit(0);
}

main();
