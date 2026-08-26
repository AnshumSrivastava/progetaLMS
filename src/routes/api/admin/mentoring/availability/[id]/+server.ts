import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const DELETE: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const reason = body.reason;

	if (!reason || reason.trim() === '') {
		return json({ error: 'A mandatory cancellation reason is required for administrative cancellations' }, { status: 400 });
	}

	try {
		const result = await MentoringService.cancelAvailabilityWindow(
			params.id,
			locals.user.id,
			reason,
			true
		);
		return json(result);
	} catch (err: any) {
		return json({ error: err.message || 'Failed to cancel window' }, { status: 400 });
	}
};
