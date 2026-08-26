import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

/**
 * PATCH /api/mentoring/admin/testimonials/[id]
 * Admin only. Approves or rejects a testimonial.
 *
 * Body: { action: 'publish' | 'reject', reason?: string }
 */
export const PATCH: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user || !['admin', 'owner'].includes(locals.user.role)) {
		return json({ error: 'Admin access required.' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { action, reason } = body;

		if (action === 'publish') {
			const result = await MentoringService.publishTestimonial(params.id);
			return json(result);
		} else if (action === 'reject') {
			if (!reason || reason.trim().length < 3) {
				return json({ error: 'Rejection reason required.' }, { status: 400 });
			}
			const result = await MentoringService.rejectTestimonial(params.id, reason.trim());
			return json(result);
		} else {
			return json({ error: 'Invalid action. Use "publish" or "reject".' }, { status: 400 });
		}
	} catch (err: any) {
		console.error('[admin testimonials] PATCH error:', err);
		return json({ error: err.message || 'Failed to update testimonial.' }, { status: 500 });
	}
};

/**
 * GET /api/mentoring/admin/testimonials/[id]
 * Returns the testimonial queue (id param ignored here, use 'queue' as sentinel)
 */
export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user || !['admin', 'owner'].includes(locals.user.role)) {
		return json({ error: 'Admin access required.' }, { status: 403 });
	}

	try {
		const queue = await MentoringService.getAdminTestimonialQueue();
		return json({ queue });
	} catch (err: any) {
		return json({ error: err.message }, { status: 500 });
	}
};
