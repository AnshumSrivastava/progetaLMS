/**
 * Mentoring Domain Schema
 *
 * Availability windows, duration pricing, and session bookings.
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	unique,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { commerceOrders, commerceCoupons } from './commerce.schema';

/**
 * Availability windows published by instructors.
 * A single date can contain multiple windows (e.g., morning and evening).
 */
export const mentoringAvailability = pgTable('mentoring_availability', {
	id:               text('id').primaryKey(),
	instructorId:     text('instructor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	date:             text('date').notNull(), // 'YYYY-MM-DD'
	windowStart:      text('window_start').notNull(), // 'HH:MM' (24-hour)
	windowEnd:        text('window_end').notNull(), // 'HH:MM' (24-hour)
	allowedDurations: integer('allowed_durations').array().notNull(), // e.g. [30, 45, 60]
	meetingUrl:       text('meeting_url').notNull(),
	status:           text('status', { enum: ['active', 'cancelled'] }).notNull().default('active'),
	cancelledBy:      text('cancelled_by').references(() => users.id),
	cancelReason:     text('cancel_reason'),
	createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('m_avail_instructor_idx').on(t.instructorId),
	index('m_avail_date_idx').on(t.date),
	index('m_avail_status_date_idx').on(t.status, t.date)
]);

/**
 * Per-instructor duration tier pricing.
 * Unique constraint per instructor and duration.
 */
export const mentoringDurationPrices = pgTable('mentoring_duration_prices', {
	id:           text('id').primaryKey(),
	instructorId: text('instructor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	durationMins: integer('duration_mins').notNull(), // 30, 45, 60
	pricePaise:   integer('price_paise').notNull().default(0), // 0 = Free
	updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	unique('m_prices_instructor_duration_uq').on(t.instructorId, t.durationMins),
	index('m_prices_instructor_idx').on(t.instructorId)
]);

/**
 * Student bookings.
 * Includes precise start and end timestamps, locked price, notes, and 5-min reminder status.
 */
export const mentoringBookings = pgTable('mentoring_bookings', {
	id:              text('id').primaryKey(),
	availabilityId:  text('availability_id').notNull().references(() => mentoringAvailability.id, { onDelete: 'cascade' }),
	studentId:       text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	instructorId:    text('instructor_id').notNull().references(() => users.id),
	startsAt:        timestamp('starts_at', { withTimezone: true }).notNull(),
	endsAt:          timestamp('ends_at', { withTimezone: true }).notNull(),
	durationMins:    integer('duration_mins').notNull(),
	pricePaise:      integer('price_paise').notNull().default(0),
	couponId:        text('coupon_id').references(() => commerceCoupons.id),
	discountPaise:   integer('discount_paise').notNull().default(0),
	orderId:         text('order_id').references(() => commerceOrders.id),
	notes:           text('notes'),
	status:          text('status', { enum: ['pending_payment', 'confirmed', 'cancelled', 'completed'] }).notNull().default('pending_payment'),
	reminderSent:    boolean('reminder_sent').notNull().default(false),
	cancelledByRole: text('cancelled_by_role', { enum: ['student', 'instructor', 'admin'] }),
	createdAt:       timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	unique('m_bookings_avail_start_uq').on(t.availabilityId, t.startsAt),
	index('m_bookings_student_idx').on(t.studentId),
	index('m_bookings_instructor_idx').on(t.instructorId),
	index('m_bookings_avail_idx').on(t.availabilityId),
	index('m_bookings_status_starts_idx').on(t.status, t.startsAt),
	index('m_bookings_reminder_idx').on(t.reminderSent, t.startsAt)
]);

export type MentoringAvailability = typeof mentoringAvailability.$inferSelect;
export type NewMentoringAvailability = typeof mentoringAvailability.$inferInsert;
export type MentoringDurationPrice = typeof mentoringDurationPrices.$inferSelect;
export type NewMentoringDurationPrice = typeof mentoringDurationPrices.$inferInsert;
export type MentoringBooking = typeof mentoringBookings.$inferSelect;
export type NewMentoringBooking = typeof mentoringBookings.$inferInsert;

/**
 * Instructor testimonials.
 * Both student-submitted (booking_id set) and admin-curated (booking_id null) are supported.
 * is_published must be set to true by an admin before the testimonial appears publicly.
 */
export const mentoringTestimonials = pgTable('mentoring_testimonials', {
	id:             text('id').primaryKey(),
	instructorId:   text('instructor_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	bookingId:      text('booking_id').references(() => mentoringBookings.id, { onDelete: 'set null' }),
	studentId:      text('student_id').references(() => users.id, { onDelete: 'set null' }),
	reviewerName:   text('reviewer_name').notNull(),       // Display name (student name or curated name)
	reviewerRole:   text('reviewer_role'),                 // e.g. "Security Engineer at Infosys"
	reviewerAvatar: text('reviewer_avatar'),               // Optional avatar URL
	rating:         integer('rating').notNull().default(5), // 1–5
	body:           text('body').notNull(),                 // Review text
	isPublished:    boolean('is_published').notNull().default(false), // Admin must approve
	rejectedReason: text('rejected_reason'),               // Set if admin rejects
	createdAt:      timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:      timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('m_testimonials_instructor_idx').on(t.instructorId),
	index('m_testimonials_published_idx').on(t.isPublished, t.instructorId)
]);

export type MentoringTestimonial = typeof mentoringTestimonials.$inferSelect;
export type NewMentoringTestimonial = typeof mentoringTestimonials.$inferInsert;

