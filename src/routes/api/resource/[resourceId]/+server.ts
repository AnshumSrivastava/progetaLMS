import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { eventResources, eventRegistrations, events } from '$lib/server/db/schema/events.schema';
import { users } from '$lib/server/db/schema/identity.schema';
import { storage } from '$lib/server/storage';
import { hmacSha256Base64, constantTimeEqual } from '$shared/utils/crypto';
import { env } from '$env/dynamic/private';
import { CASHFREE_SECRET_KEY } from '$env/static/private';
import { eq, and } from 'drizzle-orm';

const SIGNING_SECRET = env.RESOURCE_SIGNING_SECRET || CASHFREE_SECRET_KEY || 'progeta-default-resource-key-32b';

export const GET: RequestHandler = async ({ params, url }) => {
	const resourceId = params.resourceId;
	const uid = url.searchParams.get('uid');
	const expStr = url.searchParams.get('exp');
	const sig = url.searchParams.get('sig');

	if (!uid || !expStr || !sig) {
		throw error(400, 'Missing signed download parameters');
	}

	const exp = parseInt(expStr, 10);
	const nowUnix = Math.floor(Date.now() / 1000);

	if (isNaN(exp) || nowUnix > exp) {
		throw error(410, 'This download link has expired. Please refresh the resources page to get a fresh link.');
	}

	// 1. Verify HMAC Signature
	const message = `${resourceId}:${uid}:${exp}`;
	const expectedSig = await hmacSha256Base64(SIGNING_SECRET, message);

	if (!constantTimeEqual(sig, expectedSig)) {
		throw error(403, 'Invalid signature');
	}

	// 2. Fetch Resource Record
	const [resource] = await db
		.select()
		.from(eventResources)
		.where(eq(eventResources.id, resourceId));

	if (!resource) {
		throw error(404, 'Resource not found');
	}

	// 3. Verify Registration / Permissions
	const [user] = await db.select().from(users).where(eq(users.id, uid));
	const isStaff = user && (user.role === 'admin' || user.role === 'owner');

	const [registration] = await db
		.select()
		.from(eventRegistrations)
		.where(and(
			eq(eventRegistrations.eventId, resource.eventId),
			eq(eventRegistrations.userId, uid),
			eq(eventRegistrations.status, 'confirmed')
		));

	if (!isStaff && !registration && !resource.isPublic) {
		throw error(403, 'You are not authorized to download this file');
	}

	// 4. Download file from StorageService
	try {
		const fileBuffer = await storage.download(resource.urlOrKey);
		const filename = resource.title.replace(/[^\w\.\-\s]/gi, '_');

		return new Response(fileBuffer, {
			headers: {
				'Content-Type': resource.mimeType || 'application/octet-stream',
				'Content-Disposition': `attachment; filename="${filename}"`,
				'Cache-Control': 'private, no-cache, no-store'
			}
		});
	} catch (e: any) {
		console.error('[ResourceDownloadError]', e);
		throw error(500, 'Failed to retrieve file from storage');
	}
};

