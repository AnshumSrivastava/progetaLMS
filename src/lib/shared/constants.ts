/**
 * App-wide constants.
 * Not environment variables — these are invariants of the business domain.
 */

export const APP_NAME = 'Launchpad';
export const APP_COMPANY = 'Progeta Technologies';
export const APP_DOMAIN = 'lms.progeta.in';
export const SUPPORT_EMAIL = 'support@progeta.in';

/** Default Indian timezone for all date display */
export const DEFAULT_TIMEZONE = 'Asia/Kolkata';

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Asset constraints */
export const ASSET_SLUG_MAX_LENGTH = 120;
export const ASSET_TITLE_MAX_LENGTH = 200;
export const ASSET_DESCRIPTION_MAX_LENGTH = 2000;

/** Commerce */
export const CURRENCY = 'INR';
export const MIN_PAISE = 100; // ₹1 minimum for paid assets

/** Assessment */
export const DEFAULT_PASSING_PERCENT = 70;
export const MAX_ATTEMPT_DURATION_MINUTES = 180;

/** Certificate */
export const CERTIFICATE_VERIFY_PATH = '/certificates/verify';

/**
 * Storage key prefixes — provider-agnostic path namespacing.
 * These prefixes are used by StorageService as the first segment of every
 * storage key. They work identically across local, R2, Supabase, and S3.
 *
 * Example key: 'certificates/abc123.pdf'
 */
export const STORAGE_PATHS = {
	CERTIFICATES: 'certificates',
	THUMBNAILS:   'thumbnails',
	DOWNLOADS:    'downloads',
	AVATARS:      'avatars',
	INVOICES:     'invoices',
} as const;

export type StoragePath = typeof STORAGE_PATHS[keyof typeof STORAGE_PATHS];
