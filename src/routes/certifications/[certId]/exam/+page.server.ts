import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions, assessmentAttempts } from '$lib/server/db/schema/assessments.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const certId = params.certId;
	if (!locals.user) {
		throw redirect(302, `/sign-in`);
	}

	// 1. Find the certification asset
	const [cert] = await db
		.select()
		.from(assets)
		.where(
			and(
				eq(assets.id, certId),
				eq(assets.type, 'cert_test'),
				eq(assets.status, 'published'),
				isNull(assets.deletedAt)
			)
		);

	if (!cert) {
		throw error(404, 'Certification not found');
	}

	// 2. Verify ownership
	const ownership = await db
		.select()
		.from(assetOwnership)
		.where(
			and(
				eq(assetOwnership.assetId, certId),
				eq(assetOwnership.ownerId, locals.user.id),
				isNull(assetOwnership.revokedAt)
			)
		);

	if (ownership.length === 0) {
		throw redirect(302, `/certifications/${certId}`);
	}

	// 3. Find test and questions
	const [test] = await db
		.select()
		.from(assessmentTests)
		.where(eq(assessmentTests.assetId, certId));

	if (!test) {
		throw error(404, 'Assessment not configured');
	}

	const existingAttempts = await db.select().from(assessmentAttempts).where(and(eq(assessmentAttempts.testId, test.id), eq(assessmentAttempts.userId, locals.user.id)));
	const hasPassed = existingAttempts.some(a => a.passed);
	const maxReached = test.maxAttempts !== null && existingAttempts.length >= test.maxAttempts;
	
	if (hasPassed || maxReached) {
		return {
			cert,
			testId: test.id,
			cannotTake: true,
			reason: hasPassed ? 'You have already passed this assessment.' : 'You have reached the maximum number of attempts.',
			parsedContent: []
		};
	}

	const questions = await db
		.select()
		.from(assessmentQuestions)
		.where(eq(assessmentQuestions.testId, test.id))
		.orderBy(assessmentQuestions.sortOrder);

	const qIds = questions.map((q) => q.id);
	let options = [];
	if (qIds.length > 0) {
		const allOptions = await db
			.select()
			.from(assessmentOptions)
			.orderBy(assessmentOptions.sortOrder);
		options = allOptions.filter((o) => qIds.includes(o.questionId));
	}

	// Format exactly how QuizEngine expects: { id, question, options: [] }
	const parsedContent = questions.map((q) => ({
		id: q.id,
		question: q.content,
		options: options.filter((o) => o.questionId === q.id).map((o) => o.content)
	}));

	return {
		cert,
		testId: test.id,
		parsedContent,
		maxAttempts: test.maxAttempts,
		attemptsTaken: existingAttempts.length
	};
};
