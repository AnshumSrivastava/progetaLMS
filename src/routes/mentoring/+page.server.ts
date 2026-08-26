import { MentoringService } from '$lib/server/mentoring/MentoringService';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const mentors = await MentoringService.getPublicMentors();
	return {
		mentors,
		user: locals.user
	};
};
