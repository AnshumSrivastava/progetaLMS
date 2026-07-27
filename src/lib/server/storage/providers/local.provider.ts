/**
 * Local Storage Provider
 *
 * Stores files on the local filesystem inside a configurable directory.
 * Intended for development and self-hosted deployments without cloud storage.
 *
 * Configuration (via environment variables):
 *   UPLOAD_DIRECTORY=./uploads      (default: ./uploads)
 *   PUBLIC_UPLOAD_URL=/uploads      (default: /uploads)
 *
 * File serving:
 *   SvelteKit serves files at /uploads/* via a dedicated server route.
 *   See: src/routes/uploads/[...path]/+server.ts
 *
 * Migration path:
 *   To migrate to R2 or Supabase, run the migration script which:
 *   1. Reads each file from the local uploads directory
 *   2. Uploads to the new provider
 *   3. Updates the storage_objects.storage_key and storage_provider records
 *   No business logic or database schema changes required.
 */
import { mkdir, writeFile, readFile, unlink, access, copyFile, rename } from 'node:fs/promises';
import { join, dirname } from 'node:path';
import { createHash } from 'node:crypto';
import type {
	IStorageProvider,
	StorageObject,
	StorageMoveResult,
	UploadOptions
} from '../provider.interface';

export class LocalStorageProvider implements IStorageProvider {
	readonly type = 'local' as const;

	constructor(
		/** Absolute path to the uploads root directory */
		private readonly uploadDir: string,
		/** Public URL prefix — e.g. /uploads or https://example.com/uploads */
		private readonly publicUrlBase: string
	) {}

	async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject> {
		const filePath = this.resolvePath(key);

		// Create nested directories if they don't exist
		await mkdir(dirname(filePath), { recursive: true });
		await writeFile(filePath, data);

		const checksum = options?.checksum ?? this.computeChecksum(data);
		const mimeType = options?.mimeType ?? 'application/octet-stream';

		return {
			key,
			publicUrl:  this.getPublicUrl(key),
			provider:   this.type,
			mimeType,
			sizeBytes:  options?.sizeBytes ?? data.byteLength,
			checksum,
			uploadedAt: new Date()
		};
	}

	async download(key: string): Promise<Buffer> {
		const filePath = this.resolvePath(key);
		return readFile(filePath);
	}

	async delete(key: string): Promise<void> {
		const filePath = this.resolvePath(key);
		try {
			await unlink(filePath);
		} catch (e: unknown) {
			// Silently ignore ENOENT — file doesn't exist is not an error for delete
			if ((e as NodeJS.ErrnoException).code !== 'ENOENT') throw e;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			await access(this.resolvePath(key));
			return true;
		} catch {
			return false;
		}
	}

	getPublicUrl(key: string): string {
		// Normalize: strip leading slash from key, ensure base has no trailing slash
		const base = this.publicUrlBase.replace(/\/$/, '');
		const normalizedKey = key.replace(/^\//, '');
		return `${base}/${normalizedKey}`;
	}

	async move(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult> {
		const fromPath = this.resolvePath(fromKey);
		const toPath   = this.resolvePath(toKey);

		await mkdir(dirname(toPath), { recursive: true });
		await rename(fromPath, toPath);

		const object: StorageObject = {
			key:        toKey,
			publicUrl:  this.getPublicUrl(toKey),
			provider:   this.type,
			mimeType:   options?.mimeType ?? 'application/octet-stream',
			sizeBytes:  options?.sizeBytes ?? 0,
			checksum:   options?.checksum ?? null,
			uploadedAt: new Date()
		};

		return { source: fromKey, destination: toKey, object };
	}

	async copy(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult> {
		const fromPath = this.resolvePath(fromKey);
		const toPath   = this.resolvePath(toKey);

		await mkdir(dirname(toPath), { recursive: true });
		await copyFile(fromPath, toPath);

		const data = await readFile(toPath);
		const object: StorageObject = {
			key:        toKey,
			publicUrl:  this.getPublicUrl(toKey),
			provider:   this.type,
			mimeType:   options?.mimeType ?? 'application/octet-stream',
			sizeBytes:  data.byteLength,
			checksum:   options?.checksum ?? this.computeChecksum(data),
			uploadedAt: new Date()
		};

		return { source: fromKey, destination: toKey, object };
	}

	// ── Private Helpers ───────────────────────────────────────────────────────

	private resolvePath(key: string): string {
		// Prevent path traversal: strip any leading ../ sequences
		const safe = key.replace(/\.\.\//g, '').replace(/^\//, '');
		return join(this.uploadDir, safe);
	}

	private computeChecksum(data: Buffer): string {
		return createHash('sha256').update(data).digest('hex');
	}
}
