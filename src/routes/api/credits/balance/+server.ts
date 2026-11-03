import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CreditService } from '$lib/server/credits/credit.service';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		throw error(401, 'Unauthorized');
	}

	const balance = await CreditService.getBalance(locals.user.id);
	return json(balance);
};

