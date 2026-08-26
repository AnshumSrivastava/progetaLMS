import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * PATCH /api/mentoring/my/profile
 * Allows an instructor to update their rich mentoring profile details.
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
		return json({ error: 'Instructor or administrator role required.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const result = await MentoringService.updateInstructorMentoringProfile(locals.user.id, body);
		return json(result);
	} catch (err: any) {
		console.error('[my/profile] PATCH error:', err);
		return json({ error: err.message || 'Failed to update profile.' }, { status: 500 });
	}
};
