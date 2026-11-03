import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals, cookies, url }) => {
	const returnTo = url.searchParams.get('returnTo');

	if (locals.user && locals.session) {
		const [profile] = await db
			.select({ loginPreference: identityProfiles.loginPreference })
			.from(identityProfiles)
			.where(eq(identityProfiles.userId, locals.user.id))
			.limit(1);

		if (profile?.loginPreference === 'mfa') {
			const mfaVerified = cookies.get('mfa_verified');
			if (mfaVerified !== locals.session.id) {
				throw redirect(302, '/sign-in/mfa');
			}
		}

		if (returnTo && returnTo.startsWith('/')) {
			throw redirect(302, returnTo);
		}

		throw redirect(302, '/dashboard');
	}

	return {
		returnTo: returnTo && returnTo.startsWith('/') ? returnTo : null
	};
};
