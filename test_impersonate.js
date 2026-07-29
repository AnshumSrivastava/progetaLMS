import { db } from './src/lib/server/db/client.js';
import { users } from './src/lib/server/db/schema/identity.schema.js';
import { eq } from 'drizzle-orm';

async function main() {
    const teacher = await db.select().from(users).where(eq(users.role, 'teacher')).limit(1);
    console.log(teacher);
}
main();
