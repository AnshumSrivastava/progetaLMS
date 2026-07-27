/**
 * Capability Registry
 *
 * The exhaustive list of what can be done in this system.
 * Roles are assigned these capabilities.
 * The AuthorizationEngine checks them.
 *
 * Naming convention: {domain}.{action}
 * This enables prefix-based checks in the future (e.g., "can user do anything in 'asset' domain?")
 */

export const Capability = {
	// ── Assets ──────────────────────────────────────────────────────────────
	ASSET_VIEW:          'asset.view',       // view public/owned assets
	ASSET_PUBLISH:       'asset.publish',    // create + publish assets
	ASSET_EDIT:          'asset.edit',       // edit existing assets
	ASSET_DELETE:        'asset.delete',     // soft-delete assets

	// ── Students ─────────────────────────────────────────────────────────────
	STUDENT_VIEW:        'student.view',     // view student list + profiles
	STUDENT_MANAGE:      'student.manage',   // grant/revoke ownership manually

	// ── Commerce ─────────────────────────────────────────────────────────────
	PAYMENT_VIEW:        'payment.view',     // view payment history
	PAYMENT_REFUND:      'payment.refund',   // initiate refunds
	COUPON_CREATE:       'coupon.create',    // create coupon codes
	COUPON_USE:          'coupon.use',       // apply coupons at checkout

	// ── Assessments ──────────────────────────────────────────────────────────
	TEST_CREATE:         'test.create',      // create/edit tests + questions
	TEST_ATTEMPT:        'test.attempt',     // attempt a test

	// ── Certificates ─────────────────────────────────────────────────────────
	CERT_ISSUE:          'certificate.issue',   // issue certificates
	CERT_VERIFY:         'certificate.verify',  // access verification endpoint (public)
	CERT_REVOKE:         'certificate.revoke',  // revoke a certificate

	// ── Analytics ────────────────────────────────────────────────────────────
	ANALYTICS_VIEW:      'analytics.view',   // view analytics dashboard

	// ── Mentoring ────────────────────────────────────────────────────────────
	SESSION_BOOK:        'session.book',     // book a mentoring session
	SESSION_MANAGE:      'session.manage',   // create/cancel sessions (instructor)

	// ── Admin ─────────────────────────────────────────────────────────────────
	USER_VIEW:           'user.view',        // view all users
	USER_MANAGE:         'user.manage',      // manage users (ban, verify, etc.)
	ROLE_MANAGE:         'role.manage',      // assign/revoke roles
	PLATFORM_SETTINGS:   'platform.settings',  // manage platform-level config
} as const;

export type CapabilityKey = typeof Capability[keyof typeof Capability];

/** All capability keys as a readonly array — used for seeding and validation */
export const ALL_CAPABILITIES = Object.values(Capability) as CapabilityKey[];

/** Default role → capabilities mapping (used for DB seeding) */
export const ROLE_CAPABILITY_MAP: Record<string, CapabilityKey[]> = {
	student: [
		Capability.ASSET_VIEW,
		Capability.COUPON_USE,
		Capability.TEST_ATTEMPT,
		Capability.CERT_VERIFY,
		Capability.SESSION_BOOK,
	],
	instructor: [
		Capability.ASSET_VIEW,
		Capability.ASSET_PUBLISH,
		Capability.ASSET_EDIT,
		Capability.ASSET_DELETE,
		Capability.STUDENT_VIEW,
		Capability.STUDENT_MANAGE,
		Capability.PAYMENT_VIEW,
		Capability.COUPON_CREATE,
		Capability.COUPON_USE,
		Capability.TEST_CREATE,
		Capability.TEST_ATTEMPT,
		Capability.CERT_ISSUE,
		Capability.CERT_VERIFY,
		Capability.CERT_REVOKE,
		Capability.ANALYTICS_VIEW,
		Capability.SESSION_BOOK,
		Capability.SESSION_MANAGE,
	],
	super_admin: ALL_CAPABILITIES,
};
