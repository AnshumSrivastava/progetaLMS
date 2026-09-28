import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	// Direct course links: redirect directly to public catalog view
	throw redirect(302, `/catalog/${params.courseId}`);
};
