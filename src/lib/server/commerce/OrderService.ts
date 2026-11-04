import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { commerceOrders, commerceCoupons, commerceCouponUses } from '$lib/server/db/schema/commerce.schema';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { users, verifications } from '$lib/server/db/schema/identity.schema';
import { creditPackages } from '$lib/server/db/schema/credits.schema';
import { events, eventRegistrations } from '$lib/server/db/schema/events.schema';
import { CreditService } from '$lib/server/credits/credit.service';
import { eq, and, sql } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'node:crypto';
import { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import { emailService } from '$lib/server/emails';
import { CohortService } from '$lib/server/cohorts/CohortService';

const CASHFREE_API = (CASHFREE_ENV || 'production') === 'production' 
	? 'https://api.cashfree.com/pg/orders'
	: 'https://sandbox.cashfree.com/pg/orders';

const stripTrailingSlash = (u: string) => (u || '').replace(/\/+$/, '');

/**
 * Resolves the public base URL used for Cashfree return/notify URLs.
 * Cashfree (production) rejects non-HTTPS URLs, and PUBLIC_APP_URL is baked in
 * at build time, so prefer the live request origin when it is HTTPS.
 */
function resolveBaseUrl(requestOrigin?: string): string {
	const origin = stripTrailingSlash(requestOrigin || '');
	const configured = stripTrailingSlash(PUBLIC_APP_URL);
	if (origin.startsWith('https://')) return origin;
	if (configured.startsWith('https://')) return configured;
	return origin || configured;
}

export class OrderService {
	
	/**
	 * Creates a pending order in the database and generates a Cashfree payment session.
	 */
	static async createOrder(assetId: string, userId: string, customerDetails: { name: string, email: string, phone: string }, couponCode?: string, cohortId?: string, requestOrigin?: string) {
		// 1. Fetch the asset
		const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
		if (!asset) throw new Error('Asset not found');

		let amountPaise = asset.pricePaise;

		// 1b. If cohortId is provided, verify batch validity and seat capacity
		if (cohortId) {
			const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId));
			if (!batch || !batch.isActive || batch.status === 'completed' || !CohortService.isEnrollmentOpen(batch)) {
				throw new Error('This batch is closed and no longer accepting enrollments.');
			}
			if (batch.maxStudents !== null) {
				const [{ count }] = await db
					.select({ count: sql<number>`count(*)` })
					.from(cohortMemberships)
					.where(and(eq(cohortMemberships.cohortId, cohortId), eq(cohortMemberships.status, 'active')));
				if (Number(count) >= batch.maxStudents) {
					throw new Error('This batch has reached its maximum student capacity. Please select another batch.');
				}
			}
			
			// Override price if this cohort has a specific price
			if (batch.pricePaise !== null && batch.pricePaise !== undefined) {
				amountPaise = batch.pricePaise;
			}
		}
		let discountPaise = 0;
		let appliedCouponId = null;

		// 2. Apply Coupon if provided
		if (couponCode) {
			const [coupon] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.code, couponCode.toUpperCase()));
			if (coupon && coupon.isActive) {
				if (coupon.maxUses !== null && coupon.usesCount >= coupon.maxUses) {
					throw new Error('Coupon usage limit reached');
				}
				if (coupon.assetId && coupon.assetId !== assetId) {
					throw new Error('Coupon not valid for this item');
				}
				if (coupon.type === 'percent') {
					discountPaise = Math.floor((amountPaise * coupon.value) / 100);
				} else {
					discountPaise = coupon.value;
				}
				appliedCouponId = coupon.id;
				amountPaise = Math.max(0, amountPaise - discountPaise);
			} else {
				throw new Error('Invalid or expired coupon');
			}
		}

		// If total is 0 (free asset or 100% coupon), handle bypass
		if (amountPaise === 0) {
			const orderId = randomUUID();
			
			await db.insert(commerceOrders).values({
				id: orderId,
				cashfreeOrderId: `FREE_${orderId}`,
				userId,
				assetId,
				amountPaise: 0,
				discountPaise,
				couponId: appliedCouponId,
				status: 'paid',
				paidAt: new Date(),
				metadata: cohortId ? { cohortId } : {}
			});
			
			await OrderService.grantAccess(orderId, assetId, userId, couponCode ? 'coupon' : 'free');
			if (cohortId) {
				await OrderService.grantCohortAccess(cohortId, userId);
			}
			
			if (appliedCouponId) {
				await db.batch([
					db.insert(commerceCouponUses).values({
						id: randomUUID(),
						couponId: appliedCouponId,
						orderId: orderId,
						userId: userId
					}),
					db.update(commerceCoupons)
						.set({ usesCount: sql`${commerceCoupons.usesCount} + 1` })
						.where(eq(commerceCoupons.id, appliedCouponId))
				]);
			}
			
			// Send instant magic login link and confirmation email
			await OrderService.sendMagicLoginEmail(userId, assetId, cohortId);

			return { 
				isFree: true, 
				orderId,
				message: 'Asset unlocked for free.'
			};
		}

		// 3. Create Cashfree Order
		const cashfreeOrderId = `ORD_${randomUUID()}`;
		const amountRupees = amountPaise / 100;
		const baseUrl = resolveBaseUrl(requestOrigin);

		const requestBody = {
			order_id: cashfreeOrderId,
			order_amount: amountRupees,
			order_currency: 'INR',
			customer_details: {
				customer_id: userId,
				customer_name: customerDetails.name || 'Student',
				customer_email: customerDetails.email || 'student@progeta.in',
				customer_phone: customerDetails.phone || '9999999999'
			},
			order_meta: {
				return_url: `${baseUrl}/dashboard?order_id={order_id}`,
				notify_url: `${baseUrl}/api/webhooks/cashfree`
			}
		};

		let paymentSessionId = 'mock_session_id_no_keys_provided';
		
		if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
			const cfResponse = await fetch(CASHFREE_API, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-id': CASHFREE_APP_ID,
					'x-client-secret': CASHFREE_SECRET_KEY,
					'x-api-version': '2023-08-01'
				},
				body: JSON.stringify(requestBody)
			});

			if (!cfResponse.ok) {
				const error = await cfResponse.text();
				console.error('[Cashfree API Error]', cfResponse.status, error, { returnUrl: requestBody.order_meta.return_url });
				let reason = '';
				try { reason = JSON.parse(error)?.message || ''; } catch { /* non-JSON body */ }
				throw new Error(`Failed to initialize payment gateway${reason ? `: ${reason}` : ''}`);
			}
			const cfData = await cfResponse.json();
			paymentSessionId = cfData.payment_session_id;
		} else {
			console.warn('[OrderService] No Cashfree keys provided in .env! Proceeding with mock session for testing UI.');
		}

		// 4. Save pending order to DB
		const internalOrderId = randomUUID();
		
		const isMockMode = (paymentSessionId === 'mock_session_id_no_keys_provided');

		await db.insert(commerceOrders).values({
			id: internalOrderId,
			cashfreeOrderId,
			userId,
			assetId,
			amountPaise,
			discountPaise,
			couponId: appliedCouponId,
			status: isMockMode ? 'paid' : 'pending',
			paidAt: isMockMode ? new Date() : null,
			metadata: cohortId ? { cohortId } : {}
		});

		if (isMockMode) {
			await OrderService.grantAccess(internalOrderId, assetId, userId, 'purchase');
			if (cohortId) {
				await OrderService.grantCohortAccess(cohortId, userId);
			}
			if (appliedCouponId) {
				await db.batch([
					db.insert(commerceCouponUses).values({
						id: randomUUID(),
						couponId: appliedCouponId,
						orderId: internalOrderId,
						userId: userId
					}),
					db.update(commerceCoupons)
						.set({ usesCount: sql`${commerceCoupons.usesCount} + 1` })
						.where(eq(commerceCoupons.id, appliedCouponId))
				]);
			}
			// Send instant magic login link and confirmation email in mock mode
			await OrderService.sendMagicLoginEmail(userId, assetId, cohortId);
		}

		return {
			isFree: false,
			paymentSessionId,
			cashfreeOrderId,
			isMockMode
		};
	}

	/**
	 * Creates a pending Cashfree order for a credit bundle purchase.
	 */
	static async createCreditOrder(
		packageId: string,
		userId: string,
		customerDetails: { name: string; email: string; phone: string },
		requestOrigin?: string
	) {
		const [pkg] = await db
			.select()
			.from(creditPackages)
			.where(eq(creditPackages.id, packageId));

		if (!pkg || !pkg.isActive) {
			throw new Error('Credit package not found or currently unavailable');
		}

		const totalCredits = pkg.credits + (pkg.bonusCredits || 0);
		const amountPaise = pkg.pricePaise;
		const cashfreeOrderId = `CRD_${randomUUID()}`;
		const amountRupees = amountPaise / 100;
		const baseUrl = resolveBaseUrl(requestOrigin);

		const requestBody = {
			order_id: cashfreeOrderId,
			order_amount: amountRupees,
			order_currency: 'INR',
			customer_details: {
				customer_id: userId,
				customer_name: customerDetails.name || 'Student',
				customer_email: customerDetails.email || 'student@progeta.in',
				customer_phone: customerDetails.phone || '9999999999'
			},
			order_meta: {
				return_url: `${baseUrl}/credits?success=true&order_id={order_id}`,
				notify_url: `${baseUrl}/api/webhooks/cashfree`
			}
		};

		let paymentSessionId = 'mock_session_id_no_keys_provided';

		if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
			const cfResponse = await fetch(CASHFREE_API, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-id': CASHFREE_APP_ID,
					'x-client-secret': CASHFREE_SECRET_KEY,
					'x-api-version': '2023-08-01'
				},
				body: JSON.stringify(requestBody)
			});

			if (!cfResponse.ok) {
				const error = await cfResponse.text();
				throw new Error(`Failed to initialize payment gateway: ${error}`);
			}
			const cfData = await cfResponse.json();
			paymentSessionId = cfData.payment_session_id;
		}

		const internalOrderId = randomUUID();
		const isMockMode = (paymentSessionId === 'mock_session_id_no_keys_provided');

		await db.insert(commerceOrders).values({
			id: internalOrderId,
			cashfreeOrderId,
			userId,
			orderType: 'credit_package',
			targetId: packageId,
			assetId: null,
			amountPaise,
			discountPaise: 0,
			status: isMockMode ? 'paid' : 'pending',
			paidAt: isMockMode ? new Date() : null,
			metadata: {
				packageId: pkg.id,
				packageName: pkg.name,
				credits: pkg.credits,
				bonusCredits: pkg.bonusCredits,
				totalCredits
			}
		});

		if (isMockMode) {
			await CreditService.addCredits(userId, totalCredits, {
				type: 'purchase',
				referenceId: internalOrderId,
				referenceType: 'credit_package_order',
				description: `Purchase of ${pkg.name} (${totalCredits} credits)`,
				idempotencyKey: `CREDIT_ORD_${internalOrderId}`
			});
		}

		return {
			paymentSessionId,
			cashfreeOrderId,
			isMockMode
		};
	}

	/**
	 * Creates a pending Cashfree order for paid event registration.
	 */
	static async createEventOrder(
		eventId: string,
		userId: string,
		customerDetails: { name: string; email: string; phone: string },
		requestOrigin?: string,
		ticketTier?: { id: string; name: string; pricePaise: number }
	) {
		const [event] = await db
			.select()
			.from(events)
			.where(eq(events.id, eventId));

		if (!event || event.status !== 'published') {
			throw new Error('Event is not available for registration');
		}

		if (new Date() > new Date(event.registrationDeadline)) {
			throw new Error('Registration for this event has closed');
		}

		const amountPaise = ticketTier?.pricePaise || event.pricePaise;

		if (amountPaise <= 0) {
			throw new Error('This event is free, no payment required');
		}

		const cashfreeOrderId = `EVT_${randomUUID()}`;
		const amountRupees = amountPaise / 100;
		const baseUrl = resolveBaseUrl(requestOrigin);

		const requestBody = {
			order_id: cashfreeOrderId,
			order_amount: amountRupees,
			order_currency: 'INR',
			customer_details: {
				customer_id: userId,
				customer_name: customerDetails.name || 'Student',
				customer_email: customerDetails.email || 'student@progeta.in',
				customer_phone: customerDetails.phone || '9999999999'
			},
			order_meta: {
				return_url: `${baseUrl}/events/${event.slug}?registered=true&order_id={order_id}`,
				notify_url: `${baseUrl}/api/webhooks/cashfree`
			}
		};

		let paymentSessionId = 'mock_session_id_no_keys_provided';

		if (CASHFREE_APP_ID && CASHFREE_SECRET_KEY) {
			const cfResponse = await fetch(CASHFREE_API, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'x-client-id': CASHFREE_APP_ID,
					'x-client-secret': CASHFREE_SECRET_KEY,
					'x-api-version': '2023-08-01'
				},
				body: JSON.stringify(requestBody)
			});

			if (!cfResponse.ok) {
				const error = await cfResponse.text();
				throw new Error(`Failed to initialize payment gateway: ${error}`);
			}
			const cfData = await cfResponse.json();
			paymentSessionId = cfData.payment_session_id;
		}

		const internalOrderId = randomUUID();
		const isMockMode = (paymentSessionId === 'mock_session_id_no_keys_provided');

		// Create a pending registration row
		await db.insert(eventRegistrations).values({
			id: randomUUID(),
			eventId,
			userId,
			status: isMockMode ? 'confirmed' : 'pending_payment',
			paymentMethod: 'paid',
			amountPaidPaise: amountPaise,
			creditsUsed: 0,
			orderId: internalOrderId,
			registeredAt: new Date()
		}).onConflictDoUpdate({
			target: [eventRegistrations.eventId, eventRegistrations.userId],
			set: {
				status: isMockMode ? 'confirmed' : 'pending_payment',
				paymentMethod: 'paid',
				amountPaidPaise: amountPaise,
				orderId: internalOrderId,
				registeredAt: new Date()
			}
		});

		await db.insert(commerceOrders).values({
			id: internalOrderId,
			cashfreeOrderId,
			userId,
			orderType: 'event',
			targetId: eventId,
			assetId: null,
			amountPaise,
			discountPaise: 0,
			status: isMockMode ? 'paid' : 'pending',
			paidAt: isMockMode ? new Date() : null,
			metadata: {
				eventId: event.id,
				eventTitle: event.title,
				eventSlug: event.slug,
				ticketTier: ticketTier?.name || 'Normal Attendee Pass',
				ticketTierId: ticketTier?.id || 'attendee'
			}
		});

		if (isMockMode && customerDetails.email) {
			try {
				await emailService.sendEventRegistrationConfirmation({
					to: customerDetails.email,
					userName: customerDetails.name || 'Student',
					eventTitle: event.title,
					eventSlug: event.slug,
					eventDate: new Date(event.startAt).toLocaleDateString('en-IN', { dateStyle: 'full' }),
					eventTime: new Date(event.startAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }),
					venueType: (event.venueType as any) || 'online',
					venueDisplay: event.venueType === 'offline' ? 'In-person / Venue' : 'Online Session',
					paymentMethod: 'paid',
					amountPaid: `₹${(amountPaise / 100).toFixed(2)}`,
					whatsappGroupUrl: event.whatsappGroupUrl || undefined,
					registrationId: internalOrderId,
					ticketTierName: ticketTier?.name || 'Normal Attendee Pass',
					ticketTierId: ticketTier?.id || 'attendee'
				});
			} catch (e) {
				console.error('[OrderService] Failed to send instant confirmation email in mock mode:', e);
			}
		}

		return {
			paymentSessionId,
			cashfreeOrderId,
			isMockMode
		};
	}

	/**
	 * Called by the Cashfree Webhook when payment succeeds.
	 */
	static async handlePaymentSuccess(cashfreeOrderId: string, payload: any) {
		const [order] = await db.select().from(commerceOrders).where(eq(commerceOrders.cashfreeOrderId, cashfreeOrderId));
		
		if (!order) {
			console.error(`[OrderService] Webhook received for unknown order: ${cashfreeOrderId}`);
			return;
		}

		if (order.status === 'paid') {
			console.log(`[OrderService] Order ${cashfreeOrderId} is already paid. Idempotent return.`);
			return;
		}

		// Handle Credit Package Orders
		if (order.orderType === 'credit_package') {
			const meta = order.metadata as { totalCredits?: number; packageName?: string };
			const credits = meta?.totalCredits || Math.floor(order.amountPaise / 100);

			await CreditService.addCredits(order.userId, credits, {
				type: 'purchase',
				referenceId: order.id,
				referenceType: 'credit_package_order',
				description: `Purchase of ${meta?.packageName || 'Credits'} (+${credits} credits)`,
				idempotencyKey: `CREDIT_ORDER_${order.id}`
			});

			await db.update(commerceOrders)
				.set({ status: 'paid', paidAt: new Date() })
				.where(eq(commerceOrders.id, order.id));

			const [user] = await db.select().from(users).where(eq(users.id, order.userId));
			if (user?.email) {
				const balance = await CreditService.getBalance(order.userId);
				await emailService.sendCreditPurchaseConfirmation({
					to: user.email,
					userName: user.name || 'Student',
					packageName: meta?.packageName || 'Credits Package',
					credits,
					bonusCredits: 0,
					totalCredits: credits,
					amountPaid: `₹${(order.amountPaise / 100).toFixed(2)}`,
					newBalance: balance.balance
				});
			}
			console.log(`[OrderService] Processed credit package purchase for user ${order.userId}: +${credits} credits`);
			return;
		}

		// Handle Event Orders
		if (order.orderType === 'event') {
			const meta = order.metadata as { eventId?: string; ticketTier?: string; ticketTierId?: string };
			const eventId = meta?.eventId || order.targetId;

			await db.update(eventRegistrations)
				.set({ status: 'confirmed', registeredAt: new Date() })
				.where(and(
					eq(eventRegistrations.eventId, eventId!),
					eq(eventRegistrations.userId, order.userId)
				));

			await db.update(commerceOrders)
				.set({ status: 'paid', paidAt: new Date() })
				.where(eq(commerceOrders.id, order.id));

			const [event] = await db.select().from(events).where(eq(events.id, eventId!));
			const [user] = await db.select().from(users).where(eq(users.id, order.userId));
			if (event && user?.email) {
				await emailService.sendEventRegistrationConfirmation({
					to: user.email,
					userName: user.name || 'Student',
					eventTitle: event.title,
					eventSlug: event.slug,
					eventDate: new Date(event.startAt).toLocaleDateString('en-IN', { dateStyle: 'full' }),
					eventTime: new Date(event.startAt).toLocaleTimeString('en-IN', { timeStyle: 'short' }),
					venueType: (event.venueType as any) || 'online',
					venueDisplay: event.venueType === 'offline' ? 'In-person / Venue' : 'Online Session',
					paymentMethod: 'paid',
					amountPaid: `₹${(order.amountPaise / 100).toFixed(2)}`,
					whatsappGroupUrl: event.whatsappGroupUrl || undefined,
					registrationId: order.id,
					ticketTierName: meta?.ticketTier || 'Normal Attendee Pass',
					ticketTierId: meta?.ticketTierId || 'attendee'
				});
			}
			console.log(`[OrderService] Processed paid event registration for user ${order.userId} on event ${eventId}`);
			return;
		}

		// Standard Asset Orders
		if (order.assetId) {
			await OrderService.grantAccess(order.id, order.assetId, order.userId, 'purchase');
		}
		
		const metadata = order.metadata as { cohortId?: string };
		if (metadata?.cohortId) {
			await OrderService.grantCohortAccess(metadata.cohortId, order.userId);
		}

		// 2. Increment Coupon Usage and Mark Paid in a batch
		const batch = [];
		if (order.couponId) {
			batch.push(
				db.insert(commerceCouponUses).values({
					id: randomUUID(),
					couponId: order.couponId,
					orderId: order.id,
					userId: order.userId
				})
			);
			batch.push(
				db.update(commerceCoupons)
					.set({ usesCount: sql`${commerceCoupons.usesCount} + 1` })
					.where(eq(commerceCoupons.id, order.couponId))
			);
		}
		
		batch.push(
			db.update(commerceOrders)
				.set({ status: 'paid', paidAt: new Date() })
				.where(eq(commerceOrders.id, order.id))
		);

		await db.batch(batch as any);		
		console.log(`[OrderService] Successfully processed payment and unlocked asset for order ${cashfreeOrderId}`);

		// 3. Send magic login link & confirmation email so learner can jump in immediately
		await OrderService.sendMagicLoginEmail(order.userId, order.assetId, metadata?.cohortId);
	}

	/**
	 * Generates a single-use magic login link and sends it with enrollment confirmation.
	 */
	static async sendMagicLoginEmail(userId: string, assetId: string, cohortId?: string) {
		try {
			const [user] = await db.select().from(users).where(eq(users.id, userId));
			const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
			if (!user?.email) return;

			let whatsappUrl = 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i';
			if (cohortId) {
				const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId));
				if (batch?.communityUrl) {
					whatsappUrl = batch.communityUrl;
				}
			} else {
				const [batch] = await db.select().from(cohorts)
					.where(and(eq(cohorts.courseId, assetId), eq(cohorts.isActive, true)))
					.limit(1);
				if (batch?.communityUrl) {
					whatsappUrl = batch.communityUrl;
				}
			}

			const magicToken = randomBytes(32).toString('hex');
			const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

			await db.insert(verifications).values({
				id: randomUUID(),
				identifier: `magic-login:${magicToken}`,
				value: user.id,
				expiresAt
			});

			const magicUrl = `${stripTrailingSlash(PUBLIC_APP_URL)}/api/auth/magic-login?token=${magicToken}&redirect=/dashboard`;
			await emailService.sendEnrollmentWithMagicLink(
				user.email,
				user.name || 'Learner',
				asset?.title || 'Your Course',
				magicUrl,
				whatsappUrl
			);
		} catch (e) {
			console.error('[OrderService] Failed to send magic login email:', e);
		}
	}

	private static async grantAccess(orderId: string, assetId: string, userId: string, source: 'purchase' | 'free' | 'coupon') {
		const [existing] = await db.select().from(assetOwnership)
			.where(and(eq(assetOwnership.assetId, assetId), eq(assetOwnership.ownerId, userId)));
		
		if (!existing) {
			await db.insert(assetOwnership).values({
				id: randomUUID(),
				assetId,
				ownerId: userId,
				source,
				orderId
			});
		}
	}

	private static async grantCohortAccess(cohortId: string, userId: string) {
		const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, cohortId));
		const accessExpiresAt = batch?.completedAt
			? new Date(new Date(batch.completedAt).getTime() + 90 * 24 * 60 * 60 * 1000)
			: null;

		const [existing] = await db.select().from(cohortMemberships)
			.where(and(eq(cohortMemberships.cohortId, cohortId), eq(cohortMemberships.userId, userId)));
		
		if (!existing) {
			await db.insert(cohortMemberships).values({
				id: randomUUID(),
				cohortId,
				userId,
				role: 'student',
				status: 'active',
				accessExpiresAt
			});
		} else {
			await db.update(cohortMemberships).set({
				status: 'active',
				accessExpiresAt: accessExpiresAt ?? existing.accessExpiresAt
			}).where(eq(cohortMemberships.id, existing.id));
		}
	}
}
