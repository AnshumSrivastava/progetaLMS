import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const POST: RequestHandler = async ({ locals, request, url }) => {
	if (!locals.user) {
		return json({ error: 'Please sign in to book a mentoring session' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { availabilityId, startsAt, durationMins, notes, couponCode } = body;

		if (!availabilityId || !startsAt || !durationMins) {
			return json({ error: 'availabilityId, startsAt, and durationMins are required' }, { status: 400 });
		}

		const startsAtDate = new Date(startsAt);
		if (isNaN(startsAtDate.getTime())) {
			return json({ error: 'Invalid startsAt timestamp' }, { status: 400 });
		}

		const result = await MentoringService.createBooking({
			studentId: locals.user.id,
			availabilityId,
			startsAt: startsAtDate,
			durationMins: Number(durationMins),
			notes,
			couponCode,
			origin: url.origin
		});

		// If paid session, provide checkout URL
		if (!result.isFree && result.orderId) {
			return json({
				success: true,
				bookingId: result.bookingId,
				isFree: false,
				orderId: result.orderId,
				checkoutUrl: `/checkout/${result.orderId}`
			}, { status: 201 });
		}

		return json({
			success: true,
			bookingId: result.bookingId,
			isFree: true
		}, { status: 201 });
	} catch (err: any) {
		const status = err.message?.includes('just booked') || err.message?.includes('conflict') ? 409 : 400;
		return json({ error: err.message || 'Failed to create booking' }, { status });
	}
};
