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
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { events, eventAttendees } from '$lib/server/db/schema/platform.schema';
import { cohorts, cohortMemberships, cohortSuggestedAssets } from '$lib/server/db/schema/cohorts.schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

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
	const issuedCertificates = await db.select().from(certificates).where(eq(certificates.userId, locals.user.id));

	// Load upcoming events
	const upcomingEvents = await db.select().from(events);
	const myAttendees = await db.select().from(eventAttendees).where(eq(eventAttendees.userId, locals.user.id));
	const registeredEventIds = new Set(myAttendees.map(a => a.eventId));

	// Load student cohorts (Classes)
	
	const myCohortMemberships = await db.select({
		cohortId: cohortMemberships.cohortId,
		role: cohortMemberships.role
	}).from(cohortMemberships).where(eq(cohortMemberships.userId, locals.user.id));
	
	const myCohortIds = myCohortMemberships.map(m => m.cohortId);
	let myCohorts = [];
	let mySuggestedAssets = [];

	if (myCohortIds.length > 0) {
		myCohorts = await db.select().from(cohorts).where(inArray(cohorts.id, myCohortIds));
		
		mySuggestedAssets = await db.select({
			cohortId: cohortSuggestedAssets.cohortId,
			asset: {
				id: assets.id,
				title: assets.title,
				type: assets.type,
				pricePaise: assets.pricePaise,
				thumbnail: assets.thumbnail
			}
		})
		.from(cohortSuggestedAssets)
		.innerJoin(assets, eq(cohortSuggestedAssets.assetId, assets.id))
		.where(inArray(cohortSuggestedAssets.cohortId, myCohortIds));
	}

	const cohortsWithSuggestions = myCohorts.map(c => ({
		...c,
		suggestedAssets: mySuggestedAssets.filter(s => s.cohortId === c.id).map(s => s.asset)
	}));

	return {
		user: locals.user,
		ownedCourses,
		ownedResources,
		ownedCerts,
		issuedCertificates,
		upcomingEvents,
		registeredEventIds: Array.from(registeredEventIds),
		cohorts: cohortsWithSuggestions
	};
};

export const actions = {
	registerEvent: async ({ request, locals }) => {
		if (!locals.user) return { success: false, error: 'Unauthorized' };
		const data = await request.formData();
		const eventId = data.get('eventId') as string;
		if (!eventId) return { success: false, error: 'Event ID required' };
		
		
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
