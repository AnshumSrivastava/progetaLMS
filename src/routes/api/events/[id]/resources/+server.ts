import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventResources, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { hmacSha256Base64 } from '$shared/utils/crypto';
import { env } from '$env/dynamic/private';
import { CASHFREE_SECRET_KEY } from '$env/static/private';
import { eq, and, or, asc } from 'drizzle-orm';

const SIGNING_SECRET = env.RESOURCE_SIGNING_SECRET || CASHFREE_SECRET_KEY || 'progeta-default-resource-key-32b';

export const GET: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		throw error(401, 'Please sign in to access event resources');
	}

	const eventId = params.id;

	const [event] = await db
		.select()
		.from(events)
		.where(eq(events.id, eventId));

	if (!event) {
		throw error(404, 'Event not found');
	}

	const isStaff =
		locals.user.role === 'admin' ||
		locals.user.role === 'owner' ||
		locals.user.id === event.hostId;

	const [registration] = await db
		.select()
		.from(eventRegistrations)
		.where(and(
			eq(eventRegistrations.eventId, eventId),
			eq(eventRegistrations.userId, locals.user.id),
			eq(eventRegistrations.status, 'confirmed')
		));

	if (!isStaff && !registration) {
		throw error(403, 'You must be registered for this event to view its resources');
	}

	// If resources are not released yet, non-staff only see pre-event resources
	const conditions = [eq(eventResources.eventId, eventId)];

	if (!isStaff && !event.isResourcesReleased) {
		conditions.push(eq(eventResources.isPreEvent, true));
	}

	const rawResources = await db
		.select()
		.from(eventResources)
		.where(and(...conditions))
		.orderBy(asc(eventResources.sortOrder));

	const nowUnix = Math.floor(Date.now() / 1000);
	const exp = nowUnix + 3600; // 1 hour token TTL

	const resources = await Promise.all(
		rawResources.map(async (res) => {
			if (res.type === 'file') {
				const message = `${res.id}:${locals.user.id}:${exp}`;
				const sig = await hmacSha256Base64(SIGNING_SECRET, message);
				const signedUrl = `/api/resource/${res.id}?uid=${locals.user.id}&exp=${exp}&sig=${encodeURIComponent(sig)}`;

				return {
					id: res.id,
					title: res.title,
					description: res.description,
					type: res.type,
					isPreEvent: res.isPreEvent,
					mimeType: res.mimeType,
					sizeBytes: res.sizeBytes,
					downloadUrl: signedUrl
				};
			}

			// Link or Video embed URL
			return {
				id: res.id,
				title: res.title,
				description: res.description,
				type: res.type,
				isPreEvent: res.isPreEvent,
				mimeType: res.mimeType,
				sizeBytes: res.sizeBytes,
				downloadUrl: res.urlOrKey
			};
		})
	);

	return json({
		eventId: event.id,
		eventTitle: event.title,
		isResourcesReleased: event.isResourcesReleased,
		resources
	});
};

