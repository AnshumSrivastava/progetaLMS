import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { suspended, reason } = body;

		if (typeof suspended !== 'boolean') {
			return json({ error: 'suspended must be a boolean' }, { status: 400 });
		}

		await MentoringService.toggleInstructorSuspension(
			params.id,
			suspended,
			locals.user.id,
			reason
		);

		return json({ success: true, suspended });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to update suspension' }, { status: 400 });
	}
};
