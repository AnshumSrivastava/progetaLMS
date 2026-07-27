/**
 * Notifications Domain Schema
 */
import {
	pgTable,
	text,
	timestamp,
	boolean,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';

export const notifications = pgTable('notifications', {
	id:        text('id').primaryKey(),
	userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	type:      text('type').notNull(),  // 'purchase' | 'certificate' | 'booking' | 'announcement'
	title:     text('title').notNull(),
	body:      text('body').notNull(),
	isRead:    boolean('is_read').notNull().default(false),
	actionUrl: text('action_url'),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	readAt:    timestamp('read_at', { withTimezone: true })
}, (t) => [
	index('notifications_user_idx').on(t.userId),
	index('notifications_read_idx').on(t.userId, t.isRead)
]);

export type Notification = typeof notifications.$inferSelect;
export type NewNotification = typeof notifications.$inferInsert;
