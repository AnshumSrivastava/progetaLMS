import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users, auditLogs } from '$lib/server/db/schema/identity.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	// Strictly Owner-only
	if (!locals.user || locals.user.role !== 'owner') {
		throw redirect(302, '/dashboard/admin');
	}

	// Fetch current admins eligible for ownership transfer
	const eligibleAdmins = await db
		.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			createdAt: users.createdAt
		})
		.from(users)
		.where(eq(users.role, 'admin'));

	// Stats for danger zone / system health
	const [{ outboxCount }] = await db.select({ outboxCount: sql<number>`count(*)` }).from(eventOutbox);
	const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(users);

	return {
		eligibleAdmins,
		stats: {
			outboxCount,
			totalUsers
		}
	};
};

export const actions: Actions = {
	transferOwnership: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Only the current owner can transfer root ownership' });
		}

		const data = await request.formData();
		const newOwnerId = data.get('newOwnerId') as string;
		const confirmEmail = data.get('confirmEmail') as string;

		if (!newOwnerId || !confirmEmail) {
			return fail(400, { error: 'Missing target user or confirmation email' });
		}

		const target = await db.select().from(users).where(eq(users.id, newOwnerId)).limit(1);
		if (target.length === 0) {
			return fail(404, { error: 'Target admin not found' });
		}

		if (target[0].email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
			return fail(400, { error: 'Confirmation email does not match the target admin' });
		}

		try {
			await db.batch([
				// Demote current owner to admin
				db.update(users).set({ role: 'admin' }).where(eq(users.id, locals.user.id)),
				// Promote new admin to owner
				db.update(users).set({ role: 'owner' }).where(eq(users.id, newOwnerId)),
				// Audit log
				db.insert(auditLogs).values({
					id: createId(),
					actorId: locals.user.id,
					action: 'transfer_ownership',
					entityId: newOwnerId,
					entityType: 'user',
					details: JSON.stringify({ previousOwner: locals.user.id, newOwner: newOwnerId, timestamp: new Date().toISOString() })
				})
			]);

			return { success: true, message: 'Ownership transferred successfully' };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to execute ownership transfer' });
		}
	},

	flushOutbox: async ({ locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Unauthorized' });
		}

		try {
			await db.delete(eventOutbox);
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'flush_outbox',
				entityId: 'system',
				entityType: 'outbox',
				details: JSON.stringify({ flushedAt: new Date().toISOString() })
			});

			return { success: true, message: 'Event outbox flushed successfully' };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to flush outbox' });
		}
	}
};
