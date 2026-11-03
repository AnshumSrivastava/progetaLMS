import type { PageServerLoad } from './$types';
import { CreditService } from '$lib/server/credits/credit.service';

export const load: PageServerLoad = async ({ locals }) => {
	const packages = await CreditService.getActivePackages();

	let balance = { balance: 0, lifetimeEarned: 0, lifetimeSpent: 0 };
	let transactions: any[] = [];

	if (locals.user) {
		balance = await CreditService.getBalance(locals.user.id);
		transactions = await CreditService.getTransactions(locals.user.id, 10);
	}

	return {
		packages,
		user: locals.user || null,
		balance,
		transactions
	};
};

