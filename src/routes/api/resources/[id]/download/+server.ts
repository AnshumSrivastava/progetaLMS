import { db } from '$lib/server/db/client';
import { assets, assetContent, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { eq, and, isNull } from 'drizzle-orm';
import { error, redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';

export const GET: RequestHandler = async ({ params, locals }) => {
	const resourceId = params.id;

	const [asset] = await db
		.select()
		.from(assets)
		.where(
			and(
				eq(assets.id, resourceId),
				eq(assets.status, 'published'),
				isNull(assets.deletedAt)
			)
		)
		.limit(1);

	if (!asset) {
		throw error(404, 'Resource not found');
	}

	// Authorization check: if not free, require ownership
	if (asset.pricePaise > 0) {
		if (!locals.user) {
			throw redirect(303, `/sign-in?redirect=/catalog/${asset.id}`);
		}

		const [owned] = await db
			.select()
			.from(assetOwnership)
			.where(
				and(
					eq(assetOwnership.assetId, asset.id),
					eq(assetOwnership.ownerId, locals.user.id),
					isNull(assetOwnership.revokedAt)
				)
			)
			.limit(1);

		if (!owned) {
			throw redirect(303, `/checkout/${asset.id}`);
		}
	}

	// Fetch current content from assetContent
	const [contentRecord] = await db
		.select()
		.from(assetContent)
		.where(
			and(
				eq(assetContent.assetId, asset.id),
				eq(assetContent.isCurrent, true)
			)
		)
		.limit(1);

	const filenameSafe = asset.title.replace(/[^a-zA-Z0-9_-]/g, '_').toLowerCase();
	const format = (asset.metadata as any)?.format || 'PDF';
	const ext = format.toLowerCase() === 'markdown' ? 'md' : 'pdf';

	const fileBody = contentRecord?.content || `# ${asset.title}\n\n${asset.description || ''}\n\nVerified Technical Learning Resource on Launchpad.\n`;

	return new Response(fileBody, {
		status: 200,
		headers: {
			'Content-Type': ext === 'md' ? 'text/markdown; charset=utf-8' : 'application/octet-stream',
			'Content-Disposition': `attachment; filename="${filenameSafe}.${ext}"`,
			'Cache-Control': 'private, no-cache, no-store, must-revalidate'
		}
	});
};
