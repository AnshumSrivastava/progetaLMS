import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations, userEventProfiles } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq, or, and, sql } from 'drizzle-orm';

export const GET: RequestHandler = async ({ params, locals }) => {
	const slugOrId = params.slug;

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
			status: events.status,
			venueType: events.venueType,
			venueDetails: events.venueDetails,
			link: events.link,
			coverImageUrl: events.coverImageUrl,
			isResourcesReleased: events.isResourcesReleased,
			whatsappGroupUrl: events.whatsappGroupUrl,
			hostId: events.hostId,
			hostName: users.name,
			hostImage: users.image
		})
		.from(events)
		.leftJoin(users, eq(events.hostId, users.id))
		.where(or(eq(events.slug, slugOrId), eq(events.id, slugOrId)));

	if (!event) {
		throw error(404, 'Event not found');
	}

	// Count confirmed registrations
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

	let isUserRegistered = false;
	let userRegistrationStatus: string | null = null;
	let hasEventProfile = false;

	if (locals.user) {
		const [reg] = await db
			.select()
			.from(eventRegistrations)
			.where(and(
				eq(eventRegistrations.eventId, event.id),
				eq(eventRegistrations.userId, locals.user.id)
			));

		if (reg) {
			isUserRegistered = reg.status === 'confirmed';
			userRegistrationStatus = reg.status;
		}

		const [profile] = await db
			.select()
			.from(userEventProfiles)
			.where(eq(userEventProfiles.userId, locals.user.id));

		hasEventProfile = !!profile;
	}

	// Privacy mask: Only expose direct session links and joining instructions to confirmed attendees or instructor/admin
	const isStaff = locals.user && (locals.user.role === 'admin' || locals.user.role === 'owner' || locals.user.id === event.hostId);
	const canAccessPrivateDetails = isUserRegistered || isStaff;

	return json({
		event: {
			id: event.id,
			title: event.title,
			slug: event.slug,
			description: event.description,
			shortDescription: event.shortDescription,
			eventType: event.eventType,
			pricePaise: event.pricePaise,
			priceCredits: event.priceCredits,
			startAt: event.startAt,
			endAt: event.endAt,
			registrationDeadline: event.registrationDeadline,
			maxAttendees: event.maxAttendees,
			status: event.status,
			venueType: event.venueType,
			venueDetails: canAccessPrivateDetails ? event.venueDetails : null,
			link: canAccessPrivateDetails ? event.link : null,
			coverImageUrl: event.coverImageUrl,
			isResourcesReleased: event.isResourcesReleased,
			whatsappGroupUrl: canAccessPrivateDetails ? event.whatsappGroupUrl : null,
			host: {
				id: event.hostId,
				name: event.hostName || 'Instructor',
				image: event.hostImage || null
			},
			confirmedCount,
			spotsRemaining,
			isRegistrationOpen,
			isUserRegistered,
			userRegistrationStatus,
			hasEventProfile
		}
	});
};

