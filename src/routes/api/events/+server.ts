import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq, and, gte, asc, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ url }) => {
	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);
	const eventType = url.searchParams.get('type');
	const venueType = url.searchParams.get('venueType');

	const conditions = [
		eq(events.status, 'published')
	];

	if (eventType && (eventType === 'paid' || eventType === 'free')) {
		conditions.push(eq(events.eventType, eventType));
	}

	if (venueType && (venueType === 'online' || venueType === 'offline' || venueType === 'hybrid')) {
		conditions.push(eq(events.venueType, venueType));
	}

	const rawEvents = await db
		.select({
			id: events.id,
			title: events.title,
			slug: events.slug,
			shortDescription: events.shortDescription,
			eventType: events.eventType,
			pricePaise: events.pricePaise,
			priceCredits: events.priceCredits,
			startAt: events.startAt,
			endAt: events.endAt,
			registrationDeadline: events.registrationDeadline,
			maxAttendees: events.maxAttendees,
			venueType: events.venueType,
			coverImageUrl: events.coverImageUrl,
			status: events.status,
			hostName: users.name,
			hostImage: users.image
		})
		.from(events)
		.leftJoin(users, eq(events.hostId, users.id))
		.where(and(...conditions))
		.orderBy(asc(events.startAt))
		.limit(limit)
		.offset(offset);

	// Count attendees for each event to calculate spots remaining
	const eventIds = rawEvents.map((e) => e.id);
	const attendeeCounts: Record<string, number> = {};

	if (eventIds.length > 0) {
		const counts = await db
			.select({
				eventId: eventRegistrations.eventId,
				count: sql<number>`count(*)`
			})
			.from(eventRegistrations)
			.where(and(
				sql`${eventRegistrations.eventId} IN ${eventIds}`,
				eq(eventRegistrations.status, 'confirmed')
			))
			.groupBy(eventRegistrations.eventId);

		for (const c of counts) {
			attendeeCounts[c.eventId] = Number(c.count);
		}
	}

	const formatted = rawEvents.map((e) => {
		const confirmedCount = attendeeCounts[e.id] || 0;
		const spotsRemaining =
			e.maxAttendees !== null && e.maxAttendees !== undefined
				? Math.max(0, e.maxAttendees - confirmedCount)
				: null;

		const isRegistrationOpen =
			new Date() <= new Date(e.registrationDeadline) &&
			(spotsRemaining === null || spotsRemaining > 0);

		return {
			...e,
			confirmedCount,
			spotsRemaining,
			isRegistrationOpen
		};
	});

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(events)
		.where(and(...conditions));

	return json({
		events: formatted,
		total: Number(count)
	});
};

