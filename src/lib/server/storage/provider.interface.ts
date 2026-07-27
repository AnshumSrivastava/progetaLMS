/**
 * Storage Domain — Provider Interface
 *
 * The single contract that ALL storage providers must implement.
 * Business logic depends ONLY on this interface — never on provider-specific SDKs.
 *
 * Adding a new provider means implementing this interface. Nothing else changes.
 */

/** Identifies which storage backend holds the file */
export type StorageProviderType = 'local' | 'r2' | 'supabase' | 's3' | 'gcs' | 'azure' | 'minio';

/** Canonical representation of a stored object, returned from all write operations */
export interface StorageObject {
	/** Provider-relative key (path). e.g. 'certificates/abc123.pdf' */
	key: string;
	/** Fully-qualified public URL to access the file */
	publicUrl: string;
	/** Which provider is storing this file */
	provider: StorageProviderType;
	/** MIME type of the stored content */
	mimeType: string;
	/** File size in bytes */
	sizeBytes: number;
	/** SHA-256 hex digest of the file contents (for integrity verification) */
	checksum: string | null;
	/** When the object was stored */
	uploadedAt: Date;
}

/** Options passed when uploading a file */
export interface UploadOptions {
	/** MIME content type. Defaults to 'application/octet-stream' */
	mimeType?: string;
	/** File size in bytes — required by some providers for streaming */
	sizeBytes?: number;
	/** SHA-256 hex digest for integrity checking */
	checksum?: string;
	/** If true, file is publicly accessible. Default: true */
	isPublic?: boolean;
	/** Provider-specific metadata (e.g. cache headers, content disposition) */
	metadata?: Record<string, string>;
}

/** Result of a copy or move operation */
export interface StorageMoveResult {
	source: string;
	destination: string;
	object: StorageObject;
}

/**
 * The storage provider interface.
 * Every provider must implement all methods.
 * Providers live in storage/providers/ and are only referenced by the StorageFactory.
 */
export interface IStorageProvider {
	/** The type identifier for this provider */
	readonly type: StorageProviderType;

	/**
	 * Upload a file.
	 * @param key - Provider-relative path. e.g. 'certificates/abc123.pdf'
	 * @param data - File contents as a Buffer
	 * @param options - Upload metadata
	 */
	upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject>;

	/**
	 * Download a file and return its contents as a Buffer.
	 */
	download(key: string): Promise<Buffer>;

	/**
	 * Delete a file. Resolves silently if the file does not exist.
	 */
	delete(key: string): Promise<void>;

	/**
	 * Check whether a file exists at the given key.
	 */
	exists(key: string): Promise<boolean>;

	/**
	 * Return the public URL for a key WITHOUT making a network call.
	 * This must be a pure, synchronous derivation from the key.
	 */
	getPublicUrl(key: string): string;

	/**
	 * Move a file from one key to another within the same provider.
	 * Equivalent to copy + delete.
	 */
	move(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult>;

	/**
	 * Copy a file to a new key within the same provider.
	 */
	copy(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult>;
}
