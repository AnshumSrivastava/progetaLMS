import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions, assessmentAttemptAnswers } from '$lib/server/db/schema/assessments.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect, error } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const user = locals.user as any;
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
	
	let options: any[] = [];
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
	saveAll: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const certId = params.certId;

		const data = await request.formData();
		const questionsStr = data.get('questions')?.toString();
		if (!questionsStr) return fail(400, { error: 'No questions provided' });

		let rawQuestions: any[];
		try {
			rawQuestions = JSON.parse(questionsStr);
		} catch (e) {
			return fail(400, { error: 'Invalid JSON for questions' });
		}

		if (!Array.isArray(rawQuestions)) {
			return fail(400, { error: 'Questions must be an array' });
		}

		try {
			// Verify ownership
			const user = locals.user as any;
			const [certAsset] = await db.select({ testId: assessmentTests.id }).from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.id, certId),
						user.role === 'admin' || user.role === 'owner' ? undefined : eq(assets.ownerId, user.id)
					)
				);
			
			if (!certAsset) return fail(403, { error: 'Unauthorized' });

			// Filter valid rows: must have content, opt0 (correct), and at least one wrong (opt1)
			const validQuestions = rawQuestions.filter(q => q.content && q.content.trim() && q.opt0 && q.opt0.trim() && q.opt1 && q.opt1.trim());

			await db.transaction(async (tx) => {
				// 1. Get all question IDs for this testId
				const existingQuestions = await tx.select({ id: assessmentQuestions.id }).from(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));
				const existingQIds = existingQuestions.map(q => q.id);

				// 2. Delete existing attempt answers, options, and questions
				if (existingQIds.length > 0) {
					// We must delete attempt answers one by one or chunked if there are many, but since inArray with empty fails,
					// and we have them in memory, we can delete them.
					for (const qId of existingQIds) {
						await tx.delete(assessmentAttemptAnswers).where(eq(assessmentAttemptAnswers.questionId, qId));
						await tx.delete(assessmentOptions).where(eq(assessmentOptions.questionId, qId));
					}
				}
				await tx.delete(assessmentQuestions).where(eq(assessmentQuestions.testId, certAsset.testId));

				// 3. Insert new questions and options
				let currentSortOrder = 0;
				for (const q of validQuestions) {
					const questionId = createId();
					await tx.insert(assessmentQuestions).values({
						id: questionId,
						testId: certAsset.testId,
						type: 'mcq',
						content: q.content.trim(),
						explanation: q.explanation?.trim() || null,
						points: 1,
						sortOrder: currentSortOrder++
					});

					const optionsToInsert = [
						{ id: createId(), questionId, content: q.opt0.trim(), isCorrect: true, sortOrder: 0 },
						{ id: createId(), questionId, content: q.opt1.trim(), isCorrect: false, sortOrder: 1 }
					];
					
					if (q.opt2 && q.opt2.trim()) {
						optionsToInsert.push({ id: createId(), questionId, content: q.opt2.trim(), isCorrect: false, sortOrder: 2 });
					}
					if (q.opt3 && q.opt3.trim()) {
						optionsToInsert.push({ id: createId(), questionId, content: q.opt3.trim(), isCorrect: false, sortOrder: 3 });
					}

					await tx.insert(assessmentOptions).values(optionsToInsert);
				}
			});

			return { success: true };
		} catch (e) {
			console.error('saveAll error:', e);
			return fail(500, { error: 'Failed to save questions' });
		}
	},

	updateSettings: async ({ request, locals, params }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const instructorId = (locals.user as any).id;
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
			const user = locals.user as any;
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
		const instructorId = (locals.user as any).id;
		const certId = params.certId;

		const data = await request.formData();
		const questionId = data.get('questionId')?.toString();
		if (!questionId) return fail(400, { error: 'Missing question id' });

		try {
			const user = locals.user as any;
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
		const instructorId = (locals.user as any).id;
		const certId = params.certId;

		try {
			const user = locals.user as any;
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
