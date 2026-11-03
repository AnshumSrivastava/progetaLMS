import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations, userEventProfiles } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { CreditService } from '$lib/server/credits/credit.service';
import { eq, and, asc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
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
		.where(eq(events.status, 'published'))
		.orderBy(asc(events.startAt));

	const eventIds = rawEvents.map((e) => e.id);
	const attendeeCounts: Record<string, number> = {};
	const userRegisteredSet = new Set<string>();

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

		if (locals.user) {
			const myRegistrations = await db
				.select({ eventId: eventRegistrations.eventId })
				.from(eventRegistrations)
				.where(and(
					eq(eventRegistrations.userId, locals.user.id),
					eq(eventRegistrations.status, 'confirmed')
				));

			for (const r of myRegistrations) {
				userRegisteredSet.add(r.eventId);
			}
		}
	}

	let userCredits = 0;
	let hasEventProfile = false;

	if (locals.user) {
		const balance = await CreditService.getBalance(locals.user.id);
		userCredits = balance.balance;

		const [profile] = await db
			.select()
			.from(userEventProfiles)
			.where(eq(userEventProfiles.userId, locals.user.id));
		hasEventProfile = !!profile;
	}

	const formattedEvents = rawEvents.map((e) => {
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
			isRegistrationOpen,
			isRegistered: userRegisteredSet.has(e.id)
		};
	});

	return {
		events: formattedEvents,
		user: locals.user || null,
		userCredits,
		hasEventProfile
	};
};

