import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { events, eventRegistrations, userEventProfiles } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { CreditService } from '$lib/server/credits/credit.service';
import { OrderService } from '$lib/server/commerce/OrderService';
import { emailService } from '$lib/server/emails';
import { eq, and, sql } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export const POST: RequestHandler = async ({ params, request, locals, url }) => {
	const eventId = params.id;

	// 1. Parse request payload early
	let body: {
		paymentMethod?: 'free' | 'credit' | 'cashfree';
		ticketTierId?: string;
		name?: string;
		email?: string;
		phone?: string;
	} = {};
	try {
		body = await request.json();
	} catch {
		// Default empty payload
	}

	// 2. Resolve User (Logged-in or Seamless Guest Registration)
	let currentUser: { id: string; email: string; name: string | null } | null = locals.user
		? { id: locals.user.id, email: locals.user.email, name: locals.user.name }
		: null;

	if (!currentUser) {
		const rawEmail = body.email?.trim().toLowerCase();
		if (!rawEmail || !rawEmail.includes('@')) {
			throw error(401, 'Please enter a valid email address to reserve your seat.');
		}

		// Find existing user by email or create new account
		const [existingUser] = await db
			.select({ id: users.id, email: users.email, name: users.name })
			.from(users)
			.where(eq(users.email, rawEmail))
			.limit(1);

		if (existingUser) {
			currentUser = existingUser;
		} else {
			const newUserId = createId();
			const attendeeName = body.name?.trim() || 'Learner';
			await db.insert(users).values({
				id: newUserId,
				email: rawEmail,
				name: attendeeName,
				role: 'student'
			});
			currentUser = { id: newUserId, email: rawEmail, name: attendeeName };
		}
	}

	// 3. Ensure User Profile exists (auto-create minimal default so user is NEVER blocked)
	const [existingProfile] = await db
		.select()
		.from(userEventProfiles)
		.where(eq(userEventProfiles.userId, currentUser.id))
		.limit(1);

	let profile = existingProfile;
	if (!profile) {
		const defaultPhone = body.phone?.trim() || '9999999999';
		try {
			const [createdProfile] = await db
				.insert(userEventProfiles)
				.values({
					id: createId(),
					userId: currentUser.id,
					phone: defaultPhone,
					organization: 'Independent Learner',
					jobTitle: 'Practitioner',
					experienceLevel: 'student',
					city: 'Online',
					state: 'Online'
				})
				.returning();
			profile = createdProfile;
		} catch {
			// Profile may have been inserted concurrently
			const [refetched] = await db
				.select()
				.from(userEventProfiles)
				.where(eq(userEventProfiles.userId, currentUser.id))
				.limit(1);
			profile = refetched;
		}
	}

	// 4. Fetch Event from database (SERVER IS SINGLE SOURCE OF TRUTH)
	const [event] = await db
		.select()
		.from(events)
		.where(eq(events.id, eventId));

	if (!event) {
		throw error(404, 'Event not found');
	}

	if (event.status !== 'published') {
		return json({ error: 'This event is currently unavailable' }, { status: 422 });
	}

	if (event.registrationDeadline && new Date() > new Date(event.registrationDeadline)) {
		return json({ error: 'Registration for this event has closed' }, { status: 422 });
	}

	if (event.startAt && new Date() > new Date(event.startAt)) {
		return json({ error: 'This event has already started' }, { status: 422 });
	}

	// 5. Capacity check
	if (event.maxAttendees !== null && event.maxAttendees !== undefined) {
		const [{ count }] = await db
			.select({ count: sql<number>`count(*)` })
			.from(eventRegistrations)
			.where(and(
				eq(eventRegistrations.eventId, eventId),
				eq(eventRegistrations.status, 'confirmed')
			));

		if (Number(count) >= event.maxAttendees) {
			return json({ error: 'This event has reached maximum capacity' }, { status: 422 });
		}
	}

	// 6. Check existing registration
	const [existing] = await db
		.select()
		.from(eventRegistrations)
		.where(and(
			eq(eventRegistrations.eventId, eventId),
			eq(eventRegistrations.userId, currentUser.id)
		));

	if (existing && existing.status === 'confirmed') {
		return json(
			{
				error: 'ALREADY_REGISTERED',
				message: 'You have already confirmed your registration for this event.'
			},
			{ status: 409 }
		);
	}

	const TICKET_TIERS: Record<string, { id: string; name: string; pricePaise: number }> = {
		'attendee': { id: 'attendee', name: 'Normal Attendee + Tool List', pricePaise: 9900 },
		'certified': { id: 'certified', name: 'Everything above + Certificate', pricePaise: 29900 },
		'all_access': { id: 'all_access', name: 'Everything above + Defense Playbook', pricePaise: 49900 }
	};

	const selectedTier = body.ticketTierId && TICKET_TIERS[body.ticketTierId]
		? TICKET_TIERS[body.ticketTierId]
		: undefined;

	const requestedMethod = body.paymentMethod || (event.pricePaise === 0 ? 'free' : 'cashfree');

	// ── Case A: Free Event ─────────────────────────────────────────────────────
	if (event.pricePaise === 0 || requestedMethod === 'free') {
		if (event.pricePaise > 0) {
			// Malicious attempt: client tried to claim 'free' on a paid event
			return json({ error: 'Payment is required for this event' }, { status: 400 });
		}

		const regId = existing ? existing.id : createId();

		if (existing) {
			await db
				.update(eventRegistrations)
				.set({
					status: 'confirmed',
					paymentMethod: 'free',
					amountPaidPaise: 0,
					creditsUsed: 0,
					registeredAt: new Date()
				})
				.where(eq(eventRegistrations.id, existing.id));
		} else {
			await db.insert(eventRegistrations).values({
				id: regId,
				eventId,
				userId: currentUser.id,
				status: 'confirmed',
				paymentMethod: 'free',
				amountPaidPaise: 0,
				creditsUsed: 0,
				registeredAt: new Date()
			});
		}

		// Send email confirmation
		if (currentUser.email) {
			await emailService.sendEventRegistrationConfirmation({
				to: currentUser.email,
				userName: currentUser.name || 'Student',
				eventTitle: event.title,
				eventSlug: event.slug,
				eventDate: new Date(event.startAt).toLocaleDateString('en-IN', { dateStyle: 'full' }),
				eventTime: new Date(event.startAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }),
				venueType: (event.venueType as any) || 'online',
				venueDisplay: event.venueType === 'offline' ? 'In-person / Venue' : 'Online Session',
				paymentMethod: 'free',
				whatsappGroupUrl: event.whatsappGroupUrl || undefined,
				registrationId: regId
			});
		}

		return json({
			success: true,
			status: 'confirmed',
			registrationId: regId,
			event: {
				id: event.id,
				title: event.title,
				slug: event.slug
			}
		});
	}

	// ── Case B: Paid via Credits ───────────────────────────────────────────────
	if (requestedMethod === 'credit') {
		try {
			const result = await CreditService.spendCreditsForEvent(currentUser.id, eventId);

			if (currentUser.email) {
				await emailService.sendEventRegistrationConfirmation({
					to: currentUser.email,
					userName: currentUser.name || 'Student',
					eventTitle: event.title,
					eventSlug: event.slug,
					eventDate: new Date(event.startAt).toLocaleDateString('en-IN', { dateStyle: 'full' }),
					eventTime: new Date(event.startAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }),
					venueType: (event.venueType as any) || 'online',
					venueDisplay: event.venueType === 'offline' ? 'In-person / Venue' : 'Online Session',
					paymentMethod: 'credit',
					creditsUsed: result.creditsSpent,
					whatsappGroupUrl: event.whatsappGroupUrl || undefined,
					registrationId: result.registrationId
				});
			}

			return json({
				success: true,
				status: 'confirmed',
				paymentMethod: 'credit',
				registrationId: result.registrationId,
				creditsSpent: result.creditsSpent,
				remainingCredits: result.remainingBalance
			});
		} catch (e: any) {
			return json(
				{
					error: e.message || 'Failed to register with credits'
				},
				{ status: 422 }
			);
		}
	}

	// ── Case C: Paid via Cashfree Gateway ──────────────────────────────────────
	try {
		const customerDetails = {
			name: currentUser.name || body.name?.trim() || 'Student',
			email: currentUser.email || body.email?.trim() || 'student@progeta.in',
			phone: profile?.phone || body.phone?.trim() || '9999999999'
		};

		const orderResult = await OrderService.createEventOrder(
			eventId,
			currentUser.id,
			customerDetails,
			url.origin,
			selectedTier
		);

		return json({
			success: true,
			requiresPayment: true,
			paymentSessionId: orderResult.paymentSessionId,
			cashfreeOrderId: orderResult.cashfreeOrderId,
			isMockMode: orderResult.isMockMode
		});
	} catch (e: any) {
		return json(
			{
				error: e.message || 'Failed to initialize payment gateway'
			},
			{ status: 500 }
		);
	}
};

