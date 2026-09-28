import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { users, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq, and, isNull, inArray } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const rawResources = await db
		.select({
			id: assets.id,
			slug: assets.slug,
			title: assets.title,
			description: assets.description,
			type: assets.type,
			pricePaise: assets.pricePaise,
			metadata: assets.metadata,
			ownerId: assets.ownerId,
			ownerName: users.name,
			ownerRole: users.role,
			ownerAvatar: identityProfiles.avatarUrl,
			ownerHeadline: identityProfiles.mentoringHeadline
		})
		.from(assets)
		.innerJoin(users, eq(assets.ownerId, users.id))
		.leftJoin(identityProfiles, eq(identityProfiles.userId, users.id))
		.where(
			and(
				inArray(assets.type, ['download', 'external']),
				eq(assets.status, 'published'),
				eq(assets.visibility, 'public'),
				isNull(assets.deletedAt)
			)
		)
		.orderBy(assets.sortOrder);

	let ownedAssetIds = new Set<string>();
	if (locals.user) {
		const owned = await db
			.select({ assetId: assetOwnership.assetId })
			.from(assetOwnership)
			.where(
				and(
					eq(assetOwnership.ownerId, locals.user.id),
					isNull(assetOwnership.revokedAt)
				)
			);
		ownedAssetIds = new Set(owned.map((o) => o.assetId));
	}

	const resources = rawResources.map((res) => {
		// Determine source: mentor or platform
		const isMentor = ['teacher', 'owner'].includes(res.ownerRole) && res.ownerName !== 'Progeta Technologies';
		return {
			...res,
			source: isMentor ? 'mentor' : 'platform',
			alreadyOwned: ownedAssetIds.has(res.id)
		};
	});

	return {
		resources,
		user: locals.user
	};
};
