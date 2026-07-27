/**
 * Cashfree Webhook Handler
 *
 * This is the ONLY place where payment success finalizes asset ownership.
 * Never trust client-side payment success.
 *
 * Cashfree Signature Verification (API v3):
 * In newer versions of the Cashfree SDK/API, webhook signatures are verified
 * using the main CASHFREE_SECRET_KEY — no separate webhook secret is needed.
 *
 * Signature format: HMAC-SHA256(timestamp + rawBody, CASHFREE_SECRET_KEY) → Base64
 *
 * Reference: https://docs.cashfree.com/docs/webhook-verification
 *
 * Flow:
 * 1. Read raw body (BEFORE any parsing — signature verification requires raw bytes)
 * 2. Verify HMAC-SHA256 signature using CASHFREE_SECRET_KEY
 * 3. Idempotency check: was this Cashfree order already processed?
 * 4. Within a single DB transaction:
 *    a. Mark order as paid
 *    b. Grant asset ownership
 *    c. Write PaymentCompleted event to outbox
 * 5. Return 200 immediately (outbox processor handles side effects)
 *
 * Security:
 * - Signature mismatch → 401 (logged but not detailed in response)
 * - Duplicate delivery → 200 with no action (idempotent)
 * - Processing error → 500 (Cashfree will retry)
 */
import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { CASHFREE_SECRET_KEY } from '$env/static/private';
import { hmacSha256Base64, constantTimeEqual } from '$shared/utils/crypto';

import { OrderService } from '$lib/server/commerce/OrderService';

export const POST: RequestHandler = async ({ request }) => {
	// ── 1. Read raw body ────────────────────────────────────────────────────
	const rawBody = await request.text();

	// ── 2. Extract Cashfree signature headers ───────────────────────────────
	const timestamp = request.headers.get('x-webhook-timestamp');
	const receivedSignature = request.headers.get('x-webhook-signature');

	if (!timestamp || !receivedSignature) {
		throw error(400, 'Missing webhook signature headers');
	}

	// ── 3. Verify HMAC-SHA256 using CASHFREE_SECRET_KEY ─────────────────────
	// Cashfree API v3 format: HMAC-SHA256(timestamp + rawBody, secretKey) → Base64
	const expectedSignature = await hmacSha256Base64(
		CASHFREE_SECRET_KEY,
		`${timestamp}${rawBody}`
	);

	if (!constantTimeEqual(receivedSignature, expectedSignature)) {
		console.warn('[Cashfree Webhook] Signature verification failed');
		throw error(401, 'Invalid signature');
	}

	// ── 4. Parse payload ─────────────────────────────────────────────────────
	let payload: Record<string, unknown>;
	try {
		payload = JSON.parse(rawBody);
	} catch {
		throw error(400, 'Invalid JSON payload');
	}

	const eventType = payload.type as string;
	const data = payload.data as Record<string, unknown>;

	// ── 5. Handle PAYMENT_SUCCESS_WEBHOOK event ──────────────────────────────
	if (eventType === 'PAYMENT_SUCCESS_WEBHOOK') {
		const order = data?.order as Record<string, unknown>;
		const cashfreeOrderId = order?.order_id as string;

		if (!cashfreeOrderId) {
			throw error(400, 'Missing order_id in webhook payload');
		}

		// Call OrderService to handle DB updates and asset unlocking
		await OrderService.handlePaymentSuccess(cashfreeOrderId, payload);
		// This will:
		//   1. Check idempotency (order already paid? → skip)
		//   2. db.transaction(() => {
		//        mark order paid
		//        grant ownership
		//        outbox.append(PaymentCompleted event)
		//      })
		console.log(`[Cashfree Webhook] Payment success for order: ${cashfreeOrderId}`);
	}

	// Always respond 200 quickly — processing happens via outbox
	return json({ received: true });
};
