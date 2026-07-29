import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships, cohortSuggestedAssets } from '$lib/server/db/schema/cohorts.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, count } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const instructorId = locals.user.id;
	const allCohorts = await db
		.select({
			id: cohorts.id,
			name: cohorts.name,
			course: assets.title,
			status: cohorts.isActive,
			students: count(cohortMemberships.id)
		})
		.from(cohorts)
		.leftJoin(assets, eq(cohorts.courseId, assets.id))
		.leftJoin(cohortMemberships, eq(cohorts.id, cohortMemberships.cohortId))
		.where(eq(cohorts.instructorId, instructorId))
		.groupBy(cohorts.id, assets.title);

	const mappedClasses = allCohorts.map(c => ({
		id: c.id,
		name: c.name,
		course: c.course || 'Unknown Course',
		students: c.students,
		status: c.status ? 'Active' : 'Draft'
	}));

	const availableCourses = await db.select({
		id: assets.id,
		title: assets.title,
		type: assets.type
	}).from(assets).where(and(eq(assets.ownerId, instructorId))); 

	const myCohortIds = mappedClasses.map(c => c.id);
	
	let suggestedAssets = [];
	if (myCohortIds.length > 0) {
		const result = await db.select({
			cohortId: cohortSuggestedAssets.cohortId,
			assetId: assets.id,
			title: assets.title,
			type: assets.type,
			suggestedAssetId: cohortSuggestedAssets.id
		})
		.from(cohortSuggestedAssets)
		.innerJoin(assets, eq(cohortSuggestedAssets.assetId, assets.id))
		.where(eq(assets.ownerId, instructorId));

		suggestedAssets = result;
	}

	const classesWithSuggestions = mappedClasses.map(c => ({
		...c,
		suggestedAssets: suggestedAssets.filter(s => s.cohortId === c.id)
	}));

	return {
		classes: classesWithSuggestions,
		availableCourses
	};
};

export const actions: Actions = {
	createClass: async ({ request, locals }) => {
		const data = await request.formData();
		const name = data.get('className')?.toString();
		const courseId = data.get('courseId')?.toString();

		if (!name || !courseId) {
			return fail(400, { error: 'Missing name or course' });
		}

		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;

		try {
			await db.insert(cohorts).values({
				id: createId(),
				name,
				courseId,
				instructorId,
				isActive: false
			});
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to create class' });
		}
	},

	suggestAsset: async ({ request, locals }) => {
		const data = await request.formData();
		const cohortId = data.get('cohortId')?.toString();
		const assetId = data.get('assetId')?.toString();

		if (!cohortId || !assetId) return fail(400, { error: 'Missing cohort or asset' });
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;

		try {
			// verify cohort ownership
			const [ownedCohort] = await db.select().from(cohorts).where(and(eq(cohorts.id, cohortId), eq(cohorts.instructorId, instructorId)));
			if (!ownedCohort) return fail(403, { error: 'Unauthorized' });

			// verify asset ownership
			const [ownedAsset] = await db.select().from(assets).where(and(eq(assets.id, assetId), eq(assets.ownerId, instructorId)));
			if (!ownedAsset) return fail(403, { error: 'Unauthorized' });

			await db.insert(cohortSuggestedAssets).values({
				id: createId(),
				cohortId,
				assetId
			}).onConflictDoNothing();

			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to suggest asset' });
		}
	},

	removeSuggestion: async ({ request, locals }) => {
		const data = await request.formData();
		const suggestedAssetId = data.get('suggestedAssetId')?.toString();

		if (!suggestedAssetId) return fail(400, { error: 'Missing suggestion ID' });
		if (!locals.user) throw redirect(302, '/sign-in');

		try {
			await db.delete(cohortSuggestedAssets).where(eq(cohortSuggestedAssets.id, suggestedAssetId));
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to remove suggestion' });
		}
	}
};
