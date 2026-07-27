import { db } from '$lib/server/db/client';
import { certificates, certificateTemplates } from '$lib/server/db/schema/certificates.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { assessmentTests, assessmentAttempts } from '$lib/server/db/schema/assessments.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq } from 'drizzle-orm';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';
import type { PageServerLoad, Actions } from './$types';
import slugify from 'slugify';

export const load: PageServerLoad = async ({ locals }) => {
	// STRICT SAFETY PROTOCOL: Admin only
	if (!locals.user || locals.user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}
	return {};
};

const TEST_EMAIL = 'anshumsrivastava1@gmail.com';

export const actions: Actions = {
	sendTestCertificate: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);
		const data = await request.formData();
		const appUrl = data.get('appUrl') as string || 'http://localhost:5173';

		try {
			// 1. Ensure test user exists (for foreign key)
			let testUser = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
			if (testUser.length === 0) {
				const id = createId();
				await db.insert(users).values({ id, email: TEST_EMAIL, name: 'Anshum Srivastava', role: 'student', isEmailVerified: true });
				testUser = await db.select().from(users).where(eq(users.email, TEST_EMAIL)).limit(1);
			}

			// 2. Ensure dummy template exists
			let template = await db.select().from(certificateTemplates).limit(1);
			if (template.length === 0) {
				await db.insert(certificateTemplates).values({
					id: createId(),
					name: 'Default Template',
					htmlContent: 'default'
				});
				template = await db.select().from(certificateTemplates).limit(1);
			}

			// 3. Ensure dummy asset/test exists
			let asset = await db.select().from(assets).where(eq(assets.type, 'cert_test')).limit(1);
			if (asset.length === 0) {
				const assetId = createId();
				await db.insert(assets).values({
					id: assetId,
					slug: slugify('Dummy Test ' + assetId, { lower: true }),
					title: 'Dummy Test Asset',
					type: 'cert_test',
					ownerId: locals.user.id
				});
				await db.insert(assessmentTests).values({
					id: createId(),
					assetId: assetId
				});
				asset = await db.select().from(assets).where(eq(assets.type, 'cert_test')).limit(1);
			}
			const test = await db.select().from(assessmentTests).where(eq(assessmentTests.assetId, asset[0].id)).limit(1);

			// 4. Ensure dummy attempt exists
			let attempt = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.userId, testUser[0].id)).limit(1);
			if (attempt.length === 0) {
				await db.insert(assessmentAttempts).values({
					id: createId(),
					testId: test[0].id,
					userId: testUser[0].id,
					passed: true
				});
				attempt = await db.select().from(assessmentAttempts).where(eq(assessmentAttempts.userId, testUser[0].id)).limit(1);
			}

			// 5. Create Certificate Record
			const certId = createId();
			await db.insert(certificates).values({
				id: certId,
				templateId: template[0].id,
				testId: test[0].id,
				userId: testUser[0].id,
				attemptId: attempt[0].id,
				verifyUrl: `/certificates/${certId}`,
				metadata: {
					studentName: testUser[0].name || TEST_EMAIL,
					testName: 'Cybersecurity Foundations Exam',
					date: new Date().toISOString()
				}
			});

			// 6. Dispatch Outbox Event
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'CERTIFICATE_ISSUED',
				payload: {
					studentName: testUser[0].name || TEST_EMAIL,
					studentEmail: TEST_EMAIL,
					certUrl: `${appUrl}/certificates/${certId}`
				}
			});

			return { success: true, message: `Certificate email queued for ${TEST_EMAIL}.` };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: e.message });
		}
	},

	sendTestResourceMail: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);
		const data = await request.formData();
		const appUrl = data.get('appUrl') as string || 'http://localhost:5173';

		try {
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'RESOURCE_MAIL_SENT',
				payload: {
					studentName: 'Anshum Srivastava',
					studentEmail: TEST_EMAIL,
					className: 'Cybersecurity Foundations',
					courseUrl: `${appUrl}/catalog`
				}
			});
			return { success: true, message: `Resource email queued for ${TEST_EMAIL}.` };
		} catch (e: any) {
			return fail(500, { error: e.message });
		}
	},

	sendTestJoiningLink: async ({ locals, request }) => {
		if (!locals.user || locals.user.role !== 'admin') return fail(403);
		const data = await request.formData();
		const appUrl = data.get('appUrl') as string || 'http://localhost:5173';

		try {
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'JOIN_INVITE_SENT',
				payload: {
					studentName: 'Anshum Srivastava',
					studentEmail: TEST_EMAIL,
					className: 'Cybersecurity Foundations',
					joinUrl: `${appUrl}/register?cohort=CYBER101`
				}
			});
			return { success: true, message: `Joining link email queued for ${TEST_EMAIL}.` };
		} catch (e: any) {
			return fail(500, { error: e.message });
		}
	}
};
