import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventResources, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { hmacSha256Base64 } from '$shared/utils/crypto';
import { env } from '$env/dynamic/private';
import { CASHFREE_SECRET_KEY } from '$env/static/private';
import { eq, or, and, asc } from 'drizzle-orm';

const SIGNING_SECRET = env.RESOURCE_SIGNING_SECRET || CASHFREE_SECRET_KEY || 'progeta-default-resource-key-32b';

export const load: PageServerLoad = async ({ params, locals, url }) => {
	if (!locals.user) {
		throw redirect(302, `/sign-in?returnTo=${url.pathname}`);
	}

	const slug = params.slug;

	const whereConditions = [
		eq(events.slug, slug),
		eq(events.id, slug)
	];
	if (slug === 'social-engineering') {
		whereConditions.push(eq(events.slug, 'social-engineering-masterclass'));
	}

	const [event] = await db
		.select()
		.from(events)
		.where(or(...whereConditions));

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
			eq(eventRegistrations.eventId, event.id),
			eq(eventRegistrations.userId, locals.user.id),
			eq(eventRegistrations.status, 'confirmed')
		));

	if (!isStaff && !registration) {
		return {
			isAuthorized: false,
			event: {
				id: event.id,
				title: event.title,
				slug: event.slug,
				isResourcesReleased: event.isResourcesReleased
			},
			resources: []
		};
	}

	// Staff sees all resources; attendees see published resources + pre-event resources
	const conditions = [eq(eventResources.eventId, event.id)];

	if (!isStaff && !event.isResourcesReleased) {
		conditions.push(eq(eventResources.isPreEvent, true));
	}

	const rawResources = await db
		.select()
		.from(eventResources)
		.where(and(...conditions))
		.orderBy(asc(eventResources.sortOrder));

	const nowUnix = Math.floor(Date.now() / 1000);
	const exp = nowUnix + 3600; // 1 hr token

	const resources = await Promise.all(
		rawResources.map(async (res) => {
			if (res.type === 'file') {
				const message = `${res.id}:${locals.user!.id}:${exp}`;
				const sig = await hmacSha256Base64(SIGNING_SECRET, message);
				const signedUrl = `/api/resource/${res.id}?uid=${locals.user!.id}&exp=${exp}&sig=${encodeURIComponent(sig)}`;

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

	return {
		isAuthorized: true,
		event: {
			id: event.id,
			title: event.title,
			slug: event.slug,
			isResourcesReleased: event.isResourcesReleased,
			whatsappGroupUrl: event.whatsappGroupUrl
		},
		resources
	};
};

