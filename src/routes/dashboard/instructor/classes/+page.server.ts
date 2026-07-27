import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships, assets } from '$lib/server/db/schema';
import { eq, count } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	// For demo purposes we are fetching all cohorts, 
	// normally you'd filter by instructorId: eq(cohorts.instructorId, locals.user.id)
	
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
		title: assets.title
	}).from(assets).where(eq(assets.type, 'html')); // Assuming html/markdown is the main course type

	return {
		classes: mappedClasses,
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

		// Use a fallback instructor for the demo if user is not fully mocked
		const instructorId = locals.user?.id || 'demo-instructor-id';

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
	}
};
