import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eq, desc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const GET: RequestHandler = async ({ locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const coupons = await db
			.select()
			.from(commerceCoupons)
			.where(eq(commerceCoupons.createdBy, locals.user.id))
			.orderBy(desc(commerceCoupons.createdAt));

		return json({ coupons });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch coupons' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ locals, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { code, type, value, maxUses, minAmountPaise, validUntil } = body;

		if (!code || !type || value === undefined) {
			return json({ error: 'Promo code, type, and discount value are required' }, { status: 400 });
		}

		const cleanCode = code.trim().toUpperCase();
		if (cleanCode.length < 3 || cleanCode.length > 20) {
			return json({ error: 'Promo code must be 3-20 characters' }, { status: 400 });
		}

		if (!['percent', 'flat'].includes(type)) {
			return json({ error: 'Type must be percent or flat' }, { status: 400 });
		}

		const couponId = createId();
		await db.insert(commerceCoupons).values({
			id: couponId,
			code: cleanCode,
			type,
			value: Number(value),
			maxUses: maxUses ? Number(maxUses) : null,
			minAmountPaise: minAmountPaise ? Number(minAmountPaise) : 0,
			validUntil: validUntil ? new Date(validUntil) : null,
			createdBy: locals.user.id,
			isActive: true
		});

		return json({ success: true, couponId }, { status: 201 });
	} catch (err: any) {
		if (err.message?.includes('unique') || err.message?.includes('duplicate')) {
			return json({ error: 'A coupon with this code already exists' }, { status: 409 });
		}
		return json({ error: err.message || 'Failed to create coupon' }, { status: 400 });
	}
};
