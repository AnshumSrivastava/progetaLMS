import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { notifications, emailTemplates } from '$lib/server/db/schema/notifications.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const instructorId = locals.user.id;

	const allCohorts = await db.select().from(cohorts).where(eq(cohorts.instructorId, instructorId));
	const templates = await db.select().from(emailTemplates).where(eq(emailTemplates.instructorId, instructorId));
	const coupons = await db.select().from(commerceCoupons).where(eq(commerceCoupons.createdBy, instructorId));
	
	return {
		cohorts: allCohorts,
		templates,
		coupons
	};
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;

		const data = await request.formData();
		const cohortId = data.get('recipient') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;
		const includeCoupon = data.get('includeCoupon') === 'on';
		const couponCode = data.get('couponCode') as string;
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
				instructorId
			});
		}

		// 1. Verify ownership of the cohort
		const [cohort] = await db.select().from(cohorts)
			.where(and(eq(cohorts.id, cohortId), eq(cohorts.instructorId, instructorId)));
		if (!cohort) return fail(403, { error: 'You do not own this class.' });

		// 2. Find all students in this cohort
		const members = await db.select().from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohortId));
		
		if (members.length === 0) {
			return fail(400, { error: 'This class has no students yet.' });
		}

		let finalBody = body;
		if (includeCoupon && couponCode) {
			// Verify coupon belongs to this instructor
			const [coupon] = await db.select().from(commerceCoupons)
				.where(and(eq(commerceCoupons.code, couponCode), eq(commerceCoupons.createdBy, instructorId)));
			if (!coupon) return fail(400, { error: 'Invalid coupon' });
			
			finalBody += `\n\n**Special Offer**: Use code **${coupon.code}** at checkout!`;
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
			eventType: 'EMAIL_BLAST',
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
