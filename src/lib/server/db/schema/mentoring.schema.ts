/**
 * Mentoring Domain Schema
 *
 * Instructor slots and student bookings.
 *
 * Design decisions:
 * - A mentoring slot IS an asset (asset.type = 'mentoring').
 *   The slot table stores time-specific config; the parent asset stores
 *   price, title, and visibility.
 * - `capacity` supports future group sessions (default 1 = 1-on-1).
 * - `meeting_url` is set by the instructor manually in Phase 1.
 *   Phase 2 will auto-generate via Google Calendar / Zoom API.
 * - Bookings require `order_id` only for paid sessions.
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { assets } from './assets.schema';
import { commerceOrders } from './commerce.schema';

export const mentoringSlotsTable = pgTable('mentoring_slots', {
	id:           text('id').primaryKey(),
	instructorId: text('instructor_id').notNull().references(() => users.id),
	assetId:      text('asset_id').notNull().references(() => assets.id),
	startsAt:     timestamp('starts_at', { withTimezone: true }).notNull(),
	endsAt:       timestamp('ends_at', { withTimezone: true }).notNull(),
	pricePaise:   integer('price_paise').notNull().default(0),
	capacity:     integer('capacity').notNull().default(1),
	status:       text('status', { enum: ['available', 'booked', 'cancelled'] }).notNull().default('available'),
	meetingUrl:   text('meeting_url'),
	createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('slots_instructor_idx').on(t.instructorId),
	index('slots_status_idx').on(t.status),
	index('slots_starts_idx').on(t.startsAt)
]);

export const mentoringBookings = pgTable('mentoring_bookings', {
	id:          text('id').primaryKey(),
	slotId:      text('slot_id').notNull().references(() => mentoringSlotsTable.id),
	studentId:   text('student_id').notNull().references(() => users.id),
	orderId:     text('order_id').references(() => commerceOrders.id),
	status:      text('status', { enum: ['confirmed', 'cancelled', 'completed'] }).notNull().default('confirmed'),
	notes:       text('notes'),
	confirmedAt: timestamp('confirmed_at', { withTimezone: true }),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('bookings_student_idx').on(t.studentId),
	index('bookings_slot_idx').on(t.slotId)
]);

export type MentoringSlot = typeof mentoringSlotsTable.$inferSelect;
export type NewMentoringSlot = typeof mentoringSlotsTable.$inferInsert;
export type MentoringBooking = typeof mentoringBookings.$inferSelect;
export type NewMentoringBooking = typeof mentoringBookings.$inferInsert;
