/**
 * Assets Domain Schema
 *
 * Central domain of the platform. Every learnable/purchasable object is an asset.
 *
 * Design decisions:
 * - `price_paise = 0` means free. No separate "free" flag needed.
 * - `metadata` (jsonb) holds type-specific data. Each AssetType has a defined
 *   TypeScript interface in assets.types.ts — Drizzle won't validate the shape,
 *   but the service layer enforces it via Zod.
 * - Content is versioned in `asset_content`. The current version is served;
 *   old versions are retained for future edit history.
 * - Ownership is in `asset_ownership`. It is NOT derived from `commerce_orders`.
 *   Ownership can exist without a purchase (free, granted, coupon).
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	jsonb,
	uuid,
	index,
	unique
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';

export const assets = pgTable('assets', {
	id:          text('id').primaryKey(),  // CUID2
	slug:        text('slug').notNull().unique(),
	title:       text('title').notNull(),
	description: text('description'),
	thumbnail:   text('thumbnail'),        // public URL from StorageService
	type:        text('type', {
		enum: [
			'html', 'markdown', 'pdf', 'download', 'external',
			'cert_test', 'certificate', 'mentoring'
		]
	}).notNull(),
	status:      text('status', { enum: ['draft', 'published', 'archived'] }).notNull().default('draft'),
	visibility:  text('visibility', { enum: ['public', 'private', 'unlisted'] }).notNull().default('private'),
	ownerId:     text('owner_id').notNull().references(() => users.id),
	currency:    text('currency').notNull().default('INR'),
	pricePaise:  integer('price_paise').notNull().default(0),
	metadata:    jsonb('metadata').notNull().default({}),
	sortOrder:   integer('sort_order').notNull().default(0),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:   timestamp('updated_at', { withTimezone: true }).notNull().defaultNow(),
	deletedAt:   timestamp('deleted_at', { withTimezone: true })  // soft delete
}, (t) => [
	index('assets_owner_idx').on(t.ownerId),
	index('assets_type_idx').on(t.type),
	index('assets_status_idx').on(t.status),
	index('assets_visibility_idx').on(t.visibility),
	index('assets_deleted_idx').on(t.deletedAt)
]);

export const assetContent = pgTable('asset_content', {
	id:          text('id').primaryKey(),
	assetId:     text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
	version:     integer('version').notNull().default(1),
	content:     text('content').notNull(),   // raw content: HTML, Markdown, URL, or storage key
	contentType: text('content_type', {
		enum: ['html', 'markdown', 'url', 'storage_key', 'video', 'slides', 'test', 'reading']
	}).notNull(),
	isCurrent:   boolean('is_current').notNull().default(true),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	createdBy:   text('created_by').notNull().references(() => users.id)
}, (t) => [
	index('asset_content_asset_idx').on(t.assetId),
	index('asset_content_current_idx').on(t.assetId, t.isCurrent)
]);

export const assetOwnership = pgTable('asset_ownership', {
	id:        text('id').primaryKey(),
	assetId:   text('asset_id').notNull().references(() => assets.id),
	ownerId:   text('owner_id').notNull().references(() => users.id),
	source:    text('source', { enum: ['purchase', 'grant', 'free', 'coupon'] }).notNull(),
	orderId:   text('order_id'),  // FK defined after commerce schema
	grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt: timestamp('expires_at', { withTimezone: true }),  // future: time-limited
	revokedAt: timestamp('revoked_at', { withTimezone: true })
}, (t) => [
	index('asset_ownership_owner_idx').on(t.ownerId),
	index('asset_ownership_asset_idx').on(t.assetId),
	unique('asset_ownership_unique').on(t.ownerId, t.assetId)
]);

export const assetProgress = pgTable('asset_progress', {
	id:              text('id').primaryKey(),
	userId:          text('user_id').notNull().references(() => users.id),
	assetId:         text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
	lessonId:        text('lesson_id').notNull(), // points to asset_content.id or module internal id
	completed:       boolean('completed').notNull().default(false),
	progressPercent: integer('progress_percent').notNull().default(0),
	lastAccessedAt:  timestamp('last_accessed_at', { withTimezone: true }).notNull().defaultNow(),
	completedAt:     timestamp('completed_at', { withTimezone: true })
}, (t) => [
	index('asset_progress_user_idx').on(t.userId),
	index('asset_progress_asset_idx').on(t.assetId),
	unique('asset_progress_unique').on(t.userId, t.assetId, t.lessonId)
]);

export type Asset = typeof assets.$inferSelect;
export type NewAsset = typeof assets.$inferInsert;
export type AssetContent = typeof assetContent.$inferSelect;
export type NewAssetContent = typeof assetContent.$inferInsert;
export type AssetOwnership = typeof assetOwnership.$inferSelect;
export type NewAssetOwnership = typeof assetOwnership.$inferInsert;
export type AssetProgress = typeof assetProgress.$inferSelect;
export type NewAssetProgress = typeof assetProgress.$inferInsert;
