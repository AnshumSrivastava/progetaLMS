import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const DELETE: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	let reason: string | undefined;
	try {
		const body = await request.json().catch(() => ({}));
		reason = body.reason;
	} catch {
		// optional body
	}

	try {
		const result = await MentoringService.cancelAvailabilityWindow(
			params.id,
			locals.user.id,
			reason,
			['admin', 'owner'].includes(role)
		);
		return json(result);
	} catch (err: any) {
		return json({ error: err.message || 'Failed to cancel availability window' }, { status: 400 });
	}
};
