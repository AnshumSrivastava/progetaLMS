import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const PUT: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { bounds } = body;

		if (!bounds || typeof bounds !== 'object') {
			return json({ error: 'bounds object is required' }, { status: 400 });
		}

		await MentoringService.setInstructorPriceBounds(params.id, bounds, locals.user.id);
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to set price bounds' }, { status: 400 });
	}
};
