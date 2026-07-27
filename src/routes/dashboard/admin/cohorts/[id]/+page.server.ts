import { db } from '$lib/server/db/client';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq, and } from 'drizzle-orm';
import { redirect, fail, error } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ locals, params }) => {
	if (!locals.user || locals.user.role !== 'admin') throw redirect(302, '/dashboard');

	const cohortId = params.id;

	const cohort = await db.select().from(cohorts).where(eq(cohorts.id, cohortId)).limit(1);
	if (cohort.length === 0) throw error(404, 'Class not found');

	// Load members
	const members = await db.select({
		membershipId: cohortMemberships.id,
		role: cohortMemberships.role,
		joinedAt: cohortMemberships.joinedAt,
		user: { id: users.id, name: users.name, email: users.email }
	})
	.from(cohortMemberships)
	.innerJoin(users, eq(cohortMemberships.userId, users.id))
	.where(eq(cohortMemberships.cohortId, cohortId));

	// Load potential students (who aren't already in this class)
	const existingMemberIds = members.map(m => m.user.id);
	
	const allStudents = await db.select({
		id: users.id, name: users.name, email: users.email
	})
	.from(users)
	.where(eq(users.role, 'student'));

	const availableStudents = allStudents.filter(s => !existingMemberIds.includes(s.id));

	return {
		cohort: cohort[0],
		members,
		availableStudents,
		appUrl: process.env.PUBLIC_APP_URL || 'http://localhost:5173'
	};
};

export const actions: Actions = {
	enroll: async ({ request, locals, params }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;

		if (!userId) return fail(400, { error: 'No student selected' });

		try {
			await db.insert(cohortMemberships).values({
				id: createId(),
				cohortId: params.id,
				userId,
				role: 'student'
			});
			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: e.message || 'Failed to enroll student' });
		}
	},

	remove: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);

		const data = await request.formData();
		const membershipId = data.get('membershipId') as string;

		if (!membershipId) return fail(400, { error: 'Invalid membership' });

		try {
			await db.delete(cohortMemberships).where(eq(cohortMemberships.id, membershipId));
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to remove student' });
		}
	},

	sendResources: async ({ params, locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);
		
		const data = await request.formData();
		const appUrl = data.get('appUrl') as string;

		try {
			const cohort = await db.select().from(cohorts).where(eq(cohorts.id, params.id)).limit(1);
			const course = await db.select().from(assets).where(eq(assets.id, cohort[0].courseId)).limit(1);
			
			const members = await db.select({ user: users })
				.from(cohortMemberships)
				.innerJoin(users, eq(cohortMemberships.userId, users.id))
				.where(eq(cohortMemberships.cohortId, params.id));

			for (const m of members) {
				await db.insert(eventOutbox).values({
					id: createId(),
					eventType: 'RESOURCE_MAIL_SENT',
					payload: {
						studentName: m.user.name || 'Student',
						studentEmail: m.user.email,
						className: cohort[0].name,
						courseUrl: `${appUrl}/catalog/${course[0]?.slug || ''}`
					}
				});
			}
			return { success: true, message: `Resource emails queued for ${members.length} students.` };
		} catch (e: any) {
			return fail(500, { error: 'Failed to send resources' });
		}
	},

	sendExam: async ({ params, locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);

		const data = await request.formData();
		const userId = data.get('userId') as string;
		const appUrl = data.get('appUrl') as string;

		if (!userId) return fail(400, { error: 'Missing userId' });

		try {
			const cohort = await db.select().from(cohorts).where(eq(cohorts.id, params.id)).limit(1);
			const student = await db.select().from(users).where(eq(users.id, userId)).limit(1);

			// Generate 100% off coupon
			const couponCode = 'CERT-' + createId().substring(0, 8).toUpperCase();
			await db.insert(commerceCoupons).values({
				id: createId(),
				code: couponCode,
				type: 'percent',
				value: 100,
				maxUses: 1,
				cohortId: params.id,
				createdBy: locals.user.id
			});

			// Queue email
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'EXAM_INVITE_SENT',
				payload: {
					studentName: student[0].name || 'Student',
					studentEmail: student[0].email,
					className: cohort[0].name,
					couponCode: couponCode,
					examUrl: `${appUrl}/certifications` // Default to certifications page
				}
			});

			return { success: true, message: `Exam invite and coupon sent to ${student[0].name}.` };
		} catch (e: any) {
			return fail(500, { error: 'Failed to send exam invite' });
		}
	}
};
