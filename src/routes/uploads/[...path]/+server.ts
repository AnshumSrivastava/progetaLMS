/**
 * Local Storage File Server
 *
 * Serves files from the local uploads directory when UPLOAD_PROVIDER=local.
 * This route should NOT be deployed to Cloudflare Pages — it is a development
 * convenience. In production, R2 or Supabase serve files via their own CDN.
 *
 * Security:
 * - Path traversal is prevented by stripping `../` sequences
 * - Files are served with the correct MIME type
 * - 404 for missing files, not a directory listing
 *
 * Note: In production with UPLOAD_PROVIDER=r2 or supabase, requests to
 * /uploads/* will 404 — which is correct, since files are served from
 * the provider's public URL, not from this application.
 */
import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { env } from '$env/dynamic/private';
import { readFile, access } from 'node:fs/promises';
import { resolve, join, extname } from 'node:path';

const MIME_MAP: Record<string, string> = {
	'.pdf':  'application/pdf',
	'.png':  'image/png',
	'.jpg':  'image/jpeg',
	'.jpeg': 'image/jpeg',
	'.gif':  'image/gif',
	'.webp': 'image/webp',
	'.svg':  'image/svg+xml',
	'.txt':  'text/plain',
	'.json': 'application/json',
	'.zip':  'application/zip'
};

export const GET: RequestHandler = async ({ params }) => {
	// Only active when UPLOAD_PROVIDER=local
	if ((env.UPLOAD_PROVIDER ?? 'local') !== 'local') {
		throw error(404, 'Not found');
	}

	const uploadDir = resolve(env.UPLOAD_DIRECTORY ?? './uploads');

	// Sanitize path — prevent directory traversal
	const rawPath = params.path ?? '';
	const safePath = rawPath.replace(/\.\.\//g, '').replace(/^\//, '');
	const filePath  = join(uploadDir, safePath);

	// Ensure the resolved path is still within the uploads directory
	if (!filePath.startsWith(uploadDir)) {
		throw error(403, 'Forbidden');
	}

	try {
		await access(filePath);
	} catch {
		throw error(404, 'File not found');
	}

	const data = await readFile(filePath);
	const ext  = extname(filePath).toLowerCase();
	const mimeType = MIME_MAP[ext] ?? 'application/octet-stream';

	return new Response(data, {
		headers: {
			'Content-Type':   mimeType,
			'Content-Length': String(data.byteLength),
			'Cache-Control':  'public, max-age=31536000, immutable'
		}
	});
};
