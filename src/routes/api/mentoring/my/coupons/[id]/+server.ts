import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eq, and } from 'drizzle-orm';

export const PATCH: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['teacher', 'admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	try {
		const body = await request.json();
		const { isActive } = body;

		if (typeof isActive !== 'boolean') {
			return json({ error: 'isActive must be a boolean' }, { status: 400 });
		}

		await db
			.update(commerceCoupons)
			.set({ isActive })
			.where(
				and(
					eq(commerceCoupons.id, params.id),
					['admin', 'owner'].includes(role) ? undefined : eq(commerceCoupons.createdBy, locals.user.id)
				)
			);

		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to update coupon' }, { status: 400 });
	}
};
