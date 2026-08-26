import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const result = await MentoringService.cancelBookingByStudent(params.id, locals.user.id);
		return json(result);
	} catch (err: any) {
		return json({ error: err.message || 'Failed to cancel session' }, { status: 400 });
	}
};
