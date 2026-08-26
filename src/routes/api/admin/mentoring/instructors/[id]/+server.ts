import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const detail = await MentoringService.getAdminInstructorDetail(params.id);
		return json(detail);
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch instructor details' }, { status: 500 });
	}
};
