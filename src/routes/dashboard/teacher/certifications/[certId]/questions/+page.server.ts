import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions, assessmentAttemptAnswers } from '$lib/server/db/schema/assessments.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const user = locals.user;
	const certId = params.certId;

	const [certAsset] = await db.select({
		id: assets.id,
		title: assets.title,
		status: assets.status,
		testId: assessmentTests.id,
		passingPercent: assessmentTests.passingPercent,
		maxAttempts: assessmentTests.maxAttempts,
	})
	.from(assets)
	.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
	.where(
		and(
			eq(assets.id, certId),
			user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
		)
	);

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
		const explanation = data.get('explanation')?.toString();
		
		const opt0 = data.get('opt_0')?.toString();
		const opt1 = data.get('opt_1')?.toString();
		const opt2 = data.get('opt_2')?.toString();
		const opt3 = data.get('opt_3')?.toString();

		if (!content || !opt0 || !opt1) {
			return fail(400, { error: 'Missing question text, correct answer, or first wrong answer' });
		}

		const parsedOptions = [
			{ content: opt0, isCorrect: true },
			{ content: opt1, isCorrect: false }
		];
		
		if (opt2) parsedOptions.push({ content: opt2, isCorrect: false });
		if (opt3) parsedOptions.push({ content: opt3, isCorrect: false });

		try {
			// Verify ownership
			const user = locals.user;
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.id, certId),
						user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
					)
				);
			
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			const questionId = createId();

			// Count existing for sort_order
			const existing = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));
			const sortOrder = existing.length;

			await db.insert(assessmentQuestions).values({
				id: questionId,
				testId: certAsset.testId,
				type: 'mcq',
				content,
				explanation: explanation || null,
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
		const maxAttemptsStr = data.get('maxAttempts')?.toString();
		
		if (!passingPercentStr || !status) return fail(400, { error: 'Missing fields' });

		const passingPercent = parseInt(passingPercentStr, 10);
		if (passingPercent < 0 || passingPercent > 100) return fail(400, { error: 'Invalid passing percent' });

		const maxAttempts = maxAttemptsStr ? parseInt(maxAttemptsStr, 10) : null;

		try {
			const user = locals.user;
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.id, certId),
						user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
					)
				);
			
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			await db.update(assessmentTests).set({ passingPercent, maxAttempts }).where(eq(assessmentTests.id, certAsset.testId));
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
			const user = locals.user;
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.id, certId),
						user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
					)
				);
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			// Check if question belongs to this test
			const [q] = await db.select().from(assessmentQuestions).where(and(eq(assessmentQuestions.id, questionId), eq(assessmentQuestions.testId, certAsset.testId)));
			if (!q) return fail(404, { error: 'Question not found' });

			// Delete attempt answers first (if the exam was taken/tested)
			await db.delete(assessmentAttemptAnswers).where(eq(assessmentAttemptAnswers.questionId, questionId));
			await db.delete(assessmentOptions).where(eq(assessmentOptions.questionId, questionId));
			await db.delete(assessmentQuestions).where(eq(assessmentQuestions.id, questionId));
			return { success: true };
		} catch(e) {
			console.error(e);
			return fail(500, { error: 'Failed to delete question' });
		}
	},

	deleteAllQuestions: async ({ locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = locals.user.id;
		const certId = params.certId;

		try {
			const user = locals.user;
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.id, certId),
						user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
					)
				);
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			const qRows = await db.select({ id: assessmentQuestions.id }).from(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));
			for (const q of qRows) {
				await db.delete(assessmentAttemptAnswers).where(eq(assessmentAttemptAnswers.questionId, q.id));
				await db.delete(assessmentOptions).where(eq(assessmentOptions.questionId, q.id));
			}
			await db.delete(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));

			return { success: true, message: 'All questions deleted' };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to delete all questions' });
		}
	}
};
