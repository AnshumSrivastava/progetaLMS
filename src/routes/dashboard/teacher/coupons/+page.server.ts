import { db } from '$lib/server/db/client';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	const allCoupons = await db
		.select({
			id: commerceCoupons.id,
			code: commerceCoupons.code,
			type: commerceCoupons.type,
			value: commerceCoupons.value,
			uses: commerceCoupons.usesCount,
			limit: commerceCoupons.maxUses,
			assetTitle: assets.title,
			isActive: commerceCoupons.isActive
		})
		.from(commerceCoupons)
		.leftJoin(assets, eq(commerceCoupons.assetId, assets.id))
		.where(eq(commerceCoupons.createdBy, locals.user!.id));

	const mappedCoupons = allCoupons.map(c => {
		let discount = '';
		if (c.type === 'percent') discount = `${c.value}% OFF`;
		else discount = `$${(c.value / 100).toFixed(2)} OFF`;

		let status = 'Active';
		if (!c.isActive) status = 'Inactive';
		else if (c.limit !== null && c.uses >= c.limit) status = 'Exhausted';

		return {
			id: c.id,
			code: c.code,
			discount,
			course: c.assetTitle || 'All Resources',
			uses: c.uses,
			limit: c.limit,
			status
		};
	});

	// Get available resources for the select dropdown
	const availableResources = await db.select({
		id: assets.id,
		name: assets.title
	}).from(assets).where(eq(assets.ownerId, locals.user!.id));

	return {
		coupons: mappedCoupons,
		availableResources
	};
};

export const actions: Actions = {
	createCoupon: async ({ request, locals }) => {
		const data = await request.formData();
		const code = data.get('code')?.toString().toUpperCase();
		const type = data.get('type')?.toString() as 'percent' | 'flat';
		const valueStr = data.get('value')?.toString();
		const assetIdStr = data.get('assetId')?.toString();
		const limitStr = data.get('limit')?.toString();

		if (!code || !type || !valueStr) {
			return fail(400, { error: 'Missing required fields' });
		}

		let value = parseInt(valueStr, 10);
		if (type === 'flat') {
			value = value * 100; // convert dollars to paise
		}

		const assetId = assetIdStr === 'all' ? null : assetIdStr;
		const maxUses = limitStr ? parseInt(limitStr, 10) : null;
		
		const createdBy = locals.user!.id;

		try {
			await db.insert(commerceCoupons).values({
				id: createId(),
				code,
				type,
				value,
				assetId,
				maxUses,
				createdBy
			});
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to create coupon' });
		}
	}
};
