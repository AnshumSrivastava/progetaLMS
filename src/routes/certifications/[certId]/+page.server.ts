import { db } from '$lib/server/db/client';
import { assets } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const certId = params.certId;

	const [cert] = await db
		.select()
		.from(assets)
		.where(
			and(
				eq(assets.id, certId),
				eq(assets.type, 'cert_test'),
				eq(assets.status, 'published'),
				isNull(assets.deletedAt)
			)
		);

	if (!cert) {
		throw error(404, 'Certification not found');
	}

	return {
		cert
	};
};
