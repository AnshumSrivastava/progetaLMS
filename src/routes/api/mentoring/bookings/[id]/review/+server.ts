import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * POST /api/mentoring/bookings/[id]/review
 * Authenticated. Allows a student to submit a review after session completion.
 *
 * Body: { rating: number (1-5), body: string, reviewerRole?: string }
 */
export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Authentication required.' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { rating, body: reviewText, reviewerRole } = body;

		if (!rating || rating < 1 || rating > 5) {
			return json({ error: 'Rating must be between 1 and 5.' }, { status: 400 });
		}
		if (!reviewText || typeof reviewText !== 'string' || reviewText.trim().length < 20) {
			return json({ error: 'Review must be at least 20 characters.' }, { status: 400 });
		}

		const result = await MentoringService.submitTestimonial(locals.user.id, params.id, {
			rating: Number(rating),
			body: reviewText,
			reviewerRole: reviewerRole || undefined
		});

		return json(result, { status: 201 });
	} catch (err: any) {
		console.error('[review] POST error:', err);
		const status = err.message?.includes('not found') || err.message?.includes('not yet') ? 400 : 500;
		return json({ error: err.message || 'Failed to submit review.' }, { status });
	}
};
