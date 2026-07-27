import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ cookies }) => {
	cookies.delete('impersonate_role', { path: '/' });
	throw redirect(303, '/dashboard/admin');
};
