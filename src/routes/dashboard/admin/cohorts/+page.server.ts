import { db } from '$lib/server/db/client';
import { cohorts } from '$lib/server/db/schema/cohorts.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, desc } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';
import type { PageServerLoad, Actions } from './$types';
import slugify from 'slugify';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const allCohorts = await db.select({
		id: cohorts.id,
		name: cohorts.name,
		startDate: cohorts.startDate,
		isActive: cohorts.isActive,
		course: { id: assets.id, title: assets.title },
		instructor: { id: users.id, name: users.name }
	})
	.from(cohorts)
	.leftJoin(assets, eq(cohorts.courseId, assets.id))
	.leftJoin(users, eq(cohorts.instructorId, users.id))
	.orderBy(desc(cohorts.createdAt));

	const allAssets = await db.select().from(assets).where(eq(assets.status, 'published'));
	const instructors = await db.select().from(users).where(eq(users.role, 'teacher'));
	
	// If no instructors, we can allow admin to be instructor
	const admins = await db.select().from(users).where(eq(users.role, 'admin'));

	return {
		cohorts: allCohorts,
		assets: allAssets,
		instructors: [...instructors, ...admins]
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);

		const data = await request.formData();
		const name = data.get('name') as string;
		let courseId = data.get('courseId') as string;
		const instructorId = data.get('instructorId') as string;

		if (!name || !instructorId) return fail(400, { error: 'Missing fields' });

		try {
			// If no course is selected, auto-create a placeholder course asset
			if (!courseId) {
				courseId = createId();
				await db.insert(assets).values({
					id: courseId,
					slug: slugify(name, { lower: true, strict: true }) + '-' + courseId.substring(0, 4),
					title: name + ' Course Material',
					type: 'html',
					status: 'published',
					ownerId: locals.user.id
				});
			}

			const cohortId = createId();
			await db.insert(cohorts).values({
				id: cohortId,
				name,
				courseId,
				instructorId,
				isActive: true
			});

			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: e.message });
		}
	}
};
