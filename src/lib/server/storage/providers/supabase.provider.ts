/**
 * Supabase Storage Provider
 *
 * Status: READY TO ACTIVATE
 * Activate by setting UPLOAD_PROVIDER=supabase in your environment.
 *
 * Uses the Supabase Storage API directly via HTTP (no Supabase JS SDK required,
 * which avoids bundling the entire Supabase client for storage alone).
 *
 * Required environment variables:
 *   SUPABASE_URL=https://xxx.supabase.co
 *   SUPABASE_STORAGE_BUCKET=launchpad-assets
 *   SUPABASE_SERVICE_ROLE_KEY=eyJ...
 *
 * Docs: https://supabase.com/docs/guides/storage/uploads/standard-uploads
 */
import type {
	IStorageProvider,
	StorageObject,
	StorageMoveResult,
	UploadOptions
} from '../provider.interface';

interface SupabaseConfig {
	url:           string;
	bucketName:    string;
	serviceRoleKey: string;
}

export class SupabaseStorageProvider implements IStorageProvider {
	readonly type = 'supabase' as const;

	private readonly storageUrl: string;
	private readonly bucketName: string;
	private readonly authHeader: Record<string, string>;
	private readonly publicUrlBase: string;

	constructor(config: SupabaseConfig) {
		const base = config.url.replace(/\/$/, '');
		this.storageUrl  = `${base}/storage/v1`;
		this.publicUrlBase = `${base}/storage/v1/object/public/${config.bucketName}`;
		this.bucketName  = config.bucketName;
		this.authHeader  = {
			Authorization: `Bearer ${config.serviceRoleKey}`,
			apikey:        config.serviceRoleKey
		};
	}

	async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject> {
		const url = `${this.storageUrl}/object/${this.bucketName}/${key}`;

		const response = await fetch(url, {
			method:  'POST',
			headers: {
				...this.authHeader,
				'Content-Type': options?.mimeType ?? 'application/octet-stream',
				'x-upsert':     'true'   // overwrite if exists
			},
			body: data as unknown as BodyInit
		});

		if (!response.ok) {
			const body = await response.text();
			throw new Error(`Supabase upload failed (${response.status}): ${body}`);
		}

		return {
			key,
			publicUrl:  this.getPublicUrl(key),
			provider:   this.type,
			mimeType:   options?.mimeType ?? 'application/octet-stream',
			sizeBytes:  options?.sizeBytes ?? data.byteLength,
			checksum:   options?.checksum ?? null,
			uploadedAt: new Date()
		};
	}

	async download(key: string): Promise<Buffer> {
		const url = `${this.storageUrl}/object/${this.bucketName}/${key}`;
		const response = await fetch(url, { headers: this.authHeader });

		if (!response.ok) throw new Error(`Supabase download failed (${response.status})`);
		return Buffer.from(await response.arrayBuffer());
	}

	async delete(key: string): Promise<void> {
		const url = `${this.storageUrl}/object/${this.bucketName}/${key}`;
		const response = await fetch(url, {
			method:  'DELETE',
			headers: this.authHeader
		});
		// 404 = already deleted, which is acceptable
		if (!response.ok && response.status !== 404) {
			throw new Error(`Supabase delete failed (${response.status})`);
		}
	}

	async exists(key: string): Promise<boolean> {
		const url = `${this.storageUrl}/object/info/authenticated/${this.bucketName}/${key}`;
		const response = await fetch(url, { headers: this.authHeader });
		return response.ok;
	}

	getPublicUrl(key: string): string {
		return `${this.publicUrlBase}/${key.replace(/^\//, '')}`;
	}

	async move(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult> {
		const url = `${this.storageUrl}/object/move`;
		const response = await fetch(url, {
			method:  'POST',
			headers: { ...this.authHeader, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bucketId:       this.bucketName,
				sourceKey:      fromKey,
				destinationKey: toKey
			})
		});

		if (!response.ok) throw new Error(`Supabase move failed (${response.status})`);

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
		const url = `${this.storageUrl}/object/copy`;
		const response = await fetch(url, {
			method:  'POST',
			headers: { ...this.authHeader, 'Content-Type': 'application/json' },
			body: JSON.stringify({
				bucketId:       this.bucketName,
				sourceKey:      fromKey,
				destinationKey: toKey
			})
		});

		if (!response.ok) throw new Error(`Supabase copy failed (${response.status})`);

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
}
