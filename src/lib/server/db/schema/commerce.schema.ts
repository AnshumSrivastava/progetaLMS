/**
 * Commerce Domain Schema
 *
 * Handles purchases, coupons, invoices.
 *
 * Design decisions:
 * - ALL amounts are stored in smallest currency unit (paise for INR).
 *   Never store floats for money. 100 paise = ₹1.
 * - Orders reference Cashfree's order ID as an external idempotency key.
 * - `coupon_uses` is a separate table to enforce max_uses at query time
 *   without race conditions (DB constraint handles it).
 * - Invoice numbers are generated sequentially; PDFs are stored in R2.
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	jsonb,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { assets } from './assets.schema';

/**
 * Guest Purchase Intents
 *
 * Tracks the lifecycle of a guest (unauthenticated) checkout session.
 * Created when a guest initiates checkout, progresses through OTP
 * verification, and is marked completed after payment webhook fires.
 *
 * Flow:
 *   otp_pending → otp_verified → payment_initiated → completed | expired
 */
export const guestPurchaseIntents = pgTable('guest_purchase_intents', {
	id:              text('id').primaryKey(),
	email:           text('email').notNull(),
	assetId:         text('asset_id').notNull().references(() => assets.id),
	cohortId:        text('cohort_id'),
	couponCode:      text('coupon_code'),
	status:          text('status', {
		enum: ['otp_pending', 'otp_verified', 'payment_initiated', 'completed', 'expired']
	}).notNull().default('otp_pending'),
	otpHash:         text('otp_hash'),       // bcrypt hash, never stored plain
	otpExpiresAt:    timestamp('otp_expires_at', { withTimezone: true }),
	cashfreeOrderId: text('cashfree_order_id'), // set after create-order
	userId:          text('user_id').references(() => users.id), // set after OTP verify
	createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt:       timestamp('expires_at', { withTimezone: true }).notNull() // intent TTL
}, (t) => [
	index('gpi_email_idx').on(t.email),
	index('gpi_status_idx').on(t.status)
]);

/**
 * Magic Login Tokens
 *
 * One-time tokens emailed after a successful payment.
 * Clicking the link in the email creates a real session without needing a password.
 *
 * Security:
 * - 32-byte random hex (256-bit entropy)
 * - Single use (usedAt set on first consumption)
 * - 24-hour TTL
 */
export const magicLoginTokens = pgTable('magic_login_tokens', {
	id:        text('id').primaryKey(),
	userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	token:     text('token').notNull().unique(),
	usedAt:    timestamp('used_at', { withTimezone: true }),
	expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('mlt_token_idx').on(t.token),
	index('mlt_user_idx').on(t.userId)
]);

export const commerceOrders = pgTable('commerce_orders', {
	id:               text('id').primaryKey(),   // CUID2
	cashfreeOrderId:  text('cashfree_order_id').notNull().unique(),
	userId:           text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	assetId:          text('asset_id').notNull().references(() => assets.id),
	amountPaise:      integer('amount_paise').notNull(),
	currency:         text('currency').notNull().default('INR'),
	status:           text('status', {
		enum: ['pending', 'paid', 'failed', 'refunded']
	}).notNull().default('pending'),
	couponId:         text('coupon_id'),   // FK defined below
	discountPaise:    integer('discount_paise').notNull().default(0),
	metadata:         jsonb('metadata').notNull().default({}),
	paidAt:           timestamp('paid_at', { withTimezone: true }),
	createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('orders_user_idx').on(t.userId),
	index('orders_asset_idx').on(t.assetId),
	index('orders_status_idx').on(t.status)
]);

export const commerceCoupons = pgTable('commerce_coupons', {
	id:              text('id').primaryKey(),
	code:            text('code').notNull().unique(),
	type:            text('type', { enum: ['percent', 'flat'] }).notNull(),
	value:           integer('value').notNull(),   // percent (0-100) or paise
	maxUses:         integer('max_uses'),          // NULL = unlimited
	usesCount:       integer('uses_count').notNull().default(0),
	minAmountPaise:  integer('min_amount_paise').notNull().default(0),
	validFrom:       timestamp('valid_from', { withTimezone: true }).notNull().defaultNow(),
	validUntil:      timestamp('valid_until', { withTimezone: true }),
	assetId:         text('asset_id'), // NULL = global, otherwise restricts to specific asset
	createdBy:       text('created_by').notNull().references(() => users.id),
	isActive:        boolean('is_active').notNull().default(true),
	createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const commerceCouponUses = pgTable('commerce_coupon_uses', {
	id:        text('id').primaryKey(),
	couponId:  text('coupon_id').notNull().references(() => commerceCoupons.id),
	orderId:   text('order_id').notNull().references(() => commerceOrders.id),
	userId:    text('user_id').notNull().references(() => users.id),
	usedAt:    timestamp('used_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('coupon_uses_coupon_idx').on(t.couponId),
	index('coupon_uses_user_idx').on(t.userId)
]);

export const commerceInvoices = pgTable('commerce_invoices', {
	id:       text('id').primaryKey(),
	orderId:  text('order_id').notNull().references(() => commerceOrders.id),
	number:   text('number').notNull().unique(),   // INV-2026-00001
	pdfUrl:   text('pdf_url'),                     // R2 URL (null until generated)
	issuedAt: timestamp('issued_at', { withTimezone: true }).notNull().defaultNow()
});

export type CommerceOrder = typeof commerceOrders.$inferSelect;
export type NewCommerceOrder = typeof commerceOrders.$inferInsert;
export type CommerceCoupon = typeof commerceCoupons.$inferSelect;
export type NewCommerceCoupon = typeof commerceCoupons.$inferInsert;
export type CommerceInvoice = typeof commerceInvoices.$inferSelect;
export type GuestPurchaseIntent = typeof guestPurchaseIntents.$inferSelect;
export type NewGuestPurchaseIntent = typeof guestPurchaseIntents.$inferInsert;
export type MagicLoginToken = typeof magicLoginTokens.$inferSelect;
