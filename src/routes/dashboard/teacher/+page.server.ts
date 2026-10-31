import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Redirect legacy /dashboard/teacher overview to the unified /dashboard
	throw redirect(302, '/dashboard');
};
