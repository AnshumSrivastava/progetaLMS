import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { OrderService } from '$lib/server/commerce/OrderService';
import { db } from '$lib/server/db/client';
import { userEventProfiles } from '$lib/server/db/schema/events.schema';
import { eq } from 'drizzle-orm';

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!locals.user) {
		throw error(401, 'Please sign in to purchase credits');
	}

	let body: { packageId?: string };
	try {
		body = await request.json();
	} catch {
		throw error(400, 'Invalid JSON payload');
	}

	if (!body.packageId) {
		throw error(400, 'packageId is required');
	}

	// Fetch phone if user has profile, otherwise fallback
	const [profile] = await db
		.select()
		.from(userEventProfiles)
		.where(eq(userEventProfiles.userId, locals.user.id));

	const customerDetails = {
		name: locals.user.name || 'Student',
		email: locals.user.email || 'student@progeta.in',
		phone: profile?.phone || '9999999999'
	};

	try {
		const result = await OrderService.createCreditOrder(
			body.packageId,
			locals.user.id,
			customerDetails,
			url.origin
		);

		return json({
			success: true,
			paymentSessionId: result.paymentSessionId,
			cashfreeOrderId: result.cashfreeOrderId,
			isMockMode: result.isMockMode
		});
	} catch (e: any) {
		return json({ error: e.message || 'Failed to initialize credit purchase' }, { status: 500 });
	}
};

