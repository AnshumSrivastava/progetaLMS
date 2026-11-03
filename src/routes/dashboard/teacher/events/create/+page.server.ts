import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { events } from '$lib/server/db/schema/events.schema';
import { createId } from '@paralleldrive/cuid2';
import { eq } from 'drizzle-orm';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user || (locals.user.role !== 'teacher' && locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}
	return {};
};

function slugify(text: string) {
	return text
		.toString()
		.toLowerCase()
		.trim()
		.replace(/\s+/g, '-')
		.replace(/[^\w\-]+/g, '')
		.replace(/\-\-+/g, '-');
}

export const actions: Actions = {
	default: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'teacher' && locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const shortDescription = (data.get('shortDescription') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const startAtStr = data.get('startAt') as string;
		const endAtStr = data.get('endAt') as string;
		const deadlineStr = data.get('registrationDeadline') as string;
		const eventType = (data.get('eventType') as string) || 'free';
		const priceRupees = parseFloat((data.get('priceRupees') as string) || '0');
		const priceCreditsStr = data.get('priceCredits') as string;
		const maxAttendeesStr = data.get('maxAttendees') as string;
		const venueType = (data.get('venueType') as string) || 'online';
		const link = (data.get('link') as string)?.trim();
		const address = (data.get('address') as string)?.trim();
		const coverImageUrl = (data.get('coverImageUrl') as string)?.trim();
		const whatsappGroupUrl = (data.get('whatsappGroupUrl') as string)?.trim();
		const status = (data.get('status') as string) === 'published' ? 'published' : 'draft';

		if (!title || !startAtStr || !endAtStr) {
			return fail(400, { error: 'Title, Start Date, and End Date are required.' });
		}

		const startAt = new Date(startAtStr);
		const endAt = new Date(endAtStr);
		const registrationDeadline = deadlineStr ? new Date(deadlineStr) : startAt;

		if (endAt <= startAt) {
			return fail(400, { error: 'End time must be after start time.' });
		}

		let baseSlug = slugify(title);
		if (!baseSlug) baseSlug = `session-${createId().slice(0, 6)}`;

		// Check slug uniqueness
		const [existingSlug] = await db.select({ id: events.id }).from(events).where(eq(events.slug, baseSlug));
		const slug = existingSlug ? `${baseSlug}-${createId().slice(0, 4)}` : baseSlug;

		const pricePaise = eventType === 'paid' ? Math.round(priceRupees * 100) : 0;
		const priceCredits = priceCreditsStr ? parseInt(priceCreditsStr, 10) : null;
		const maxAttendees = maxAttendeesStr ? parseInt(maxAttendeesStr, 10) : null;

		const eventId = createId();

		try {
			await db.insert(events).values({
				id: eventId,
				title,
				slug,
				shortDescription: shortDescription || null,
				description: description || null,
				hostId: locals.user.id,
				date: startAt,
				startAt,
				endAt,
				registrationDeadline,
				eventType: eventType as 'paid' | 'free',
				pricePaise,
				priceCredits,
				maxAttendees,
				status: status as any,
				venueType: venueType as any,
				venueDetails: {
					address: address || undefined,
					meetingUrl: link || undefined
				},
				link: link || null,
				coverImageUrl: coverImageUrl || null,
				whatsappGroupUrl: whatsappGroupUrl || null,
				createdAt: new Date(),
				updatedAt: new Date()
			});
		} catch (e: any) {
			console.error('[CreateEventError]', e);
			return fail(500, { error: e.message || 'Failed to save event.' });
		}

		throw redirect(303, `/dashboard/teacher/events/${eventId}`);
	}
};

