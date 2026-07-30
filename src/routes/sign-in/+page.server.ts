import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// The sign-in page has been moved to the root landing page (/)
	// We keep this route and redirect for backward compatibility with existing links
	throw redirect(301, '/');
};
