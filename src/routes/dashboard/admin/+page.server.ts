import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { platformSettings } from '$lib/server/db/schema/platform.schema';
import { emailTemplates } from '$lib/server/db/schema/notifications.schema';
import { users, auditLogs } from '$lib/server/db/schema/identity.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { cohorts } from '$lib/server/db/schema/cohorts.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq, desc, sql } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	// Guard: Accessible to admins and owners
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	// 1. System Platform Settings
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

	// 2. Email Templates
	const templates = await db.select().from(emailTemplates);
	if (templates.length === 0) {
		const defaultTemp = await db.insert(emailTemplates).values({
			id: 'welcome',
			name: 'Welcome Template',
			subject: 'Welcome to Launchpad',
			body: 'Hello {{user.name}}!\n\nWelcome to your new course on Launchpad.',
			instructorId: locals.user.id
		}).returning();
		templates.push(defaultTemp[0]);
	}

	// 3. Platform Counts / Cockpit KPIs
	const [{ totalUsers }] = await db.select({ totalUsers: sql<number>`count(*)` }).from(users);
	const [{ totalCourses }] = await db.select({ totalCourses: sql<number>`count(*)` }).from(assets).where(eq(assets.type, 'course'));
	const [{ totalCerts }] = await db.select({ totalCerts: sql<number>`count(*)` }).from(assets).where(eq(assets.type, 'cert_test'));
	const [{ totalCohorts }] = await db.select({ totalCohorts: sql<number>`count(*)` }).from(cohorts);
	const [{ outboxPending }] = await db.select({ outboxPending: sql<number>`count(*)` }).from(eventOutbox);

	// 4. Recent Audit Logs (Live System Activity)
	const recentAudit = await db
		.select({
			id: auditLogs.id,
			action: auditLogs.action,
			entityType: auditLogs.entityType,
			createdAt: auditLogs.createdAt,
			actorName: users.name,
			actorEmail: users.email
		})
		.from(auditLogs)
		.leftJoin(users, eq(auditLogs.actorId, users.id))
		.orderBy(desc(auditLogs.createdAt))
		.limit(6);

	return {
		settings,
		templates,
		kpis: {
			totalUsers,
			totalCourses,
			totalCerts,
			totalCohorts,
			outboxPending
		},
		recentAudit,
		isOwner: locals.user.role === 'owner'
	};
};

export const actions: Actions = {
	updateSettings: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const enableCatalog = data.get('enableCatalog') === 'on';
		const enableMentoring = data.get('enableMentoring') === 'on';
		const enableCertifications = data.get('enableCertifications') === 'on';

		await db.update(platformSettings)
			.set({ enableCatalog, enableMentoring, enableCertifications, updatedAt: new Date() })
			.where(eq(platformSettings.id, 'default'));

		return { success: true, message: 'Platform module settings updated' };
	},

	impersonate: async ({ request, cookies, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const role = data.get('role') as string;

		if (role && ['student', 'teacher'].includes(role)) {
			cookies.set('impersonate_role', role, {
				path: '/',
				httpOnly: true,
				secure: true,
				sameSite: 'lax'
			});
			throw redirect(302, '/dashboard');
		}

		return fail(400, { message: 'Invalid role for impersonation' });
	},

	saveTemplate: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			throw error(403, 'Unauthorized');
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;

		if (!id || !subject || !body) {
			return fail(400, { message: 'All fields are required' });
		}

		const existing = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
		if (existing.length > 0) {
			await db.update(emailTemplates).set({ subject, body, name: id }).where(eq(emailTemplates.id, id));
		} else {
			await db.insert(emailTemplates).values({ id, subject, body, name: id, instructorId: locals.user.id });
		}

		return { success: true, message: `Template ${id} saved successfully` };
	}
};
