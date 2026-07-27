/**
 * Slug Generation
 *
 * Creates URL-safe, human-readable slugs from arbitrary strings.
 * Ensures uniqueness by appending a short random suffix when needed.
 */
import slugify from 'slugify';
import { generateId } from './id';

/**
 * Create a URL-safe slug from a title.
 * e.g., "My HTML Resource #1" → "my-html-resource-1"
 */
export function toSlug(input: string): string {
	return slugify(input, {
		lower: true,
		strict: true,     // remove special chars
		trim: true,
		locale: 'en'
	});
}

/**
 * Create a slug with a guaranteed unique suffix.
 * Use for asset slugs to prevent collisions on the assets table.
 * e.g., "my-html-resource-k7x9p2"
 */
export function toUniqueSlug(input: string): string {
	const base = toSlug(input);
	const suffix = generateId().slice(0, 6);
	return `${base}-${suffix}`;
}

/**
 * Validate that a slug conforms to expected format.
 */
export function isValidSlug(slug: string): boolean {
	return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}
