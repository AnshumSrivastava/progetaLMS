import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions } from '$lib/server/db/schema/assessments.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const instructorId = locals.user.id;
	const certId = params.certId;

	const [certAsset] = await db.select({
		id: assets.id,
		title: assets.title,
		status: assets.status,
		testId: assessmentTests.id,
		passingPercent: assessmentTests.passingPercent,
	})
	.from(assets)
	.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
	.where(and(eq(assets.id, certId), eq(assets.ownerId, instructorId)));

	if (!certAsset) {
		throw error(404, 'Certification not found or unauthorized');
	}

	// Fetch all questions and options
	const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId)).orderBy(assessmentQuestions.sortOrder);
	const qIds = questions.map(q => q.id);
	
	let options = [];
	if (qIds.length > 0) {
		// Drizzle `inArray` can't take an empty array
		const allOptions = await db.select().from(assessmentOptions).orderBy(assessmentOptions.sortOrder);
		options = allOptions.filter(o => qIds.includes(o.questionId));
	}

	const questionsWithOptions = questions.map(q => ({
		...q,
		options: options.filter(o => o.questionId === q.id)
	}));

	return {
		cert: certAsset,
		questions: questionsWithOptions
	};
};

export const actions: Actions = {
	addQuestion: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;
		const certId = params.certId;

		const data = await request.formData();
		const content = data.get('content')?.toString();
		const optionsJson = data.get('options')?.toString(); // [{content: string, isCorrect: boolean}]

		if (!content || !optionsJson) {
			return fail(400, { error: 'Missing content or options' });
		}

		try {
			// Verify ownership
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(and(eq(assets.id, certId), eq(assets.ownerId, instructorId)));
			
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			const parsedOptions = JSON.parse(optionsJson);
			if (!Array.isArray(parsedOptions) || parsedOptions.length < 2) {
				return fail(400, { error: 'At least 2 options are required' });
			}

			const questionId = createId();

			// Count existing for sort_order
			const existing = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));
			const sortOrder = existing.length;

			await db.insert(assessmentQuestions).values({
				id: questionId,
				testId: certAsset.testId,
				type: 'mcq',
				content,
				points: 1,
				sortOrder
			});

			const optionsToInsert = parsedOptions.map((opt, i) => ({
				id: createId(),
				questionId,
				content: opt.content,
				isCorrect: opt.isCorrect,
				sortOrder: i
			}));

			await db.insert(assessmentOptions).values(optionsToInsert);

			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to add question' });
		}
	},

	updateSettings: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;
		const certId = params.certId;

		const data = await request.formData();
		const passingPercentStr = data.get('passingPercent')?.toString();
		const status = data.get('status')?.toString();
		
		if (!passingPercentStr || !status) return fail(400, { error: 'Missing fields' });

		const passingPercent = parseInt(passingPercentStr, 10);
		if (passingPercent < 0 || passingPercent > 100) return fail(400, { error: 'Invalid passing percent' });

		try {
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(and(eq(assets.id, certId), eq(assets.ownerId, instructorId)));
			
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			await db.update(assessmentTests).set({ passingPercent }).where(eq(assessmentTests.id, certAsset.testId));
			await db.update(assets).set({ status: status as 'draft' | 'published' }).where(eq(assets.id, certId));

			return { success: true };
		} catch(e) {
			console.error(e);
			return fail(500, { error: 'Failed to update settings' });
		}
	},

	deleteQuestion: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;
		const certId = params.certId;

		const data = await request.formData();
		const questionId = data.get('questionId')?.toString();
		if (!questionId) return fail(400, { error: 'Missing question id' });

		try {
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(and(eq(assets.id, certId), eq(assets.ownerId, instructorId)));
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			// Check if question belongs to this test
			const [q] = await db.select().from(assessmentQuestions).where(and(eq(assessmentQuestions.id, questionId), eq(assessmentQuestions.testId, certAsset.testId)));
			if (!q) return fail(404, { error: 'Question not found' });

			await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, questionId));
			return { success: true };
		} catch(e) {
			console.error(e);
			return fail(500, { error: 'Failed to delete question' });
		}
	}
};
