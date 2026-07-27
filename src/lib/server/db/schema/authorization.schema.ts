/**
 * Authorization Domain Schema
 *
 * Implements a Roles → Capabilities model.
 *
 * Design decisions:
 * - Capabilities are stored in the DB (not code-only enums) so they can be
 *   queried, audited, and documented from a dashboard.
 * - Roles can be added/renamed without migrations that touch user_roles.
 * - authz_user_overrides allows future direct capability grants/denials
 *   on individual users without touching their role assignments.
 */
import {
	pgTable,
	text,
	timestamp,
	primaryKey,
	uuid
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';

export const authzRoles = pgTable('authz_roles', {
	id:          text('id').primaryKey(),
	name:        text('name').notNull().unique(),
	description: text('description'),
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const authzCapabilities = pgTable('authz_capabilities', {
	id:          text('id').primaryKey(),
	key:         text('key').notNull().unique(),  // e.g., 'asset.publish'
	description: text('description'),
	domain:      text('domain').notNull(),         // e.g., 'assets', 'commerce'
	createdAt:   timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export const authzRoleCapabilities = pgTable(
	'authz_role_capabilities',
	{
		roleId:       text('role_id').notNull().references(() => authzRoles.id, { onDelete: 'cascade' }),
		capabilityId: text('capability_id').notNull().references(() => authzCapabilities.id, { onDelete: 'cascade' })
	},
	(t) => [primaryKey({ columns: [t.roleId, t.capabilityId] })]
);

export const authzUserRoles = pgTable(
	'authz_user_roles',
	{
		userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
		roleId:    text('role_id').notNull().references(() => authzRoles.id, { onDelete: 'cascade' }),
		grantedBy: text('granted_by').references(() => users.id, { onDelete: 'set null' }),
		grantedAt: timestamp('granted_at', { withTimezone: true }).notNull().defaultNow()
	},
	(t) => [primaryKey({ columns: [t.userId, t.roleId] })]
);

/**
 * Direct user overrides — allow or deny specific capabilities per user.
 * Effect 'deny' always wins over role-derived allows.
 * This is intentionally forward-compatible — not used in Phase 1.
 */
export const authzUserOverrides = pgTable('authz_user_overrides', {
	id:           text('id').primaryKey(),
	userId:       text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	capabilityId: text('capability_id').notNull().references(() => authzCapabilities.id, { onDelete: 'cascade' }),
	effect:       text('effect', { enum: ['allow', 'deny'] }).notNull(),
	reason:       text('reason'),
	expiresAt:    timestamp('expires_at', { withTimezone: true }),
	createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
});

export type AuthzRole = typeof authzRoles.$inferSelect;
export type AuthzCapability = typeof authzCapabilities.$inferSelect;
export type AuthzUserRole = typeof authzUserRoles.$inferSelect;
