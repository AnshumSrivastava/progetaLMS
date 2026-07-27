import { db } from '$lib/server/db/client';
import { assetContent } from '$lib/server/db/schema/assets.schema';
import { eq } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const lessonId = params.lessonId;

	const [content] = await db
		.select()
		.from(assetContent)
		.where(eq(assetContent.id, lessonId));

	if (!content) {
		throw error(404, 'Lesson not found');
	}

	return {
		lesson: content,
		contentType: content.contentType
	};
};
