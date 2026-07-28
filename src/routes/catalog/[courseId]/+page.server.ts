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

	// Load public cohorts
	const { cohorts } = await import('$lib/server/db/schema/cohorts.schema');
	const availableCohorts = await db
		.select()
		.from(cohorts)
		.where(
			and(
				eq(cohorts.courseId, courseId),
				eq(cohorts.isActive, true)
			)
		);

	return {
		asset: record.asset,
		instructorName: record.instructor?.name || 'Instructor',
		alreadyOwned,
		cohorts: availableCohorts
	};
};
