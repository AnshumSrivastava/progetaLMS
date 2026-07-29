import { db } from '$lib/server/db/client';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { cohorts } from '$lib/server/db/schema/cohorts.schema';
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
			cohortName: cohorts.name,
			isActive: commerceCoupons.isActive
		})
		.from(commerceCoupons)
		.leftJoin(cohorts, eq(commerceCoupons.cohortId, cohorts.id))
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
			course: c.cohortName || 'All Classes',
			uses: c.uses,
			limit: c.limit,
			status
		};
	});

	// Get available classes for the select dropdown
	const availableClasses = await db.select({
		id: cohorts.id,
		name: cohorts.name
	}).from(cohorts).where(eq(cohorts.instructorId, locals.user!.id));

	return {
		coupons: mappedCoupons,
		availableClasses
	};
};

export const actions: Actions = {
	createCoupon: async ({ request, locals }) => {
		const data = await request.formData();
		const code = data.get('code')?.toString().toUpperCase();
		const type = data.get('type')?.toString() as 'percent' | 'flat';
		const valueStr = data.get('value')?.toString();
		const cohortIdStr = data.get('cohortId')?.toString();
		const limitStr = data.get('limit')?.toString();

		if (!code || !type || !valueStr) {
			return fail(400, { error: 'Missing required fields' });
		}

		let value = parseInt(valueStr, 10);
		if (type === 'flat') {
			value = value * 100; // convert dollars to paise
		}

		const cohortId = cohortIdStr === 'all' ? null : cohortIdStr;
		const maxUses = limitStr ? parseInt(limitStr, 10) : null;
		
		const createdBy = locals.user!.id;

		try {
			await db.insert(commerceCoupons).values({
				id: createId(),
				code,
				type,
				value,
				cohortId,
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
