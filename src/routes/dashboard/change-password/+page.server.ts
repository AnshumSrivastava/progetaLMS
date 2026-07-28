import { auth } from '$lib/server/auth/auth.config';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	return { user: locals.user };
};

export const actions: Actions = {
	changePassword: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const data = await request.formData();
		const currentPassword = data.get('currentPassword') as string;
		const newPassword = data.get('newPassword') as string;
		const confirm = data.get('confirmPassword') as string;

		if (!newPassword || newPassword.length < 8) return fail(400, { error: 'Password must be at least 8 characters' });
		if (newPassword !== confirm) return fail(400, { error: 'Passwords do not match' });

		// Change password via Better Auth
		const result = await auth.api.changePassword({ headers: request.headers, body: { currentPassword, newPassword } });
		if (result.error) return fail(400, { error: result.error.message });

		// Clear the DB flag
		await db.update(users).set({ mustChangePassword: false }).where(eq(users.id, locals.user.id));

		throw redirect(302, '/dashboard');
	}
};
