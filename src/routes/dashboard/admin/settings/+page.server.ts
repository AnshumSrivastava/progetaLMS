import { db } from '$lib/server/db/client';
import { platformSettings } from '$lib/server/db/schema/platform.schema';
import { eq } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	let settingsRows = await db.select().from(platformSettings).where(eq(platformSettings.id, 'default'));
	
	if (settingsRows.length === 0) {
		// Init default if doesn't exist
		await db.insert(platformSettings).values({
			id: 'default',
			enableCatalog: true,
			enableMentoring: true,
			enableCertifications: true
		});
		settingsRows = await db.select().from(platformSettings).where(eq(platformSettings.id, 'default'));
	}

	return {
		settings: settingsRows[0]
	};
};

export const actions: Actions = {
	update: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const enableCatalog = data.get('enableCatalog') === 'on';
		const enableMentoring = data.get('enableMentoring') === 'on';
		const enableCertifications = data.get('enableCertifications') === 'on';

		try {
			await db.update(platformSettings)
				.set({
					enableCatalog,
					enableMentoring,
					enableCertifications,
					updatedAt: new Date()
				})
				.where(eq(platformSettings.id, 'default'));
			
			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: 'Failed to update settings' });
		}
	}
};
