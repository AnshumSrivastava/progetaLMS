import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const windows = await MentoringService.getInstructorCalendar(locals.user.id);
		return json({ windows });
	} catch (err: any) {
		console.error('Error fetching calendar:', err);
		return json({ error: err.message || 'Failed to fetch calendar' }, { status: 500 });
	}
};
