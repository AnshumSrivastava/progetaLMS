import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import { auth } from '$lib/server/auth/auth.config';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	const profile = await db.query.identityProfiles.findFirst({
		where: eq(identityProfiles.userId, locals.user.id)
	});

	return {
		profile,
		user: locals.user
	};
};

export const actions: Actions = {
	updatePreference: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		
		const data = await request.formData();
		const preference = data.get('preference') as string;
		
		if (preference !== 'otp' && preference !== 'password') {
			return fail(400, { error: 'Invalid preference' });
		}
		
		try {
			await db.update(identityProfiles)
				.set({ loginPreference: preference as 'otp' | 'password', updatedAt: new Date() })
				.where(eq(identityProfiles.userId, locals.user.id));
				
			return { success: true, message: 'Preference updated successfully.' };
		} catch (e) {
			return fail(500, { error: 'Failed to update preference.' });
		}
	},
	
	updatePassword: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		
		const data = await request.formData();
		const newPassword = data.get('newPassword') as string;
		const confirmPassword = data.get('confirmPassword') as string;
		
		if (!newPassword || newPassword.length < 8) {
			return fail(400, { error: 'Password must be at least 8 characters long.' });
		}
		
		if (newPassword !== confirmPassword) {
			return fail(400, { error: 'Passwords do not match.' });
		}
		
		try {
			await auth.api.setPassword({
				headers: request.headers,
				body: { newPassword: newPassword }
			});
			await db.update(identityProfiles)
				.set({ loginPreference: 'password', updatedAt: new Date() })
				.where(eq(identityProfiles.userId, locals.user.id));
			return { success: true, message: 'Password set successfully. Your login preference has been updated to Password.' };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to update password.' });
		}
	}
};
