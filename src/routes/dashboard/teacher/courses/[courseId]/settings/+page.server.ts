import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { CohortService } from '$lib/server/cohorts/CohortService';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/sign-in');
	if (user.role !== 'teacher' && user.role !== 'admin' && user.role !== 'owner') {
		throw redirect(302, '/dashboard');
	}

	const courseId = params.courseId;
	const canManage = await CohortService.canManageCourse(courseId, user.id);
	if (!canManage) {
		throw error(403, 'You do not have permission to manage this course');
	}

	const [course] = await db.select().from(assets).where(eq(assets.id, courseId)).limit(1);
	if (!course) {
		throw error(404, 'Course not found');
	}

	const isCourseAdmin = await CohortService.isCourseAdmin(courseId, user.id);
	const collaborators = await CohortService.getCourseCollaborators(courseId);

	return {
		course,
		isCourseAdmin,
		collaborators
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		const canManage = await CohortService.canManageCourse(courseId, user.id);
		if (!canManage) throw error(403, 'Permission denied');

		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const price = parseFloat((data.get('price') as string) || '0') || 0;
		const currency = data.get('currency')?.toString() || 'INR';
		const pricePaise = Math.floor(price * 100);
		const pricingType = data.get('pricingType') as string;
		const accessType = data.get('accessType') as string;
		const isSelfPacedEnabled = data.get('isSelfPacedEnabled') === 'on';
		const isLiveBatchesEnabled = data.get('isLiveBatchesEnabled') === 'on';

		const deliveryFormat = (data.get('deliveryFormat') as 'self_paced' | 'live_batch') || (isLiveBatchesEnabled ? 'live_batch' : 'self_paced');

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		try {
			await db
				.update(assets)
				.set({
					title,
					description,
					deliveryFormat,
					isSelfPacedEnabled: deliveryFormat === 'self_paced',
					isLiveBatchesEnabled: deliveryFormat === 'live_batch',
					pricePaise: pricingType === 'free' ? 0 : pricePaise,
					currency,
					visibility: accessType === 'private' ? 'private' : 'public',
					updatedAt: new Date()
				})
				.where(eq(assets.id, courseId));

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to save settings' });
		}
	},

	addCollaborator: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		const data = await request.formData();
		const emailOrId = (data.get('emailOrId') as string || '').trim();
		const role = (data.get('role') as 'co_instructor' | 'teaching_assistant') || 'co_instructor';

		if (!emailOrId) {
			return fail(400, { collaboratorError: 'Please provide mentor email or user ID' });
		}

		try {
			await CohortService.addCourseCollaborator(courseId, user.id, emailOrId, role);
			return { collaboratorSuccess: true, message: `Added ${emailOrId} as ${role === 'co_instructor' ? 'Co-Instructor' : 'Teaching Assistant'}` };
		} catch (e: any) {
			return fail(400, { collaboratorError: e.message || 'Failed to add collaborator' });
		}
	},

	removeCollaborator: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		const data = await request.formData();
		const collaboratorUserId = (data.get('collaboratorUserId') as string || '').trim();

		try {
			await CohortService.removeCourseCollaborator(courseId, user.id, collaboratorUserId);
			return { collaboratorSuccess: true, message: 'Collaborator removed from course' };
		} catch (e: any) {
			return fail(400, { collaboratorError: e.message || 'Failed to remove collaborator' });
		}
	}
};
