import { error, fail, redirect } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eq, and } from 'drizzle-orm';
import { OrderService } from '$lib/server/commerce/OrderService';
import { CASHFREE_ENV } from '$env/static/private';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) {
		throw redirect(302, '/sign-in');
	}

	const itemId = params.itemId;
	let asset: any = null;
	let cohort: any = null;

	// First try to find a cohort
	const { cohorts } = await import('$lib/server/db/schema/cohorts.schema');
	const [foundCohort] = await db.select().from(cohorts).where(eq(cohorts.id, itemId));
	
	if (foundCohort) {
		cohort = foundCohort;
		const [foundAsset] = await db.select().from(assets).where(eq(assets.id, cohort.courseId));
		asset = foundAsset;
	} else {
		// Fallback to searching for the asset directly
		const [foundAsset] = await db.select().from(assets).where(eq(assets.id, itemId));
		asset = foundAsset;
	}

	if (!asset) {
		// Mock asset if not found (so UI doesn't crash while testing)
		return {
			asset: {
				id: itemId,
				title: 'Certification Exam: Network Defense Associate',
				type: 'Certification Exam',
				pricePaise: 15000 // $150.00
			},
			cohort,
			alreadyOwned: false,
			cashfreeEnv: CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
		};
	}

	// Check if already owned
	const [ownership] = await db.select().from(assetOwnership)
		.where(and(eq(assetOwnership.assetId, asset.id), eq(assetOwnership.ownerId, user.id)));

	return {
		asset,
		cohort,
		alreadyOwned: !!ownership,
		cashfreeEnv: CASHFREE_ENV === 'production' ? 'production' : 'sandbox'
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
		
		let assetId = itemId;
		let cohortId: string | undefined = undefined;

		const { cohorts } = await import('$lib/server/db/schema/cohorts.schema');
		const [foundCohort] = await db.select().from(cohorts).where(eq(cohorts.id, itemId));
		if (foundCohort) {
			cohortId = foundCohort.id;
			assetId = foundCohort.courseId;
		}

		try {
			const result = await OrderService.createOrder(assetId, user.id, { name, email, phone: '9999999999' }, couponCode, cohortId);
			return { success: true, paymentSessionId: result.paymentSessionId, isFree: result.isFree, isMockMode: result.isMockMode };
		} catch (e: any) {
			return fail(500, { checkoutError: e.message });
		}
	}
};
