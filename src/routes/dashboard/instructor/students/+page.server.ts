import { db } from '$lib/server/db/client';
import { users, cohortMemberships, cohorts } from '$lib/server/db/schema';
import { eq, and, inArray } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';
import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_ADDRESS } from '$env/static/private';

const resend = new Resend(RESEND_API_KEY);

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const instructorId = locals.user.id;
	const myCohorts = await db.select().from(cohorts).where(eq(cohorts.instructorId, instructorId));
	const myCohortIds = myCohorts.map(c => c.id);

	const members = myCohortIds.length > 0
		? await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				joinedAt: cohortMemberships.joinedAt
			})
			.from(cohortMemberships)
			.innerJoin(users, eq(cohortMemberships.userId, users.id))
			.where(inArray(cohortMemberships.cohortId, myCohortIds))
		: [];

	const mappedStudents = members.map(m => ({
		id: m.id,
		name: m.name || 'Unknown',
		email: m.email,
		enrolled: 1, // Mock
		completed: 0, // Mock
		access: 'Active',
		joined: m.joinedAt.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
	}));

	const availableClasses = await db.select({
		id: cohorts.id,
		name: cohorts.name
	}).from(cohorts)
	.where(eq(cohorts.instructorId, instructorId));

	return {
		students: mappedStudents,
		availableClasses
	};
};

export const actions: Actions = {
	batchAdd: async ({ request }) => {
		const data = await request.formData();
		const emailsStr = data.get('emails')?.toString();
		const cohortId = data.get('cohortId')?.toString();

		if (!emailsStr) {
			return fail(400, { error: 'Missing emails' });
		}

		const emails = emailsStr.split(/[\n,]+/).map(e => e.trim()).filter(Boolean);
		if (emails.length === 0) {
			return fail(400, { error: 'No valid emails found' });
		}

		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;

		try {
			// Find existing users
			const existingUsers = await db.select().from(users).where(inArray(users.email, emails));
			const existingEmails = new Set(existingUsers.map(u => u.email));
			
			// Create missing users as placeholders
			const newEmails = emails.filter(e => !existingEmails.has(e));
			const newUsers = newEmails.map(email => ({
				id: createId(),
				email,
				name: email.split('@')[0], // placeholder name
				role: 'student' as const
			}));

			if (newUsers.length > 0) {
				await db.insert(users).values(newUsers);
			}

			if (cohortId) {
				const [ownedCohort] = await db.select().from(cohorts)
					.where(and(eq(cohorts.id, cohortId), eq(cohorts.instructorId, instructorId)));
				if (!ownedCohort) return fail(403, { error: 'You do not own this class' });

				const allUsers = [...existingUsers, ...newUsers];
				
				// Create memberships
				const membershipsToInsert = allUsers.map(u => ({
					id: createId(),
					cohortId,
					userId: u.id,
					role: 'student' as const
				}));

				if (membershipsToInsert.length > 0) {
					await db.insert(cohortMemberships)
						.values(membershipsToInsert)
						.onConflictDoNothing();
				}
			}

			// Send invitation emails
			if (RESEND_API_KEY && !RESEND_API_KEY.startsWith('re_123456')) {
				for (const email of emails) {
					await resend.emails.send({
						from: RESEND_FROM_ADDRESS,
						to: email,
						subject: `You've been invited to Progeta LMS`,
						html: `<p>You have been invited to join Progeta LMS.</p><a href="https://lms.progeta.in/sign-in" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Sign In Now</a>`
					});
				}
			}

			return { success: true, count: emails.length };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to process invitations' });
		}
	}
};
