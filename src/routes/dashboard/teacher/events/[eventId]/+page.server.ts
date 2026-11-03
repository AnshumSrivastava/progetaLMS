import { error, redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations, eventResources, userEventProfiles } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { emailService } from '$lib/server/emails';
import { createId } from '@paralleldrive/cuid2';
import { eq, and, desc, asc } from 'drizzle-orm';

export const load: PageServerLoad = async ({ params, locals }) => {
	if (!locals.user || (locals.user.role !== 'teacher' && locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
		throw redirect(302, '/dashboard');
	}

	const eventId = params.eventId;

	const [event] = await db
		.select()
		.from(events)
		.where(eq(events.id, eventId));

	if (!event) {
		throw error(404, 'Event not found');
	}

	const isStaff = locals.user.role === 'admin' || locals.user.role === 'owner';
	if (!isStaff && event.hostId !== locals.user.id) {
		throw error(403, 'Unauthorized to manage this session');
	}

	// Fetch Attendees with their profile data
	const attendees = await db
		.select({
			registrationId: eventRegistrations.id,
			userId: eventRegistrations.userId,
			status: eventRegistrations.status,
			paymentMethod: eventRegistrations.paymentMethod,
			amountPaidPaise: eventRegistrations.amountPaidPaise,
			creditsUsed: eventRegistrations.creditsUsed,
			registeredAt: eventRegistrations.registeredAt,
			attendedAt: eventRegistrations.attendedAt,
			name: users.name,
			email: users.email,
			phone: userEventProfiles.phone,
			organization: userEventProfiles.organization,
			jobTitle: userEventProfiles.jobTitle
		})
		.from(eventRegistrations)
		.leftJoin(users, eq(eventRegistrations.userId, users.id))
		.leftJoin(userEventProfiles, eq(eventRegistrations.userId, userEventProfiles.userId))
		.where(eq(eventRegistrations.eventId, eventId))
		.orderBy(desc(eventRegistrations.registeredAt));

	// Fetch Resources
	const resources = await db
		.select()
		.from(eventResources)
		.where(eq(eventResources.eventId, eventId))
		.orderBy(asc(eventResources.sortOrder));

	return {
		event,
		attendees,
		resources
	};
};

export const actions: Actions = {
	releaseResources: async ({ params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });

		const eventId = params.eventId;

		const [event] = await db.select().from(events).where(eq(events.id, eventId));
		if (!event) return fail(404, { error: 'Event not found' });

		const isStaff = locals.user.role === 'admin' || locals.user.role === 'owner' || event.hostId === locals.user.id;
		if (!isStaff) return fail(403, { error: 'Unauthorized' });

		await db
			.update(events)
			.set({ isResourcesReleased: true, updatedAt: new Date() })
			.where(eq(events.id, eventId));

		// Fetch confirmed attendees to notify
		const attendees = await db
			.select({
				name: users.name,
				email: users.email
			})
			.from(eventRegistrations)
			.innerJoin(users, eq(eventRegistrations.userId, users.id))
			.where(and(
				eq(eventRegistrations.eventId, eventId),
				eq(eventRegistrations.status, 'confirmed')
			));

		const resourceList = await db.select().from(eventResources).where(eq(eventResources.eventId, eventId));

		// Batch notify attendees (asynchronous)
		for (const att of attendees) {
			if (att.email) {
				emailService.sendEventResourcesReleased({
					to: att.email,
					userName: att.name || 'Student',
					eventTitle: event.title,
					eventSlug: event.slug,
					resourceCount: resourceList.length
				}).catch((err) => console.error('[ResourceEmailError]', err));
			}
		}

		return { success: true, message: `Resources released and sent to ${attendees.length} attendees!` };
	},

	addResource: async ({ request, params, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const eventId = params.eventId;

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const description = (data.get('description') as string)?.trim();
		const type = (data.get('type') as 'link' | 'file' | 'video') || 'link';
		const urlOrKey = (data.get('urlOrKey') as string)?.trim();
		const isPreEvent = data.get('isPreEvent') === 'on';

		if (!title || !urlOrKey) {
			return fail(400, { error: 'Resource Title and URL/Storage Key are required.' });
		}

		await db.insert(eventResources).values({
			id: createId(),
			eventId,
			title,
			description: description || null,
			type,
			urlOrKey,
			isPreEvent,
			sortOrder: 0,
			createdAt: new Date()
		});

		return { success: true, message: 'Resource added successfully' };
	},

	deleteResource: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const resourceId = data.get('resourceId') as string;

		if (!resourceId) return fail(400, { error: 'resourceId is required' });

		await db.delete(eventResources).where(eq(eventResources.id, resourceId));
		return { success: true, message: 'Resource deleted' };
	},

	checkinAttendee: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const registrationId = data.get('registrationId') as string;

		if (!registrationId) return fail(400, { error: 'registrationId is required' });

		await db
			.update(eventRegistrations)
			.set({ attendedAt: new Date() })
			.where(eq(eventRegistrations.id, registrationId));

		return { success: true, message: 'Attendee marked as present' };
	}
};

