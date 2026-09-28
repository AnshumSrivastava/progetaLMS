import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const courseId = params.courseId;

	// Query asset and owner (instructor) in one go
	const [record] = await db
		.select({
			asset: assets,
			instructor: users
		})
		.from(assets)
		.leftJoin(users, eq(assets.ownerId, users.id))
		.where(
			and(
				eq(assets.id, courseId),
				eq(assets.status, 'published'),
				isNull(assets.deletedAt)
			)
		);

	if (!record) {
		throw error(404, 'Course not found');
	}

	let alreadyOwned = false;
	
	if (locals.user) {
		const ownership = await db
			.select()
			.from(assetOwnership)
			.where(
				and(
					eq(assetOwnership.assetId, courseId),
					eq(assetOwnership.ownerId, locals.user.id),
					isNull(assetOwnership.revokedAt)
				)
			);
		
		alreadyOwned = ownership.length > 0;
	}

	// Load public cohorts with live capacity: 1 batch at a time, once filled the next unlocks
	const { CohortService } = await import('$lib/server/cohorts/CohortService');
	const allBatches = await CohortService.getCourseBatches(courseId);
	const eligibleBatches = allBatches.filter(b => b.isActive && b.status !== 'completed');

	// Determine sequential batch availability:
	// Find the earliest upcoming batch that is not sold out.
	// Allow sold out batches to be shown as "Full", the active open batch as available,
	// and lock subsequent batches until the current batch is full.
	const activeBatches: typeof eligibleBatches = [];
	let foundOpenBatch = false;

	for (const batch of eligibleBatches) {
		if (batch.isSoldOut) {
			activeBatches.push(batch);
		} else if (!foundOpenBatch) {
			activeBatches.push(batch);
			foundOpenBatch = true;
		}
		// If foundOpenBatch is true, subsequent batches are kept in reserve until this batch fills
	}

	let userEnrolledCohortId: string | null = null;
	if (locals.user) {
		const { cohortMemberships } = await import('$lib/server/db/schema/cohorts.schema');
		const [membership] = await db
			.select({ cohortId: cohortMemberships.cohortId })
			.from(cohortMemberships)
			.where(
				and(
					eq(cohortMemberships.userId, locals.user.id),
					eq(cohortMemberships.status, 'active')
				)
			)
			.limit(1);
		if (membership) {
			userEnrolledCohortId = membership.cohortId;
		}
	}

	return {
		asset: record.asset,
		instructorName: record.instructor?.name || 'Instructor',
		alreadyOwned,
		userEnrolledCohortId,
		cohorts: activeBatches
	};
};
