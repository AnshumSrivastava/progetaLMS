import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { commerceOrders, commerceCoupons, commerceCouponUses } from '$lib/server/db/schema/commerce.schema';
import { cohorts, cohortMemberships } from '$lib/server/db/schema/cohorts.schema';
import { eq, and } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { CASHFREE_APP_ID, CASHFREE_SECRET_KEY, CASHFREE_ENV } from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';

const CASHFREE_API = CASHFREE_ENV === 'production' 
	? 'https://api.cashfree.com/pg/orders'
	: 'https://sandbox.cashfree.com/pg/orders';

export class OrderService {
	
	/**
	 * Creates a pending order in the database and generates a Cashfree payment session.
	 */
	static async createOrder(assetId: string, userId: string, customerDetails: { name: string, email: string, phone: string }, couponCode?: string, cohortId?: string) {
		// 1. Fetch the asset
		const [asset] = await db.select().from(assets).where(eq(assets.id, assetId));
		if (!asset) throw new Error('Asset not found');

		let amountPaise = asset.pricePaise;
		let discountPaise = 0;
		let appliedCouponId = null;

		// 2. Apply Coupon if provided
		if (couponCode) {
			const [coupon] = await db.select().from(commerceCoupons).where(eq(commerceCoupons.code, couponCode.toUpperCase()));
			if (coupon && coupon.isActive) {
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
			
			await this.grantAccess(orderId, assetId, userId, couponCode ? 'coupon' : 'free');
			if (cohortId) {
				await this.grantCohortAccess(cohortId, userId);
			}
			
			return { 
				isFree: true, 
				orderId,
				message: 'Asset unlocked for free.'
			};
		}

		// 3. Create Cashfree Order
		const cashfreeOrderId = `ORD_${randomUUID()}`;
		const amountRupees = amountPaise / 100;

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
				return_url: `${PUBLIC_APP_URL}/dashboard?order_id={order_id}`,
				notify_url: `${PUBLIC_APP_URL}/api/webhooks/cashfree`
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
				console.error('[Cashfree API Error]', error);
				throw new Error('Failed to initialize payment gateway');
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
			await this.grantAccess(internalOrderId, assetId, userId, 'purchase');
			if (cohortId) {
				await this.grantCohortAccess(cohortId, userId);
			}
			if (appliedCouponId) {
				await db.insert(commerceCouponUses).values({
					id: randomUUID(),
					couponId: appliedCouponId,
					orderId: internalOrderId,
					userId: userId
				});
			}
		}

		return {
			isFree: false,
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

		// 1. Mark Order as Paid
		await db.update(commerceOrders)
			.set({ status: 'paid', paidAt: new Date() })
			.where(eq(commerceOrders.id, order.id));

		// 2. Increment Coupon Usage
		if (order.couponId) {
			await db.insert(commerceCouponUses).values({
				id: randomUUID(),
				couponId: order.couponId,
				orderId: order.id,
				userId: order.userId
			});
			// Optionally update total usage count on coupon itself
		}

		// 3. Grant Access to Asset
		await this.grantAccess(order.id, order.assetId, order.userId, 'purchase');
		
		const metadata = order.metadata as { cohortId?: string };
		if (metadata?.cohortId) {
			await this.grantCohortAccess(metadata.cohortId, order.userId);
		}
		
		console.log(`[OrderService] Successfully processed payment and unlocked asset for order ${cashfreeOrderId}`);
	}

	private static async grantAccess(orderId: string, assetId: string, userId: string, source: 'purchase' | 'free' | 'coupon') {
		// Check if already owns
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
		const [existing] = await db.select().from(cohortMemberships)
			.where(and(eq(cohortMemberships.cohortId, cohortId), eq(cohortMemberships.userId, userId)));
		
		if (!existing) {
			await db.insert(cohortMemberships).values({
				id: randomUUID(),
				cohortId,
				userId,
				role: 'student'
			});
		}
	}
}
