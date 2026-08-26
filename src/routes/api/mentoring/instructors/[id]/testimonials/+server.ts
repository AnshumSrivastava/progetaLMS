import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * GET /api/mentoring/instructors/[id]/testimonials
 * Public. Returns published testimonials for an instructor.
 */
export const GET: RequestHandler = async ({ params }) => {
	try {
		const testimonials = await MentoringService.getPublishedTestimonials(params.id);
		return json({ testimonials });
	} catch (err: any) {
		console.error('[testimonials] GET error:', err);
		return json({ error: err.message || 'Failed to load testimonials.' }, { status: 500 });
	}
};
