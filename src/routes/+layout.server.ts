/**
 * Root layout server load
 * Passes the session user to ALL pages via layout data.
 * Components can read `data.user` to show auth-aware UI.
 */
import type { LayoutServerLoad } from './$types';
import { CreditService } from '$lib/server/credits/credit.service';

export const load: LayoutServerLoad = async ({ locals }) => {
	let userCredits = 0;
	if (locals.user?.id) {
		try {
			const result = await CreditService.getBalance(locals.user.id);
			userCredits = result.balance;
		} catch {
			userCredits = 0;
		}
	}
	return {
		user: locals.user ?? null,
		isImpersonating: locals.isImpersonating ?? false,
		userCredits
	};
};
