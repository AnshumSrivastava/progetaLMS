import {
	pgTable,
	text,
	integer,
	boolean,
	timestamp,
	jsonb,
	index,
	unique
} from 'drizzle-orm/pg-core';
import { createId } from '@paralleldrive/cuid2';
import { users } from './identity.schema';

/**
 * Events Domain Schema
 * Handles 1-day sessions, workshops, hackathons, and webinars.
 */
export const events = pgTable('events', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	title: text('title').notNull(),
	slug: text('slug').notNull().unique(),
	description: text('description'),
	shortDescription: text('short_description'),
	hostId: text('host_id').notNull().references(() => users.id),
	// Backward compatible with original platform.events column
	date: timestamp('date', { withTimezone: true }).notNull().defaultNow(),
	startAt: timestamp('start_at', { withTimezone: true }).notNull().defaultNow(),
	endAt: timestamp('end_at', { withTimezone: true }).notNull().defaultNow(),
	registrationDeadline: timestamp('registration_deadline', { withTimezone: true }).notNull().defaultNow(),
	type: text('type', { enum: ['public', 'private'] }).notNull().default('public'),
	eventType: text('event_type', { enum: ['paid', 'free'] }).notNull().default('free'),
	pricePaise: integer('price_paise').notNull().default(0),
	priceCredits: integer('price_credits'),
	maxAttendees: integer('max_attendees'),
	status: text('status', { enum: ['draft', 'published', 'ended', 'cancelled'] }).notNull().default('published'),
	venueType: text('venue_type', { enum: ['online', 'offline', 'hybrid'] }).notNull().default('online'),
	venueDetails: jsonb('venue_details').default({}),
	link: text('link'), // Zoom/Meet link for online sessions
	coverImageUrl: text('cover_image_url'),
	isResourcesReleased: boolean('is_resources_released').notNull().default(false),
	whatsappGroupUrl: text('whatsapp_group_url'),
	metadata: jsonb('metadata').default({}),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('events_status_start_idx').on(t.status, t.startAt),
	index('events_host_idx').on(t.hostId),
	index('events_slug_idx').on(t.slug)
]);

/**
 * Event Attendees / Registrations
 */
export const eventAttendees = pgTable('event_attendees', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	status: text('status', { enum: ['confirmed', 'cancelled', 'waitlisted', 'pending_payment'] }).notNull().default('confirmed'),
	paymentMethod: text('payment_method', { enum: ['free', 'paid', 'credit'] }).notNull().default('free'),
	amountPaidPaise: integer('amount_paid_paise').notNull().default(0),
	creditsUsed: integer('credits_used').notNull().default(0),
	orderId: text('order_id'),
	registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow(),
	attendedAt: timestamp('attended_at', { withTimezone: true }),
	cancellationReason: text('cancellation_reason')
}, (t) => [
	unique('event_attendees_event_user_unique').on(t.eventId, t.userId),
	index('event_attendees_user_idx').on(t.userId),
	index('event_attendees_event_status_idx').on(t.eventId, t.status)
]);

// Alias for semantic clarity
export const eventRegistrations = eventAttendees;

/**
 * Event Resources (Pre-event guides or post-event slide decks/recordings/code)
 */
export const eventResources = pgTable('event_resources', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
	title: text('title').notNull(),
	description: text('description'),
	type: text('type', { enum: ['link', 'file', 'video'] }).notNull(),
	urlOrKey: text('url_or_key').notNull(), // storage key (for files) or external URL (for links/videos)
	mimeType: text('mime_type'),
	sizeBytes: integer('size_bytes'),
	isPreEvent: boolean('is_pre_event').notNull().default(false),
	isPublic: boolean('is_public').notNull().default(false),
	sortOrder: integer('sort_order').notNull().default(0),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('event_resources_event_sort_idx').on(t.eventId, t.sortOrder)
]);

/**
 * User Event Profiles
 * One-time questionnaire filled once by the student before their first event booking.
 */
export const userEventProfiles = pgTable('user_event_profiles', {
	id: text('id').primaryKey().$defaultFn(() => createId()),
	userId: text('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
	phone: text('phone').notNull(),
	organization: text('organization').notNull(),
	jobTitle: text('job_title').notNull(),
	experienceLevel: text('experience_level', {
		enum: ['student', 'fresher', '1-3yrs', '3-5yrs', '5+yrs']
	}).notNull(),
	city: text('city').notNull(),
	state: text('state').notNull(),
	linkedinUrl: text('linkedin_url'),
	githubUrl: text('github_url'),
	dietaryPreference: text('dietary_preference'),
	emergencyContact: text('emergency_contact'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('user_event_profiles_user_idx').on(t.userId)
]);

export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
export type NewEventAttendee = typeof eventAttendees.$inferInsert;
export type EventRegistration = typeof eventRegistrations.$inferSelect;
export type NewEventRegistration = typeof eventRegistrations.$inferInsert;
export type EventResource = typeof eventResources.$inferSelect;
export type NewEventResource = typeof eventResources.$inferInsert;
export type UserEventProfile = typeof userEventProfiles.$inferSelect;
export type NewUserEventProfile = typeof userEventProfiles.$inferInsert;

