import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions } from '$lib/server/db/schema/assessments.schema';
import { eq, and, asc, isNull } from 'drizzle-orm';
import { error, fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';
import type { PageServerLoad, Actions } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const courseId = params.courseId;

	const [course] = await db
		.select()
		.from(assets)
		.where(
			and(
				eq(assets.id, courseId),
				eq(assets.ownerId, locals.user.id),
				isNull(assets.deletedAt)
			)
		);

	if (!course) {
		throw error(404, 'Course not found or unauthorized');
	}

	let [test] = await db
		.select()
		.from(assessmentTests)
		.where(eq(assessmentTests.assetId, courseId));

	let formattedQuestions: any[] = [];

	if (test) {
		const questions = await db
			.select()
			.from(assessmentQuestions)
			.where(eq(assessmentQuestions.testId, test.id))
			.orderBy(asc(assessmentQuestions.sortOrder));

		for (const q of questions) {
			const options = await db
				.select()
				.from(assessmentOptions)
				.where(eq(assessmentOptions.questionId, q.id))
				.orderBy(asc(assessmentOptions.sortOrder));

			formattedQuestions.push({
				id: q.id,
				text: q.content,
				options: options.map(o => ({
					id: o.id,
					text: o.content,
					isCorrect: o.isCorrect
				}))
			});
		}
	}

	return {
		course,
		testId: test?.id || null,
		title: (course.metadata as any)?.quizTitle || `${course.title} Quiz`,
		passingScore: test?.passingPercent || 80,
		questions: formattedQuestions
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		if (!locals.user) throw redirect(302, '/sign-in');
		const courseId = params.courseId;

		const data = await request.formData();
		const quizTitle = data.get('quizTitle')?.toString() || 'Course Quiz';
		const passingScore = parseInt(data.get('passingScore')?.toString() || '80', 10);
		const rawQuestions = data.get('questions')?.toString();

		if (!rawQuestions) {
			return fail(400, { error: 'No questions provided' });
		}

		try {
			const questions = JSON.parse(rawQuestions);

			// 1. Ensure assessment test exists
			let [test] = await db
				.select()
				.from(assessmentTests)
				.where(eq(assessmentTests.assetId, courseId));

			if (!test) {
				const [newTest] = await db
					.insert(assessmentTests)
					.values({
						id: createId(),
						assetId: courseId,
						passingPercent: passingScore
					})
					.returning();
				test = newTest;
			} else {
				await db
					.update(assessmentTests)
					.set({ passingPercent: passingScore, updatedAt: new Date() })
					.where(eq(assessmentTests.id, test.id));
			}

			// 2. Delete existing questions and options for clean sync
			const existingQuestions = await db
				.select({ id: assessmentQuestions.id })
				.from(assessmentQuestions)
				.where(eq(assessmentQuestions.testId, test.id));

			for (const q of existingQuestions) {
				await db.delete(assessmentOptions).where(eq(assessmentOptions.questionId, q.id));
			}
			await db.delete(assessmentQuestions).where(eq(assessmentQuestions.testId, test.id));

			// 3. Insert new questions and options
			for (let i = 0; i < questions.length; i++) {
				const q = questions[i];
				if (!q.text) continue;

				const [insertedQ] = await db
					.insert(assessmentQuestions)
					.values({
						id: createId(),
						testId: test.id,
						type: 'mcq',
						content: q.text,
						sortOrder: i
					})
					.returning();

				for (let j = 0; j < (q.options || []).length; j++) {
					const opt = q.options[j];
					if (!opt.text) continue;

					await db.insert(assessmentOptions).values({
						id: createId(),
						questionId: insertedQ.id,
						content: opt.text,
						isCorrect: !!opt.isCorrect,
						sortOrder: j
					});
				}
			}

			// 4. Update asset metadata
			const [course] = await db.select().from(assets).where(eq(assets.id, courseId));
			if (course) {
				await db.update(assets).set({
					metadata: {
						...(course.metadata as any || {}),
						quizTitle
					},
					updatedAt: new Date()
				}).where(eq(assets.id, courseId));
			}

			return { success: true };
		} catch (e: any) {
			console.error('Failed to save quiz:', e);
			return fail(500, { error: e.message || 'Failed to save quiz' });
		}
	}
};
