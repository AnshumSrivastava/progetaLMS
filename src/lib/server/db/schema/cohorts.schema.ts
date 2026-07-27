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

export const cohorts = pgTable('cohorts', {
	id:           text('id').primaryKey(), // CUID2
	courseId:     text('course_id').notNull().references(() => assets.id),
	name:         text('name').notNull(), // e.g., 'Fall 2026 Cohort'
	instructorId: text('instructor_id').notNull().references(() => users.id),
	startDate:    timestamp('start_date', { withTimezone: true }),
	endDate:      timestamp('end_date', { withTimezone: true }),
	isActive:     boolean('is_active').notNull().default(true),
	maxStudents:  integer('max_students'), // null means unlimited
	createdAt:    timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:    timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('cohorts_course_idx').on(t.courseId),
	index('cohorts_instructor_idx').on(t.instructorId)
]);

export const cohortMemberships = pgTable('cohort_memberships', {
	id:        text('id').primaryKey(),
	cohortId:  text('cohort_id').notNull().references(() => cohorts.id, { onDelete: 'cascade' }),
	userId:    text('user_id').notNull().references(() => users.id),
	role:      text('role', { enum: ['student', 'assistant'] }).notNull().default('student'),
	joinedAt:  timestamp('joined_at', { withTimezone: true }).notNull().defaultNow()
}, (t) => [
	index('cohort_members_cohort_idx').on(t.cohortId),
	index('cohort_members_user_idx').on(t.userId),
	unique('cohort_members_unique').on(t.cohortId, t.userId)
]);

export type Cohort = typeof cohorts.$inferSelect;
export type NewCohort = typeof cohorts.$inferInsert;
export type CohortMembership = typeof cohortMemberships.$inferSelect;
export type NewCohortMembership = typeof cohortMemberships.$inferInsert;
