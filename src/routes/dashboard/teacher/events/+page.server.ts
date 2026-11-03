import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { eq, desc, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'teacher' && locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	const isStaff = locals.user.role === 'admin' || locals.user.role === 'owner';

	const conditions = isStaff ? [] : [eq(events.hostId, locals.user.id)];

	const teacherEvents = await db
		.select()
		.from(events)
		.where(conditions.length ? and(...conditions) : undefined)
		.orderBy(desc(events.createdAt));

	const eventIds = teacherEvents.map((e) => e.id);
	const statsMap: Record<string, { confirmedCount: number; totalRevenuePaise: number; creditsUsed: number }> = {};

	if (eventIds.length > 0) {
		const regs = await db
			.select({
				eventId: eventRegistrations.eventId,
				status: eventRegistrations.status,
				amountPaidPaise: eventRegistrations.amountPaidPaise,
				creditsUsed: eventRegistrations.creditsUsed
			})
			.from(eventRegistrations)
			.where(sql`${eventRegistrations.eventId} IN ${eventIds}`);

		for (const r of regs) {
			if (!statsMap[r.eventId]) {
				statsMap[r.eventId] = { confirmedCount: 0, totalRevenuePaise: 0, creditsUsed: 0 };
			}
			if (r.status === 'confirmed') {
				statsMap[r.eventId].confirmedCount += 1;
				statsMap[r.eventId].totalRevenuePaise += r.amountPaidPaise || 0;
				statsMap[r.eventId].creditsUsed += r.creditsUsed || 0;
			}
		}
	}

	const formatted = teacherEvents.map((e) => ({
		...e,
		stats: statsMap[e.id] || { confirmedCount: 0, totalRevenuePaise: 0, creditsUsed: 0 }
	}));

	return {
		events: formatted
	};
};

