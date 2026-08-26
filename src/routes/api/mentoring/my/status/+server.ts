import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * PATCH /api/mentoring/my/status
 * Allows an instructor/teacher/admin to toggle their mentoring listing status (ON / OFF).
 *
 * Body: { enabled: boolean }
 */
export const PATCH: RequestHandler = async ({ request, locals }) => {
	if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
		return json({ error: 'Instructor or administrator role required.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { enabled } = body;

		if (typeof enabled !== 'boolean') {
			return json({ error: 'Field "enabled" must be a boolean.' }, { status: 400 });
		}

		const result = await MentoringService.toggleInstructorMentoring(locals.user.id, enabled);
		return json(result);
	} catch (err: any) {
		console.error('[my/status] PATCH error:', err);
		return json({ error: err.message || 'Failed to update mentoring status.' }, { status: 500 });
	}
};
