import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If signed in, take user to their unified dashboard
	if (locals.user) {
		throw redirect(302, '/dashboard');
	}

	// Home page removed: visitors redirect directly to sign-in
	throw redirect(302, '/sign-in');
};
