import { db } from '$lib/server/db/client';
import { events } from '$lib/server/db/schema/platform.schema';
import { eq, desc } from 'drizzle-orm';
import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	const allEvents = await db.select().from(events).orderBy(desc(events.createdAt));

	return {
		events: allEvents
	};
};

export const actions: Actions = {
	create: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const dateStr = data.get('date') as string;
		const link = data.get('link') as string;
		const type = data.get('type') as 'public' | 'private';

		if (!title || !dateStr) {
			return fail(400, { error: 'Title and Date are required' });
		}

		try {
			await db.insert(events).values({
				id: createId(),
				title,
				description,
				hostId: locals.user.id,
				date: new Date(dateStr),
				link,
				type: type || 'public'
			});
			return { success: true };
		} catch (e: any) {
			console.error(e);
			return fail(500, { error: 'Failed to create event' });
		}
	},
	delete: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const eventId = data.get('eventId') as string;

		try {
			await db.delete(events).where(eq(events.id, eventId));
			return { success: true };
		} catch (e: any) {
			return fail(500, { error: 'Failed to delete event' });
		}
	}
};
