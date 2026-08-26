import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { mentoringBookings } from '$lib/server/db/schema/mentoring.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ locals, params, request }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	if (!['admin', 'owner'].includes(role)) {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const body = await request.json().catch(() => ({}));
	const reason = body.reason;

	if (!reason || reason.trim() === '') {
		return json({ error: 'A mandatory cancellation reason is required for administrative cancellations' }, { status: 400 });
	}

	try {
		const [booking] = await db
			.select()
			.from(mentoringBookings)
			.where(eq(mentoringBookings.id, params.id))
			.limit(1);

		if (!booking) {
			return json({ error: 'Booking not found' }, { status: 404 });
		}

		await db
			.update(mentoringBookings)
			.set({
				status: 'cancelled',
				cancelledByRole: 'admin'
			})
			.where(eq(mentoringBookings.id, params.id));

		const [student] = await db.select().from(users).where(eq(users.id, booking.studentId)).limit(1);
		const [instructor] = await db.select().from(users).where(eq(users.id, booking.instructorId)).limit(1);

		if (student && instructor) {
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'MENTORING_CANCELLED_BY_STUDENT',
				payload: {
					instructorEmail: instructor.email,
					instructorName: instructor.name || 'Instructor',
					studentName: student.name || 'Student',
					startsAt: new Date(booking.startsAt).toISOString(),
					durationMins: booking.durationMins
				}
			});
		}

		return json({ success: true });
	} catch (err: any) {
		return json({ error: err.message || 'Failed to cancel booking' }, { status: 400 });
	}
};
