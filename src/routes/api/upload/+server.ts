import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY, R2_BUCKET_NAME, R2_PUBLIC_URL } from '$env/static/private';

const S3 = new S3Client({
	region: 'auto',
	endpoint: `https://${R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
	credentials: {
		accessKeyId: R2_ACCESS_KEY_ID,
		secretAccessKey: R2_SECRET_ACCESS_KEY
	}
});

const ALLOWED_MIME_TYPES = new Set([
	'image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/svg+xml',
	'video/mp4', 'video/webm',
	'application/pdf',
	'text/plain', 'text/markdown',
]);
const INSTRUCTOR_ROLES = ['instructor', 'admin', 'owner'];

export const POST: RequestHandler = async ({ request, locals }) => {
	const user = locals.user;
	if (!user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	if (!INSTRUCTOR_ROLES.includes(user.role as string)) {
		return json({ error: 'Forbidden: only instructors can upload files' }, { status: 403 });
	}

	try {
		const { filename, contentType } = await request.json();

		if (!filename || !contentType) {
			return json({ error: 'Missing filename or contentType' }, { status: 400 });
		}

		if (!ALLOWED_MIME_TYPES.has(contentType)) {
			return json({ error: `File type '${contentType}' is not allowed` }, { status: 400 });
		}

		// Sanitize filename and create unique key
		const ext = filename.split('.').pop() || '';
		const safeName = filename.replace(/[^a-z0-9]/gi, '_').toLowerCase();
		const key = `${user.id}/${Date.now()}_${safeName}`;

		const command = new PutObjectCommand({
			Bucket: R2_BUCKET_NAME,
			Key: key,
			ContentType: contentType
		});

		// Generate presigned URL valid for 5 minutes
		const signedUrl = await getSignedUrl(S3, command, { expiresIn: 300 });

		// Construct public URL
		// Assumes R2_PUBLIC_URL is something like "https://assets.progeta.in" without trailing slash
		const publicUrl = `${R2_PUBLIC_URL.replace(/\/$/, '')}/${key}`;

		return json({
			uploadUrl: signedUrl,
			publicUrl: publicUrl,
			key: key
		});
	} catch (err: any) {
		console.error('Upload error:', err);
		return json({ error: err.message || 'Internal server error' }, { status: 500 });
	}
};
