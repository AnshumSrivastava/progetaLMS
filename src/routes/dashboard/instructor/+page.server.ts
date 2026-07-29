/**
 * Dashboard — Server Load
 *
 * Protects the route: unauthenticated users are redirected to sign-in.
 * Passes the authenticated user to the page component via data.
 */
import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { commerceOrders } from '$lib/server/db/schema/commerce.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq, and, sql, desc, inArray } from 'drizzle-orm';
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	const instructorId = locals.user.id;

	const ownedAssets = await db
		.select()
		.from(assets)
		.where(eq(assets.ownerId, instructorId));
		
	const ownedAssetIds = ownedAssets.map(a => a.id);

	// Get my cohorts to find my students
	const myCohorts = await db.select({ id: cohorts.id, name: cohorts.name }).from(cohorts).where(eq(cohorts.instructorId, instructorId));
	const myCohortIds = myCohorts.map(c => c.id);

	// Real unique student count
	let totalStudents = 0;
	if (myCohortIds.length > 0) {
		const activeStudentsResult = await db
			.select({ count: sql`count(distinct ${cohortMemberships.userId})` })
			.from(cohortMemberships)
			.where(inArray(cohortMemberships.cohortId, myCohortIds));
		totalStudents = Number(activeStudentsResult[0]?.count) || 0;
	}

	// Real revenue
	let totalRevenuePaise = 0;
	if (ownedAssetIds.length > 0) {
		const revenueResult = await db
			.select({ sum: sql`sum(${commerceOrders.amountPaise})` })
			.from(commerceOrders)
			.where(and(eq(commerceOrders.status, 'paid'), inArray(commerceOrders.assetId, ownedAssetIds)));
		totalRevenuePaise = Number(revenueResult[0]?.sum) || 0;
	}

	// Real recent activity (last 5 enrollments)
	let recentActivity = [];
	if (myCohortIds.length > 0) {
		const recentJoins = await db
			.select({
				user: users.name,
				cohortName: cohorts.name,
				joinedAt: cohortMemberships.joinedAt
			})
			.from(cohortMemberships)
			.innerJoin(users, eq(cohortMemberships.userId, users.id))
			.innerJoin(cohorts, eq(cohortMemberships.cohortId, cohorts.id))
			.where(inArray(cohortMemberships.cohortId, myCohortIds))
			.orderBy(desc(cohortMemberships.joinedAt))
			.limit(5);

		recentActivity = recentJoins.map(join => {
			// very naive "time ago"
			const diffMs = Date.now() - join.joinedAt.getTime();
			const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
			const diffDays = Math.floor(diffHours / 24);
			let timeStr = 'just now';
			if (diffDays > 0) timeStr = `${diffDays} days ago`;
			else if (diffHours > 0) timeStr = `${diffHours} hours ago`;
			else timeStr = 'recently';

			return {
				user: join.user || 'Unknown User',
				action: 'enrolled in',
				target: join.cohortName,
				time: timeStr
			};
		});
	}

	return {
		user: locals.user,
		recentActivity,
		stats: {
			totalStudents,
			activeCourses: ownedAssets.length,
			avgRating: 0, // Mock for now
			totalRevenue: (totalRevenuePaise / 100).toFixed(2)
		}
	};
};
