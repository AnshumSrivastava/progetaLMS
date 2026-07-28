import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { assessmentTests, assessmentAttempts, assessmentAttemptAnswers, assessmentQuestions, assessmentOptions } from '$lib/server/db/schema/assessments.schema';
import { certificates, certificateTemplates } from '$lib/server/db/schema/certificates.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) return json({ error: 'Unauthorized' }, { status: 401 });

	try {
		const { testId, answers } = await request.json();
		if (!testId || !answers) return json({ error: 'Missing parameters' }, { status: 400 });

		// Fetch test and questions
		const [test] = await db.select().from(assessmentTests).where(eq(assessmentTests.id, testId));
		if (!test) return json({ error: 'Test not found' }, { status: 404 });

		const questions = await db.select().from(assessmentQuestions).where(eq(assessmentQuestions.testId, testId));
		const options = await db.select().from(assessmentOptions);

		// Calculate score
		let score = 0;
		let maxScore = 0;
		
		const attemptId = createId();

		const answerInserts = [];

		for (const q of questions) {
			maxScore += q.points;
			const providedAns = answers[q.id];
			
			// Find correct option for this question
			const qOptions = options.filter(o => o.questionId === q.id);
			const correctOpt = qOptions.find(o => o.isCorrect);

			let isCorrect = false;
			let pointsEarned = 0;

			// A very naive check assuming the providedAns is the text of the option (as per QuizEngine.svelte)
			if (providedAns && correctOpt && providedAns === correctOpt.content) {
				isCorrect = true;
				pointsEarned = q.points;
				score += pointsEarned;
			}

			const selectedOpt = qOptions.find(o => o.content === providedAns);

			answerInserts.push({
				id: createId(),
				attemptId,
				questionId: q.id,
				selectedOptionId: selectedOpt?.id || null,
				textAnswer: providedAns || null,
				isCorrect,
				pointsEarned
			});
		}

		const percent = maxScore > 0 ? (score / maxScore) * 100 : 0;
		const passed = percent >= test.passingPercent;

		// Save Attempt
		await db.insert(assessmentAttempts).values({
			id: attemptId,
			testId: test.id,
			userId: user.id,
			status: 'evaluated',
			score,
			maxScore,
			passed,
			startedAt: new Date(),
			submittedAt: new Date(),
			evaluatedAt: new Date()
		});

		if (answerInserts.length > 0) {
			await db.insert(assessmentAttemptAnswers).values(answerInserts);
		}

		// Certificate Generation if passed
		let certificateId = null;
		if (passed) {
			// Find default template
			let templates = await db.select().from(certificateTemplates).where(eq(certificateTemplates.isActive, true));
			
			// If no template exists, create a dummy one for this to work
			if (templates.length === 0) {
				const tplId = createId();
				await db.insert(certificateTemplates).values({
					id: tplId,
					name: 'Default Template',
					htmlContent: '<h1>Certificate of Completion</h1><p>{{studentName}} completed {{testName}} on {{date}}</p>',
					isActive: true
				});
				templates = await db.select().from(certificateTemplates).where(eq(certificateTemplates.id, tplId));
			}

			const [asset] = await db.select().from(assets).where(eq(assets.id, test.assetId));

			certificateId = createId();
			
			await db.insert(certificates).values({
				id: certificateId,
				templateId: templates[0].id,
				testId: test.id,
				userId: user.id,
				attemptId,
				verifyUrl: `/certificates/${certificateId}`,
				metadata: {
					studentName: user.name,
					testName: asset?.title || 'Course Assessment',
					score: `${Math.round(percent)}%`,
					date: new Date().toISOString()
				}
			});

			// Queue certificate email via Outbox
			await db.insert(eventOutbox).values({
				id: randomUUID(),
				eventType: 'CERTIFICATE_ISSUED',
				payload: {
					studentName: user.name || 'Student',
					studentEmail: user.email,
					className: asset?.title || test.title,
					certUrl: `${new URL(request.url).origin}/certificates/${certificateId}`
				}
			});
		}

		return json({ success: true, score, maxScore, passed, percent, certificateId });
	} catch (e: any) {
		console.error('Quiz submission error:', e);
		return json({ error: 'Failed to submit quiz' }, { status: 500 });
	}
};
