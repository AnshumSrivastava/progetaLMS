import { db } from '$lib/server/db/client';
import { assets, cohortMemberships, cohorts } from '$lib/server/db/schema';
import { eq, and, count } from 'drizzle-orm';
import type { PageServerLoad, Actions } from './$types';
import { fail, redirect } from '@sveltejs/kit';
import { createId } from '@paralleldrive/cuid2';

export const load: PageServerLoad = async ({ locals }) => {
	const allAssets = await db.select({
		id: assets.id,
		title: assets.title,
		status: assets.status,
		pricePaise: assets.pricePaise
	})
	.from(assets)
	.where(and(eq(assets.type, 'html'), eq(assets.ownerId, locals.user!.id)));

	// Calculate student count (dummy approximation: count cohorts and multiply or fetch real)
	// In a real system, course students = sum of students in all cohorts of this course
	
	const courses = allAssets.map(a => ({
		id: a.id,
		title: a.title,
		status: a.status === 'published' ? 'Published' : (a.status === 'draft' ? 'Draft' : 'Unpublished'),
		students: 0, // Mock for now, requires complex join or subquery
		price: a.pricePaise === 0 ? 'Free' : `$${(a.pricePaise / 100).toFixed(2)}`,
		rating: 0
	}));

	return {
		courses
	};
};

export const actions: Actions = {
	createCourse: async ({ request, locals }) => {
		const data = await request.formData();
		const title = data.get('title')?.toString();

		if (!title) {
			return fail(400, { error: 'Missing title' });
		}

		const ownerId = locals.user!.id;

		try {
			// Generate slug from title (e.g. "My Course" -> "my-course-abc12")
			const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
			const uniqueSuffix = Math.random().toString(36).substring(2, 7);
			const slug = baseSlug ? `${baseSlug}-${uniqueSuffix}` : createId();

			await db.insert(assets).values({
				id: createId(),
				slug: slug,
				title,
				type: 'html',
				ownerId,
				status: 'draft',
				pricePaise: 0
			});
			return { success: true };
		} catch (e) {
			console.error(e);
			return fail(500, { error: 'Failed to create course' });
		}
	},
	
	updatePrice: async ({ request, locals }) => {
		const user = locals.user;
		if (!user) throw redirect(302, '/sign-in');
		if (user.role !== 'instructor' && user.role !== 'admin') {
			throw redirect(302, '/dashboard');
		}

		const data = await request.formData();
		const courseId = data.get('courseId') as string;
		const price = parseFloat(data.get('price') as string) || 0;

		const pricePaise = Math.floor(price * 100);

		try {
			// Verify ownership
			const [course] = await db.select().from(assets)
				.where(and(eq(assets.id, courseId), eq(assets.ownerId, user.id)));
			if (!course) return fail(403, { error: 'Unauthorized' });

			await db.update(assets)
				.set({ pricePaise })
				.where(eq(assets.id, courseId));
			
			return { success: true };
		} catch (e) {
			return fail(500, { error: 'Failed to update price' });
		}
	}
};
