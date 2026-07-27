/**
 * Dashboard — Server Load
 *
 * Protects the route: unauthenticated users are redirected to sign-in.
 * Passes the authenticated user to the page component via data.
 */
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { eq, sql } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	const ownedAssets = await db
		.select()
		.from(assets)
		.where(eq(assets.ownerId, locals.user.id));

	const activeStudentsResult = await db
		.select({ count: sql`count(distinct ${assetOwnership.ownerId})` })
		.from(assetOwnership)
		.innerJoin(assets, eq(assetOwnership.assetId, assets.id))
		.where(eq(assets.ownerId, locals.user.id));
	
	const totalStudents = Number(activeStudentsResult[0]?.count) || 0;

	return {
		user: locals.user,
		stats: {
			totalStudents,
			activeCourses: ownedAssets.length,
			avgRating: 0,
			totalRevenue: 0
		}
	};
};
