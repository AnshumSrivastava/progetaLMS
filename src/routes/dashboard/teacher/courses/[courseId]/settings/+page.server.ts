import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';

export const load: PageServerLoad = async ({ params, locals }) => {
	const user = locals.user;
	if (!user) throw redirect(302, '/sign-in');
	if (user.role !== 'teacher' && user.role !== 'admin') {
		throw redirect(302, '/dashboard');
	}

	const courseId = params.courseId;
	const [course] = await db.select().from(assets).where(and(eq(assets.id, courseId), eq(assets.ownerId, user.id)));

	if (!course) {
		throw error(404, 'Course not found or unauthorized');
	}

	return {
		course
	};
};

export const actions: Actions = {
	save: async ({ request, params, locals }) => {
		const user = locals.user;
		if (!user) throw error(401, 'Unauthorized');

		const courseId = params.courseId;
		const data = await request.formData();
		
		const title = data.get('title') as string;
		const description = data.get('description') as string;
		const price = parseFloat(data.get('price') as string) || 0;
		const currency = data.get('currency')?.toString() || 'INR';
		const pricePaise = Math.floor(price * 100);
		const pricingType = data.get('pricingType') as string;
		const accessType = data.get('accessType') as string;

		if (!title) {
			return fail(400, { error: 'Title is required' });
		}

		try {
			await db.update(assets).set({
				title,
				description,
				pricePaise: pricingType === 'free' ? 0 : pricePaise,
				currency,
				visibility: accessType === 'private' ? 'private' : 'public',
				updatedAt: new Date()
			}).where(and(eq(assets.id, courseId), eq(assets.ownerId, user.id)));

			return { success: true };
		} catch (e: any) {
			return fail(500, { error: e.message || 'Failed to save settings' });
		}
	}
};
