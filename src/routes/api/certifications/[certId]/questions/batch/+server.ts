import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests, assessmentQuestions, assessmentOptions } from '$lib/server/db/schema/assessments.schema';
import { eq, and } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ params, request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role || 'student';
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Instructor role required' }, { status: 403 });
	}

	const certId = params.certId;
	if (!certId) {
		return json({ error: 'Certification ID is required' }, { status: 400 });
	}

	try {
		// 1. Verify ownership or administrative authority
		const [certAsset] = await db
			.select({
				id: assets.id,
				ownerId: assets.ownerId,
				testId: assessmentTests.id
			})
			.from(assets)
			.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
			.where(
				and(
					eq(assets.id, certId),
					role === 'admin' || role === 'owner' ? undefined : eq(assets.ownerId, locals.user.id)
				)
			);

		if (!certAsset) {
			return json({ error: 'Certification not found or unauthorized' }, { status: 404 });
		}

		const body = await request.json();
		const rawQuestions = body.questions;

		if (!Array.isArray(rawQuestions) || rawQuestions.length === 0) {
			return json({ error: 'No questions provided for batch upload' }, { status: 400 });
		}

		// 2. Count existing questions to establish sort order
		const existing = await db
			.select({ id: assessmentQuestions.id })
			.from(assessmentQuestions)
			.where(eq(assessmentQuestions.testId, certAsset.testId));

		let currentSortOrder = existing.length;

		// 3. Batch insert questions and options
		const questionsToInsert: Array<typeof assessmentQuestions.$inferInsert> = [];
		const optionsToInsert: Array<typeof assessmentOptions.$inferInsert> = [];

		for (const q of rawQuestions) {
			if (!q.content || !Array.isArray(q.options) || q.options.length < 2) {
				continue; // Skip invalid entries
			}

			const questionId = createId();
			questionsToInsert.push({
				id: questionId,
				testId: certAsset.testId,
				type: 'mcq',
				content: q.content.trim(),
				explanation: q.explanation?.trim() || null,
				points: q.points || 1,
				sortOrder: currentSortOrder++
			});

			q.options.forEach((opt: { content: string; isCorrect: boolean }, idx: number) => {
				optionsToInsert.push({
					id: createId(),
					questionId,
					content: opt.content.trim(),
					isCorrect: Boolean(opt.isCorrect),
					sortOrder: idx
				});
			});
		}

		if (questionsToInsert.length === 0) {
			return json({ error: 'No valid questions found to import' }, { status: 400 });
		}

		// Perform database inserts
		await db.transaction(async (tx) => {
			for (const q of questionsToInsert) {
				await tx.insert(assessmentQuestions).values(q);
			}
			for (const opt of optionsToInsert) {
				await tx.insert(assessmentOptions).values(opt);
			}
		});

		return json({
			success: true,
			importedCount: questionsToInsert.length,
			totalQuestions: currentSortOrder
		});
	} catch (err: any) {
		console.error('Batch question import error:', err);
		return json({ error: err.message || 'Failed to batch import questions' }, { status: 500 });
	}
};
