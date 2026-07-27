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

	return {
		user: locals.user,
		ownedCourses,
		ownedResources,
		ownedCerts
	};
};
