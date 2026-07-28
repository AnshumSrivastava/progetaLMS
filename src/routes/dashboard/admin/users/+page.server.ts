import { db } from '$lib/server/db/client';
import { users, auditLogs } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
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
		allUsers,
		currentUserRole: locals.user.role
	};
};

export const actions: Actions = {
	updateRole: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const newRole = data.get('role') as string;

		if (!userId || !newRole) {
			return fail(400, { error: 'Missing userId or role' });
		}
		if (newRole === 'owner') {
			return fail(400, { error: 'Cannot directly set owner role. Use ownership transfer.' });
		}

		// Prevent regular admins from modifying the owner
		const targetUser = await db.select().from(users).where(eq(users.id, userId)).limit(1);
		if (targetUser.length === 0) return fail(404, { error: 'User not found' });
		
		if (targetUser[0].role === 'owner' && locals.user.role !== 'owner') {
			return fail(403, { error: 'Admins cannot modify the owner' });
		}

		try {
			await db.update(users).set({ role: newRole }).where(eq(users.id, userId));
			
			// Log it
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'role_change',
				entityId: userId,
				entityType: 'user',
				details: JSON.stringify({ from: targetUser[0].role, to: newRole })
			});

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to update role' });
		}
	},
	
	transferOwnership: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Only the owner can transfer ownership' });
		}

		const data = await request.formData();
		const newOwnerId = data.get('userId') as string;

		if (!newOwnerId) return fail(400, { error: 'Missing userId' });
		
		try {
			// Transaction-like logic (though Neon serverless over HTTP doesn't fully support traditional interactive transactions easily, we do them sequentially here for simplicity)
			// Demote current owner to admin
			await db.update(users).set({ role: 'admin' }).where(eq(users.id, locals.user.id));
			// Promote new user to owner
			await db.update(users).set({ role: 'owner' }).where(eq(users.id, newOwnerId));
			
			// Log it
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'transfer_ownership',
				entityId: newOwnerId,
				entityType: 'user',
				details: JSON.stringify({ fromOwner: locals.user.id, toOwner: newOwnerId })
			});

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to transfer ownership' });
		}
	}
};
