/**
 * Dashboard — Server Load
 *
 * Protects the route: unauthenticated users are redirected to sign-in.
 * Passes the authenticated user to the page component via data.
 */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}
	
	if (locals.user.role === 'admin' || locals.user.role === 'owner') {
		throw redirect(302, '/dashboard/settings');
	}
	
	if (locals.user.role === 'teacher') {
		throw redirect(302, '/dashboard/instructor');
	}

	const owned = await db
		.select({
			id: assets.id,
			slug: assets.slug,
			title: assets.title,
			description: assets.description,
			type: assets.type,
			thumbnail: assets.thumbnail,
			metadata: assets.metadata,
			grantedAt: assetOwnership.grantedAt
		})
		.from(assetOwnership)
		.innerJoin(assets, eq(assetOwnership.assetId, assets.id))
		.where(
			and(
				eq(assetOwnership.ownerId, locals.user.id),
				isNull(assetOwnership.revokedAt),
				isNull(assets.deletedAt)
			)
		);

	const ownedCourses = owned.filter(a => ['html', 'markdown', 'pdf'].includes(a.type));
	const ownedResources = owned.filter(a => ['download', 'external'].includes(a.type));
	const ownedCerts = owned.filter(a => a.type === 'cert_test');

	// Also load issued certificates
	const { certificates } = await import('$lib/server/db/schema/certificates.schema');
	const issuedCertificates = await db.select().from(certificates).where(eq(certificates.userId, locals.user.id));

	// Load upcoming events
	const { events } = await import('$lib/server/db/schema/platform.schema');
	const { eventAttendees } = await import('$lib/server/db/schema/platform.schema');
	const upcomingEvents = await db.select().from(events);
	const myAttendees = await db.select().from(eventAttendees).where(eq(eventAttendees.userId, locals.user.id));
	const registeredEventIds = new Set(myAttendees.map(a => a.eventId));

	return {
		user: locals.user,
		ownedCourses,
		ownedResources,
		ownedCerts,
		issuedCertificates,
		upcomingEvents,
		registeredEventIds: Array.from(registeredEventIds)
	};
};

export const actions = {
	registerEvent: async ({ request, locals }) => {
		if (!locals.user) return { success: false, error: 'Unauthorized' };
		const data = await request.formData();
		const eventId = data.get('eventId') as string;
		if (!eventId) return { success: false, error: 'Event ID required' };
		
		const { eventAttendees } = await import('$lib/server/db/schema/platform.schema');
		const { randomUUID } = await import('node:crypto');
		const { db } = await import('$lib/server/db/client');
		const { eq, and } = await import('drizzle-orm');
		
		const [existing] = await db.select().from(eventAttendees)
			.where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, locals.user.id)));
			
		if (existing) return { success: false, error: 'Already registered' };
		
		await db.insert(eventAttendees).values({
			id: randomUUID(),
			eventId,
			userId: locals.user.id
		});
		
		return { success: true };
	}
};
