import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const prices = await MentoringService.getInstructorDurationPrices(locals.user.id);
		return json({ prices });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch prices' }, { status: 500 });
	}
};

export const PUT: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { prices } = body;

		if (!Array.isArray(prices)) {
			return json({ error: 'Prices array is required' }, { status: 400 });
		}

		await MentoringService.upsertInstructorDurationPrices(locals.user.id, prices);
		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to update prices' }, { status: 400 });
	}
};
