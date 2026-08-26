import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const POST: RequestHandler = async ({ locals, params }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		await MentoringService.markBookingCompleted(params.id, locals.user.id);
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to complete booking' }, { status: 400 });
	}
};
