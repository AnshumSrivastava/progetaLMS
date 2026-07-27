/**
 * Event Outbox Schema
 *
 * Implements the Transactional Outbox Pattern.
 *
 * Events are written to this table atomically within the same DB transaction
 * as the state change that triggered them. A processor then reads and dispatches
 * them to the appropriate handlers.
 *
 * This guarantees at-least-once delivery without distributed transactions.
 * Handlers must be idempotent.
 *
 * The partial index on processed_at IS NULL makes queue polling fast —
 * only unprocessed events are indexed.
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	jsonb,
	index
} from 'drizzle-orm/pg-core';
import { sql } from 'drizzle-orm';

export const eventOutbox = pgTable('event_outbox', {
	id:          text('id').primaryKey(),
	eventType:   text('event_type').notNull(),
	payload:     jsonb('payload').notNull(),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	processedAt: timestamp('processed_at', { withTimezone: true }),
	failedAt:    timestamp('failed_at', { withTimezone: true }),
	error:       text('error'),
	attempts:    integer('attempts').notNull().default(0)
});
// Note: The partial index (WHERE processed_at IS NULL) is added manually
// in the migration SQL since Drizzle doesn't yet support conditional indexes.

export type EventOutboxRecord = typeof eventOutbox.$inferSelect;
export type NewEventOutboxRecord = typeof eventOutbox.$inferInsert;
