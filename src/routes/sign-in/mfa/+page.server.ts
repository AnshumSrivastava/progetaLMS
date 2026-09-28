import { redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth/auth.config';

export const load: PageServerLoad = async ({ locals, cookies, request }) => {
	if (!locals.user || !locals.session) {
		throw redirect(302, '/sign-in');
	}

	const [profile] = await db
		.select({ loginPreference: identityProfiles.loginPreference })
		.from(identityProfiles)
		.where(eq(identityProfiles.userId, locals.user.id))
		.limit(1);

	if (profile?.loginPreference !== 'mfa') {
		throw redirect(302, '/dashboard');
	}

	const mfaVerified = cookies.get('mfa_verified');
	if (mfaVerified === locals.session.id) {
		throw redirect(302, '/dashboard');
	}

	// Automatically send the OTP on initial landing
	try {
		await auth.api.sendVerificationOtp({
			headers: request.headers,
			body: {
				email: locals.user.email,
				type: 'sign-in'
			}
		});
	} catch (e) {
		console.error('Failed to send MFA verification OTP:', e);
	}

	return {
		email: locals.user.email
	};
};

export const actions: Actions = {
	resend: async ({ locals, request }) => {
		if (!locals.user) return { success: false, error: 'Unauthorized' };
		try {
			await auth.api.sendVerificationOtp({
				headers: request.headers,
				body: {
					email: locals.user.email,
					type: 'sign-in'
				}
			});
			return { success: true };
		} catch (e: any) {
			return { success: false, error: e.message || 'Failed to resend code' };
		}
	}
};
