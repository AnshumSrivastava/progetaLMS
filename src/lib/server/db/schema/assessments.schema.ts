/**
 * Assessments Domain Schema
 *
 * Tests, questions, options, and attempts.
 *
 * Design decisions:
 * - A test IS an asset (asset.type = 'cert_test'). The assessment_tests table
 *   stores test-specific config; the parent asset stores title, slug, ownership.
 * - Questions are ordered by sort_order, not insertion order.
 * - Shuffling happens at read time in the service layer, not stored.
 * - Attempt answers record both the selected option AND whether it was correct,
 *   so results can be displayed without re-evaluating (immutable audit trail).
 * - The evaluator is pluggable: MCQ is the first implementation.
 *   Future types (essay, coding) add new evaluators without touching this schema.
 */
import {
	pgTable,
	text,
	timestamp,
	integer,
	boolean,
	jsonb,
	uuid,
	index
} from 'drizzle-orm/pg-core';
import { users } from './identity.schema';
import { assets } from './assets.schema';

export const assessmentTests = pgTable('assessment_tests', {
	id:               text('id').primaryKey(),
	assetId:          text('asset_id').notNull().unique().references(() => assets.id, { onDelete: 'cascade' }),
	passingPercent:   integer('passing_percent').notNull().default(70),
	timeLimitMins:    integer('time_limit_mins'),   // NULL = no limit
	maxAttempts:      integer('max_attempts'),      // NULL = unlimited
	shuffleQuestions: boolean('shuffle_questions').notNull().default(true),
	shuffleOptions:   boolean('shuffle_options').notNull().default(true),
	createdAt:        timestamp('created_at', { withTimezone: true }).notNull().defaultNow(),
	updatedAt:        timestamp('updated_at', { withTimezone: true }).notNull().defaultNow()
});

export const assessmentQuestions = pgTable('assessment_questions', {
	id:          text('id').primaryKey(),
	testId:      text('test_id').notNull().references(() => assessmentTests.id, { onDelete: 'cascade' }),
	type:        text('type', { enum: ['mcq', 'essay', 'coding'] }).notNull().default('mcq'),
	content:     text('content').notNull(),   // Markdown-supported question text
	explanation: text('explanation'),         // Shown after submission
	points:      integer('points').notNull().default(1),
	sortOrder:   integer('sort_order').notNull().default(0),
	metadata:    jsonb('metadata').notNull().default({})   // future: hints, tags, difficulty
}, (t) => [
	index('questions_test_idx').on(t.testId)
]);

export const assessmentOptions = pgTable('assessment_options', {
	id:          text('id').primaryKey(),
	questionId:  text('question_id').notNull().references(() => assessmentQuestions.id, { onDelete: 'cascade' }),
	content:     text('content').notNull(),
	isCorrect:   boolean('is_correct').notNull(),
	sortOrder:   integer('sort_order').notNull().default(0)
}, (t) => [
	index('options_question_idx').on(t.questionId)
]);

export const assessmentAttempts = pgTable('assessment_attempts', {
	id:          text('id').primaryKey(),
	testId:      text('test_id').notNull().references(() => assessmentTests.id),
	userId:      text('user_id').notNull().references(() => users.id),
	status:      text('status', {
		enum: ['in_progress', 'submitted', 'evaluated']
	}).notNull().default('in_progress'),
	score:       integer('score'),
	maxScore:    integer('max_score'),
	passed:      boolean('passed'),
	startedAt:   timestamp('started_at', { withTimezone: true }).notNull().defaultNow(),
	submittedAt: timestamp('submitted_at', { withTimezone: true }),
	evaluatedAt: timestamp('evaluated_at', { withTimezone: true })
}, (t) => [
	index('attempts_user_idx').on(t.userId),
	index('attempts_test_idx').on(t.testId),
	index('attempts_status_idx').on(t.status)
]);

export const assessmentAttemptAnswers = pgTable('assessment_attempt_answers', {
	id:               text('id').primaryKey(),
	attemptId:        text('attempt_id').notNull().references(() => assessmentAttempts.id, { onDelete: 'cascade' }),
	questionId:       text('question_id').notNull().references(() => assessmentQuestions.id),
	selectedOptionId: text('selected_option_id').references(() => assessmentOptions.id),
	textAnswer:       text('text_answer'),    // future: essay
	isCorrect:        boolean('is_correct'),
	pointsEarned:     integer('points_earned').notNull().default(0)
}, (t) => [
	index('answers_attempt_idx').on(t.attemptId)
]);

export type AssessmentTest = typeof assessmentTests.$inferSelect;
export type NewAssessmentTest = typeof assessmentTests.$inferInsert;
export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type NewAssessmentQuestion = typeof assessmentQuestions.$inferInsert;
export type AssessmentOption = typeof assessmentOptions.$inferSelect;
export type AssessmentAttempt = typeof assessmentAttempts.$inferSelect;
export type NewAssessmentAttempt = typeof assessmentAttempts.$inferInsert;
