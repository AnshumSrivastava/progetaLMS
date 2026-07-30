import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { assessmentTests } from '$lib/server/db/schema/assessments.schema';
import { eq, and, isNull } from 'drizzle-orm';
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
		currency: assets.currency,
		testId: assessmentTests.id,
		passingPercent: assessmentTests.passingPercent,
		createdAt: assessmentTests.createdAt,
		metadata: assets.metadata
	})
	.from(assets)
	.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
	.where(and(eq(assets.type, 'cert_test'), eq(assets.ownerId, instructorId), isNull(assets.deletedAt)));

	const certifications = certAssets.map(c => {
		let formattedPrice = 'Free';
		if (c.pricePaise > 0) {
			const val = (c.pricePaise / 100).toFixed(2);
			formattedPrice = c.currency === 'USD' ? `$${val}` : `${c.currency} ${val}`;
		}
		return {
			...c,
			price: formattedPrice,
			rawCurrency: c.currency,
			rawPrice: c.pricePaise / 100,
			certEmailTemplate: (c.metadata as any)?.certEmailTemplate || ''
		};
	});

	return {
		certifications
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
	},
	updatePrice: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');
		
		const data = await request.formData();
		const certId = data.get('certId') as string;
		const price = parseFloat(data.get('price') as string) || 0;
		const currency = data.get('currency')?.toString() || 'INR';
		const pricePaise = Math.floor(price * 100);

		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, user.id)));
			if (!cert) return fail(403, { error: 'Unauthorized' });

			await db.update(assets).set({ pricePaise, currency }).where(eq(assets.id, certId));
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to update price' });
		}
	},
	togglePublish: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');
		
		const data = await request.formData();
		const certId = data.get('certId') as string;
		
		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, user.id)));
			if (!cert) return fail(403, { error: 'Unauthorized' });

			const newStatus = cert.status === 'published' ? 'draft' : 'published';
			await db.update(assets).set({ status: newStatus }).where(eq(assets.id, certId));
			
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to toggle status' });
		}
	},
	updateEmailTemplate: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');
		
		const data = await request.formData();
		const certId = data.get('certId') as string;
		const certEmailTemplate = data.get('certEmailTemplate') as string;

		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, user.id)));
			if (!cert) return fail(403, { error: 'Unauthorized' });

			const newMetadata = {
				...((cert.metadata as any) || {}),
				certEmailTemplate
			};

			await db.update(assets).set({ metadata: newMetadata }).where(eq(assets.id, certId));
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to update email template' });
		}
	},
	deleteCert: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');
		
		const data = await request.formData();
		const certId = data.get('certId') as string;
		
		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, user.id)));
			if (!cert) return fail(403, { error: 'Unauthorized' });

			await db.update(assets).set({ deletedAt: new Date(), status: 'archived' }).where(eq(assets.id, certId));
			
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to delete certification' });
		}
	}
};
