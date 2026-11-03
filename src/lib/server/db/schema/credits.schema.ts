import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	index
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './identity.schema';

/**
 * User Credits Balance
 * Single source of truth for a student's available credit balance.
 */
export const userCredits = pgTable('user_credits', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
	balance: integer('balance').notNull().default(0),
	lifetimeEarned: integer('lifetime_earned').notNull().default(0),
	lifetimeSpent: integer('lifetime_spent').notNull().default(0),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('user_credits_user_idx').on(t.userId)
]);

/**
 * Credit Transactions Ledger
 * Append-only immutable transaction log.
 */
export const creditTransactions = pgTable('credit_transactions', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	type: text('type', {
		enum: ['purchase', 'spend', 'refund', 'bonus', 'adjustment']
	}).notNull(),
	amount: integer('amount').notNull(), // positive for credits added, negative for spent
	balanceBefore: integer('balance_before').notNull(),
	balanceAfter: integer('balance_after').notNull(),
	referenceId: text('reference_id'), // e.g. registrationId, orderId
	referenceType: text('reference_type'), // 'event_registration', 'credit_package_order', 'admin_adjustment'
	description: text('description').notNull(),
	idempotencyKey: text('idempotency_key').unique(),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('credit_tx_user_created_idx').on(t.userId, t.createdAt),
	index('credit_tx_ref_idx').on(t.referenceType, t.referenceId)
]);

/**
 * Credit Packages
 * Purchasing options presented to students on /credits
 */
export const creditPackages = pgTable('credit_packages', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	name: text('name').notNull(),
	credits: integer('credits').notNull(),
	bonusCredits: integer('bonus_credits').notNull().default(0),
	pricePaise: integer('price_paise').notNull(),
	isActive: boolean('is_active').notNull().default(true),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('credit_packages_active_sort_idx').on(t.isActive, t.sortOrder)
]);

export type UserCredit = typeof userCredits.$inferSelect;
export type NewUserCredit = typeof userCredits.$inferInsert;
export type CreditTransaction = typeof creditTransactions.$inferSelect;
export type NewCreditTransaction = typeof creditTransactions.$inferInsert;
export type CreditPackage = typeof creditPackages.$inferSelect;
export type NewCreditPackage = typeof creditPackages.$inferInsert;

