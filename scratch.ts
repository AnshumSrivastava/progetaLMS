import { db } from './src/lib/server/db/client';
import { users } from './src/lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

async function run() {
  await db.delete(users).where(eq(users.email, 'admin@progetalms.com'));
  console.log('Deleted admin');
  process.exit(0);
}
run();
