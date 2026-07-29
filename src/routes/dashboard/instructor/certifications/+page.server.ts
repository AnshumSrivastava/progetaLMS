import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests } from '$lib/server/db/schema/assessments.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) throw redirect(302, '/sign-in');
	const instructorId = locals.user.id;

	const certAssets = await db.select({
		id: assets.id,
		title: assets.title,
		status: assets.status,
		pricePaise: assets.pricePaise,
		testId: assessmentTests.id,
		passingPercent: assessmentTests.passingPercent,
		createdAt: assessmentTests.createdAt
	})
	.from(assets)
	.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
	.where(and(eq(assets.type, 'cert_test'), eq(assets.ownerId, instructorId)));

	return {
		certifications: certAssets
	};
};

export const actions: Actions = {
	createCert: async ({ request, locals }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString();

		if (!title) {
			return fail(400, { error: 'Missing title' });
		}

		if (!locals.user) throw redirect(302, '/sign-in');
		const ownerId = locals.user.id;

		try {
			const assetId = createId();
			const testId = createId();

			// Generate slug
			const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			const uniqueSuffix = Math.random().toString(36).substring(2, 7);
			const slug = baseSlug ? `${baseSlug}-${uniqueSuffix}` : createId();

			// 1. Create asset
			await db.insert(assets).values({
				id: assetId,
				slug: slug,
				title,
				type: 'cert_test',
				ownerId,
				status: 'draft',
				pricePaise: 0
			});

			// 2. Create assessment test config
			await db.insert(assessmentTests).values({
				id: testId,
				assetId: assetId,
				passingPercent: 70
			});

			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to create certification' });
		}
	}
};
