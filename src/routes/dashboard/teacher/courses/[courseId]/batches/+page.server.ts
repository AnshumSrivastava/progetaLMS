import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { CohortService } from '$lib/server/cohorts/CohortService';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/sign-in');

	const courseId = params.courseId;
	const canManage = await CohortService.canManageCourse(courseId, user.id);
	if (!canManage) throw error(403, 'Permission denied');

	const [course] = await db
		.select()
		.from(assets)
		.where(and(eq(assets.id, courseId), isNull(assets.deletedAt)))
		.limit(1);

	if (!course) throw error(404, 'Course not found');

	const batches = await CohortService.getCourseBatches(courseId);

	// Get enrolled students roster for all batches of this course
	const batchIds = batches.map((b) => b.id);
	let roster: Record<string, any[]> = {};

	if (batchIds.length > 0) {
		const members = await db
			.select({
				id: cohortMemberships.id,
				cohortId: cohortMemberships.cohortId,
				userId: users.id,
				name: users.name,
				email: users.email,
				role: cohortMemberships.role,
				status: cohortMemberships.status,
				joinedAt: cohortMemberships.joinedAt,
				accessExpiresAt: cohortMemberships.accessExpiresAt
			})
			.from(cohortMemberships)
			.innerJoin(users, eq(cohortMemberships.userId, users.id))
			.where(inArray(cohortMemberships.cohortId, batchIds));

		members.forEach((m) => {
			if (!roster[m.cohortId]) roster[m.cohortId] = [];
			roster[m.cohortId].push(m);
		});
	}

	return {
		course,
		batches,
		roster
	};
};

export const actions: Actions = {
	createBatch: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		const data = await request.formData();

		const name = (data.get('name') as string || '').trim();
		const startDateStr = data.get('startDate') as string;
		const endDateStr = data.get('endDate') as string;
		const scheduleText = (data.get('scheduleText') as string || '').trim();
		const maxStudents = parseInt(data.get('maxStudents') as string || '0') || undefined;
		const meetingUrl = (data.get('meetingUrl') as string || '').trim();
		const communityUrl = (data.get('communityUrl') as string || '').trim();

		if (!name || !startDateStr) {
			return fail(400, { error: 'Batch name and start date are required' });
		}

		try {
			await CohortService.createBatch(courseId, user.id, {
				name,
				startDate: new Date(startDateStr),
				endDate: endDateStr ? new Date(endDateStr) : undefined,
				scheduleText,
				maxStudents,
				meetingUrl,
				communityUrl
			});

			return { success: true, message: `Batch '${name}' created successfully` };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to create batch' });
		}
	},

	updateLinks: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const batchId = data.get('batchId') as string;
		const meetingUrl = data.get('meetingUrl') as string;
		const communityUrl = data.get('communityUrl') as string;
		const scheduleText = data.get('scheduleText') as string;

		try {
			await CohortService.updateBatchLinks(batchId, user.id, {
				meetingUrl,
				communityUrl,
				scheduleText
			});
			return { success: true, message: 'Batch schedule & communication links updated' };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to update links' });
		}
	},

	addSessionLink: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const batchId = data.get('batchId') as string;
		const title = (data.get('title') as string || '').trim();
		const date = (data.get('date') as string || '').trim();
		const recordingUrl = (data.get('recordingUrl') as string || '').trim();
		const materialsUrl = (data.get('materialsUrl') as string || '').trim();
		const notes = (data.get('notes') as string || '').trim();

		if (!title || !date) {
			return fail(400, { error: 'Session title and date are required' });
		}

		try {
			await CohortService.addSessionLink(batchId, user.id, {
				title,
				date,
				recordingUrl,
				materialsUrl,
				notes
			});
			return { success: true, message: `Session link for '${title}' added` };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to add session link' });
		}
	},

	markCompleted: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const batchId = data.get('batchId') as string;

		try {
			const res = await CohortService.markBatchCompleted(batchId, user.id);
			return {
				success: true,
				message: `Batch marked as completed. 3-month retention window set until ${new Date(res.accessExpiresAt).toLocaleDateString()}`
			};
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to complete batch' });
		}
	},

	sendTransferPing: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const data = await request.formData();
		const studentId = data.get('studentId') as string;
		const fromCohortId = data.get('fromCohortId') as string;
		const toCohortId = data.get('toCohortId') as string;
		const reason = (data.get('reason') as string || '').trim();

		if (!studentId || !fromCohortId || !toCohortId) {
			return fail(400, { error: 'Missing required transfer details' });
		}

		try {
			await CohortService.sendTransferPing(user.id, {
				studentId,
				fromCohortId,
				toCohortId,
				reason
			});
			return { success: true, message: 'Transfer ping sent to student. Pending their acceptance.' };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to send transfer ping' });
		}
	}
};
