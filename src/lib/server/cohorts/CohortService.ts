import { db } from '$lib/server/db/client';
import {
	cohorts,
	cohortMemberships,
	courseCollaborators,
	cohortTransferRequests,
	type Cohort,
	type CohortMembership,
	type CourseCollaborator
} from '$lib/server/db/schema/cohorts.schema';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { users, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq, and, sql, gte, isNull, inArray, desc, asc } from 'drizzle-orm';
import { createId } from '@paralleldrive/cuid2';

export interface SessionLinkItem {
	id: string;
	title: string;
	date: string;
	recordingUrl?: string; // e.g. Google Drive, YouTube unlisted, Zoom cloud
	materialsUrl?: string; // e.g. Notion, GitHub repo, Drive folder
	notes?: string;
}

/**
 * Enrollment for a batch closes this many days before its start date.
 * The public catalog automatically rolls over to the next batch once a batch
 * enters this window (or fills up).
 */
export const ENROLLMENT_CUTOFF_DAYS = 7;

export class CohortService {
	/**
	 * Whether a batch is still accepting enrollments based on its start date.
	 * Batches without a start date are considered open.
	 */
	static isEnrollmentOpen(batch: { startDate: Date | string | null }, now: Date = new Date()): boolean {
		if (!batch.startDate) return true;
		const cutoffMs = new Date(batch.startDate).getTime() - ENROLLMENT_CUTOFF_DAYS * 24 * 60 * 60 * 1000;
		return now.getTime() < cutoffMs;
	}

	// ── 1. COURSE ADMIN & COLLABORATORS MANAGEMENT ──────────────────────────

	/**
	 * Checks if a user has management access to a course:
	 * Either they are the Course Admin (creator/owner of the asset),
	 * or they are an invited collaborator (co_instructor / assistant),
	 * or they are a platform super_admin.
	 */
	static async canManageCourse(courseId: string, userId: string): Promise<boolean> {
		const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
		if (user?.role === 'super_admin' || user?.role === 'owner') return true;

		// Check if creator/owner of the course asset (Course Admin)
		const [asset] = await db
			.select({ ownerId: assets.ownerId })
			.from(assets)
			.where(and(eq(assets.id, courseId), isNull(assets.deletedAt)))
			.limit(1);

		if (asset && asset.ownerId === userId) return true;

		// Check if registered in course_collaborators
		const [collab] = await db
			.select({ id: courseCollaborators.id })
			.from(courseCollaborators)
			.where(and(eq(courseCollaborators.courseId, courseId), eq(courseCollaborators.userId, userId)))
			.limit(1);

		return !!collab;
	}

	/**
	 * Checks if a user is the primary Course Admin (creator/owner) of the course.
	 * Only Course Admins can add or remove other collaborating mentors.
	 */
	static async isCourseAdmin(courseId: string, userId: string): Promise<boolean> {
		const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
		if (user?.role === 'super_admin' || user?.role === 'owner') return true;

		const [asset] = await db
			.select({ ownerId: assets.ownerId })
			.from(assets)
			.where(and(eq(assets.id, courseId), isNull(assets.deletedAt)))
			.limit(1);

		return asset?.ownerId === userId;
	}

	/**
	 * Retrieves all collaborating mentors assigned to a course.
	 */
	static async getCourseCollaborators(courseId: string) {
		return await db
			.select({
				id: courseCollaborators.id,
				userId: users.id,
				name: users.name,
				email: users.email,
				role: courseCollaborators.role,
				avatarUrl: identityProfiles.avatarUrl,
				headline: identityProfiles.mentoringHeadline,
				createdAt: courseCollaborators.createdAt
			})
			.from(courseCollaborators)
			.innerJoin(users, eq(courseCollaborators.userId, users.id))
			.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
			.where(eq(courseCollaborators.courseId, courseId))
			.orderBy(asc(courseCollaborators.createdAt));
	}

