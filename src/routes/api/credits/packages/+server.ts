import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CreditService } from '$lib/server/credits/credit.service';

export const GET: RequestHandler = async () => {
	const packages = await CreditService.getActivePackages();
	return json({ packages });
};

