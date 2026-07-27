import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.toLowerCase() ?? '';

	const published = await db
		.select({
			id: assets.id,
			slug: assets.slug,
			title: assets.title,
			description: assets.description,
			type: assets.type,
			pricePaise: assets.pricePaise,
			thumbnail: assets.thumbnail,
			metadata: assets.metadata
		})
		.from(assets)
		.where(
			and(
				eq(assets.status, 'published'),
				eq(assets.visibility, 'public'),
				isNull(assets.deletedAt)
			)
		)
		.orderBy(assets.sortOrder);

	// Filter by search client-side (simple approach for now)
	const filtered = search
		? published.filter(a => a.title.toLowerCase().includes(search) || (a.description ?? '').toLowerCase().includes(search))
		: published;

	const courses = filtered.filter(a => ['html', 'markdown', 'pdf'].includes(a.type));
	const resources = filtered.filter(a => ['download', 'external'].includes(a.type));
	const certifications = filtered.filter(a => a.type === 'cert_test');

	return { courses, resources, certifications, search };
};
