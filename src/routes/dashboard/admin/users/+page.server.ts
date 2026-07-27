import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { auth } from '$lib/server/auth/auth.config';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const allUsers = await db.select({
		id: users.id,
		name: users.name,
		email: users.email,
		role: users.role,
		createdAt: users.createdAt
	}).from(users);

	return {
		allUsers
	};
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newRole = data.get('role') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Missing userId or role' });
		}

		// Use better auth setRole API if we want it to trigger webhooks, 
		// but since we are bypassing it mostly, direct DB update is fine.
		try {
			await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to update role' });
		}
	}
};
