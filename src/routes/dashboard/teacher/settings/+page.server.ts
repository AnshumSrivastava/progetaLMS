import { db } from '$lib/server/db/client';
import { identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');

	let profile = await db.query.identityProfiles.findFirst({
		where: eq(identityProfiles.userId, locals.user.id)
	});

	if (!profile) {
		const [newProfile] = await db.insert(identityProfiles).values({
			id: crypto.randomUUID(),
			userId: locals.user.id,
			displayName: locals.user.name
		}).returning();
		profile = newProfile;
	}

	return {
		profile
	};
};

export const actions: Actions = {
	saveProfile: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		
		const data = await request.formData();
		const displayName = data.get('displayName')?.toString() || '';
		const bio = data.get('bio')?.toString() || '';
		
		try {
			await db.update(identityProfiles)
				.set({ displayName, bio, updatedAt: new Date() })
				.where(eq(identityProfiles.userId, locals.user.id));
				
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to update profile' });
		}
	}
};
