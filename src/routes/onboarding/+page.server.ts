import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	// If they already have a name, redirect to dashboard
	const [freshUser] = await db.select().from(users).where(eq(users.id, locals.user.id)).limit(1);
	if (freshUser?.name && freshUser.name.trim() !== '') {
		throw redirect(302, '/dashboard');
	}

	return {
		user: locals.user
	};
};

export const actions: Actions = {
	saveName: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const data = await request.formData();
		const name = data.get('name') as string;

		if (!name || name.trim() === '') {
			return fail(400, { error: 'Name is required' });
		}

		try {
			await db.update(users).set({ name: name.trim() }).where(eq(users.id, locals.user.id));
			// Better auth caches the user session in cookies. SvelteKit locals.user is fetched per request though, 
			// but we need to ensure the user gets redirected.
			throw redirect(302, '/dashboard');
		} catch (e) {
			if (e instanceof Response) throw e; // Let redirects pass through
			return fail(500, { error: 'Failed to update profile' });
		}
	}
};
