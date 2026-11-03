import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CreditService } from '$lib/server/credits/credit.service';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const limit = Math.min(parseInt(url.searchParams.get('limit') || '20', 10), 100);
	const offset = Math.max(parseInt(url.searchParams.get('offset') || '0', 10), 0);

	const transactions = await CreditService.getTransactions(locals.user.id, limit, offset);
	return json({ transactions });
};

