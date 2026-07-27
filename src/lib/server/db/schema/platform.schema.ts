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

export const emailTemplates = pgTable('email_templates', {
	id: text('id').primaryKey(),
	subject: text('subject').notNull(),
	body: text('body').notNull(), // Supports simple Markdown
	updatedAt: timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export type PlatformSettings = typeof platformSettings.$inferSelect;
export type EmailTemplate = typeof emailTemplates.$inferSelect;
