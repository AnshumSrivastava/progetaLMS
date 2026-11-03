import {
	pgTable,
	text,
	boolean,
	timestamp
} from 'drizzle-orm/pg-core';

export const platformSettings = pgTable('platform_settings', {
	id: text('id').primaryKey(),
	enableCatalog: boolean('enable_catalog').notNull().default(true),
	enableMentoring: boolean('enable_mentoring').notNull().default(true),
	enableCertifications: boolean('enable_certifications').notNull().default(true),
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

// Re-export events domain from events.schema for seamless backward compatibility
export {
	events,
	eventAttendees,
	eventRegistrations,
	eventResources,
	userEventProfiles,
	type Event,
	type NewEvent,
	type EventAttendee,
	type NewEventAttendee,
	type EventRegistration,
	type NewEventRegistration,
	type EventResource,
	type NewEventResource,
	type UserEventProfile,
	type NewUserEventProfile
} from './events.schema';

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
