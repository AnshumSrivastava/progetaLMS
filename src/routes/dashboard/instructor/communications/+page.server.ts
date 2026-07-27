import { fail } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { notifications } from '$lib/server/db/schema/notifications.schema';
import { outbox } from '$lib/server/db/schema/outbox.schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';

export const load: PageServerLoad = async ({ locals }) => {
	// Normally load cohorts for this instructor
	// const instructorId = locals.user.id;
	// const myCohorts = await db.select().from(cohorts).where(eq(cohorts.instructorId, instructorId));
	
	// For demo, we'll return a static list or all cohorts if empty
	const allCohorts = await db.select().from(cohorts);
	return {
		cohorts: allCohorts
	};
};

export const actions: Actions = {
	send: async ({ request, locals }) => {
		const data = await request.formData();
		const cohortId = data.get('recipient') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;
		const includeCoupon = data.get('includeCoupon') === 'on';

		if (!cohortId || !subject || !body) {
			return fail(400, { error: 'All fields are required.' });
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
		await db.insert(outbox).values({
			id: randomUUID(),
			type: 'email_blast',
			payload: {
				userIds: members.map(m => m.userId),
				subject,
				body: finalBody
			}
		});

		return { success: true };
	}
};
