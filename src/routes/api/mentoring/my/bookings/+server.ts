import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { MentoringService } from '$lib/server/mentoring/MentoringService';

export const GET: RequestHandler = async ({ locals, url }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const role = locals.user.role as string;
	const viewAsStudent = url.searchParams.get('as') === 'student' || role === 'student';

	try {
		if (viewAsStudent) {
			const bookings = await MentoringService.getStudentBookings(locals.user.id);
			return json({ bookings });
		} else {
			if (!['teacher', 'admin', 'owner'].includes(role)) {
				return json({ error: 'Forbidden' }, { status: 403 });
			}
			const bookings = await MentoringService.getInstructorBookings(locals.user.id);
			return json({ bookings });
		}
	} catch (err: any) {
		return json({ error: err.message || 'Failed to fetch bookings' }, { status: 500 });
	}
};

