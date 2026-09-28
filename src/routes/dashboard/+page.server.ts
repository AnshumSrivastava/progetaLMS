import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { events, eventAttendees, platformSettings } from '$lib/server/db/schema/platform.schema';
import { cohorts, cohortMemberships, cohortSuggestedAssets, courseCollaborators } from '$lib/server/db/schema/cohorts.schema';
import { assessmentTests, assessmentAttempts } from '$lib/server/db/schema/assessments.schema';
import { users, auditLogs, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { emailTemplates, notifications } from '$lib/server/db/schema/notifications.schema';
import { commerceOrders, commerceCoupons } from '$lib/server/db/schema/commerce.schema';
import { eventOutbox } from '$lib/server/db/schema/outbox.schema';
import { eq, and, isNull, inArray, desc, sql, not } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { createId } from '@paralleldrive/cuid2';
import { auth } from '$lib/server/auth/auth.config';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/');
	}

	const role = locals.user.role || 'student';
	const isTeacher = role === 'teacher' || role === 'admin' || role === 'owner';
	const isAdmin = role === 'admin' || role === 'owner';
	const isOwner = role === 'owner';

	// ── 1. LEARNER DATA (Safe for all users) ───────────────────
	let ownedCourses: any[] = [];
	let ownedResources: any[] = [];
	let ownedCerts: any[] = [];
	let issuedCertificates: any[] = [];
	let upcomingEvents: any[] = [];
	let registeredEventIds: string[] = [];
	let userCohorts: any[] = [];
	let avgQuizScore = '—';

	try {
		const owned = await db
			.select({
				id: assets.id,
				slug: assets.slug,
				title: assets.title,
				description: assets.description,
				type: assets.type,
				thumbnail: assets.thumbnail,
				metadata: assets.metadata,
				grantedAt: assetOwnership.grantedAt
			})
			.from(assetOwnership)
			.innerJoin(assets, eq(assetOwnership.assetId, assets.id))
			.where(
				and(
					eq(assetOwnership.ownerId, locals.user.id),
					isNull(assetOwnership.revokedAt),
					isNull(assets.deletedAt)
				)
			);

		ownedCourses = owned.filter(a => ['html', 'markdown', 'pdf'].includes(a.type));
		ownedResources = owned.filter(a => ['download', 'external'].includes(a.type));

		const issuedCertsWithAsset = await db
			.select({
				certificate: certificates,
				assetId: assessmentTests.assetId
			})
			.from(certificates)
			.innerJoin(assessmentTests, eq(certificates.testId, assessmentTests.id))
			.where(eq(certificates.userId, locals.user.id));

		const issuedAssetIds = new Set(issuedCertsWithAsset.map(c => c.assetId));
		issuedCertificates = issuedCertsWithAsset.map(c => c.certificate);
		ownedCerts = owned.filter(a => a.type === 'cert_test' && !issuedAssetIds.has(a.id));

		upcomingEvents = await db.select().from(events).orderBy(desc(events.date)).limit(20);
		const myAttendees = await db.select().from(eventAttendees).where(eq(eventAttendees.userId, locals.user.id));
		registeredEventIds = myAttendees.map(a => a.eventId);

		// Real Quiz Score from assessmentAttempts
		const myAttempts = await db
			.select({ percentage: assessmentAttempts.percentage })
			.from(assessmentAttempts)
			.where(eq(assessmentAttempts.userId, locals.user.id));

		avgQuizScore = myAttempts.length > 0
			? `${Math.round(myAttempts.reduce((sum, a) => sum + (a.percentage || 0), 0) / myAttempts.length)}%`
			: '—';

		const myCohortMemberships = await db
			.select({ cohortId: cohortMemberships.cohortId, role: cohortMemberships.role })
			.from(cohortMemberships)
			.where(eq(cohortMemberships.userId, locals.user.id));

		const myCohortIds = myCohortMemberships.map(m => m.cohortId);
		if (myCohortIds.length > 0) {
			const rawCohorts = await db.select().from(cohorts).where(inArray(cohorts.id, myCohortIds));
			const mySuggested = await db
				.select({
					cohortId: cohortSuggestedAssets.cohortId,
					asset: {
						id: assets.id,
						title: assets.title,
						type: assets.type,
						pricePaise: assets.pricePaise,
						thumbnail: assets.thumbnail
					}
				})
				.from(cohortSuggestedAssets)
				.innerJoin(assets, eq(cohortSuggestedAssets.assetId, assets.id))
				.where(inArray(cohortSuggestedAssets.cohortId, myCohortIds));

			userCohorts = rawCohorts.map(c => ({
				...c,
				suggestedAssets: mySuggested.filter(s => s.cohortId === c.id).map(s => s.asset)
			}));
		}
	} catch (err) {
		console.error('Error loading learner data:', err);
	}

	// ── 1b. LIVE CLASSROOM BATCHES & TRANSFER PING ─────────────
	let liveBatches: any[] = [];
	let pendingTransfer: any = null;

	try {
		const { CohortService } = await import('$lib/server/cohorts/CohortService');
		pendingTransfer = await CohortService.getStudentPendingTransfer(locals.user.id);

		// Get all active memberships
		const activeMemberships = await db
			.select({ cohortId: cohortMemberships.cohortId })
			.from(cohortMemberships)
			.where(and(eq(cohortMemberships.userId, locals.user.id), eq(cohortMemberships.status, 'active')));

		for (const mem of activeMemberships) {
			const hubData = await CohortService.getStudentBatchHub(mem.cohortId, locals.user.id);
			if (hubData) {
				liveBatches.push(hubData);
			}
		}
	} catch (err) {
		console.error('Error loading live batches for learner:', err);
	}

	// ── 2. TEACHER DATA (If Teacher, Admin, or Owner) ──────────
	let teacherStats = { totalStudents: 0, activeCourses: 0, activeCerts: 0, avgRating: '—', totalRevenue: '0' };
	let teacherCourses: any[] = [];
	let teacherClasses: any[] = [];
	let teacherStudents: any[] = [];
	let teacherCertifications: any[] = [];
	let teacherCoupons: any[] = [];
	let teacherTemplates: any[] = [];
	let teacherRecentActivity: any[] = [];

	if (isTeacher) {
		try {
			// Find courses where user is owner OR collaborator
			const collabRows = await db
				.select({ courseId: courseCollaborators.courseId })
				.from(courseCollaborators)
				.where(eq(courseCollaborators.userId, locals.user.id));
			const collabCourseIds = collabRows.map(r => r.courseId);

			const courseConditions = [
				and(
					inArray(assets.type, ['html', 'markdown', 'pdf']),
					eq(assets.ownerId, locals.user.id),
					isNull(assets.deletedAt)
				)
			];
			if (collabCourseIds.length > 0) {
				courseConditions.push(
					and(
						inArray(assets.type, ['html', 'markdown', 'pdf']),
						inArray(assets.id, collabCourseIds),
						isNull(assets.deletedAt)
					)
				);
			}

			const rawTeacherCourses = await db
				.select()
				.from(assets)
				.where(sql`(${courseConditions[0]}) ${collabCourseIds.length > 0 ? sql`OR (${courseConditions[1]})` : sql``}`)
				.orderBy(desc(assets.createdAt));

			const courseIds = rawTeacherCourses.map(a => a.id);
			let studentCountMap = new Map<string, number>();
			if (courseIds.length > 0) {
				const counts = await db
					.select({
						assetId: assetOwnership.assetId,
						count: sql<number>`count(distinct ${assetOwnership.ownerId})`
					})
					.from(assetOwnership)
					.where(and(inArray(assetOwnership.assetId, courseIds), isNull(assetOwnership.revokedAt)))
					.groupBy(assetOwnership.assetId);
				counts.forEach(c => studentCountMap.set(c.assetId, Number(c.count) || 0));
			}

			teacherCourses = rawTeacherCourses.map(c => {
				const isOwner = c.ownerId === locals.user.id;
				const priceVal = (c.pricePaise / 100).toFixed(2);
				const priceFormatted = c.pricePaise === 0 ? 'Free' : (c.currency === 'USD' ? `$${priceVal}` : `₹${(c.pricePaise / 100).toLocaleString('en-IN')}`);
				return {
					...c,
					students: studentCountMap.get(c.id) || 0,
					price: priceFormatted,
					rawPrice: c.pricePaise / 100,
					rawCurrency: c.currency || 'INR',
					status: c.status === 'published' ? 'Published' : 'Draft',
					isCourseAdmin: isOwner
				};
			});

			// Teacher's cohorts & classes
			const myCohorts = await db
				.select({
					id: cohorts.id,
					name: cohorts.name,
					courseId: cohorts.courseId,
					courseTitle: assets.title,
					isActive: cohorts.isActive,
					status: cohorts.status,
					startDate: cohorts.startDate,
					endDate: cohorts.endDate,
					scheduleText: cohorts.scheduleText,
					timezone: cohorts.timezone,
					meetingUrl: cohorts.meetingUrl,
					communityUrl: cohorts.communityUrl,
					maxStudents: cohorts.maxStudents,
					completedAt: cohorts.completedAt,
					createdAt: cohorts.createdAt
				})
				.from(cohorts)
				.leftJoin(assets, eq(cohorts.courseId, assets.id))
				.where(eq(cohorts.instructorId, locals.user.id))
				.orderBy(desc(cohorts.createdAt));

			const myCohortIds = myCohorts.map(c => c.id);
			let cohortStudentCounts = new Map<string, number>();
			if (myCohortIds.length > 0) {
				const counts = await db
					.select({
						cohortId: cohortMemberships.cohortId,
						count: sql<number>`count(distinct ${cohortMemberships.userId})`
					})
					.from(cohortMemberships)
					.where(and(inArray(cohortMemberships.cohortId, myCohortIds), eq(cohortMemberships.status, 'active')))
					.groupBy(cohortMemberships.cohortId);
				counts.forEach(c => cohortStudentCounts.set(c.cohortId, Number(c.count) || 0));
			}

			teacherClasses = myCohorts.map(c => ({
				...c,
				course: c.courseTitle || 'Unassigned Course',
				students: cohortStudentCounts.get(c.id) || 0
			}));

			// Teacher's enrolled students across cohorts
			if (myCohortIds.length > 0) {
				teacherStudents = await db
					.select({
						id: users.id,
						name: users.name,
						email: users.email,
						cohortId: cohortMemberships.cohortId,
						cohortName: cohorts.name,
						joinedAt: cohortMemberships.joinedAt,
						status: cohortMemberships.status
					})
					.from(cohortMemberships)
					.innerJoin(users, eq(cohortMemberships.userId, users.id))
					.innerJoin(cohorts, eq(cohortMemberships.cohortId, cohorts.id))
					.where(inArray(cohortMemberships.cohortId, myCohortIds))
					.orderBy(desc(cohortMemberships.joinedAt))
					.limit(50);
			}

			// Teacher Certifications
			const certAssets = await db
				.select({
					id: assets.id,
					slug: assets.slug,
					title: assets.title,
					status: assets.status,
					pricePaise: assets.pricePaise,
					currency: assets.currency,
					createdAt: assets.createdAt,
					testId: assessmentTests.id,
					passingPercent: assessmentTests.passingPercent,
					metadata: assets.metadata
				})
				.from(assets)
				.innerJoin(assessmentTests, eq(assets.id, assessmentTests.assetId))
				.where(
					and(
						eq(assets.type, 'cert_test'),
						eq(assets.ownerId, locals.user.id),
						isNull(assets.deletedAt)
					)
				)
				.orderBy(desc(assets.createdAt));

			teacherCertifications = certAssets.map(c => ({
				...c,
				price: c.pricePaise > 0 ? `₹${c.pricePaise / 100}` : 'Free',
				rawPrice: c.pricePaise / 100,
				duration: (c.metadata as any)?.duration || 120,
				questionsCount: (c.metadata as any)?.questions || 50,
				isProctored: (c.metadata as any)?.isProctored !== false
			}));

			// Teacher Coupons
			teacherCoupons = await db
				.select()
				.from(commerceCoupons)
				.where(eq(commerceCoupons.createdBy, locals.user.id))
				.orderBy(desc(commerceCoupons.createdAt));

			// Teacher Email Templates
			teacherTemplates = await db
				.select()
				.from(emailTemplates)
				.where(eq(emailTemplates.instructorId, locals.user.id))
				.orderBy(desc(emailTemplates.createdAt));

			// Real unique students count (from course ownership + cohorts)
			const studentUserIds = new Set<string>();
			teacherStudents.forEach(s => studentUserIds.add(s.id));
			if (courseIds.length > 0) {
				const owners = await db
					.select({ ownerId: assetOwnership.ownerId })
					.from(assetOwnership)
					.where(and(inArray(assetOwnership.assetId, courseIds), isNull(assetOwnership.revokedAt)));
				owners.forEach(o => studentUserIds.add(o.ownerId));
			}

			// Revenue from orders for this teacher's assets
			let totalRevenuePaise = 0;
			if (courseIds.length > 0) {
				const revenueRes = await db
					.select({ sum: sql`sum(${commerceOrders.amountPaise})` })
					.from(commerceOrders)
					.where(and(eq(commerceOrders.status, 'paid'), inArray(commerceOrders.assetId, courseIds)));
				totalRevenuePaise = Number(revenueRes[0]?.sum) || 0;
			}

			teacherStats = {
				totalStudents: studentUserIds.size,
				activeCourses: teacherCourses.length,
				activeCerts: teacherCertifications.length,
				avgRating: '—',
				totalRevenue: (totalRevenuePaise / 100).toLocaleString('en-IN')
			};

			teacherRecentActivity = teacherStudents.slice(0, 5).map(s => ({
				user: s.name || s.email,
				action: 'enrolled in',
				target: s.cohortName,
				time: s.joinedAt ? new Date(s.joinedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }) : 'recently'
			}));
		} catch (err) {
			console.error('Error loading teacher stats:', err);
		}
	}

	// ── 3. ADMIN & OWNER DATA (If Admin or Owner) ──────────────
	let adminSettings: any = { enableCatalog: true, enableMentoring: true, enableCertifications: true };
	let adminTemplates: any[] = [];
	let adminKpis = { totalUsers: 0, totalCourses: 0, totalCerts: 0, totalCohorts: 0, outboxPending: 0 };
	let adminAuditLogs: any[] = [];
	let adminAllUsers: any[] = [];
	let eligibleAdmins: any[] = [];
	let adminGrantableAssets: any[] = [];
	let adminGrantableCohorts: any[] = [];

	if (isAdmin) {
		try {
			let settingsRows = await db.select().from(platformSettings).where(eq(platformSettings.id, 'default'));
			if (settingsRows.length > 0) {
				adminSettings = settingsRows[0];
			} else {
				const [inserted] = await db.insert(platformSettings).values({ id: 'default' }).returning();
				adminSettings = inserted;
			}

			adminTemplates = await db.select().from(emailTemplates);
			if (adminTemplates.length === 0) {
				const [defTpl] = await db.insert(emailTemplates).values({
					id: 'welcome',
					name: 'Welcome Template',
					subject: 'Welcome to Launchpad',
					body: 'Hello {{user.name}}!\n\nWelcome to your new course.',
					instructorId: locals.user.id
				}).returning();
				adminTemplates = [defTpl];
			}

			const [{ uCount }] = await db.select({ uCount: sql<number>`count(*)` }).from(users);
			const [{ cCount }] = await db.select({ cCount: sql<number>`count(*)` }).from(assets).where(and(inArray(assets.type, ['html', 'markdown', 'pdf']), isNull(assets.deletedAt)));
			const [{ certCount }] = await db.select({ certCount: sql<number>`count(*)` }).from(assets).where(and(eq(assets.type, 'cert_test'), isNull(assets.deletedAt)));
			const [{ cohortCount }] = await db.select({ cohortCount: sql<number>`count(*)` }).from(cohorts);
			const [{ outboxCount }] = await db.select({ outboxCount: sql<number>`count(*)` }).from(eventOutbox);

			// Financial metrics across all courses and orders
			const [revRow] = await db
				.select({ sum: sql`sum(${commerceOrders.amountPaise})` })
				.from(commerceOrders)
				.where(eq(commerceOrders.status, 'paid'));
			const totalPlatformRevenuePaise = Number(revRow?.sum) || 0;

			const [{ paidOrdersCount }] = await db
				.select({ paidOrdersCount: sql<number>`count(*)` })
				.from(commerceOrders)
				.where(eq(commerceOrders.status, 'paid'));

			adminKpis = {
				totalUsers: uCount,
				totalCourses: cCount,
				totalCerts: certCount,
				totalCohorts: cohortCount,
				outboxPending: outboxCount,
				totalRevenuePaise: totalPlatformRevenuePaise,
				totalRevenueFormatted: (totalPlatformRevenuePaise / 100).toLocaleString('en-IN'),
				totalPaidOrders: paidOrdersCount
			};

			adminAuditLogs = await db
				.select({
					id: auditLogs.id,
					action: auditLogs.action,
					entityType: auditLogs.entityType,
					createdAt: auditLogs.createdAt,
					actorName: users.name,
					actorEmail: users.email
				})
				.from(auditLogs)
				.leftJoin(users, eq(auditLogs.actorId, users.id))
				.orderBy(desc(auditLogs.createdAt))
				.limit(10);

			const rawUsers = await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
					banned: users.banned,
					banReason: users.banReason,
					emailVerified: users.emailVerified,
					mustChangePassword: users.mustChangePassword,
					createdAt: users.createdAt
				})
				.from(users)
				.orderBy(desc(users.createdAt))
				.limit(100);

			// Count enrollments and cohorts for each user
			const userIds = rawUsers.map(u => u.id);
			const enrollCounts = new Map<string, number>();
			const cohortCounts = new Map<string, number>();

			if (userIds.length > 0) {
				const rawEnrollCounts = await db
					.select({
						userId: assetOwnership.ownerId,
						count: sql<number>`count(*)`
					})
					.from(assetOwnership)
					.where(and(inArray(assetOwnership.ownerId, userIds), isNull(assetOwnership.revokedAt)))
					.groupBy(assetOwnership.ownerId);
				rawEnrollCounts.forEach(r => enrollCounts.set(r.userId, Number(r.count) || 0));

				const rawCohortCounts = await db
					.select({
						userId: cohortMemberships.userId,
						count: sql<number>`count(*)`
					})
					.from(cohortMemberships)
					.where(and(inArray(cohortMemberships.userId, userIds), eq(cohortMemberships.status, 'active')))
					.groupBy(cohortMemberships.userId);
				rawCohortCounts.forEach(r => cohortCounts.set(r.userId, Number(r.count) || 0));
			}

			// Load catalog assets and cohorts for quick enrollment grants
			const adminGrantableAssets = await db
				.select({
					id: assets.id,
					title: assets.title,
					type: assets.type,
					deliveryFormat: assets.deliveryFormat
				})
				.from(assets)
				.where(isNull(assets.deletedAt))
				.orderBy(assets.title);

			const adminGrantableCohorts = await db
				.select({
					id: cohorts.id,
					name: cohorts.name,
					courseId: cohorts.courseId
				})
				.from(cohorts)
				.where(eq(cohorts.isActive, true))
				.orderBy(cohorts.name);

			// Load user detailed enrollments mapping for drawer inspection
			const allUserAssetRows = await db
				.select({
					ownershipId: assetOwnership.id,
					userId: assetOwnership.ownerId,
					assetId: assets.id,
					title: assets.title,
					type: assets.type,
					grantedAt: assetOwnership.grantedAt
				})
				.from(assetOwnership)
				.innerJoin(assets, eq(assetOwnership.assetId, assets.id))
				.where(isNull(assetOwnership.revokedAt));

			const userEnrollmentMap: Record<string, any[]> = {};
			for (const row of allUserAssetRows) {
				if (!userEnrollmentMap[row.userId]) userEnrollmentMap[row.userId] = [];
				userEnrollmentMap[row.userId].push(row);
			}

			adminAllUsers = rawUsers.map(u => {
				const effectiveRole = u.role === 'user' ? 'student' : u.role;
				return {
					...u,
					role: effectiveRole,
					rawRole: u.role,
					enrollmentsCount: enrollCounts.get(u.id) || 0,
					cohortsCount: cohortCounts.get(u.id) || 0,
					enrolledAssets: userEnrollmentMap[u.id] || []
				};
			});

			if (isOwner) {
				eligibleAdmins = adminAllUsers.filter(u => u.role === 'admin');
			}
		} catch (err) {
			console.error('Error loading admin data:', err);
		}
	}

	// ── 4. MENTORING DATA ──────────────────────────────────────
	let learnerMentoringBookings: any[] = [];
	let teacherMentoringWindows: any[] = [];
	let teacherMentoringPrices: any[] = [];
	let teacherMentoringBookings: any[] = [];
	let adminMentoringStats: any = null;
	let adminMentoringInstructors: any[] = [];
	let adminTestimonialQueue: any[] = [];

	try {
		const { MentoringService } = await import('$lib/server/mentoring/MentoringService');
		learnerMentoringBookings = await MentoringService.getStudentBookings(locals.user.id);

		if (isTeacher) {
			teacherMentoringWindows = await MentoringService.getInstructorCalendar(locals.user.id);
			teacherMentoringPrices = await MentoringService.getInstructorDurationPrices(locals.user.id);
			teacherMentoringBookings = await MentoringService.getInstructorBookings(locals.user.id);
		}

		if (isAdmin) {
			adminMentoringStats = await MentoringService.getAdminStats();
			adminMentoringInstructors = await MentoringService.getAdminInstructorsList();
			adminTestimonialQueue = await MentoringService.getAdminTestimonialQueue();
		}
	} catch (err) {
		console.error('Error loading mentoring dashboard data:', err);
	}

	// ── 5. USER PROFILE DATA ───────────────────────────────────
	let userProfile: any = null;
	try {
		const prof = await db.select().from(identityProfiles).where(eq(identityProfiles.userId, locals.user.id)).limit(1);
		userProfile = prof[0] || null;
	} catch (err) {
		console.error('Error loading identity profile:', err);
	}

	return {
		user: locals.user,
		isTeacher,
		isAdmin,
		isOwner,
		learner: {
			ownedCourses,
			ownedResources,
			ownedCerts,
			issuedCertificates,
			upcomingEvents,
			registeredEventIds,
			cohorts: userCohorts,
			liveBatches,
			pendingTransfer,
			mentoringBookings: learnerMentoringBookings,
			avgQuizScore
		},
		teacher: {
			stats: teacherStats,
			courses: teacherCourses,
			classes: teacherClasses,
			students: teacherStudents,
			certifications: teacherCertifications,
			coupons: teacherCoupons,
			templates: teacherTemplates,
			recentActivity: teacherRecentActivity,
			mentoringWindows: teacherMentoringWindows,
			mentoringPrices: teacherMentoringPrices,
			mentoringBookings: teacherMentoringBookings
		},
		admin: {
			settings: adminSettings,
			templates: adminTemplates,
			kpis: adminKpis,
			auditLogs: adminAuditLogs,
			allUsers: adminAllUsers,
			eligibleAdmins,
			grantableAssets: adminGrantableAssets,
			grantableCohorts: adminGrantableCohorts,
			mentoringStats: adminMentoringStats,
			mentoringInstructors: adminMentoringInstructors,
			testimonialQueue: adminTestimonialQueue
		},
		profile: userProfile
	};
};

