import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const initialSearch = url.searchParams.get('q') || '';
	const initialCategory = url.searchParams.get('category') || 'All';
	const initialLevel = url.searchParams.get('level') || 'All';

	const publishedCourses = await db
		.select({
			id: assets.id,
			slug: assets.slug,
			title: assets.title,
			description: assets.description,
			type: assets.type,
			deliveryFormat: assets.deliveryFormat,
			isSelfPacedEnabled: assets.isSelfPacedEnabled,
			isLiveBatchesEnabled: assets.isLiveBatchesEnabled,
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

	// All live cohort classes
	const allCourses = publishedCourses.filter((a) => ['html', 'markdown', 'pdf'].includes(a.type));
	const liveClasses = allCourses.filter(
		(a) => a.deliveryFormat === 'live_batch' || (a.isLiveBatchesEnabled && !a.isSelfPacedEnabled)
	);

	return {
		liveClasses,
		initialSearch,
		initialCategory,
		initialLevel
	};
};
