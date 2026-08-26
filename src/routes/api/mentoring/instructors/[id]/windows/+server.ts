import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ params, url }) => {
	const date = url.searchParams.get('date');
	if (!date) {
		return json({ error: 'Date query parameter is required (YYYY-MM-DD)' }, { status: 400 });
	}

	try {
		const windows = await MentoringService.getInstructorWindowsForDate(params.id, date);
		const prices = await MentoringService.getInstructorDurationPrices(params.id);
		return json({ windows, prices });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch windows' }, { status: 500 });
	}
};
