import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ params }) => {
	try {
		const availableDates = await MentoringService.getInstructorAvailableDates(params.id);
		return json({ availableDates });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch available dates' }, { status: 500 });
	}
};
