import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If signed in, take user to their dashboard
	if (locals.user) {
		if (locals.user.role === 'admin' || locals.user.role === 'owner') {
			throw redirect(302, '/dashboard/settings');
		}
		if (locals.user.role === 'teacher') {
			throw redirect(302, '/dashboard/teacher');
		}
		throw redirect(302, '/dashboard');
	}

	// Home page removed as requested: redirect visitors directly to sign-in
	throw redirect(302, '/sign-in');
};
