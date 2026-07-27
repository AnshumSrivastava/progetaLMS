/**
 * Root layout server load
 * Passes the session user to ALL pages via layout data.
 * Components can read `data.user` to show auth-aware UI.
 */
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	return {
		user: locals.user ?? null,
		isImpersonating: locals.isImpersonating ?? false
	};
};
