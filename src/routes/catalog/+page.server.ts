import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { events } from '$lib/server/db/schema/events.schema';
import { eq, and, isNull, asc } from 'drizzle-orm';
import { MentoringService } from '$lib/server/mentoring/MentoringService';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ url }) => {
	const search = url.searchParams.get('q')?.toLowerCase() ?? '';
	const category = url.searchParams.get('category') ?? '';
	const level = url.searchParams.get('level') ?? '';

	let dbAssets: any[] = [];
	try {
		dbAssets = await db
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
	} catch (e) {
		console.error('Failed to load assets from db:', e);
	}

	let upcomingEvents: any[] = [];
	try {
		upcomingEvents = await db
			.select({
				id: events.id,
				slug: events.slug,
				title: events.title,
				shortDescription: events.shortDescription,
				eventType: events.eventType,
				pricePaise: events.pricePaise,
				priceCredits: events.priceCredits,
				startAt: events.startAt,
				endAt: events.endAt,
				venueType: events.venueType,
				venueDetails: events.venueDetails,
				coverImageUrl: events.coverImageUrl
			})
			.from(events)
			.where(eq(events.status, 'published'))
			.orderBy(asc(events.startAt))
			.limit(12);
	} catch (e) {
		console.error('Failed to load events for catalog:', e);
	}

	let publicMentors: any[] = [];
	try {
		publicMentors = await MentoringService.getPublicMentors();
	} catch (e) {
		console.error('Failed to load mentors from db:', e);
	}

	// Filter db assets if search query exists
	let filtered = search
		? dbAssets.filter(
				(a) =>
					a.title.toLowerCase().includes(search) ||
					(a.description ?? '').toLowerCase().includes(search)
			)
		: dbAssets;

	if (category && category !== 'All') {
		filtered = filtered.filter((a) => (a.metadata as any)?.category === category);
	}
	if (level && level !== 'All') {
		filtered = filtered.filter((a) => (a.metadata as any)?.level === level);
	}

	const allCourses = filtered.filter((a) => ['html', 'markdown', 'pdf'].includes(a.type));
	const liveClasses = allCourses.filter(
		(a) => a.deliveryFormat === 'live_batch' || (a.isLiveBatchesEnabled && !a.isSelfPacedEnabled)
	);
	const courses = allCourses.filter((a) => a.deliveryFormat !== 'live_batch');
	const resources = filtered.filter((a) => ['download', 'external', 'pdf'].includes(a.type));
	const certifications = filtered.filter((a) => a.type === 'cert_test');

	return {
		events: upcomingEvents,
		courses,
		liveClasses,
		resources,
		certifications,
		mentors: publicMentors,
		search,
		category,
		level
	};
};
