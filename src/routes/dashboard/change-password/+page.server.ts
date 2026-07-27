import { auth } from '$lib/server/auth/auth.config';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/login');
	return { user: locals.user };
};
