/**
 * Storage Domain Schema
 *
 * Tracks every file stored by the application, regardless of provider.
 * This table is the source of truth for:
 *   - Which provider holds a file (enables cross-provider migration)
 *   - File integrity (checksum for verification)
 *   - Audit trail (who uploaded, when)
 *
 * Domain records (assets.thumbnail, certificates.pdf_url, etc.) store
 * the public_url string. The storage_objects table lets you reconstruct
 * the storage_key and provider from any URL — essential for migrations.
 *
 * Migration Strategy (local → R2):
 *   1. Query WHERE storage_provider = 'local'
 *   2. For each record: download from local, upload to R2
 *   3. UPDATE storage_objects SET storage_provider='r2', storage_key=..., public_url=...
 *   4. No schema changes in other domains — they read public_url which is updated here
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

export const storageObjects = pgTable('storage_objects', {
	id:              text('id').primaryKey(),  // CUID2
	storageProvider: text('storage_provider', {
		enum: ['local', 'r2', 'supabase', 's3', 'gcs', 'azure', 'minio']
	}).notNull(),
	storageKey:      text('storage_key').notNull().unique(),  // provider-relative path
	publicUrl:       text('public_url').notNull(),
	mimeType:        text('mime_type').notNull(),
	sizeBytes:       integer('size_bytes').notNull().default(0),
	checksum:        text('checksum'),    // SHA-256 hex digest
	uploadedBy:      text('uploaded_by').references(() => users.id, { onDelete: 'set null' }),
	uploadedAt:      timestamp('uploaded_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('storage_objects_provider_idx').on(t.storageProvider),
	index('storage_objects_uploader_idx').on(t.uploadedBy)
]);

export type StorageObjectRecord = typeof storageObjects.$inferSelect;
export type NewStorageObjectRecord = typeof storageObjects.$inferInsert;