	/**
	 * Course Admin invites/adds a mentor to collaborate on this course.
	 */
	static async addCourseCollaborator(
		courseId: string,
		actorId: string,
		targetUserEmailOrId: string,
		role: 'co_instructor' | 'teaching_assistant' = 'co_instructor'
	) {
		const isPermitted = await this.isCourseAdmin(courseId, actorId);
		if (!isPermitted) {
			throw new Error('Only the Course Admin can add instructors to this course');
		}

		// Find target user by email or ID
		const [target] = await db
			.select({ id: users.id, role: users.role })
			.from(users)
			.where(
				targetUserEmailOrId.includes('@')
					? eq(users.email, targetUserEmailOrId.trim().toLowerCase())
					: eq(users.id, targetUserEmailOrId.trim())
			)
			.limit(1);

		if (!target) {
			throw new Error('User not found. They must have an existing account on Launchpad.');
		}

		// Prevent adding the course owner as a collaborator
		const [asset] = await db.select({ ownerId: assets.ownerId }).from(assets).where(eq(assets.id, courseId)).limit(1);
		if (asset?.ownerId === target.id) {
			throw new Error('This user is already the primary Course Admin');
		}

		const collabId = createId();
		await db
			.insert(courseCollaborators)
			.values({
				id: collabId,
				courseId,
				userId: target.id,
				role,
				addedBy: actorId
			})
			.onConflictDoNothing();

		return { success: true, collabId, userId: target.id };
	}

	/**
	 * Course Admin removes a collaborator from the course.
	 */
	static async removeCourseCollaborator(courseId: string, actorId: string, collaboratorUserId: string) {
		const isPermitted = await this.isCourseAdmin(courseId, actorId);
		if (!isPermitted) {
			throw new Error('Only the Course Admin can remove collaborating instructors');
		}

		await db
			.delete(courseCollaborators)
			.where(and(eq(courseCollaborators.courseId, courseId), eq(courseCollaborators.userId, collaboratorUserId)));

		return { success: true };
	}

	// ── 2. BATCHES & LINK MANAGEMENT ──────────────────────────────────────────

	/**
	 * Retrieves all batches for a course with active enrolled counts.
	 */
	static async getCourseBatches(courseId: string) {
		const rows = await db
			.select({
				id: cohorts.id,
				courseId: cohorts.courseId,
				name: cohorts.name,
				instructorId: cohorts.instructorId,
				instructorName: users.name,
				startDate: cohorts.startDate,
				endDate: cohorts.endDate,
				scheduleText: cohorts.scheduleText,
				timezone: cohorts.timezone,
				meetingUrl: cohorts.meetingUrl,
				communityUrl: cohorts.communityUrl,
				sessionsData: cohorts.sessionsData,
				status: cohorts.status,
				completedAt: cohorts.completedAt,
				maxStudents: cohorts.maxStudents,
				pricePaise: cohorts.pricePaise,
				isActive: cohorts.isActive,
				createdAt: cohorts.createdAt
			})
			.from(cohorts)
			.innerJoin(users, eq(cohorts.instructorId, users.id))
			.where(eq(cohorts.courseId, courseId))
			.orderBy(asc(cohorts.startDate));

		// Get active membership counts per cohort
		const cohortIds = rows.map((r) => r.id);
		let counts: Record<string, number> = {};

		if (cohortIds.length > 0) {
			const countRows = await db
				.select({
					cohortId: cohortMemberships.cohortId,
					count: sql<number>`count(*)`
				})
				.from(cohortMemberships)
				.where(and(inArray(cohortMemberships.cohortId, cohortIds), eq(cohortMemberships.status, 'active')))
				.groupBy(cohortMemberships.cohortId);

			countRows.forEach((c) => {
				counts[c.cohortId] = Number(c.count);
			});
		}

		return rows.map((r) => {
			const enrolledCount = counts[r.id] || 0;
			const maxStudents = r.maxStudents ?? null;
			const isSoldOut = maxStudents !== null && enrolledCount >= maxStudents;
			const seatsLeft = maxStudents !== null ? Math.max(0, maxStudents - enrolledCount) : null;

			return {
				...r,
				enrolledCount,
				isSoldOut,
				seatsLeft
			};
		});
	}

