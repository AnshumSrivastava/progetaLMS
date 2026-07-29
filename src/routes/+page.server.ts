import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	// If the user is signed in, don't show the landing page.
	// Redirect them to their respective dashboard instead.
	if (locals.user) {
		if (locals.user.role === 'admin' || locals.user.role === 'owner') {
			throw redirect(302, '/dashboard/settings');
		}
		if (locals.user.role === 'teacher') {
			throw redirect(302, '/dashboard/teacher');
		}
		throw redirect(302, '/dashboard');
	}

	return {};
};
