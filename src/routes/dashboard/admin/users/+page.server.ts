import { db } from '$lib/server/db/client';
import { users, auditLogs } from '$lib/server/db/schema/identity.schema';
import { eq, sql } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createId } from '@paralleldrive/cuid2';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { auth } from '$lib/server/auth/auth.config';
import { randomBytes } from 'node:crypto';

export const load: PageServerLoad = async ({ locals, url }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	const page = parseInt(url.searchParams.get('page') || '1', 10);
	const limit = 20;
	const offset = (page - 1) * limit;

	const allUsers = await db.select({
		id: users.id,
		name: users.name,
		email: users.email,
		role: users.role,
		createdAt: users.createdAt
	}).from(users).limit(limit).offset(offset);

	const [{ count }] = await db.select({ count: sql<number>`count(*)` }).from(users);

	return {
		allUsers,
		currentUserRole: locals.user.role,
		pagination: {
			page,
			limit,
			total: count,
			totalPages: Math.ceil(count / limit)
		}
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
			// Use drizzle's batch support to ensure atomicity
			await db.batch([
				// Demote current owner to admin
				db.update(users).set({ role: 'admin' }).where(eq(users.id, locals.user!.id)),
				// Promote new user to owner
				db.update(users).set({ role: 'owner' }).where(eq(users.id, newOwnerId)),
				
				// Log it
				db.insert(auditLogs).values({
					id: createId(),
					actorId: locals.user!.id,
					action: 'transfer_ownership',
					entityId: newOwnerId,
					entityType: 'user',
					details: JSON.stringify({ fromOwner: locals.user!.id, toOwner: newOwnerId })
				})
			]);

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to transfer ownership' });
		}
	},
	
	deleteUser: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Only the owner can delete users' });
		}
		
		const data = await request.formData();
		const userId = data.get('userId') as string;
		if (!userId) return fail(400, { error: 'Missing userId' });
		if (userId === locals.user.id) return fail(400, { error: 'Cannot delete yourself. Transfer ownership first.' });
		
		try {
			await db.delete(users).where(eq(users.id, userId));
			
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'delete_user',
				entityId: userId,
				entityType: 'user',
				details: JSON.stringify({ deletedUserId: userId })
			});
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to delete user' });
		}
	},
	
	inviteAdmin: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const email = data.get('email') as string;
		if (!email) return fail(400, { error: 'Missing email' });

		const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
		if (existingUser.length > 0) {
			return fail(400, { error: 'User already exists' });
		}

		try {
			const tempPassword = randomBytes(16).toString('hex');
			const result = await auth.api.signUpEmail({
				headers: new Headers(),
				body: { email, password: tempPassword, name: 'Invited Admin' }
			});

			if (result?.user) {
				await db.update(users).set({ role: 'admin' }).where(eq(users.id, result.user.id));
				
				await db.insert(auditLogs).values({
					id: createId(),
					actorId: locals.user.id,
					action: 'invite_admin',
					entityId: result.user.id,
					entityType: 'user',
					details: JSON.stringify({ email })
				});

				await db.insert(eventOutbox).values({
					id: createId(),
					type: 'EMAIL_BLAST',
					payload: {
						subject: 'You have been invited as an Admin',
						html: `<p>You have been invited to be an administrator on Progeta LMS. Please sign in using this email address via OTP or Google OAuth.</p>`,
						recipients: [email]
					}
				});
				
				return { success: true };
			}
			return fail(500, { error: 'Failed to create user' });
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to invite admin' });
		}
	}
};
