/**
 * ID Generation
 *
 * Uses @paralleldrive/cuid2 for collision-resistant, URL-safe, unpredictable IDs.
 * - Preferred over UUID for public-facing identifiers (assets, orders, certificates)
 *   because CUIDs are harder to enumerate and are monotonically sortable.
 * - UUIDs are used in identity/auth tables because Better Auth generates them.
 */
import { createId } from '@paralleldrive/cuid2';

/** Generate a new CUID2 — collision-resistant, URL-safe, 24 chars */
export function generateId(): string {
	return createId();
}

/** Generate a prefixed ID for readability in logs/debugging */
export function generatePrefixedId(prefix: string): string {
	return `${prefix}_${createId()}`;
}
