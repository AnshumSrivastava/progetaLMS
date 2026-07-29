import { auth } from '$lib/server/auth/auth.config';
import { redirect, type Handle } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users } from '$lib/server/db/schema/identity.schema';
import { platformSettings } from '$lib/server/db/schema/platform.schema';
import { eq } from 'drizzle-orm';
import { processOutbox } from '$lib/server/events/outbox.processor';
import { randomBytes } from 'node:crypto';
import { registerEventHandlers } from '$lib/server/events/handlers';
let appInitialized = false;

async function initializeApp() {
	if (appInitialized) return;
	
	try {
		// Register event handlers
		registerEventHandlers();
		const existingAdmin = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
		const existingOwner = await db.select().from(users).where(eq(users.role, 'owner')).limit(1);
		if (existingAdmin.length === 0 && existingOwner.length === 0) {
			console.log('🌱 No admin/owner found, creating default Super Admin...');
			const tempPassword = 'Admin@12345';
			const result = await auth.api.signUpEmail({
				headers: new Headers(),
				body: {
					email: 'admin@progetalms.com',
					password: tempPassword,
					name: 'Super Admin'
				}
			});
			if (result?.user) {
				await db.update(users)
					.set({ role: 'owner', mustChangePassword: true })
					.where(eq(users.id, result.user.id));
				console.log('✅ Super Admin created: admin@progetalms.com (Owner)');
				console.log('⚠️ TEMP PASSWORD:', tempPassword, '— Change this immediately!');
			}
		}
		appInitialized = true;
	} catch (e) {
		console.error('Failed to initialize app:', e);
	}
}

// Trigger manual deployment refresh
export const handle: Handle = async ({ event, resolve }) => {
	await initializeApp();

	// Process outbox in background on every request
	if (typeof event.waitUntil === 'function') {
		event.waitUntil(processOutbox(db).catch(e => console.error('Outbox err:', e)));
	} else {
		processOutbox(db).catch(e => console.error('Outbox err:', e));
	}

	const session = await auth.api.getSession({
		headers: event.request.headers
	});

	if (session) {
		event.locals.user = session.user;
		event.locals.session = session.session;

		// Handle impersonation
		const impersonatedRole = event.cookies.get('impersonate_role');
		if (impersonatedRole && session.user.role === 'admin') {
			event.locals.user.role = impersonatedRole;
			event.locals.isImpersonating = true;
		} else {
			event.locals.isImpersonating = false;
		}
	} else {
		event.locals.user = null;
		event.locals.session = null;
		event.locals.isImpersonating = false;
	}

	const path = event.url.pathname;

	// Enforce Admin password change (ignore if impersonating so we don't break their testing)
	if (session && !event.locals.isImpersonating) {
		const [freshUser] = await db.select().from(users).where(eq(users.id, session.user.id)).limit(1);
		if (freshUser?.mustChangePassword && !path.startsWith('/dashboard/change-password') && !path.startsWith('/api/auth')) {
			throw redirect(302, '/dashboard/change-password');
		}
	}
	
	// Feature Flags / Public Browsing Toggles
	// Only block exact paths so direct links (e.g. /catalog/123) still work!
	if (path === '/catalog' || path === '/mentoring' || path === '/certifications') {
		const settingsRows = await db.select().from(platformSettings).where(eq(platformSettings.id, 'default'));
		const settings = settingsRows[0];
		if (settings) {
			// Don't block admins from viewing the pages they turned off!
			const isAdmin = session?.user.role === 'admin' && !event.locals.isImpersonating;
			if (!isAdmin) {
				if (path === '/catalog' && !settings.enableCatalog) throw redirect(302, '/dashboard');
				if (path === '/mentoring' && !settings.enableMentoring) throw redirect(302, '/dashboard');
				if (path === '/certifications' && !settings.enableCertifications) throw redirect(302, '/dashboard');
			}
		}
	}

	// Route Protection
	const TEACHER_ROLES = ['teacher', 'admin', 'owner'];
	const ADMIN_ROLES = ['admin', 'owner'];
	
	if (path.startsWith('/dashboard/admin')) {
		if (!session) throw redirect(302, '/sign-in');
		const role = session.user.role as string;
		if (!ADMIN_ROLES.includes(role)) throw redirect(302, '/dashboard');
	} else if (path.startsWith('/dashboard/teacher')) {
		if (!session) throw redirect(302, '/sign-in');
		const role = session.user.role as string;
		if (!TEACHER_ROLES.includes(role)) throw redirect(302, '/dashboard');
	} else if (path.startsWith('/dashboard')) {
		if (!session) throw redirect(302, '/sign-in');
	}

	return resolve(event);
};
