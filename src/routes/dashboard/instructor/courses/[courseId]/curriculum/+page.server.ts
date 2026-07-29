import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/sign-in');
	if (user.role !== 'teacher' && user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const courseId = params.courseId;
	const [course] = await db.select().from(assets).where(and(eq(assets.id, courseId), eq(assets.ownerId, user.id)));

	if (!course) {
		throw error(404, 'Course not found or unauthorized');
	}

	return {
		course
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		
		// Verify ownership
		const [course] = await db.select().from(assets).where(and(eq(assets.id, courseId), eq(assets.ownerId, user.id)));
		if (!course) {
			return fail(404, { error: 'Course not found' });
		}

		const data = await request.formData();
		const curriculumJson = data.get('curriculum') as string;
		
		if (!curriculumJson) {
			return fail(400, { error: 'Curriculum data missing' });
		}

		try {
			const curriculum = JSON.parse(curriculumJson);
			
			// Preserve other metadata properties while updating curriculum
			const updatedMetadata = {
				...((course.metadata as any) || {}),
				curriculum
			};

			await db.update(assets).set({
				metadata: updatedMetadata,
				updatedAt: new Date()
			}).where(eq(assets.id, courseId));

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to save curriculum' });
		}
	}
};
