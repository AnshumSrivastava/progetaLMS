import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ url }) => {
	const windowId = url.searchParams.get('windowId');
	const durationStr = url.searchParams.get('duration');

	if (!windowId || !durationStr) {
		return json({ error: 'windowId and duration query parameters are required' }, { status: 400 });
	}

	const durationMins = parseInt(durationStr, 10);
	if (isNaN(durationMins) || ![30, 45, 60].includes(durationMins)) {
		return json({ error: 'Duration must be 30, 45, or 60 minutes' }, { status: 400 });
	}

	try {
		const availableSlots = await MentoringService.getFreeSlots(windowId, durationMins);
		return json({ availableSlots });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to compute free slots' }, { status: 400 });
	}
};
