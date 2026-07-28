import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { notifications, emailTemplates } from '$lib/server/db/schema/notifications.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async ({ locals }) => {
	const allCohorts = await db.select().from(cohorts);
	const templates = await db.select().from(emailTemplates).where(eq(emailTemplates.instructorId, locals.user?.id || 'demo-instructor-id'));
	
	return {
		cohorts: allCohorts,
		templates
	};
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		const data = await request.formData();
		const cohortId = data.get('recipient') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;
		const includeCoupon = data.get('includeCoupon') === 'on';
		const saveTemplate = data.get('saveTemplate') === 'on';
		const templateName = data.get('templateName') as string;

		if (!cohortId || !subject || !body) {
			return fail(400, { error: 'All fields are required.' });
		}

		if (saveTemplate && !templateName) {
			return fail(400, { error: 'Template name is required to save.' });
		}

		// Save template if requested
		if (saveTemplate) {
			await db.insert(emailTemplates).values({
				id: randomUUID(),
				name: templateName,
				subject,
				body,
				instructorId: locals.user?.id || 'demo-instructor-id'
			});
		}

		// 1. Find all students in this cohort
		const members = await db.select().from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohortId));
		
		if (members.length === 0) {
			return fail(400, { error: 'This class has no students yet.' });
		}

		let finalBody = body;
		if (includeCoupon) {
			finalBody += '\n\n**Special Offer**: Use code STUDENT50 at checkout!';
		}

		// 2. Create in-app notifications
		const notifInserts = members.map(m => ({
			id: randomUUID(),
			userId: m.userId,
			type: 'announcement',
			title: subject,
			body: finalBody,
			actionUrl: `/dashboard`
		}));
		
		if (notifInserts.length > 0) {
			await db.insert(notifications).values(notifInserts);
		}

		// 3. Queue emails via Outbox pattern
		await db.insert(eventOutbox).values({
			id: randomUUID(),
			eventType: 'email_blast',
			payload: {
				userIds: members.map(m => m.userId),
				subject,
				body: finalBody
			}
		});

		return { success: true };
	},

	deleteTemplate: async ({ request, locals }) => {
		const data = await request.formData();
		const templateId = data.get('templateId') as string;

		if (!templateId) return fail(400, { error: 'Missing template ID' });

		try {
			await db.delete(emailTemplates).where(eq(emailTemplates.id, templateId));
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to delete template' });
		}
	}
};
