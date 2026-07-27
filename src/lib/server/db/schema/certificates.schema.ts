/**
 * Certificates Domain Schema
 *
 * Templates and issued certificates.
 *
 * Design decisions:
 * - Certificate ID is the public verification key. It is a CUID2 — unpredictable,
 *   not sequential. Users cannot enumerate certificates by ID.
 * - `metadata` snapshots the rendered values (student name, score, etc.) so the
 *   certificate is self-contained even if the underlying data changes.
 * - PDF and QR code are stored in R2; URLs are stored here.
 * - Revocation is a soft operation (revoked_at timestamp). The verification page
 *   reads this and shows an appropriate message.
 */
import {
	pgTable,
	text,
	timestamp,
	boolean,
	jsonb,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { assessmentTests, assessmentAttempts } from './assessments.schema';

export const certificateTemplates = pgTable('certificate_templates', {
	id:          text('id').primaryKey(),
	name:        text('name').notNull(),
	htmlContent: text('html_content').notNull(),   // Handlebars template
	thumbnail:   text('thumbnail'),                // R2 URL (preview image)
	isActive:    boolean('is_active').notNull().default(true),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const certificates = pgTable('certificates', {
	id:         text('id').primaryKey(),   // CUID2 — used as verification key
	templateId: text('template_id').notNull().references(() => certificateTemplates.id),
	testId:     text('test_id').notNull().references(() => assessmentTests.id),
	userId:     text('user_id').notNull().references(() => users.id),
	attemptId:  text('attempt_id').notNull().references(() => assessmentAttempts.id),
	pdfUrl:     text('pdf_url'),           // R2 URL (null while generating)
	qrCodeUrl:  text('qr_code_url'),       // R2 URL
	verifyUrl:  text('verify_url').notNull(),  // /certificates/verify/{id}
	issuedAt:   timestamp('issued_at', { withTimezone: true }).notNull().defaultNow(),
	revokedAt:  timestamp('revoked_at', { withTimezone: true }),
	metadata:   jsonb('metadata').notNull().default({})  // snapshot of rendered data
}, (t) => [
	index('certificates_user_idx').on(t.userId),
	index('certificates_test_idx').on(t.testId)
]);

export type CertificateTemplate = typeof certificateTemplates.$inferSelect;
export type NewCertificateTemplate = typeof certificateTemplates.$inferInsert;
export type Certificate = typeof certificates.$inferSelect;
export type NewCertificate = typeof certificates.$inferInsert;
