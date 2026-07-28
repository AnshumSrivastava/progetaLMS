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



export const events = pgTable('events', {
	id: text('id').primaryKey(),
	title: text('title').notNull(),
	description: text('description'),
	hostId: text('host_id').notNull(), // reference to users.id
	date: timestamp('date', { withTimezone: true }).notNull(),
	link: text('link'), // e.g. zoom link
	type: text('type', { enum: ['public', 'private'] }).notNull().default('public'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const eventAttendees = pgTable('event_attendees', {
	id: text('id').primaryKey(),
	eventId: text('event_id').notNull().references(() => events.id, { onDelete: 'cascade' }),
	userId: text('user_id').notNull(), // reference to users.id
	registeredAt: timestamp('registered_at', { withTimezone: true }).notNull().defaultNow()
});

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type Event = typeof events.$inferSelect;
export type NewEvent = typeof events.$inferInsert;
export type EventAttendee = typeof eventAttendees.$inferSelect;
