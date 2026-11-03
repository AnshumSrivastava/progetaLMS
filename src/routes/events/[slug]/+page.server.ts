import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations, userEventProfiles } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { CreditService } from '$lib/server/credits/credit.service';
import { eq, or, and, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	const slug = params.slug;

	const whereConditions = [
		eq(events.slug, slug),
		eq(events.id, slug)
	];
	if (slug === 'social-engineering') {
		whereConditions.push(eq(events.slug, 'social-engineering-masterclass'));
	}

	const [event] = await db
		.select({
			id: events.id,
			title: events.title,
			slug: events.slug,
			description: events.description,
			shortDescription: events.shortDescription,
			eventType: events.eventType,
			pricePaise: events.pricePaise,
			priceCredits: events.priceCredits,
			startAt: events.startAt,
			endAt: events.endAt,
			registrationDeadline: events.registrationDeadline,
			maxAttendees: events.maxAttendees,
			venueType: events.venueType,
			venueDetails: events.venueDetails,
			link: events.link,
			coverImageUrl: events.coverImageUrl,
			status: events.status,
			isResourcesReleased: events.isResourcesReleased,
			whatsappGroupUrl: events.whatsappGroupUrl,
			hostId: events.hostId,
			hostName: users.name,
			hostImage: users.image
		})
		.from(events)
		.leftJoin(users, eq(events.hostId, users.id))
		.where(or(...whereConditions));

	if (!event) {
		throw error(404, 'Event not found');
	}

	const [{ count }] = await db
		.select({ count: sql<number>`count(*)` })
		.from(eventRegistrations)
		.where(and(
			eq(eventRegistrations.eventId, event.id),
			eq(eventRegistrations.status, 'confirmed')
		));

	const confirmedCount = Number(count);
	const spotsRemaining =
		event.maxAttendees !== null && event.maxAttendees !== undefined
			? Math.max(0, event.maxAttendees - confirmedCount)
			: null;

	const isRegistrationOpen =
		event.status === 'published' &&
		new Date() <= new Date(event.registrationDeadline) &&
		(spotsRemaining === null || spotsRemaining > 0);

	let isRegistered = false;
	let userCredits = 0;
	let hasEventProfile = false;

	if (locals.user) {
		const [reg] = await db
			.select()
			.from(eventRegistrations)
			.where(and(
				eq(eventRegistrations.eventId, event.id),
				eq(eventRegistrations.userId, locals.user.id),
				eq(eventRegistrations.status, 'confirmed')
			));

		isRegistered = !!reg;

		const balance = await CreditService.getBalance(locals.user.id);
		userCredits = balance.balance;

		const [profile] = await db
			.select()
			.from(userEventProfiles)
			.where(eq(userEventProfiles.userId, locals.user.id));
		hasEventProfile = !!profile;
	}

	return {
		event: {
			...event,
			confirmedCount,
			spotsRemaining,
			isRegistrationOpen
		},
		isRegistered,
		user: locals.user || null,
		userCredits,
		hasEventProfile
	};
};

