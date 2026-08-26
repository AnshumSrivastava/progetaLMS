import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { date, windowStart, windowEnd, allowedDurations, meetingUrl } = body;

		if (!date || !windowStart || !windowEnd || !allowedDurations || !meetingUrl) {
			return json({ error: 'All fields (date, windowStart, windowEnd, allowedDurations, meetingUrl) are required' }, { status: 400 });
		}

		const result = await MentoringService.createAvailabilityWindow(locals.user.id, {
			date,
			windowStart,
			windowEnd,
			allowedDurations,
			meetingUrl
		});

		return json(result, { status: 201 });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to create availability window' }, { status: 400 });
	}
};
