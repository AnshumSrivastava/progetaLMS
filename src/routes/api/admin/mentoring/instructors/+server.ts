import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const instructors = await MentoringService.getAdminInstructorsList();
		return json({ instructors });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch instructors list' }, { status: 500 });
	}
};
