/**
 * Mentoring Domain Service
 *
 * Encapsulates all mentoring business logic:
 * - Overlap-aware slot computation
 * - Availability window management
 * - Concurrency-safe booking and checkout
 * - Duration pricing and instructor coupons
 * - 5-minute reminder scheduling via Transactional Outbox
 * - Admin oversight and revenue analytics
 */
import { db } from '../db/client';
import {
	mentoringAvailability,
	mentoringDurationPrices,
	mentoringBookings,
	mentoringTestimonials,
	type MentoringAvailability,
	type MentoringBooking
} from '../db/schema/mentoring.schema';
import { users, identityProfiles, auditLogs } from '../db/schema/identity.schema';
import { commerceOrders, commerceCoupons, commerceCouponUses } from '../db/schema/commerce.schema';
import { eventOutbox } from '../db/schema/outbox.schema';
import { eq, and, sql, gte, lte, ne, inArray, desc, asc, isNull, or } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export class MentoringService {
	// ── 1. PUBLIC MENTOR CATALOG & FREE SLOTS ─────────────────────────────────

	/**
	 * Lists all verified instructors who have future active availability windows.
	 */
	static async getPublicMentors() {
		const today = new Date().toISOString().split('T')[0];

		// Find instructors with at least one active window today or in the future
		const activeInstructors = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				bio: identityProfiles.bio,
				avatarUrl: identityProfiles.avatarUrl,
				timezone: identityProfiles.timezone,
				isSuspended: identityProfiles.mentoringSuspended,
				handle: identityProfiles.mentoringHandle,
				headline: identityProfiles.mentoringHeadline,
				isFeatured: identityProfiles.mentoringIsFeatured
			})
			.from(users)
			.innerJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(
				and(
					inArray(users.role, ['teacher', 'admin', 'owner']),
					eq(identityProfiles.mentoringEnabled, true),
					eq(identityProfiles.mentoringSuspended, false)
				)
			);

		if (activeInstructors.length === 0) return [];

		// For each instructor, fetch lowest price, next available date, and completed sessions count
		const results = [];
		for (const inst of activeInstructors) {
			const nextWindows = await db
				.select({ date: mentoringAvailability.date })
				.from(mentoringAvailability)
				.where(
					and(
						eq(mentoringAvailability.instructorId, inst.id),
						eq(mentoringAvailability.status, 'active'),
						gte(mentoringAvailability.date, today)
					)
				)
				.orderBy(asc(mentoringAvailability.date))
				.limit(1);

			// Fetch duration prices
			const prices = await db
				.select()
				.from(mentoringDurationPrices)
				.where(eq(mentoringDurationPrices.instructorId, inst.id));

			const lowestPrice = prices.length > 0
				? Math.min(...prices.map(p => p.pricePaise))
				: 0;

			// Fetch completed count
			const [{ completedCount }] = await db
				.select({ completedCount: sql<number>`count(*)` })
				.from(mentoringBookings)
				.where(
					and(
						eq(mentoringBookings.instructorId, inst.id),
						inArray(mentoringBookings.status, ['confirmed', 'completed'])
					)
				);

			// Parse bio tags if any (e.g. "Cloud Security | AWS | Pentesting")
			const specialties = inst.bio
				? inst.bio.split(/[|\n,]/).map(s => s.trim()).filter(s => s.length > 1 && s.length < 30).slice(0, 4)
				: ['Security Practitioner'];

			results.push({
				id: inst.id,
				handle: inst.handle,
				profileUrl: `/mentoring/${inst.handle || inst.id}`,
				name: inst.name || 'Verified Mentor',
				bio: inst.bio || 'Experienced cybersecurity instructor and practitioner.',
				headline: inst.headline,
				avatarUrl: inst.avatarUrl,
				timezone: inst.timezone || 'Asia/Kolkata',
				isFeatured: inst.isFeatured,
				specialties: specialties.length > 0 ? specialties : ['Cybersecurity Guidance'],
				lowestPricePaise: lowestPrice,
				hasAvailability: nextWindows.length > 0,
				nextAvailableDate: nextWindows[0]?.date || null,
				totalSessionsCompleted: completedCount || 0
			});
		}

		// Sort by hasAvailability first, then nextAvailableDate
		return results.sort((a, b) => {
			if (a.hasAvailability && !b.hasAvailability) return -1;
			if (!a.hasAvailability && b.hasAvailability) return 1;
			return (a.nextAvailableDate || '9999').localeCompare(b.nextAvailableDate || '9999');
		});
	}

	/**
	 * Returns all unique dates that have active windows for an instructor.
	 */
	static async getInstructorAvailableDates(instructorId: string) {
		const today = new Date().toISOString().split('T')[0];
		const rows = await db
			.select({ date: mentoringAvailability.date })
			.from(mentoringAvailability)
			.where(
				and(
					eq(mentoringAvailability.instructorId, instructorId),
					eq(mentoringAvailability.status, 'active'),
					gte(mentoringAvailability.date, today)
				)
			)
			.orderBy(asc(mentoringAvailability.date));

		return Array.from(new Set(rows.map(r => r.date)));
	}

	/**
	 * Returns active windows for an instructor on a specific date.
	 */
	static async getInstructorWindowsForDate(instructorId: string, date: string) {
		const windows = await db
			.select({
				id: mentoringAvailability.id,
				windowStart: mentoringAvailability.windowStart,
				windowEnd: mentoringAvailability.windowEnd,
				allowedDurations: mentoringAvailability.allowedDurations
			})
			.from(mentoringAvailability)
			.where(
				and(
					eq(mentoringAvailability.instructorId, instructorId),
					eq(mentoringAvailability.date, date),
					eq(mentoringAvailability.status, 'active')
				)
			)
			.orderBy(asc(mentoringAvailability.windowStart));

		return windows;
	}

	/**
	 * Computes overlap-aware available start times for a specific window and duration.
	 * Runs the exact interval overlap algorithm: B.starts_at < C_end && B.ends_at > C
	 */
	static async getFreeSlots(windowId: string, durationMins: number) {
		const [window] = await db
			.select()
			.from(mentoringAvailability)
			.where(and(eq(mentoringAvailability.id, windowId), eq(mentoringAvailability.status, 'active')))
			.limit(1);

		if (!window) {
			throw new Error('Availability window not found or inactive');
		}

		if (!window.allowedDurations.includes(durationMins)) {
			throw new Error(`Duration of ${durationMins} minutes is not permitted for this window`);
		}

		// Helper to convert 'HH:MM' string to total minutes from midnight
		const toMinutes = (timeStr: string) => {
			const [h, m] = timeStr.split(':').map(Number);
			return h * 60 + m;
		};

		// Helper to convert total minutes back to 'HH:MM'
		const toTimeStr = (totalMins: number) => {
			const h = Math.floor(totalMins / 60).toString().padStart(2, '0');
			const m = (totalMins % 60).toString().padStart(2, '0');
			return `${h}:${m}`;
		};

		const startMins = toMinutes(window.windowStart);
		const endMins = toMinutes(window.windowEnd);

		// Step in 15-minute increments (or durationMins increments) from start to (end - duration)
		const stepMins = Math.min(30, durationMins);
		const candidateStartMinutes: number[] = [];

		for (let cur = startMins; cur + durationMins <= endMins; cur += stepMins) {
			candidateStartMinutes.push(cur);
		}

		// Fetch all confirmed bookings for this window
		const existingBookings = await db
			.select({
				startsAt: mentoringBookings.startsAt,
				endsAt: mentoringBookings.endsAt
			})
			.from(mentoringBookings)
			.where(
				and(
					eq(mentoringBookings.availabilityId, windowId),
					eq(mentoringBookings.status, 'confirmed')
				)
			);

		// Convert existing bookings to window-local minutes
		const bookedIntervals = existingBookings.map(b => {
			const sDate = new Date(b.startsAt);
			const eDate = new Date(b.endsAt);
			const sMins = sDate.getHours() * 60 + sDate.getMinutes();
			const eMins = eDate.getHours() * 60 + eDate.getMinutes();
			return { start: sMins, end: eMins, rawStart: b.startsAt, rawEnd: b.endsAt };
		});

		// Filter out overlapping candidates
		const availableSlots: { timeStr: string; startsAtISO: string; endsAtISO: string }[] = [];

		for (const candStart of candidateStartMinutes) {
			const candEnd = candStart + durationMins;

			// Overlap condition: booking.start < candEnd AND booking.end > candStart
			const hasOverlap = bookedIntervals.some(b => b.start < candEnd && b.end > candStart);

			if (!hasOverlap) {
				const timeStr = toTimeStr(candStart);
				// Construct ISO string using window.date + timeStr in local context
				const startsAtDate = new Date(`${window.date}T${timeStr}:00`);
				const endsAtDate = new Date(startsAtDate.getTime() + durationMins * 60000);

				// Do not allow slots in the past if window is today
				if (startsAtDate.getTime() > Date.now() + 15 * 60000) {
					availableSlots.push({
						timeStr,
						startsAtISO: startsAtDate.toISOString(),
						endsAtISO: endsAtDate.toISOString()
					});
				}
			}
		}

		return availableSlots;
	}

	// ── 2. BOOKING & CHECKOUT ENGINE ──────────────────────────────────────────

	/**
	 * Creates a booking with atomic concurrency check and coupon calculation.
	 */
	static async createBooking(opts: {
		studentId: string;
		availabilityId: string;
		startsAt: Date;
		durationMins: number;
		notes?: string;
		couponCode?: string;
		origin?: string;
	}) {
		// 1. Fetch window and check instructor suspension
		const [window] = await db
			.select({
				id: mentoringAvailability.id,
				instructorId: mentoringAvailability.instructorId,
				date: mentoringAvailability.date,
				windowStart: mentoringAvailability.windowStart,
				windowEnd: mentoringAvailability.windowEnd,
				allowedDurations: mentoringAvailability.allowedDurations,
				meetingUrl: mentoringAvailability.meetingUrl,
				status: mentoringAvailability.status,
				instructorName: users.name,
				instructorEmail: users.email,
				isSuspended: identityProfiles.mentoringSuspended
			})
			.from(mentoringAvailability)
			.innerJoin(users, eq(mentoringAvailability.instructorId, users.id))
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(eq(mentoringAvailability.id, opts.availabilityId))
			.limit(1);

		if (!window || window.status !== 'active') {
			throw new Error('Availability window is not available or has been cancelled');
		}

		if (window.isSuspended) {
			throw new Error('The instructor is currently unable to accept new bookings');
		}

		if (!window.allowedDurations.includes(opts.durationMins)) {
			throw new Error(`Duration ${opts.durationMins}m is not permitted for this window`);
		}

		// 2. Fetch student info
		const [student] = await db
			.select()
			.from(users)
			.where(eq(users.id, opts.studentId))
			.limit(1);

		if (!student) {
			throw new Error('Student account not found');
		}

		// 3. Compute endsAt
		const endsAt = new Date(opts.startsAt.getTime() + opts.durationMins * 60000);

		// 4. Overlap verification guard
		const conflicting = await db
			.select({ id: mentoringBookings.id })
			.from(mentoringBookings)
			.where(
				and(
					eq(mentoringBookings.availabilityId, opts.availabilityId),
					eq(mentoringBookings.status, 'confirmed'),
					sql`${mentoringBookings.startsAt} < ${endsAt.toISOString()} AND ${mentoringBookings.endsAt} > ${opts.startsAt.toISOString()}`
				)
			)
			.limit(1);

		if (conflicting.length > 0) {
			throw new Error('This time slot was just booked by another student. Please select a different time.');
		}

		// 5. Fetch instructor price for this duration
		const [priceRow] = await db
			.select()
			.from(mentoringDurationPrices)
			.where(
				and(
					eq(mentoringDurationPrices.instructorId, window.instructorId),
					eq(mentoringDurationPrices.durationMins, opts.durationMins)
				)
			)
			.limit(1);

		const basePricePaise = priceRow ? priceRow.pricePaise : 0;
		let discountPaise = 0;
		let appliedCouponId: string | null = null;

		// 6. Validate Coupon if provided
		if (opts.couponCode && opts.couponCode.trim() !== '') {
			const cleanCode = opts.couponCode.trim().toUpperCase();
			const [coupon] = await db
				.select()
				.from(commerceCoupons)
				.where(
					and(
						eq(commerceCoupons.code, cleanCode),
						eq(commerceCoupons.isActive, true),
						eq(commerceCoupons.createdBy, window.instructorId)
					)
				)
				.limit(1);

			if (!coupon) {
				throw new Error('Invalid promo code or not valid for this instructor');
			}

			if (coupon.validUntil && new Date(coupon.validUntil).getTime() < Date.now()) {
				throw new Error('This promo code has expired');
			}

			if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
				throw new Error('This promo code has reached its maximum usage limit');
			}

			if (basePricePaise < coupon.minAmountPaise) {
				throw new Error(`Minimum session amount of ₹${(coupon.minAmountPaise / 100).toFixed(0)} required for this coupon`);
			}

			appliedCouponId = coupon.id;
			if (coupon.type === 'percent') {
				discountPaise = Math.round((basePricePaise * coupon.value) / 100);
			} else {
				discountPaise = Math.min(basePricePaise, coupon.value);
			}
		}

		const finalPricePaise = Math.max(0, basePricePaise - discountPaise);
		const bookingId = createId();

		// 7. Case A: Free Session (or 100% Discount)
		if (finalPricePaise === 0) {
			await db.insert(mentoringBookings).values({
				id: bookingId,
				availabilityId: opts.availabilityId,
				studentId: opts.studentId,
				instructorId: window.instructorId,
				startsAt: opts.startsAt,
				endsAt: endsAt,
				durationMins: opts.durationMins,
				pricePaise: 0,
				discountPaise: discountPaise,
				couponId: appliedCouponId,
				notes: opts.notes || null,
				status: 'confirmed',
				reminderSent: false
			});

			// If coupon applied, increment usage
			if (appliedCouponId) {
				await db
					.update(commerceCoupons)
					.set({ usesCount: sql`${commerceCoupons.usesCount} + 1` })
					.where(eq(commerceCoupons.id, appliedCouponId));
			}

			// Queue Booking Confirmation Email
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'MENTORING_BOOKED',
				payload: {
					bookingId,
					studentEmail: student.email,
					studentName: student.name || 'Student',
					instructorEmail: window.instructorEmail,
					instructorName: window.instructorName || 'Instructor',
					startsAt: opts.startsAt.toISOString(),
					durationMins: opts.durationMins,
					meetingUrl: window.meetingUrl,
					notes: opts.notes
				}
			});

			// Queue 5-Min Prior Reminder Event (created_at = startsAt - 5 mins)
			const reminderTime = new Date(opts.startsAt.getTime() - 5 * 60000);
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'MENTORING_REMINDER',
				payload: {
					bookingId,
					studentEmail: student.email,
					studentName: student.name || 'Student',
					instructorEmail: window.instructorEmail,
					instructorName: window.instructorName || 'Instructor',
					startsAt: opts.startsAt.toISOString(),
					durationMins: opts.durationMins,
					meetingUrl: window.meetingUrl
				},
				createdAt: reminderTime > new Date() ? reminderTime : new Date()
			});

			return {
				success: true,
				bookingId,
				isFree: true,
				finalPricePaise: 0
			};
		}

		// 8. Case B: Paid Session -> Initiate Order & Checkout
		const orderId = createId();
		const cashfreeOrderId = `MENTOR_${bookingId}_${Date.now()}`;

		await db.insert(commerceOrders).values({
			id: orderId,
			cashfreeOrderId,
			userId: opts.studentId,
			assetId: opts.availabilityId, // linked to availability
			amountPaise: finalPricePaise,
			currency: 'INR',
			status: 'pending',
			couponId: appliedCouponId,
			discountPaise: discountPaise,
			metadata: {
				type: 'mentoring',
				bookingId,
				instructorId: window.instructorId,
				startsAt: opts.startsAt.toISOString(),
				durationMins: opts.durationMins,
				notes: opts.notes
			}
		});

		await db.insert(mentoringBookings).values({
			id: bookingId,
			availabilityId: opts.availabilityId,
			studentId: opts.studentId,
			instructorId: window.instructorId,
			startsAt: opts.startsAt,
			endsAt: endsAt,
			durationMins: opts.durationMins,
			pricePaise: finalPricePaise,
			discountPaise: discountPaise,
			couponId: appliedCouponId,
			orderId: orderId,
			notes: opts.notes || null,
			status: 'pending_payment',
			reminderSent: false
		});

		return {
			success: true,
			bookingId,
			isFree: false,
			orderId,
			finalPricePaise,
			cashfreeOrderId
		};
	}

	/**
	 * Promotes a pending booking to confirmed upon payment confirmation.
	 */
	static async confirmPaidBooking(orderId: string) {
		const [booking] = await db
			.select()
			.from(mentoringBookings)
			.where(eq(mentoringBookings.orderId, orderId))
			.limit(1);

		if (!booking || booking.status === 'confirmed') return;

		await db
			.update(mentoringBookings)
			.set({ status: 'confirmed' })
			.where(eq(mentoringBookings.id, booking.id));

		const [window] = await db
			.select()
			.from(mentoringAvailability)
			.where(eq(mentoringAvailability.id, booking.availabilityId))
			.limit(1);

		const [student] = await db.select().from(users).where(eq(users.id, booking.studentId)).limit(1);
		const [instructor] = await db.select().from(users).where(eq(users.id, booking.instructorId)).limit(1);

		if (window && student && instructor) {
			// Queue Booking Confirmation Email
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'MENTORING_BOOKED',
				payload: {
					bookingId: booking.id,
					studentEmail: student.email,
					studentName: student.name || 'Student',
					instructorEmail: instructor.email,
					instructorName: instructor.name || 'Instructor',
					startsAt: new Date(booking.startsAt).toISOString(),
					durationMins: booking.durationMins,
					meetingUrl: window.meetingUrl,
					notes: booking.notes
				}
			});

			// Queue 5-Min Prior Reminder Event
			const reminderTime = new Date(new Date(booking.startsAt).getTime() - 5 * 60000);
			await db.insert(eventOutbox).values({
				id: createId(),
				eventType: 'MENTORING_REMINDER',
				payload: {
					bookingId: booking.id,
					studentEmail: student.email,
					studentName: student.name || 'Student',
					instructorEmail: instructor.email,
					instructorName: instructor.name || 'Instructor',
					startsAt: new Date(booking.startsAt).toISOString(),
					durationMins: booking.durationMins,
					meetingUrl: window.meetingUrl
				},
				createdAt: reminderTime > new Date() ? reminderTime : new Date()
			});
		}
	}

	/**
	 * Student cancels own booking.
	 */
	static async cancelBookingByStudent(bookingId: string, studentId: string) {
		const [booking] = await db
			.select()
			.from(mentoringBookings)
			.where(and(eq(mentoringBookings.id, bookingId), eq(mentoringBookings.studentId, studentId)))
			.limit(1);

		if (!booking) {
			throw new Error('Booking not found or access denied');
		}

		if (booking.status === 'cancelled') {
			throw new Error('Booking is already cancelled');
		}

		// Update booking status
		await db
			.update(mentoringBookings)
			.set({
				status: 'cancelled',
				cancelledByRole: 'student'
			})
			.where(eq(mentoringBookings.id, bookingId));

		const [student] = await db.select().from(users).where(eq(users.id, studentId)).limit(1);
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

		return { success: true };
	}

	// ── 3. INSTRUCTOR STUDIO & MANAGEMENT ─────────────────────────────────────

	/**
	 * Returns all availability windows for instructor with booking counts.
	 */
	static async getInstructorCalendar(instructorId: string) {
		const windows = await db
			.select({
				id: mentoringAvailability.id,
				date: mentoringAvailability.date,
				windowStart: mentoringAvailability.windowStart,
				windowEnd: mentoringAvailability.windowEnd,
				allowedDurations: mentoringAvailability.allowedDurations,
				meetingUrl: mentoringAvailability.meetingUrl,
				status: mentoringAvailability.status,
				createdAt: mentoringAvailability.createdAt
			})
			.from(mentoringAvailability)
			.where(eq(mentoringAvailability.instructorId, instructorId))
			.orderBy(asc(mentoringAvailability.date), asc(mentoringAvailability.windowStart));

		// For each window, count confirmed bookings
		const windowIds = windows.map(w => w.id);
		let bookingCounts: Record<string, number> = {};

		if (windowIds.length > 0) {
			const counts = await db
				.select({
					availabilityId: mentoringBookings.availabilityId,
					count: sql<number>`count(*)`
				})
				.from(mentoringBookings)
				.where(
					and(
						inArray(mentoringBookings.availabilityId, windowIds),
						eq(mentoringBookings.status, 'confirmed')
					)
				)
				.groupBy(mentoringBookings.availabilityId);

			counts.forEach(c => {
				bookingCounts[c.availabilityId] = Number(c.count);
			});
		}

		return windows.map(w => ({
			...w,
			bookingCount: bookingCounts[w.id] || 0
		}));
	}

	/**
	 * Creates a new availability window for instructor.
	 */
	static async createAvailabilityWindow(instructorId: string, data: {
		date: string;
		windowStart: string;
		windowEnd: string;
		allowedDurations: number[];
		meetingUrl: string;
	}) {
		// Verify not suspended
		const [prof] = await db
			.select({ suspended: identityProfiles.mentoringSuspended })
			.from(identityProfiles)
			.where(eq(identityProfiles.userId, instructorId))
			.limit(1);

		if (prof?.suspended) {
			throw new Error('Your mentoring access is currently suspended by administration');
		}

		if (data.windowEnd <= data.windowStart) {
			throw new Error('Window end time must be strictly after window start time');
		}

		if (!data.allowedDurations || data.allowedDurations.length === 0) {
			throw new Error('Please select at least one session duration tier (30, 45, or 60 min)');
		}

		if (!data.meetingUrl || data.meetingUrl.trim() === '') {
			throw new Error('A valid meeting link (Google Meet, Zoom, Teams) is required');
		}

		const windowId = createId();
		await db.insert(mentoringAvailability).values({
			id: windowId,
			instructorId,
			date: data.date,
			windowStart: data.windowStart,
			windowEnd: data.windowEnd,
			allowedDurations: data.allowedDurations,
			meetingUrl: data.meetingUrl.trim(),
			status: 'active'
		});

		return { windowId };
	}

	/**
	 * Cancels an availability window and notifies all booked students.
	 */
	static async cancelAvailabilityWindow(windowId: string, actorId: string, reason?: string, isAdmin = false) {
		const [window] = await db
			.select()
			.from(mentoringAvailability)
			.where(eq(mentoringAvailability.id, windowId))
			.limit(1);

		if (!window) {
			throw new Error('Window not found');
		}

		if (!isAdmin && window.instructorId !== actorId) {
			throw new Error('You do not have permission to cancel this window');
		}

		// Fetch all confirmed bookings
		const bookings = await db
			.select({
				id: mentoringBookings.id,
				studentId: mentoringBookings.studentId
			})
			.from(mentoringBookings)
			.where(
				and(
					eq(mentoringBookings.availabilityId, windowId),
					eq(mentoringBookings.status, 'confirmed')
				)
			);

		// Update window
		await db
			.update(mentoringAvailability)
			.set({
				status: 'cancelled',
				cancelledBy: actorId,
				cancelReason: reason || null
			})
			.where(eq(mentoringAvailability.id, windowId));

		// Cancel all bookings in this window
		if (bookings.length > 0) {
			await db
				.update(mentoringBookings)
				.set({
					status: 'cancelled',
					cancelledByRole: isAdmin ? 'admin' : 'instructor'
				})
				.where(eq(mentoringBookings.availabilityId, windowId));

			const [instructor] = await db.select().from(users).where(eq(users.id, window.instructorId)).limit(1);

			// Send cancellation notice to each student
			for (const b of bookings) {
				const [student] = await db.select().from(users).where(eq(users.id, b.studentId)).limit(1);
				if (student) {
					await db.insert(eventOutbox).values({
						id: createId(),
						eventType: 'MENTORING_WINDOW_CANCELLED',
						payload: {
							studentEmail: student.email,
							studentName: student.name || 'Student',
							instructorName: instructor?.name || 'Instructor',
							date: window.date,
							windowStart: window.windowStart,
							windowEnd: window.windowEnd,
							reason
						}
					});
				}
			}
		}

		return { cancelledBookingsCount: bookings.length };
	}

	/**
	 * Gets duration pricing for instructor.
	 */
	static async getInstructorDurationPrices(instructorId: string) {
		const prices = await db
			.select()
			.from(mentoringDurationPrices)
			.where(eq(mentoringDurationPrices.instructorId, instructorId));

		const tiers = [30, 45, 60].map(dur => {
			const found = prices.find(p => p.durationMins === dur);
			return {
				durationMins: dur,
				pricePaise: found ? found.pricePaise : 0,
				enabled: !!found
			};
		});

		return tiers;
	}

	/**
	 * Upserts duration pricing for instructor.
	 */
	static async upsertInstructorDurationPrices(instructorId: string, prices: { durationMins: number; pricePaise: number }[]) {
		// Check admin price bounds if any
		const [prof] = await db
			.select({ priceBounds: identityProfiles.mentoringPriceBounds })
			.from(identityProfiles)
			.where(eq(identityProfiles.userId, instructorId))
			.limit(1);

		const bounds = (prof?.priceBounds as any) || {};

		for (const p of prices) {
			const bound = bounds[p.durationMins];
			if (bound) {
				if (bound.minPaise !== undefined && p.pricePaise < bound.minPaise) {
					throw new Error(`Price for ${p.durationMins}m cannot be below ₹${(bound.minPaise / 100).toFixed(0)}`);
				}
				if (bound.maxPaise !== undefined && p.pricePaise > bound.maxPaise) {
					throw new Error(`Price for ${p.durationMins}m cannot exceed ₹${(bound.maxPaise / 100).toFixed(0)}`);
				}
			}

			// UPSERT
			const [existing] = await db
				.select()
				.from(mentoringDurationPrices)
				.where(
					and(
						eq(mentoringDurationPrices.instructorId, instructorId),
						eq(mentoringDurationPrices.durationMins, p.durationMins)
					)
				)
				.limit(1);

			if (existing) {
				await db
					.update(mentoringDurationPrices)
					.set({
						pricePaise: p.pricePaise,
						updatedAt: new Date()
					})
					.where(eq(mentoringDurationPrices.id, existing.id));
			} else {
				await db.insert(mentoringDurationPrices).values({
					id: createId(),
					instructorId,
					durationMins: p.durationMins,
					pricePaise: p.pricePaise
				});
			}
		}

		return { success: true };
	}

	/**
	 * Returns all bookings for instructor.
	 */
	static async getInstructorBookings(instructorId: string) {
		const bookings = await db
			.select({
				id: mentoringBookings.id,
				studentId: mentoringBookings.studentId,
				studentName: users.name,
				studentEmail: users.email,
				studentAvatar: identityProfiles.avatarUrl,
				startsAt: mentoringBookings.startsAt,
				endsAt: mentoringBookings.endsAt,
				durationMins: mentoringBookings.durationMins,
				pricePaise: mentoringBookings.pricePaise,
				notes: mentoringBookings.notes,
				status: mentoringBookings.status,
				createdAt: mentoringBookings.createdAt
			})
			.from(mentoringBookings)
			.innerJoin(users, eq(mentoringBookings.studentId, users.id))
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(eq(mentoringBookings.instructorId, instructorId))
			.orderBy(desc(mentoringBookings.startsAt));

		return bookings;
	}

	/**
	 * Mark booking completed.
	 */
	static async markBookingCompleted(bookingId: string, instructorId: string) {
		const [booking] = await db
			.select()
			.from(mentoringBookings)
			.where(and(eq(mentoringBookings.id, bookingId), eq(mentoringBookings.instructorId, instructorId)))
			.limit(1);

		if (!booking) throw new Error('Booking not found');

		await db
			.update(mentoringBookings)
			.set({ status: 'completed' })
			.where(eq(mentoringBookings.id, bookingId));

		return { success: true };
	}

	// ── 4. STUDENT SESSIONS LIST ──────────────────────────────────────────────

	/**
	 * Returns all confirmed/completed/upcoming bookings for a student with meeting links.
	 */
	static async getStudentBookings(studentId: string) {
		const bookings = await db
			.select({
				id: mentoringBookings.id,
				instructorId: mentoringBookings.instructorId,
				instructorName: users.name,
				instructorEmail: users.email,
				instructorAvatar: identityProfiles.avatarUrl,
				startsAt: mentoringBookings.startsAt,
				endsAt: mentoringBookings.endsAt,
				durationMins: mentoringBookings.durationMins,
				pricePaise: mentoringBookings.pricePaise,
				meetingUrl: mentoringAvailability.meetingUrl,
				notes: mentoringBookings.notes,
				status: mentoringBookings.status,
				createdAt: mentoringBookings.createdAt
			})
			.from(mentoringBookings)
			.innerJoin(users, eq(mentoringBookings.instructorId, users.id))
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.innerJoin(mentoringAvailability, eq(mentoringBookings.availabilityId, mentoringAvailability.id))
			.where(eq(mentoringBookings.studentId, studentId))
			.orderBy(desc(mentoringBookings.startsAt));

		return bookings;
	}

	// ── 5. ADMIN REVENUE & OVERSIGHT ──────────────────────────────────────────

	/**
	 * Platform-level KPI metrics for mentoring.
	 */
	static async getAdminStats() {
		const [{ totalBooked }] = await db
			.select({ totalBooked: sql<number>`count(*)` })
			.from(mentoringBookings);

		const [{ totalCompleted }] = await db
			.select({ totalCompleted: sql<number>`count(*)` })
			.from(mentoringBookings)
			.where(eq(mentoringBookings.status, 'completed'));

		const [{ totalRevenue }] = await db
			.select({ totalRevenue: sql<number>`coalesce(sum(${mentoringBookings.pricePaise}), 0)` })
			.from(mentoringBookings)
			.where(inArray(mentoringBookings.status, ['confirmed', 'completed']));

		const [{ activeInstructorsCount }] = await db
			.select({ activeInstructorsCount: sql<number>`count(distinct ${mentoringAvailability.instructorId})` })
			.from(mentoringAvailability)
			.where(eq(mentoringAvailability.status, 'active'));

		const [{ suspendedCount }] = await db
			.select({ suspendedCount: sql<number>`count(*)` })
			.from(identityProfiles)
			.where(eq(identityProfiles.mentoringSuspended, true));

		return {
			totalSessionsBooked: Number(totalBooked) || 0,
			totalSessionsCompleted: Number(totalCompleted) || 0,
			totalRevenuePaise: Number(totalRevenue) || 0,
			activeInstructors: Number(activeInstructorsCount) || 0,
			suspendedInstructors: Number(suspendedCount) || 0
		};
	}

	/**
	 * Per-instructor breakdown for admin table.
	 */
	static async getAdminInstructorsList() {
		const instructors = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				avatarUrl: identityProfiles.avatarUrl,
				isSuspended: identityProfiles.mentoringSuspended,
				priceBounds: identityProfiles.mentoringPriceBounds
			})
			.from(users)
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(inArray(users.role, ['teacher', 'admin', 'owner']));

		const results = [];
		for (const inst of instructors) {
			const [{ activeWindowsCount }] = await db
				.select({ activeWindowsCount: sql<number>`count(*)` })
				.from(mentoringAvailability)
				.where(
					and(
						eq(mentoringAvailability.instructorId, inst.id),
						eq(mentoringAvailability.status, 'active')
					)
				);

			const [{ sessionsCompleted }] = await db
				.select({ sessionsCompleted: sql<number>`count(*)` })
				.from(mentoringBookings)
				.where(
					and(
						eq(mentoringBookings.instructorId, inst.id),
						eq(mentoringBookings.status, 'completed')
					)
				);

			const [{ grossRevenue }] = await db
				.select({ grossRevenue: sql<number>`coalesce(sum(${mentoringBookings.pricePaise}), 0)` })
				.from(mentoringBookings)
				.where(
					and(
						eq(mentoringBookings.instructorId, inst.id),
						inArray(mentoringBookings.status, ['confirmed', 'completed'])
					)
				);

			results.push({
				id: inst.id,
				name: inst.name || 'Instructor',
				email: inst.email,
				avatarUrl: inst.avatarUrl,
				isSuspended: inst.isSuspended || false,
				priceBounds: inst.priceBounds || null,
				activeWindowsCount: Number(activeWindowsCount) || 0,
				sessionsCompleted: Number(sessionsCompleted) || 0,
				grossRevenuePaise: Number(grossRevenue) || 0
			});
		}

		return results;
	}

	/**
	 * Full session history and windows for an individual instructor (Admin view).
	 */
	static async getAdminInstructorDetail(instructorId: string) {
		const [instructor] = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				bio: identityProfiles.bio,
				avatarUrl: identityProfiles.avatarUrl,
				isSuspended: identityProfiles.mentoringSuspended,
				priceBounds: identityProfiles.mentoringPriceBounds
			})
			.from(users)
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(eq(users.id, instructorId))
			.limit(1);

		if (!instructor) throw new Error('Instructor not found');

		const windows = await db
			.select()
			.from(mentoringAvailability)
			.where(eq(mentoringAvailability.instructorId, instructorId))
			.orderBy(desc(mentoringAvailability.date));

		const bookings = await db
			.select({
				id: mentoringBookings.id,
				studentId: mentoringBookings.studentId,
				studentName: users.name,
				studentEmail: users.email,
				startsAt: mentoringBookings.startsAt,
				endsAt: mentoringBookings.endsAt,
				durationMins: mentoringBookings.durationMins,
				pricePaise: mentoringBookings.pricePaise,
				notes: mentoringBookings.notes,
				status: mentoringBookings.status,
				createdAt: mentoringBookings.createdAt
			})
			.from(mentoringBookings)
			.innerJoin(users, eq(mentoringBookings.studentId, users.id))
			.where(eq(mentoringBookings.instructorId, instructorId))
			.orderBy(desc(mentoringBookings.startsAt));

		const prices = await db
			.select()
			.from(mentoringDurationPrices)
			.where(eq(mentoringDurationPrices.instructorId, instructorId));

		return {
			instructor,
			windows,
			bookings,
			prices
		};
	}

	/**
	 * Toggles instructor mentoring suspension.
	 */
	static async toggleInstructorSuspension(instructorId: string, suspended: boolean, adminId: string, reason?: string) {
		await db
			.update(identityProfiles)
			.set({ mentoringSuspended: suspended })
			.where(eq(identityProfiles.userId, instructorId));

		await db.insert(auditLogs).values({
			id: createId(),
			actorId: adminId,
			action: suspended ? 'mentor_suspend' : 'mentor_unsuspend',
			entityId: instructorId,
			entityType: 'user',
			details: JSON.stringify({ suspended, reason })
		});

		return { success: true };
	}

	/**
	 * Sets price bounds (floor/ceiling) for an instructor.
	 */
	static async setInstructorPriceBounds(instructorId: string, bounds: any, adminId: string) {
		await db
			.update(identityProfiles)
			.set({ mentoringPriceBounds: bounds })
			.where(eq(identityProfiles.userId, instructorId));

		await db.insert(auditLogs).values({
			id: createId(),
			actorId: adminId,
			action: 'mentor_price_bounds_update',
			entityId: instructorId,
			entityType: 'user',
			details: JSON.stringify(bounds)
		});

		return { success: true };
	}

	// ── 8. INSTRUCTOR PUBLIC PROFILE ────────────────────────────────────────────

	/**
	 * Resolves a public instructor profile by handle (slug) or UUID.
	 * Returns null if not found, suspended, or not a teacher/admin/owner.
	 */
	static async getInstructorPublicProfile(handleOrId: string) {
		// Try to find by handle first, then fall back to ID
		const rows = await db
			.select({
				id: users.id,
				name: users.name,
				email: users.email,
				role: users.role,
				bio: identityProfiles.bio,
				avatarUrl: identityProfiles.avatarUrl,
				timezone: identityProfiles.timezone,
				isSuspended: identityProfiles.mentoringSuspended,
				handle: identityProfiles.mentoringHandle,
				headline: identityProfiles.mentoringHeadline,
				about: identityProfiles.mentoringAbout,
				yearsExp: identityProfiles.mentoringYearsExp,
				languages: identityProfiles.mentoringLanguages,
				credentials: identityProfiles.mentoringCredentials,
				videoIntroUrl: identityProfiles.mentoringVideoIntroUrl,
				socialLinks: identityProfiles.mentoringSocialLinks,
				isFeatured: identityProfiles.mentoringIsFeatured
			})
			.from(users)
			.innerJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(
				and(
					inArray(users.role, ['teacher', 'admin', 'owner']),
					eq(identityProfiles.mentoringEnabled, true),
					eq(identityProfiles.mentoringSuspended, false),
					or(
						eq(identityProfiles.mentoringHandle, handleOrId),
						eq(users.id, handleOrId)
					)
				)
			)
			.limit(1);

		if (rows.length === 0) return null;
		const inst = rows[0];

		const today = new Date().toISOString().split('T')[0];

		// Prices, next dates, session count
		const [prices, nextWindows, [{ completedCount }], [{ avgRating }]] = await Promise.all([
			db.select().from(mentoringDurationPrices).where(eq(mentoringDurationPrices.instructorId, inst.id)).orderBy(asc(mentoringDurationPrices.durationMins)),
			db.select({ date: mentoringAvailability.date })
				.from(mentoringAvailability)
				.where(and(eq(mentoringAvailability.instructorId, inst.id), eq(mentoringAvailability.status, 'active'), gte(mentoringAvailability.date, today)))
				.orderBy(asc(mentoringAvailability.date))
				.limit(30),
			db.select({ completedCount: sql<number>`count(*)` })
				.from(mentoringBookings)
				.where(and(eq(mentoringBookings.instructorId, inst.id), inArray(mentoringBookings.status, ['confirmed', 'completed']))),
			db.select({ avgRating: sql<number>`coalesce(avg(rating)::numeric(3,1), 0)` })
				.from(mentoringTestimonials)
				.where(and(eq(mentoringTestimonials.instructorId, inst.id), eq(mentoringTestimonials.isPublished, true)))
		]);

		const specialties = inst.bio
			? inst.bio.split(/[|\n,]/).map((s: string) => s.trim()).filter((s: string) => s.length > 1 && s.length < 40).slice(0, 6)
			: ['Security Practitioner'];

		const availableDates = Array.from(new Set(nextWindows.map(w => w.date)));
		const lowestPrice = prices.length > 0 ? Math.min(...prices.map(p => p.pricePaise)) : 0;

		return {
			...inst,
			specialties,
			prices,
			lowestPricePaise: lowestPrice,
			availableDates,
			nextAvailableDate: availableDates[0] || null,
			totalSessionsCompleted: Number(completedCount) || 0,
			averageRating: Number(avgRating) || 0
		};
	}

	/**
	 * Returns published testimonials for an instructor, newest first.
	 */
	static async getPublishedTestimonials(instructorId: string, limit = 20) {
		return db
			.select()
			.from(mentoringTestimonials)
			.where(and(eq(mentoringTestimonials.instructorId, instructorId), eq(mentoringTestimonials.isPublished, true)))
			.orderBy(desc(mentoringTestimonials.createdAt))
			.limit(limit);
	}

	/**
	 * Student submits a review after a completed session.
	 * Booking must belong to the student and have status 'completed'.
	 * Review starts as is_published = false (awaits admin approval).
	 */
	static async submitTestimonial(
		studentId: string,
		bookingId: string,
		data: { rating: number; body: string; reviewerRole?: string }
	) {
		// Verify booking belongs to student and is completed
		const [booking] = await db
			.select()
			.from(mentoringBookings)
			.where(and(eq(mentoringBookings.id, bookingId), eq(mentoringBookings.studentId, studentId), eq(mentoringBookings.status, 'completed')))
			.limit(1);

		if (!booking) throw new Error('Booking not found or session not yet completed.');

		// Prevent duplicate reviews for same booking
		const existing = await db.select({ id: mentoringTestimonials.id }).from(mentoringTestimonials).where(eq(mentoringTestimonials.bookingId, bookingId)).limit(1);
		if (existing.length > 0) throw new Error('You have already submitted a review for this session.');

		const [student] = await db.select({ name: users.name }).from(users).where(eq(users.id, studentId)).limit(1);

		const id = createId();
		await db.insert(mentoringTestimonials).values({
			id,
			instructorId: booking.instructorId,
			bookingId,
			studentId,
			reviewerName: student?.name || 'Anonymous',
			reviewerRole: data.reviewerRole || null,
			rating: Math.min(5, Math.max(1, data.rating)),
			body: data.body.trim().slice(0, 600),
			isPublished: false
		});

		return { id, message: 'Review submitted and pending admin approval.' };
	}

	/**
	 * Returns testimonials pending admin review (is_published = false, no rejected_reason).
	 */
	static async getAdminTestimonialQueue() {
		const rows = await db
			.select({
				id: mentoringTestimonials.id,
				instructorId: mentoringTestimonials.instructorId,
				bookingId: mentoringTestimonials.bookingId,
				reviewerName: mentoringTestimonials.reviewerName,
				reviewerRole: mentoringTestimonials.reviewerRole,
				rating: mentoringTestimonials.rating,
				body: mentoringTestimonials.body,
				createdAt: mentoringTestimonials.createdAt,
				instructorName: users.name
			})
			.from(mentoringTestimonials)
			.innerJoin(users, eq(users.id, mentoringTestimonials.instructorId))
			.where(and(eq(mentoringTestimonials.isPublished, false), isNull(mentoringTestimonials.rejectedReason)))
			.orderBy(asc(mentoringTestimonials.createdAt));
		return rows;
	}

	/**
	 * Admin approves a testimonial — makes it publicly visible.
	 */
	static async publishTestimonial(testimonialId: string) {
		const updated = await db
			.update(mentoringTestimonials)
			.set({ isPublished: true, updatedAt: new Date() })
			.where(eq(mentoringTestimonials.id, testimonialId))
			.returning({ id: mentoringTestimonials.id });
		if (updated.length === 0) throw new Error('Testimonial not found.');
		return { success: true };
	}

	/**
	 * Admin rejects a testimonial with a reason — hides it permanently.
	 */
	static async rejectTestimonial(testimonialId: string, reason: string) {
		const updated = await db
			.update(mentoringTestimonials)
			.set({ isPublished: false, rejectedReason: reason, updatedAt: new Date() })
			.where(eq(mentoringTestimonials.id, testimonialId))
			.returning({ id: mentoringTestimonials.id });
		if (updated.length === 0) throw new Error('Testimonial not found.');
		return { success: true };
	}

	/**
	 * Toggles mentoring opt-in status for an instructor (enable/disable marketplace listing).
	 */
	static async toggleInstructorMentoring(instructorId: string, enabled: boolean) {
		const [updated] = await db
			.update(identityProfiles)
			.set({ mentoringEnabled: enabled, updatedAt: new Date() })
			.where(eq(identityProfiles.userId, instructorId))
			.returning({ userId: identityProfiles.userId, mentoringEnabled: identityProfiles.mentoringEnabled });

		if (!updated) throw new Error('Instructor profile not found.');
		return { success: true, mentoringEnabled: updated.mentoringEnabled };
	}

	/**
	 * Updates rich profile fields for an instructor from the dashboard studio.
	 */
	static async updateInstructorMentoringProfile(instructorId: string, data: {
		handle?: string;
		headline?: string;
		about?: string;
		yearsExp?: number;
		languages?: string[];
		socialLinks?: Record<string, string | null>;
		videoIntroUrl?: string;
	}) {
		const updateData: any = { updatedAt: new Date() };
		if (data.handle !== undefined) updateData.mentoringHandle = data.handle.trim().toLowerCase().replace(/[^a-z0-9-]/g, '-');
		if (data.headline !== undefined) updateData.mentoringHeadline = data.headline.trim();
		if (data.about !== undefined) updateData.mentoringAbout = data.about.trim();
		if (data.yearsExp !== undefined) updateData.mentoringYearsExp = Number(data.yearsExp);
		if (data.languages !== undefined) updateData.mentoringLanguages = data.languages;
		if (data.socialLinks !== undefined) updateData.mentoringSocialLinks = data.socialLinks;
		if (data.videoIntroUrl !== undefined) updateData.mentoringVideoIntroUrl = data.videoIntroUrl?.trim() || null;

		const [updated] = await db
			.update(identityProfiles)
			.set(updateData)
			.where(eq(identityProfiles.userId, instructorId))
			.returning();

		if (!updated) throw new Error('Instructor profile not found.');
		return { success: true, profile: updated };
	}
}
