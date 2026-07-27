import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema/identity.schema';
import { accounts } from '$lib/server/db/schema/identity.schema';

export async function GET() {
    const allUsers = await db.select().from(users);
    const allAccounts = await db.select().from(accounts);
    return json({ users: allUsers, accounts: allAccounts });
}
