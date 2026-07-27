import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull } from 'drizzle-orm';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	const certs = await db
		.select()
		.from(assets)
		.where(
			and(
				eq(assets.type, 'cert_test'),
				eq(assets.status, 'published'),
				isNull(assets.deletedAt)
			)
		);

	return {
		certs
	};
};
