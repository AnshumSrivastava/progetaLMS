import { db } from '$lib/server/db/client';
import { auditLogs, users } from '$lib/server/db/schema/identity.schema';
import { desc, eq } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	const logs = await db
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			entityId: auditLogs.entityId,
			entityType: auditLogs.entityType,
			details: auditLogs.details,
			createdAt: auditLogs.createdAt,
			actorName: users.name,
			actorEmail: users.email
		})
		.from(auditLogs)
		.leftJoin(users, eq(auditLogs.actorId, users.id))
		.orderBy(desc(auditLogs.createdAt))
		.limit(100);

	return {
		logs
	};
};
