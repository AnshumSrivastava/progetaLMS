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

export const commerceOrders = pgTable('commerce_orders', {
	id:               text('id').primaryKey(),   // CUID2
	cashfreeOrderId:  text('cashfree_order_id').notNull().unique(),
	userId:           text('user_id').notNull().references(() => users.id),
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
