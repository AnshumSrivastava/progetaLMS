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

		// Batch enrollment window has closed — send the buyer back to pick the current open batch
		const { CohortService } = await import('$lib/server/cohorts/CohortService');
		if (!CohortService.isEnrollmentOpen(foundCohort)) {
			throw redirect(303, `/catalog/${foundCohort.courseId}`);
		}
	} else {
		// Fallback to searching for the asset directly
		const [foundAsset] = await db.select().from(assets).where(eq(assets.id, itemId));
		asset = foundAsset;
	}

	if (!asset) {
		throw error(404, 'Item not found in catalog');
	}

	// Check if already owned (only if user is logged in)
	let alreadyOwned = false;
	if (user) {
		const [ownership] = await db.select().from(assetOwnership)
			.where(and(eq(assetOwnership.assetId, asset.id), eq(assetOwnership.ownerId, user.id)));
		alreadyOwned = !!ownership;
	}

	return {
		asset,
		cohort,
		alreadyOwned,
		user: user ? { id: user.id, email: user.email, name: user.name } : null,
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
		
		if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
			return fail(400, { couponError: 'Coupon usage limit reached' });
		}

		const itemId = params.itemId;
		let assetId = itemId;

		const { cohorts } = await import('$lib/server/db/schema/cohorts.schema');
		const [foundCohort] = await db.select().from(cohorts).where(eq(cohorts.id, itemId));
		if (foundCohort) {
			assetId = foundCohort.courseId;
		}

		if (coupon.assetId && coupon.assetId !== assetId) {
			return fail(400, { couponError: 'Coupon not valid for this item' });
		}

		return {
			couponValid: true,
			couponValue: coupon.value,
			couponType: coupon.type,
			couponCode: code
		};
	},

	checkout: async ({ request, params, locals, url }) => {
		let user = locals.user;

		const data = await request.formData();
		const couponCode = data.get('couponCode') as string;
		const firstName = (data.get('firstName') as string || '').trim();
		const lastName = (data.get('lastName') as string || '').trim();
		const name = [firstName, lastName].filter(Boolean).join(' ') || 'Student';
		const email = (data.get('email') as string || '').trim().toLowerCase();
		
		if (!email) {
			return fail(400, { checkoutError: 'A valid email address is required for checkout.' });
		}

		// If not already authenticated in session, check if user exists and is verified
		if (!user) {
			const { users } = await import('$lib/server/db/schema/identity.schema');
			const [foundUser] = await db.select().from(users).where(eq(users.email, email)).limit(1);
			if (!foundUser) {
				return fail(400, { checkoutError: 'Please verify your email address before completing payment.' });
			}
			user = foundUser;
		}

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
			const result = await OrderService.createOrder(assetId, user.id, { name, email, phone: '9999999999' }, couponCode, cohortId, url.origin);
			return { success: true, paymentSessionId: result.paymentSessionId, isFree: result.isFree, isMockMode: result.isMockMode };
		} catch (e: any) {
			return fail(500, { checkoutError: e.message });
		}
	}
};
