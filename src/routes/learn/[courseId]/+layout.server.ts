import { db } from '$lib/server/db/client';
import { assets, assetOwnership, assetContent } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull, or } from 'drizzle-orm';
import { redirect, error } from '@sveltejs/kit';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ params, locals }) => {
	const courseId = params.courseId;

	if (!locals.user) {
		throw redirect(302, `/checkout/${courseId}`);
	}

	const [asset] = await db
		.select()
		.from(assets)
		.where(
			and(
				or(eq(assets.id, courseId), eq(assets.slug, courseId)),
				isNull(assets.deletedAt)
			)
		);

	if (!asset) {
		throw error(404, 'Course not found');
	}

	const realAssetId = asset.id;

	// Gate access
	const ownership = await db
		.select()
		.from(assetOwnership)
		.where(
			and(
				eq(assetOwnership.assetId, realAssetId),
				eq(assetOwnership.ownerId, locals.user.id),
				isNull(assetOwnership.revokedAt)
			)
		);

	if (ownership.length === 0) {
		throw redirect(302, `/checkout/${asset.slug || realAssetId}`);
	}

	// Fetch all active content blocks for this asset
	const modules = await db
		.select()
		.from(assetContent)
		.where(
			and(
				eq(assetContent.assetId, realAssetId),
				eq(assetContent.isCurrent, true)
			)
		)
		.orderBy(assetContent.id); // For now, just order by ID

	return {
		course: asset,
		modules
	};
};
