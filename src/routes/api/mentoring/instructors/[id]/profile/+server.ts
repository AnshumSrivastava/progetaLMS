import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * GET /api/mentoring/instructors/[id]/profile
 * Public. No authentication required.
 * Resolves by handle (slug) or UUID.
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const profile = await MentoringService.getInstructorPublicProfile(params.id);
		if (!profile) {
			return json({ error: 'Instructor not found.' }, { status: 404 });
		}
		return json({ instructor: profile });
	} catch (err: any) {
		console.error('[profile] GET error:', err);
		return json({ error: err.message || 'Failed to load profile.' }, { status: 500 });
	}
};
