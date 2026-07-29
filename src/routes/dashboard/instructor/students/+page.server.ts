import { db } from '$lib/server/db/client';
import { users, cohortMemberships, cohorts, commerceCoupons } from '$lib/server/db/schema';
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
	},

	inviteWithCoupon: async ({ request, locals }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;

		const data = await request.formData();
		const email = data.get('email')?.toString().trim();
		const cohortId = data.get('cohortId')?.toString();
		const discountType = data.get('discountType')?.toString() as 'percent' | 'flat';
		const discountValueStr = data.get('discountValue')?.toString();

		if (!email || !cohortId || !discountType || !discountValueStr) {
			return fail(400, { error: 'Missing required fields' });
		}

		let discountValue = parseInt(discountValueStr, 10);
		if (discountType === 'flat') {
			discountValue = discountValue * 100; // convert dollars to paise
		}

		try {
			// Verify ownership
			const [ownedCohort] = await db.select().from(cohorts)
				.where(and(eq(cohorts.id, cohortId), eq(cohorts.instructorId, instructorId)));
			if (!ownedCohort) return fail(403, { error: 'You do not own this class' });

			// Generate unique coupon code
			const couponCode = `INVITE-${createId().substring(0, 8).toUpperCase()}`;

			await db.insert(commerceCoupons).values({
				id: createId(),
				code: couponCode,
				type: discountType,
				value: discountValue,
				cohortId: cohortId,
				maxUses: 1, // Only useable once!
				createdBy: instructorId
			});

			// Send email with coupon
			if (RESEND_API_KEY && !RESEND_API_KEY.startsWith('re_123456')) {
				const discountText = discountType === 'percent' ? `${discountValue}% OFF` : `$${(discountValue / 100).toFixed(2)} OFF`;
				const joinLink = `https://lms.progeta.in/join/${cohortId}`;
				
				await resend.emails.send({
					from: RESEND_FROM_ADDRESS,
					to: email,
					subject: `You're invited to ${ownedCohort.name} with a special offer!`,
					html: `
						<p>Hi there,</p>
						<p>You have been invited to join <strong>${ownedCohort.name}</strong> on Progeta LMS.</p>
						<p>Use this exclusive, one-time coupon code during checkout to get <strong>${discountText}</strong>:</p>
						<div style="margin: 20px 0; padding: 15px; background: #f3f4f6; border-radius: 8px; font-family: monospace; font-size: 1.25rem; font-weight: bold; text-align: center; letter-spacing: 2px;">
							${couponCode}
						</div>
						<a href="${joinLink}" style="display:inline-block;padding:12px 24px;background:#1a1a2e;color:white;border-radius:8px;text-decoration:none;font-weight:600;">Join Class Now</a>
					`
				});
			}

			return { inviteSuccess: true, email };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to send invite with coupon' });
		}
	}
};
