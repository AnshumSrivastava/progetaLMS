import { redirect, error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ parent }) => {
	const { course, modules } = await parent();

	if (modules && modules.length > 0) {
		throw redirect(302, `/learn/${course.id}/${modules[0].id}`);
	}

	// If no modules exist for this course, we could render an empty state
	// If no modules exist for this course, it will render the fallback +page.svelte
	return {};
};
