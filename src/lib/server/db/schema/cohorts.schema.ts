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
import { assets } from './assets.schema';

// ── Course Collaborators (Course Admin + Invited Mentors/Handlers) ───────────
export const courseCollaborators = pgTable('course_collaborators', {
	id:        text('id').primaryKey(), // CUID2
	courseId:  text('course_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
	userId:    text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	role:      text('role', { enum: ['course_admin', 'co_instructor', 'teaching_assistant'] }).notNull().default('co_instructor'),
	addedBy:   text('added_by').notNull().references(() => users.id),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('course_collab_course_idx').on(t.courseId),
	index('course_collab_user_idx').on(t.userId),
	unique('course_collab_unique').on(t.courseId, t.userId)
]);

export type CourseCollaborator = typeof courseCollaborators.$inferSelect;
export type NewCourseCollaborator = typeof courseCollaborators.$inferInsert;

// ── Cohorts / Batches ────────────────────────────────────────────────────────
export const cohorts = pgTable('cohorts', {
	id:           text('id').primaryKey(), // CUID2
	courseId:     text('course_id').notNull().references(() => assets.id),
	name:         text('name').notNull(), // e.g., 'October 2026 Live Batch'
	instructorId: text('instructor_id').notNull().references(() => users.id),
	startDate:    timestamp('start_date', { withTimezone: true }),
	endDate:      timestamp('end_date', { withTimezone: true }),
	scheduleText: text('schedule_text'), // e.g. "Tues & Thurs · 8:00 PM – 10:00 PM IST"
	timezone:     text('timezone').notNull().default('Asia/Kolkata'),
	meetingUrl:   text('meeting_url'), // Google Meet / Zoom external room
	communityUrl: text('community_url'), // WhatsApp Group / Telegram / Teams link
	sessionsData: jsonb('sessions_data').notNull().default([]), // [{ id, title, date, recordingUrl, materialsUrl }]
	status:       text('status', { enum: ['upcoming', 'in_progress', 'completed', 'cancelled'] }).notNull().default('upcoming'),
	pricePaise:   integer('price_paise'), // Override base course price
	completedAt:  timestamp('completed_at', { withTimezone: true }),
	isActive:     boolean('is_active').notNull().default(true),
	maxStudents:  integer('max_students'), // null means unlimited
	createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('cohorts_course_idx').on(t.courseId),
	index('cohorts_instructor_idx').on(t.instructorId)
]);

export const cohortMemberships = pgTable('cohort_memberships', {
	id:                    text('id').primaryKey(),
	cohortId:              text('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
	userId:                text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	role:                  text('role', { enum: ['student', 'assistant'] }).notNull().default('student'),
	status:                text('status', { enum: ['active', 'transferred', 'expired'] }).notNull().default('active'),
	accessExpiresAt:       timestamp('access_expires_at', { withTimezone: true }), // batch.completedAt + 90 days
	transferredToCohortId: text('transferred_to_cohort_id').references(() => cohorts.id),
	joinedAt:              timestamp('joined_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('cohort_members_cohort_idx').on(t.cohortId),
	index('cohort_members_user_idx').on(t.userId),
	unique('cohort_members_unique').on(t.cohortId, t.userId)
]);

export type Cohort = typeof cohorts.$inferSelect;
export type NewCohort = typeof cohorts.$inferInsert;
export type CohortMembership = typeof cohortMemberships.$inferSelect;
export type NewCohortMembership = typeof cohortMemberships.$inferInsert;

// ── Batch Transfer Ping Handshake ───────────────────────────────────────────
export const cohortTransferRequests = pgTable('cohort_transfer_requests', {
	id:           text('id').primaryKey(),
	studentId:    text('student_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
	fromCohortId: text('from_cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
	toCohortId:   text('to_cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
	initiatedBy:  text('initiated_by').notNull().references(() => users.id), // Course Admin or Mentor
	reason:       text('reason'),
	status:       text('status', { enum: ['pending', 'accepted', 'rejected', 'expired'] }).notNull().default('pending'),
	createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	expiresAt:    timestamp('expires_at', { withTimezone: true }).notNull() // e.g. 72 hours
}, (t) => [
	index('transfer_req_student_idx').on(t.studentId),
	index('transfer_req_status_idx').on(t.status)
]);

export type CohortTransferRequest = typeof cohortTransferRequests.$inferSelect;
export type NewCohortTransferRequest = typeof cohortTransferRequests.$inferInsert;

export const cohortSuggestedAssets = pgTable('cohort_suggested_assets', {
	id:        text('id').primaryKey(),
	cohortId:  text('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
	assetId:   text('asset_id').notNull().references(() => assets.id, { onDelete: 'cascade' }),
	createdAt: timestamp('created_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('cohort_suggested_assets_cohort_idx').on(t.cohortId),
	unique('cohort_suggested_assets_unique').on(t.cohortId, t.assetId)
]);

export type CohortSuggestedAsset = typeof cohortSuggestedAssets.$inferSelect;
export type NewCohortSuggestedAsset = typeof cohortSuggestedAssets.$inferInsert;
