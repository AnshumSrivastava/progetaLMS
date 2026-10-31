import { db } from '$lib/server/db/client';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, desc, isNull } from 'drizzle-orm';
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
		.orderBy(desc(commerceCoupons.createdAt));

	const mappedCoupons = allCoupons.map(c => {
		let discount = '';
		if (c.type === 'percent') discount = `${c.value}% OFF`;
		else discount = `₹${(c.value / 100).toLocaleString('en-IN')} OFF`;

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
	}).from(assets).where(isNull(assets.deletedAt));

	return {
		coupons: mappedCoupons,
		availableResources
	};
};

export const actions: Actions = {
	createCoupon: async ({ request, locals }) => {
		const data = await request.formData();
		const code = data.get('code')?.toString().trim().toUpperCase();
		const type = data.get('type')?.toString() as 'percent' | 'flat';
		const valueStr = data.get('value')?.toString();
		const assetIdStr = data.get('assetId')?.toString()?.trim();
		const limitStr = data.get('limit')?.toString();

		if (!code || !type || !valueStr) {
			return fail(400, { error: 'Missing required fields' });
		}

		let rawValue = parseFloat(valueStr) || 0;
		if (rawValue <= 0) {
			return fail(400, { error: 'Discount value must be greater than zero' });
		}
		if (type === 'percent' && rawValue > 100) {
			return fail(400, { error: 'Percentage discount cannot exceed 100%' });
		}

		const value = type === 'flat' ? Math.round(rawValue * 100) : Math.round(rawValue);
		const assetId = (!assetIdStr || assetIdStr === 'all') ? null : assetIdStr;
		const maxUses = limitStr ? parseInt(limitStr, 10) : null;
		const createdBy = locals.user!.id;

		try {
			const [existing] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.code, code));
			if (existing) {
				await db.update(commerceCoupons).set({
					type,
					value,
					assetId,
					maxUses,
					isActive: true
				}).where(eq(commerceCoupons.id, existing.id));
				return { success: true, message: `Coupon "${code}" updated successfully!` };
			}

			await db.insert(commerceCoupons).values({
				id: createId(),
				code,
				type,
				value,
				assetId,
				maxUses,
				createdBy,
				isActive: true
			});
			return { success: true, message: `Coupon "${code}" created successfully!` };
		} catch (e: any) {
			console.error('Failed to create coupon:', e);
			return fail(400, { error: e.message || 'Failed to create coupon' });
		}
	},

	toggleCouponActive: async ({ request }) => {
		const data = await request.formData();
		const couponId = data.get('couponId') as string;

		try {
			const [coupon] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.id, couponId));
			if (!coupon) return fail(404, { error: 'Coupon not found' });

			await db.update(commerceCoupons).set({ isActive: !coupon.isActive }).where(eq(commerceCoupons.id, couponId));
			return { success: true, message: `Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}.` };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to toggle coupon' });
		}
	},

	deleteCoupon: async ({ request }) => {
		const data = await request.formData();
		const couponId = data.get('couponId') as string;

		try {
			const [coupon] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.id, couponId));
			if (!coupon) return fail(404, { error: 'Coupon not found' });

			await db.delete(commerceCoupons).where(eq(commerceCoupons.id, couponId));
			return { success: true, message: 'Coupon deleted successfully.' };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to delete coupon' });
		}
	}
};
