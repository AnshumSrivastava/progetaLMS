import { redirect, fail } from '@sveltejs/kit';
import type { PageServerLoad, Actions } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { events, eventAttendees, platformSettings } from '$lib/server/db/schema/platform.schema';
import { cohorts, cohortMemberships, cohortSuggestedAssets } from '$lib/server/db/schema/cohorts.schema';
import { assessmentTests } from '$lib/server/db/schema/assessments.schema';
import { users, auditLogs, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { emailTemplates } from '$lib/server/db/schema/notifications.schema';
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

	// ── 2. TEACHER DATA (If Teacher, Admin, or Owner) ──────────
	let teacherStats = { totalStudents: 0, activeCourses: 0, activeCerts: 0, avgRating: '4.9', totalRevenue: '0' };
	let teacherCourses: any[] = [];
	let teacherCertifications: any[] = [];
	if (isTeacher) {
		try {
			teacherCourses = await db
				.select()
				.from(assets)
				.where(
					and(
						inArray(assets.type, ['html', 'markdown', 'pdf']),
						isNull(assets.deletedAt)
					)
				)
				.limit(20);

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

			teacherStats.activeCourses = teacherCourses.length;
			teacherStats.activeCerts = teacherCertifications.length;
			const [{ studentCount }] = await db.select({ studentCount: sql<number>`count(*)` }).from(users);
			teacherStats.totalStudents = studentCount;
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

			adminKpis = {
				totalUsers: uCount,
				totalCourses: cCount,
				totalCerts: certCount,
				totalCohorts: cohortCount,
				outboxPending: outboxCount
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

			adminAllUsers = await db
				.select({
					id: users.id,
					name: users.name,
					email: users.email,
					role: users.role,
					banned: users.banned,
					createdAt: users.createdAt
				})
				.from(users)
				.orderBy(desc(users.createdAt))
				.limit(50);

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
			mentoringBookings: learnerMentoringBookings
		},
		teacher: {
			stats: teacherStats,
			courses: teacherCourses,
			certifications: teacherCertifications,
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
	}
};
