/**
 * Analytics Domain Schema
 *
 * Append-only event log for analytics.
 *
 * Design decisions:
 * - This is a write-heavy, read-occasional table. Index only what's necessary.
 * - `ip_hash` stores a SHA-256 hash of the IP — never raw IPs (privacy).
 * - `user_id` is nullable for anonymous events (future public pages).
 * - This table feeds dashboards; complex aggregations use DB views or
 *   a future dedicated analytics service.
 * - Designed for future extraction to ClickHouse or similar if volume demands.
 */
import {
	pgTable,
	text,
	timestamp,
	jsonb,
	uuid,
	index
} from 'drizzle-orm/pg-core';

export const analyticsEvents = pgTable('analytics_events', {
	id:         text('id').primaryKey(),
	userId:     text('user_id'),   // nullable — anonymous events
	eventType:  text('event_type').notNull(),   // 'asset.viewed', 'purchase.completed', etc.
	entityType: text('entity_type'),            // 'asset' | 'test' | 'certificate' | null
	entityId:   text('entity_id'),
	properties: jsonb('properties').notNull().default({}),
	ipHash:     text('ip_hash'),               // SHA-256 of IP, never raw
	occurredAt: timestamp('occurred_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('analytics_event_type_idx').on(t.eventType, t.occurredAt),
	index('analytics_entity_idx').on(t.entityType, t.entityId),
	index('analytics_user_idx').on(t.userId)
]);

export type AnalyticsEvent = typeof analyticsEvents.$inferSelect;
export type NewAnalyticsEvent = typeof analyticsEvents.$inferInsert;