	/**
	 * Creates a new live classroom batch under a course.
	 */
	static async createBatch(
		courseId: string,
		actorId: string,
		data: {
			name: string;
			startDate: Date;
			endDate?: Date;
			scheduleText: string;
			timezone?: string;
			maxStudents?: number;
			meetingUrl?: string;
			communityUrl?: string;
		}
	) {
		const canManage = await this.canManageCourse(courseId, actorId);
		if (!canManage) {
			throw new Error('You do not have permission to create batches for this course');
		}

		const batchId = createId();
		await db.insert(cohorts).values({
			id: batchId,
			courseId,
			name: data.name.trim(),
			instructorId: actorId,
			startDate: data.startDate,
			endDate: data.endDate || null,
			scheduleText: data.scheduleText?.trim() || null,
			timezone: data.timezone || 'Asia/Kolkata',
			maxStudents: data.maxStudents || null,
			meetingUrl: data.meetingUrl?.trim() || null,
			communityUrl: data.communityUrl?.trim() || null,
			sessionsData: [],
			status: 'upcoming',
			isActive: true
		});

		return { success: true, batchId };
	}

	/**
	 * Updates the external links (Google Meet, WhatsApp) and schedule text for a batch.
	 */
	static async updateBatchLinks(
		batchId: string,
		actorId: string,
		links: {
			meetingUrl?: string;
			communityUrl?: string;
			scheduleText?: string;
		}
	) {
		const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, batchId)).limit(1);
		if (!batch) throw new Error('Batch not found');

		const canManage = await this.canManageCourse(batch.courseId, actorId);
		if (!canManage) throw new Error('Permission denied');

		await db
			.update(cohorts)
			.set({
				...(links.meetingUrl !== undefined && { meetingUrl: links.meetingUrl.trim() || null }),
				...(links.communityUrl !== undefined && { communityUrl: links.communityUrl.trim() || null }),
				...(links.scheduleText !== undefined && { scheduleText: links.scheduleText.trim() || null }),
				updatedAt: new Date()
			})
			.where(eq(cohorts.id, batchId));

		return { success: true };
	}

	/**
	 * Appends or edits a session link (recording / material URL) in a batch.
	 */
	static async addSessionLink(
		batchId: string,
		actorId: string,
		session: {
			title: string;
			date: string;
			recordingUrl?: string;
			materialsUrl?: string;
			notes?: string;
		}
	) {
		const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, batchId)).limit(1);
		if (!batch) throw new Error('Batch not found');

		const canManage = await this.canManageCourse(batch.courseId, actorId);
		if (!canManage) throw new Error('Permission denied');

		const currentSessions = (batch.sessionsData as SessionLinkItem[]) || [];
		const newSessionItem: SessionLinkItem = {
			id: createId(),
			title: session.title.trim(),
			date: session.date,
			recordingUrl: session.recordingUrl?.trim() || undefined,
			materialsUrl: session.materialsUrl?.trim() || undefined,
			notes: session.notes?.trim() || undefined
		};

		const updatedSessions = [...currentSessions, newSessionItem];

		await db
			.update(cohorts)
			.set({
				sessionsData: updatedSessions,
				updatedAt: new Date()
			})
			.where(eq(cohorts.id, batchId));

		return { success: true, session: newSessionItem };
	}

	/**
	 * Marks a batch completed and enforces the strict 3-month (90 days) content retention rule.
	 */
	static async markBatchCompleted(batchId: string, actorId: string) {
		const [batch] = await db.select().from(cohorts).where(eq(cohorts.id, batchId)).limit(1);
		if (!batch) throw new Error('Batch not found');

		const canManage = await this.canManageCourse(batch.courseId, actorId);
		if (!canManage) throw new Error('Permission denied');

		const completedAt = new Date();
		// 3 months (90 days) expiration
		const accessExpiresAt = new Date(completedAt.getTime() + 90 * 24 * 60 * 60 * 1000);

		// Update batch status
		await db
			.update(cohorts)
			.set({
				status: 'completed',
				completedAt,
				updatedAt: completedAt
			})
			.where(eq(cohorts.id, batchId));

		// Set access_expires_at on all active student memberships
		await db
			.update(cohortMemberships)
			.set({
				accessExpiresAt
			})
			.where(and(eq(cohortMemberships.cohortId, batchId), eq(cohortMemberships.status, 'active')));

		return { success: true, completedAt, accessExpiresAt };
	}

	// ── 3. DUAL-HANDSHAKE BATCH TRANSFER PING ─────────────────────────────────

	/**
	 * Instructor or Course Admin sends a Transfer Ping to a student.
	 */
	static async sendTransferPing(
		actorId: string,
		opts: {
			studentId: string;
			fromCohortId: string;
			toCohortId: string;
			reason?: string;
		}
	) {
		const [fromBatch] = await db.select().from(cohorts).where(eq(cohorts.id, opts.fromCohortId)).limit(1);
		const [toBatch] = await db.select().from(cohorts).where(eq(cohorts.id, opts.toCohortId)).limit(1);

		if (!fromBatch || !toBatch) throw new Error('Source or target batch not found');

		const canManage = await this.canManageCourse(fromBatch.courseId, actorId);
		if (!canManage) throw new Error('Permission denied to initiate transfers');

		// Verify student is in fromCohort
		const [membership] = await db
			.select()
			.from(cohortMemberships)
			.where(and(eq(cohortMemberships.cohortId, opts.fromCohortId), eq(cohortMemberships.userId, opts.studentId)))
			.limit(1);

		if (!membership || membership.status !== 'active') {
			throw new Error('Student is not an active member of the origin batch');
		}

		// Verify target batch has capacity
		if (toBatch.maxStudents !== null) {
			const [{ count }] = await db
				.select({ count: sql<number>`count(*)` })
				.from(cohortMemberships)
				.where(and(eq(cohortMemberships.cohortId, opts.toCohortId), eq(cohortMemberships.status, 'active')));

			if (Number(count) >= toBatch.maxStudents) {
				throw new Error('The target batch is currently at full capacity');
			}
		}

		const requestId = createId();
		const expiresAt = new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours window

		await db.insert(cohortTransferRequests).values({
			id: requestId,
			studentId: opts.studentId,
			fromCohortId: opts.fromCohortId,
			toCohortId: opts.toCohortId,
			initiatedBy: actorId,
			reason: opts.reason || null,
			status: 'pending',
			expiresAt
		});

		return { success: true, requestId, expiresAt };
	}

	/**
	 * Student accepts the Transfer Ping.
	 * Executes an atomic database transaction:
	 * 1. Checks target batch capacity.
	 * 2. Delinks old batch membership (sets status: 'transferred').
	 * 3. Enrolls into new batch (with new 3-month post-completion expiry).
	 * 4. Marks transfer request 'accepted'.
	 */
	static async acceptTransferPing(studentId: string, requestId: string) {
		const [req] = await db
			.select()
			.from(cohortTransferRequests)
			.where(and(eq(cohortTransferRequests.id, requestId), eq(cohortTransferRequests.studentId, studentId)))
			.limit(1);

		if (!req) throw new Error('Transfer request not found');
		if (req.status !== 'pending') throw new Error(`Transfer request is already ${req.status}`);
		if (new Date(req.expiresAt).getTime() < Date.now()) {
			await db.update(cohortTransferRequests).set({ status: 'expired' }).where(eq(cohortTransferRequests.id, requestId));
			throw new Error('This transfer offer has expired. Please contact your instructor.');
		}

		const [toBatch] = await db.select().from(cohorts).where(eq(cohorts.id, req.toCohortId)).limit(1);
		if (!toBatch) throw new Error('Target batch no longer exists');

		// Verify target batch seat capacity
		if (toBatch.maxStudents !== null) {
			const [{ count }] = await db
				.select({ count: sql<number>`count(*)` })
				.from(cohortMemberships)
				.where(and(eq(cohortMemberships.cohortId, req.toCohortId), eq(cohortMemberships.status, 'active')));

			if (Number(count) >= toBatch.maxStudents) {
				throw new Error('Target batch has filled up. Please ask your mentor for an alternative batch.');
			}
		}

		// Calculate expiry: if toBatch has completed, set to completedAt + 90 days
		const accessExpiresAt = toBatch.completedAt
			? new Date(new Date(toBatch.completedAt).getTime() + 90 * 24 * 60 * 60 * 1000)
			: null;

		// Atomic execution
		await db.batch([
			// 1. Mark old batch membership transferred
			db
				.update(cohortMemberships)
				.set({
					status: 'transferred',
					transferredToCohortId: req.toCohortId
				})
				.where(and(eq(cohortMemberships.cohortId, req.fromCohortId), eq(cohortMemberships.userId, studentId))),

			// 2. Insert new batch membership
			db.insert(cohortMemberships).values({
				id: createId(),
				cohortId: req.toCohortId,
				userId: studentId,
				role: 'student',
				status: 'active',
				accessExpiresAt
			}),

			// 3. Mark transfer request accepted
			db.update(cohortTransferRequests).set({ status: 'accepted' }).where(eq(cohortTransferRequests.id, requestId))
		]);

		return { success: true, newCohortId: req.toCohortId, newCohortName: toBatch.name };
	}

	/**
	 * Retrieves any pending transfer ping for a student.
	 */
	static async getStudentPendingTransfer(studentId: string) {
		const [req] = await db
			.select({
				id: cohortTransferRequests.id,
				studentId: cohortTransferRequests.studentId,
				fromCohortId: cohortTransferRequests.fromCohortId,
				fromCohortName: sql<string>`from_c.name`,
				toCohortId: cohortTransferRequests.toCohortId,
				toCohortName: sql<string>`to_c.name`,
				toCohortSchedule: sql<string>`to_c.schedule_text`,
				toCohortStartDate: sql<Date>`to_c.start_date`,
				reason: cohortTransferRequests.reason,
				expiresAt: cohortTransferRequests.expiresAt,
				mentorName: users.name
			})
			.from(cohortTransferRequests)
			.innerJoin(sql`cohorts AS from_c`, sql`from_c.id = ${cohortTransferRequests.fromCohortId}`)
			.innerJoin(sql`cohorts AS to_c`, sql`to_c.id = ${cohortTransferRequests.toCohortId}`)
			.innerJoin(users, eq(cohortTransferRequests.initiatedBy, users.id))
			.where(
				and(
					eq(cohortTransferRequests.studentId, studentId),
					eq(cohortTransferRequests.status, 'pending'),
					gte(cohortTransferRequests.expiresAt, new Date())
				)
			)
			.limit(1);

		return req || null;
	}

	// ── 4. STUDENT BATCH ACCESS & 3-MONTH EXPIRY GUARD ─────────────────────────

	/**
	 * Retrieves batch details for the student dashboard.
	 * Enforces the strict 3-month post-completion retention window.
	 */
	static async getStudentBatchHub(cohortId: string, userId: string) {
		const [membership] = await db
			.select()
			.from(cohortMemberships)
			.where(and(eq(cohortMemberships.cohortId, cohortId), eq(cohortMemberships.userId, userId)))
			.limit(1);

		if (!membership || membership.status !== 'active') {
			return { hasAccess: false, reason: 'No active enrollment in this batch' };
		}

		const [batch] = await db
			.select({
				id: cohorts.id,
				name: cohorts.name,
				courseId: cohorts.courseId,
				courseTitle: assets.title,
				instructorName: users.name,
				startDate: cohorts.startDate,
				endDate: cohorts.endDate,
				scheduleText: cohorts.scheduleText,
				timezone: cohorts.timezone,
				meetingUrl: cohorts.meetingUrl,
				communityUrl: cohorts.communityUrl,
				sessionsData: cohorts.sessionsData,
				status: cohorts.status,
				completedAt: cohorts.completedAt
			})
			.from(cohorts)
			.innerJoin(assets, eq(cohorts.courseId, assets.id))
			.innerJoin(users, eq(cohorts.instructorId, users.id))
			.where(eq(cohorts.id, cohortId))
			.limit(1);

		if (!batch) return { hasAccess: false, reason: 'Batch not found' };

		// Check 3-month retention window
		const now = Date.now();
		let isExpired = false;
		let daysRemaining: number | null = null;

		if (membership.accessExpiresAt) {
			const expiryMs = new Date(membership.accessExpiresAt).getTime();
			if (now > expiryMs) {
				isExpired = true;
			} else {
				daysRemaining = Math.max(0, Math.ceil((expiryMs - now) / (1000 * 60 * 60 * 24)));
			}
		}

		if (isExpired) {
			return {
				hasAccess: false,
				isExpired: true,
				batchName: batch.name,
				courseTitle: batch.courseTitle,
				completedAt: batch.completedAt,
				message: 'The 3-month content retention window for this batch has concluded.'
			};
		}

		return {
			hasAccess: true,
			isExpired: false,
			daysRemaining,
			batch: {
				...batch,
				sessions: (batch.sessionsData as SessionLinkItem[]) || []
			}
		};
	}
}
