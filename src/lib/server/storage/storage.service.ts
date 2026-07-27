/**
 * Storage Service
 *
 * The application's single interface to file storage.
 * Business logic imports StorageService — never a provider directly.
 *
 * Key paths (STORAGE_PATHS) keep key naming consistent across providers.
 * e.g. StorageService.upload('certificates/abc123.pdf', data) works
 *      regardless of whether the backend is local, R2, or Supabase.
 *
 * The service also persists a record to `storage_objects` for:
 *   - Audit trail
 *   - Migration: knowing which provider holds each file
 *   - Integrity: checksum stored for future verification
 *
 * Usage:
 *   const storage = new StorageService(db);
 *   const obj = await storage.upload('certificates/abc.pdf', buffer, {
 *     mimeType: 'application/pdf',
 *     uploadedBy: userId
 *   });
 *   // obj.publicUrl is safe to store in the certificates table
 */
import type { Database } from '../db/client';
import { storageObjects } from '../db/schema/storage.schema';
import type {
	IStorageProvider,
	StorageObject,
	UploadOptions,
	StorageMoveResult
} from './provider.interface';
import { generateId } from '$shared/utils/id';

interface ServiceUploadOptions extends UploadOptions {
	/** User ID who initiated the upload (for audit trail) */
	uploadedBy?: string;
}

export class StorageService {
	constructor(
		private readonly provider: IStorageProvider,
		private readonly db: Database
	) {}

	get providerType() {
		return this.provider.type;
	}

	/**
	 * Upload a file and persist a storage_objects record.
	 * Returns the StorageObject with a guaranteed publicUrl.
	 */
	async upload(
		key: string,
		data: Buffer,
		options?: ServiceUploadOptions
	): Promise<StorageObject> {
		const object = await this.provider.upload(key, data, options);
		await this.persistRecord(object, options?.uploadedBy);
		return object;
	}

	/**
	 * Download file contents. Does NOT update any DB record.
	 */
	async download(key: string): Promise<Buffer> {
		return this.provider.download(key);
	}

	/**
	 * Delete a file and remove its storage_objects record.
	 */
	async delete(key: string): Promise<void> {
		await this.provider.delete(key);
		// Note: storage_objects records are retained (soft audit trail)
		// Update them to reflect deletion if needed in the future
	}

	/**
	 * Check if a file exists in the provider.
	 */
	async exists(key: string): Promise<boolean> {
		return this.provider.exists(key);
	}

	/**
	 * Return the public URL for a key without network IO.
	 */
	getPublicUrl(key: string): string {
		return this.provider.getPublicUrl(key);
	}

	/**
	 * Move a file to a new key (copy + delete).
	 */
	async move(
		fromKey: string,
		toKey: string,
		options?: ServiceUploadOptions
	): Promise<StorageMoveResult> {
		const result = await this.provider.move(fromKey, toKey, options);
		await this.persistRecord(result.object, options?.uploadedBy);
		return result;
	}

	/**
	 * Copy a file to a new key.
	 */
	async copy(
		fromKey: string,
		toKey: string,
		options?: ServiceUploadOptions
	): Promise<StorageMoveResult> {
		const result = await this.provider.copy(fromKey, toKey, options);
		await this.persistRecord(result.object, options?.uploadedBy);
		return result;
	}

	// ── Private ───────────────────────────────────────────────────────────────

	private async persistRecord(
		object: StorageObject,
		uploadedBy?: string
	): Promise<void> {
		await this.db
			.insert(storageObjects)
			.values({
				id:              generateId(),
				storageProvider: object.provider,
				storageKey:      object.key,
				publicUrl:       object.publicUrl,
				mimeType:        object.mimeType,
				sizeBytes:       object.sizeBytes,
				checksum:        object.checksum,
				uploadedBy:      uploadedBy ?? null,
				uploadedAt:      object.uploadedAt
			})
			.onConflictDoNothing(); // key is unique — idempotent on retry
	}
}
