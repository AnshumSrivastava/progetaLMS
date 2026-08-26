import { error } from '@sveltejs/kit';
import { MentoringService } from '$lib/server/mentoring/MentoringService';
import type { PageServerLoad } from './$types';

/**
 * Load function for the public instructor profile page.
 *
 * Route: /mentoring/[handle]
 *
 * This page is publicly accessible without authentication.
 * - Resolves [handle] as either a slug (e.g. 'anshum-srivastava') or a UUID.
 * - If neither matches, returns 404.
 * - Passes user session to the page so the Svelte component can conditionally
 *   show the booking interface vs. a "Sign in to Book" prompt.
 */
export const load: PageServerLoad = async ({ params, locals }) => {
	const instructor = await MentoringService.getInstructorPublicProfile(params.handle);

	if (!instructor) {
		throw error(404, 'Instructor not found or no longer available.');
	}

	const testimonials = await MentoringService.getPublishedTestimonials(instructor.id);

	return {
		instructor,
		testimonials,
		user: locals.user ?? null
	};
};
