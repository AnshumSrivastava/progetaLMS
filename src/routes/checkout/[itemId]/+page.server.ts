import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eq, and } from 'drizzle-orm';
import { OrderService } from '$lib/server/commerce/OrderService';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/sign-in');
	}

	// Wait, the params might be UUID or slug. For now we use slug/id.
	const itemId = params.itemId;
	const [asset] = await db.select().from(assets).where(eq(assets.id, itemId));

	if (!asset) {
		// Mock asset if not found (so UI doesn't crash while testing)
		return {
			asset: {
				id: itemId,
				title: 'Certification Exam: Network Defense Associate',
				type: 'Certification Exam',
				pricePaise: 15000 // $150.00
			},
			alreadyOwned: false
		};
	}

	// Check if already owned
	const [ownership] = await db.select().from(assetOwnership)
		.where(and(eq(assetOwnership.assetId, asset.id), eq(assetOwnership.ownerId, user.id)));

	return {
		asset,
		alreadyOwned: !!ownership
	};
};

export const actions: Actions = {
	validateCoupon: async ({ request, params }) => {
		const data = await request.formData();
		const code = (data.get('couponCode') as string || '').toUpperCase();
		
		const [coupon] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.code, code));
		
		if (!coupon || !coupon.isActive) {
			return fail(400, { couponError: 'Invalid or expired coupon' });
		}

		return {
			couponValid: true,
			couponValue: coupon.value,
			couponType: coupon.type,
			couponCode: code
		};
	},

	checkout: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');

		const data = await request.formData();
		const couponCode = data.get('couponCode') as string;
		const name = data.get('firstName') + ' ' + data.get('lastName');
		const email = data.get('email') as string;
		
		const itemId = params.itemId;

		try {
			const result = await OrderService.createOrder(itemId, user.id, { name, email, phone: '9999999999' }, couponCode);
			return { success: true, paymentSessionId: result.paymentSessionId, isFree: result.isFree, isMockMode: result.isMockMode };
		} catch (e: any) {
			return fail(500, { checkoutError: e.message });
		}
	}
};
