import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { platformSettings, emailTemplates } from '$lib/server/db/schema/platform.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Only accessible to actual admins
	if (locals.user?.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	// 1. Load Settings
	let settingsRows = await db.select().from(platformSettings).where(eq(platformSettings.id, 'default'));
	let settings = settingsRows[0];
	if (!settings) {
		const newSettings = await db.insert(platformSettings).values({
			id: 'default',
			enableCatalog: true,
			enableMentoring: true,
			enableCertifications: true
		}).returning();
		settings = newSettings[0];
	}

	// 2. Load Email Templates
	const templates = await db.select().from(emailTemplates);
	
	// Default template if empty
	if (templates.length === 0) {
		const defaultTemp = await db.insert(emailTemplates).values({
			id: 'welcome',
			subject: 'Welcome to ProgetaLMS',
			body: 'Hello!\n\nWelcome to your new course.'
		}).returning();
		templates.push(defaultTemp[0]);
	}

	// 3. Get roles for impersonation (just getting a unique list of roles or a set of test users)
	// For simplicity, we just provide the static roles in the frontend, but we could fetch test users.

	return {
		settings,
		templates
	};
};

export const actions: Actions = {
	updateSettings: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Unauthorized');

		const data = await request.formData();
		const enableCatalog = data.get('enableCatalog') === 'on';
		const enableMentoring = data.get('enableMentoring') === 'on';
		const enableCertifications = data.get('enableCertifications') === 'on';

		await db.update(platformSettings)
			.set({ enableCatalog, enableMentoring, enableCertifications })
			.where(eq(platformSettings.id, 'default'));

		return { success: true };
	},

	impersonate: async ({ request, cookies, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Unauthorized');

		const data = await request.formData();
		const role = data.get('role') as string;

		if (role && ['student', 'instructor'].includes(role)) {
			// Set a cookie that expires when the browser session ends
			cookies.set('impersonate_role', role, {
				path: '/',
				httpOnly: true,
				secure: process.env.NODE_ENV === 'production',
				sameSite: 'lax'
			});
			// Redirect them to their impersonated dashboard
			throw redirect(302, '/dashboard');
		}

		return fail(400, { message: 'Invalid role' });
	},

	saveTemplate: async ({ request, locals }) => {
		if (locals.user?.role !== 'admin') throw error(403, 'Unauthorized');

		const data = await request.formData();
		const id = data.get('id') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;

		if (!id || !subject || !body) {
			return fail(400, { message: 'All fields are required' });
		}

		// Upsert logic (Insert or Update if exists)
		const existing = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
		if (existing.length > 0) {
			await db.update(emailTemplates).set({ subject, body, updatedAt: new Date() }).where(eq(emailTemplates.id, id));
		} else {
			await db.insert(emailTemplates).values({ id, subject, body });
		}

		return { success: true };
	}
};