export const actions: Actions = {
	registerEvent: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const eventId = data.get('eventId') as string;
		if (!eventId) return fail(400, { error: 'Event ID required' });

		const [existing] = await db.select().from(eventAttendees)
			.where(and(eq(eventAttendees.eventId, eventId), eq(eventAttendees.userId, locals.user.id)));

		if (existing) return { success: true, message: 'Already registered' };

		await db.insert(eventAttendees).values({
			id: randomUUID(),
			eventId,
			userId: locals.user.id
		});

		return { success: true, message: 'Registered for live event' };
	},

	updateSettings: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const enableCatalog = data.get('enableCatalog') === 'on';
		const enableMentoring = data.get('enableMentoring') === 'on';
		const enableCertifications = data.get('enableCertifications') === 'on';

		try {
			await db.update(platformSettings)
				.set({ enableCatalog, enableMentoring, enableCertifications, updatedAt: new Date() })
				.where(eq(platformSettings.id, 'default'));
			return { success: true, message: 'Platform module settings updated' };
		} catch (e: any) {
			return fail(500, { error: 'Failed to update platform settings' });
		}
	},

	saveTemplate: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const id = data.get('id') as string;
		const subject = data.get('subject') as string;
		const body = data.get('body') as string;

		if (!id || !subject || !body) return fail(400, { error: 'Missing fields' });

		const existing = await db.select().from(emailTemplates).where(eq(emailTemplates.id, id));
		if (existing.length > 0) {
			await db.update(emailTemplates).set({ subject, body, name: id }).where(eq(emailTemplates.id, id));
		} else {
			await db.insert(emailTemplates).values({ id, subject, body, name: id, instructorId: locals.user.id });
		}

		return { success: true, message: `Template ${id} saved` };
	},

	updateUserRole: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const newRole = data.get('role') as string;

		if (!targetUserId || !newRole) return fail(400, { error: 'Missing fields' });
		if (newRole === 'owner') return fail(400, { error: 'Cannot set owner directly. Use Owner Vault.' });

		if (locals.user.role === 'admin' && (newRole === 'admin' || newRole === 'owner')) {
			return fail(403, { error: 'Admins can only toggle student/teacher roles' });
		}

		try {
			await db.update(users).set({ role: newRole }).where(eq(users.id, targetUserId));
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'update_role',
				entityId: targetUserId,
				entityType: 'user',
				details: JSON.stringify({ role: newRole })
			});
			return { success: true, message: 'User role updated successfully' };
		} catch (e: any) {
			return fail(500, { error: 'Failed to update role' });
		}
	},

	toggleUserBan: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const isBanned = data.get('isBanned') === 'true';

		try {
			await db.update(users).set({ banned: !isBanned }).where(eq(users.id, targetUserId));
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: !isBanned ? 'ban_user' : 'unban_user',
				entityId: targetUserId,
				entityType: 'user',
				details: JSON.stringify({ banned: !isBanned })
			});
			return { success: true, message: `User ${!isBanned ? 'banned' : 'unbanned'} successfully` };
		} catch (e: any) {
			return fail(500, { error: 'Failed to toggle ban' });
		}
	},

	grantAssetAccess: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized: Admin or Owner privileges required' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const assetId = data.get('assetId') as string;

		if (!targetUserId || !assetId) {
			return fail(400, { error: 'Target user and asset are required' });
		}

		try {
			// Check if already owned
			const existing = await db
				.select()
				.from(assetOwnership)
				.where(and(eq(assetOwnership.ownerId, targetUserId), eq(assetOwnership.assetId, assetId), isNull(assetOwnership.revokedAt)))
				.limit(1);

			if (existing.length > 0) {
				return fail(400, { error: 'User already has active access to this asset' });
			}

			const grantId = createId();
			await db.insert(assetOwnership).values({
				id: grantId,
				ownerId: targetUserId,
				assetId,
				source: 'grant'
			});

			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'admin_grant_access',
				entityId: targetUserId,
				entityType: 'asset_ownership',
				details: JSON.stringify({ assetId, targetUserId, grantedBy: locals.user.email })
			});

			return { success: true, message: 'Direct access granted successfully' };
		} catch (e: any) {
			console.error('Error granting access:', e);
			return fail(500, { error: 'Failed to grant access' });
		}
	},

	revokeAssetAccess: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized: Admin or Owner privileges required' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const assetId = data.get('assetId') as string;

		if (!targetUserId || !assetId) {
			return fail(400, { error: 'Missing userId or assetId' });
		}

		try {
			await db
				.update(assetOwnership)
				.set({ revokedAt: new Date() })
				.where(and(eq(assetOwnership.ownerId, targetUserId), eq(assetOwnership.assetId, assetId)));

			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'admin_revoke_access',
				entityId: targetUserId,
				entityType: 'asset_ownership',
				details: JSON.stringify({ assetId, targetUserId, revokedBy: locals.user.email })
			});

			return { success: true, message: 'Access revoked successfully' };
		} catch (e: any) {
			console.error('Error revoking access:', e);
			return fail(500, { error: 'Failed to revoke access' });
		}
	},

	toggleEmailVerification: async ({ request, locals }) => {
		if (!locals.user || (locals.user.role !== 'admin' && locals.user.role !== 'owner')) {
			return fail(403, { error: 'Unauthorized: Admin or Owner privileges required' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;
		const currentStatus = data.get('currentStatus') === 'true';

		if (!targetUserId) return fail(400, { error: 'Missing userId' });

		try {
			await db.update(users).set({ emailVerified: !currentStatus }).where(eq(users.id, targetUserId));
			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'admin_toggle_email_verification',
				entityId: targetUserId,
				entityType: 'user',
				details: JSON.stringify({ emailVerified: !currentStatus })
			});

			return { success: true, message: `Email marked as ${!currentStatus ? 'verified' : 'unverified'}` };
		} catch (e: any) {
			console.error('Error toggling email verification:', e);
			return fail(500, { error: 'Failed to update email verification status' });
		}
	},

	deleteUserAccount: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Unauthorized: Strictly restricted to Platform Owner' });
		}

		const data = await request.formData();
		const targetUserId = data.get('userId') as string;

		if (!targetUserId) return fail(400, { error: 'Missing userId' });
		if (targetUserId === locals.user.id) return fail(400, { error: 'Owner cannot delete own account from here' });

		try {
			const [targetUser] = await db.select().from(users).where(eq(users.id, targetUserId)).limit(1);
			if (!targetUser) return fail(404, { error: 'User not found' });
			if (targetUser.role === 'owner') return fail(403, { error: 'Cannot delete another owner account' });

			// Delete user - cascading foreign keys will clean up memberships, ownerships, etc.
			await db.delete(users).where(eq(users.id, targetUserId));

			await db.insert(auditLogs).values({
				id: createId(),
				actorId: locals.user.id,
				action: 'owner_delete_user',
				entityId: targetUserId,
				entityType: 'user',
				details: JSON.stringify({ email: targetUser.email, name: targetUser.name, deletedBy: locals.user.email })
			});

			return { success: true, message: `User account ${targetUser.email} permanently purged` };
		} catch (e: any) {
			console.error('Error deleting user:', e);
			return fail(500, { error: 'Failed to delete user account' });
		}
	},

	transferOwnership: async ({ request, locals }) => {
		if (!locals.user || locals.user.role !== 'owner') {
			return fail(403, { error: 'Only owner can transfer ownership' });
		}

		const data = await request.formData();
		const newOwnerId = data.get('newOwnerId') as string;
		const confirmEmail = data.get('confirmEmail') as string;

		if (!newOwnerId || !confirmEmail) return fail(400, { error: 'Missing target user or email' });

		const target = await db.select().from(users).where(eq(users.id, newOwnerId)).limit(1);
		if (target.length === 0 || target[0].email.toLowerCase() !== confirmEmail.trim().toLowerCase()) {
			return fail(400, { error: 'Target admin email does not match' });
		}

		try {
			await db.batch([
				db.update(users).set({ role: 'admin' }).where(eq(users.id, locals.user.id)),
				db.update(users).set({ role: 'owner' }).where(eq(users.id, newOwnerId)),
				db.insert(auditLogs).values({
					id: createId(),
					actorId: locals.user.id,
					action: 'transfer_ownership',
					entityId: newOwnerId,
					entityType: 'user',
					details: JSON.stringify({ from: locals.user.id, to: newOwnerId })
				})
			]);
			return { success: true, message: 'Ownership transferred successfully' };
		} catch (e: any) {
			return fail(500, { error: 'Failed to transfer ownership' });
		}
	},

	updateProfile: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const name = (data.get('name') as string)?.trim();
		if (!name) return fail(400, { error: 'Name is required' });

		try {
			await db.update(users).set({ name }).where(eq(users.id, locals.user.id));
			return { success: true, message: 'Profile updated' };
		} catch (e) {
			return fail(500, { error: 'Failed to update profile' });
		}
	},

	updatePreference: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const preference = data.get('preference') as 'otp' | 'password';
		if (!['otp', 'password'].includes(preference)) return fail(400, { error: 'Invalid preference' });

		try {
			const existing = await db.select().from(identityProfiles).where(eq(identityProfiles.userId, locals.user.id)).limit(1);
			if (existing.length > 0) {
				await db.update(identityProfiles).set({ loginPreference: preference, updatedAt: new Date() }).where(eq(identityProfiles.userId, locals.user.id));
			} else {
				await db.insert(identityProfiles).values({ id: createId(), userId: locals.user.id, loginPreference: preference });
			}
			return { success: true, message: 'Login preference saved' };
		} catch (e) {
			return fail(500, { error: 'Failed to update preference' });
		}
	},

	// ── TEACHER CERTIFICATION ACTIONS ──────────────────────────
	createCert: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Instructor role required' });
		}

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const passingPercent = parseInt(data.get('passingPercent') as string) || 70;
		const price = parseFloat(data.get('price') as string) || 0;
		const pricePaise = Math.floor(price * 100);

		if (!title) return fail(400, { error: 'Certification title is required' });

		try {
			const assetId = createId();
			const testId = createId();
			const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			const slug = baseSlug ? `${baseSlug}-${Math.random().toString(36).substring(2, 6)}` : createId();

			await db.insert(assets).values({
				id: assetId,
				slug,
				title,
				type: 'cert_test',
				ownerId: locals.user.id,
				status: 'draft',
				pricePaise,
				currency: 'INR'
			});

			await db.insert(assessmentTests).values({
				id: testId,
				assetId,
				passingPercent
			});

			return { success: true, message: `Certification "${title}" created as draft.` };
		} catch (e: any) {
			console.error('Failed to create certification:', e);
			return fail(500, { error: 'Failed to create certification' });
		}
	},

	toggleCertPublish: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const certId = data.get('certId') as string;

		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, locals.user.id)));
			if (!cert) return fail(403, { error: 'Certification not found or unauthorized' });

			const newStatus = cert.status === 'published' ? 'draft' : 'published';
			await db.update(assets).set({ status: newStatus }).where(eq(assets.id, certId));
			return { success: true, message: `Certification ${newStatus === 'published' ? 'published' : 'moved to draft'}.` };
		} catch (e) {
			return fail(500, { error: 'Failed to update certification status' });
		}
	},

	updateCertPrice: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const certId = data.get('certId') as string;
		const price = parseFloat(data.get('price') as string) || 0;
		const pricePaise = Math.floor(price * 100);

		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, locals.user.id)));
			if (!cert) return fail(403, { error: 'Certification not found or unauthorized' });

			await db.update(assets).set({ pricePaise }).where(eq(assets.id, certId));
			return { success: true, message: 'Price updated successfully' };
		} catch (e) {
			return fail(500, { error: 'Failed to update price' });
		}
	},

	deleteCert: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const certId = data.get('certId') as string;

		try {
			const [cert] = await db.select().from(assets)
				.where(and(eq(assets.id, certId), eq(assets.ownerId, locals.user.id)));
			if (!cert) return fail(403, { error: 'Certification not found or unauthorized' });

			await db.update(assets).set({ deletedAt: new Date() }).where(eq(assets.id, certId));
			return { success: true, message: 'Certification deleted' };
		} catch (e) {
			return fail(500, { error: 'Failed to delete certification' });
		}
	},

	// ── LEARNER BATCH TRANSFER ACTIONS ─────────────────────────
	acceptBatchTransfer: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const requestId = data.get('requestId') as string;
		if (!requestId) return fail(400, { error: 'Request ID is required' });

		try {
			const { CohortService } = await import('$lib/server/cohorts/CohortService');
			const result = await CohortService.acceptTransferPing(requestId, locals.user.id);
			return { success: true, message: `Successfully transferred to batch: ${result.newCohortName}!` };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to accept batch transfer' });
		}
	},

	declineBatchTransfer: async ({ request, locals }) => {
		if (!locals.user) return fail(401, { error: 'Unauthorized' });
		const data = await request.formData();
		const requestId = data.get('requestId') as string;
		if (!requestId) return fail(400, { error: 'Request ID is required' });

		try {
			const { cohortTransferRequests } = await import('$lib/server/db/schema/cohorts.schema');
			await db
				.update(cohortTransferRequests)
				.set({ status: 'declined' })
				.where(and(eq(cohortTransferRequests.id, requestId), eq(cohortTransferRequests.studentId, locals.user.id)));
			return { success: true, message: 'Batch transfer offer declined.' };
		} catch (e: any) {
			return fail(400, { error: e.message || 'Failed to decline batch transfer' });
		}
	},

	// ── TEACHER STUDIO ACTIONS ─────────────────────────────────
	createCourse: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Instructor role required' });
		}

		const data = await request.formData();
		const title = (data.get('title') as string)?.trim();
		const deliveryFormat = (data.get('deliveryFormat') as 'self_paced' | 'live_batch') || 'self_paced';
		if (!title) return fail(400, { error: 'Course title is required' });

		try {
			const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			const uniqueSuffix = Math.random().toString(36).substring(2, 7);
			const slug = baseSlug ? `${baseSlug}-${uniqueSuffix}` : createId();

			// Default price: 5999 INR for self-paced, 16999 INR for live cohorts
			const pricePaise = deliveryFormat === 'live_batch' ? 1699900 : 599900;

			await db.insert(assets).values({
				id: createId(),
				slug,
				title,
				type: 'html',
				deliveryFormat,
				isSelfPacedEnabled: deliveryFormat === 'self_paced',
				isLiveBatchesEnabled: deliveryFormat === 'live_batch',
				ownerId: locals.user.id,
				status: 'draft',
				pricePaise,
				currency: 'INR'
			});
			return { success: true, message: `Course "${title}" drafted successfully.` };
		} catch (e: any) {
			return fail(500, { error: 'Failed to create course' });
		}
	},

	updateCoursePrice: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const courseId = data.get('courseId') as string;
		const price = parseFloat(data.get('price') as string) || 0;
		const currency = (data.get('currency') as string) || 'INR';
		const pricePaise = Math.floor(price * 100);

		try {
			const [course] = await db.select().from(assets)
				.where(and(eq(assets.id, courseId), eq(assets.ownerId, locals.user.id)));
			if (!course) return fail(403, { error: 'Course not found or unauthorized' });

			await db.update(assets).set({ pricePaise, currency }).where(eq(assets.id, courseId));
			return { success: true, message: 'Price updated successfully' };
		} catch (e) {
			return fail(500, { error: 'Failed to update price' });
		}
	},

	toggleCoursePublish: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const courseId = data.get('courseId') as string;

		try {
			const [course] = await db.select().from(assets)
				.where(and(eq(assets.id, courseId), eq(assets.ownerId, locals.user.id)));
			if (!course) return fail(403, { error: 'Course not found or unauthorized' });

			const newStatus = course.status === 'published' ? 'draft' : 'published';
			await db.update(assets).set({ status: newStatus }).where(eq(assets.id, courseId));
			return { success: true, message: `Course ${newStatus === 'published' ? 'published' : 'un-published'}.` };
		} catch (e) {
			return fail(500, { error: 'Failed to update course status' });
		}
	},

	deleteCourse: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const courseId = data.get('courseId') as string;

		try {
			const [course] = await db.select().from(assets)
				.where(and(eq(assets.id, courseId), eq(assets.ownerId, locals.user.id)));
			if (!course) return fail(403, { error: 'Course not found or unauthorized' });

			await db.update(assets).set({ deletedAt: new Date() }).where(eq(assets.id, courseId));
			return { success: true, message: 'Course deleted' };
		} catch (e) {
			return fail(500, { error: 'Failed to delete course' });
		}
	},

	createClass: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const name = (data.get('className') as string)?.trim();
		const courseId = data.get('courseId') as string;
		const rawPrice = data.get('price') as string;
		
		let pricePaise: number | null = null;
		if (rawPrice && rawPrice.trim() !== '') {
			const parsed = parseFloat(rawPrice);
			if (!isNaN(parsed) && parsed >= 0) {
				pricePaise = Math.floor(parsed * 100);
			}
		}

		if (!name || !courseId) return fail(400, { error: 'Class name and course are required' });

		try {
			await db.insert(cohorts).values({
				id: createId(),
				name,
				courseId,
				instructorId: locals.user.id,
				pricePaise,
				isActive: true
			});
			return { success: true, message: `Class cohort "${name}" created!` };
		} catch (e) {
			return fail(500, { error: 'Failed to create class cohort' });
		}
	},

	inviteWithCoupon: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const email = (data.get('email') as string)?.trim().toLowerCase();
		const cohortId = data.get('cohortId') as string;
		const discountType = (data.get('discountType') as 'percent' | 'flat') || 'percent';
		const discountValue = parseInt(data.get('discountValue') as string) || 10;

		if (!email || !cohortId) return fail(400, { error: 'Email and cohort are required' });

		try {
			const couponCode = `INV-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
			await db.insert(commerceCoupons).values({
				id: createId(),
				code: couponCode,
				type: discountType,
				value: discountValue,
				maxUses: 1,
				createdBy: locals.user.id
			});
			return { success: true, message: `Student invited with coupon code: ${couponCode}` };
		} catch (e) {
			return fail(500, { error: 'Failed to generate student coupon invite' });
		}
	},

	createCoupon: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const code = (data.get('code') as string)?.trim().toUpperCase();
		const type = (data.get('type') as 'percent' | 'flat') || 'percent';
		const value = parseInt(data.get('value') as string) || 10;
		const limit = parseInt(data.get('limit') as string) || null;

		if (!code) return fail(400, { error: 'Coupon code is required' });

		try {
			await db.insert(commerceCoupons).values({
				id: createId(),
				code,
				type,
				value,
				maxUses: limit,
				createdBy: locals.user.id,
				isActive: true
			});
			return { success: true, message: `Coupon "${code}" created successfully!` };
		} catch (e) {
			return fail(500, { error: 'Failed to create coupon' });
		}
	},

	toggleCouponActive: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const couponId = data.get('couponId') as string;

		try {
			const [coupon] = await db.select().from(commerceCoupons)
				.where(and(eq(commerceCoupons.id, couponId), eq(commerceCoupons.createdBy, locals.user.id)));
			if (!coupon) return fail(403, { error: 'Coupon not found or unauthorized' });

			await db.update(commerceCoupons).set({ isActive: !coupon.isActive }).where(eq(commerceCoupons.id, couponId));
			return { success: true, message: `Coupon ${!coupon.isActive ? 'activated' : 'deactivated'}.` };
		} catch (e) {
			return fail(500, { error: 'Failed to toggle coupon' });
		}
	},

	deleteCoupon: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const couponId = data.get('couponId') as string;

		try {
			await db.delete(commerceCoupons)
				.where(and(eq(commerceCoupons.id, couponId), eq(commerceCoupons.createdBy, locals.user.id)));
			return { success: true, message: 'Coupon deleted.' };
		} catch (e) {
			return fail(500, { error: 'Failed to delete coupon' });
		}
	},

	sendBroadcast: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const cohortId = data.get('recipient') as string;
		const subject = (data.get('subject') as string)?.trim();
		const body = (data.get('body') as string)?.trim();
		const saveTemplate = data.get('saveTemplate') === 'on';

		if (!cohortId || !subject || !body) {
			return fail(400, { error: 'Recipient cohort, subject, and message are required.' });
		}

		try {
			// Save template if requested
			if (saveTemplate) {
				await db.insert(emailTemplates).values({
					id: createId(),
					name: subject.slice(0, 40),
					subject,
					body,
					instructorId: locals.user.id
				});
			}

			// Get students in this cohort
			const members = await db.select().from(cohortMemberships).where(eq(cohortMemberships.cohortId, cohortId));
			if (members.length > 0) {
				const notifInserts = members.map(m => ({
					id: randomUUID(),
					userId: m.userId,
					type: 'announcement',
					title: subject,
					body,
					actionUrl: '/dashboard'
				}));
				await db.insert(notifications).values(notifInserts);

				await db.insert(eventOutbox).values({
					id: randomUUID(),
					eventType: 'EMAIL_BLAST',
					payload: {
						userIds: members.map(m => m.userId),
						subject,
						body
					}
				});
			}

			return { success: true, message: `Broadcast sent to ${members.length} students in cohort.` };
		} catch (e: any) {
			console.error('Failed to send broadcast:', e);
			return fail(500, { error: 'Failed to send broadcast announcement' });
		}
	},

	saveInstructorProfile: async ({ request, locals }) => {
		if (!locals.user || !['teacher', 'admin', 'owner'].includes(locals.user.role)) {
			return fail(403, { error: 'Unauthorized' });
		}

		const data = await request.formData();
		const displayName = (data.get('displayName') as string)?.trim();
		const bio = (data.get('bio') as string)?.trim() || '';

		if (!displayName) return fail(400, { error: 'Display name is required' });

		try {
			await db.update(users).set({ name: displayName }).where(eq(users.id, locals.user.id));
			const existing = await db.select().from(identityProfiles).where(eq(identityProfiles.userId, locals.user.id)).limit(1);
			if (existing.length > 0) {
				await db.update(identityProfiles).set({ bio, updatedAt: new Date() }).where(eq(identityProfiles.userId, locals.user.id));
			} else {
				await db.insert(identityProfiles).values({ id: createId(), userId: locals.user.id, bio });
			}
			return { success: true, message: 'Instructor profile updated successfully.' };
		} catch (e) {
			return fail(500, { error: 'Failed to save instructor profile' });
		}
	}
};
