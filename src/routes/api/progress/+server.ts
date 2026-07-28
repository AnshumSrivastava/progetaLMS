import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { assetProgress } from '$lib/server/db/schema/assets.schema';
import { randomUUID } from 'node:crypto';

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { assetId, lessonId, progressPercent, completed } = await request.json();

		if (!assetId || !lessonId) {
			return json({ error: 'Missing parameters' }, { status: 400 });
		}

		// Insert or update progress using onConflictDoUpdate
		await db.insert(assetProgress).values({
			id: randomUUID(),
			userId: user.id,
			assetId,
			lessonId,
			progressPercent: progressPercent || 0,
			completed: !!completed,
			lastAccessedAt: new Date(),
			completedAt: completed ? new Date() : null
		}).onConflictDoUpdate({
			target: [assetProgress.userId, assetProgress.assetId, assetProgress.lessonId],
			set: {
				progressPercent: progressPercent || 0,
				completed: !!completed,
				lastAccessedAt: new Date(),
				// Only update completedAt if it transitions to true
				completedAt: completed ? new Date() : undefined
			}
		});

		return json({ success: true });
	} catch (e: any) {
		console.error('Progress tracking error:', e);
		return json({ error: 'Failed to update progress' }, { status: 500 });
	}
};
