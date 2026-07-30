import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { identityProfiles, users } from '$lib/server/db/schema/identity.schema';
import { platformSettings } from '$lib/server/db/schema/platform.schema';
import { eq, not } from 'drizzle-orm';
import { auth } from '$lib/server/auth/auth.config';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/sign-in');
	}

	const profile = await db.query.identityProfiles.findFirst({
		where: eq(identityProfiles.userId, locals.user.id)
	});

	let settings = await db.query.platformSettings.findFirst({
		where: eq(platformSettings.id, 'default')
	});
	if (!settings) {
		const [newSettings] = await db.insert(platformSettings).values({ id: 'default' }).returning();
		settings = newSettings;
	}

	let allUsers = [];
	if (locals.user.role === 'admin' || locals.user.role === 'owner') {
		allUsers = await db.select({
			id: users.id,
			name: users.name,
			email: users.email,
			role: users.role,
			banned: users.banned,
			createdAt: users.createdAt
		}).from(users).where(not(eq(users.id, locals.user.id)));
	}

	return {
		profile,
		user: locals.user,
		platformSettings: settings,
		allUsers
	};
};

export const actions: Actions = {
	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		
		const data = await request.formData();
		const name = data.get('name') as string;
		
		if (!name || name.trim() === '') {
			return fail(400, { error: 'Name cannot be empty.' });
		}
		
		try {
			await db.update(users).set({ name: name.trim() }).where(eq(users.id, locals.user.id));
			return { success: true, message: 'Profile updated successfully.' };
		} catch (e) {
			return fail(500, { error: 'Failed to update profile.' });
		}
	},

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
	},

	updatePlatformSettings: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Forbidden' });
		}
		
		const data = await request.formData();
		const enableCatalog = data.get('enableCatalog') === 'true';
		const enableMentoring = data.get('enableMentoring') === 'true';
		const enableCertifications = data.get('enableCertifications') === 'true';

		try {
			await db.update(platformSettings).set({
				enableCatalog,
				enableMentoring,
				enableCertifications,
				updatedAt: new Date()
			}).where(eq(platformSettings.id, 'default'));
			return { success: true, message: 'Platform settings updated.' };
		} catch (e) {
			return fail(500, { error: 'Failed to update settings.' });
		}
	},

	updateUserRole: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && locals.user.role !== 'admin')) {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const newRole = data.get('role') as string;

		if (!targetUserId || !newRole) return fail(400, { error: 'Missing fields' });

		// Admins can only elevate to teacher/student, Owners can do all
		if (locals.user.role === 'admin') {
			if (newRole !== 'student' && newRole !== 'teacher') {
				return fail(403, { error: 'Admins can only assign teacher or student roles.' });
			}
		}

		try {
			// Using better auth's user update, but we need to update our DB for the role
			await db.update(users).set({ role: newRole }).where(eq(users.id, targetUserId));
			return { success: true, message: 'User role updated.' };
		} catch (e) {
			return fail(500, { error: 'Failed to update user role.' });
		}
	},

	toggleUserBan: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'owner' && locals.user.role !== 'admin')) {
			return fail(403, { error: 'Forbidden' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const action = data.get('action') as 'ban' | 'unban';

		if (!targetUserId) return fail(400, { error: 'Missing user ID' });

		try {
			if (action === 'ban') {
				await auth.api.banUser({ headers: new Headers(), body: { userId: targetUserId } });
			} else {
				await auth.api.unbanUser({ headers: new Headers(), body: { userId: targetUserId } });
			}
			return { success: true, message: `User successfully ${action}ned.` };
		} catch (e) {
			return fail(500, { error: 'Failed to toggle ban status.' });
		}
	}
};
