/**
 * Sign-in page server loader
 *
 * If the user is already authenticated, redirect them to the dashboard.
 * This prevents authenticated users from seeing the sign-in form.
 */
import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}
	return {};
};
