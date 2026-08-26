import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async () => {
	try {
		const instructors = await MentoringService.getPublicMentors();
		return json({ instructors });
	} catch (err: any) {
		console.error('Error fetching mentors:', err);
		return json({ error: err.message || 'Failed to fetch mentors' }, { status: 500 });
	}
};
