/**
 * Cloudflare R2 Storage Provider
 *
 * Uses the AWS S3-compatible API via @aws-sdk/client-s3.
 * R2 is S3-compatible, so no Cloudflare-specific SDK is needed.
 *
 * Status: READY TO ACTIVATE
 * Activate by setting UPLOAD_PROVIDER=r2 in your environment.
 *
 * Required environment variables:
 *   R2_ACCOUNT_ID=
 *   R2_ACCESS_KEY_ID=
 *   R2_SECRET_ACCESS_KEY=
 *   R2_BUCKET_NAME=
 *   R2_PUBLIC_URL=https://assets.progeta.in
 *
 * Migration from local:
 *   Run scripts/migrate-storage.ts to copy local files to R2.
 */
import {
	S3Client,
	PutObjectCommand,
	GetObjectCommand,
	DeleteObjectCommand,
	HeadObjectCommand,
	CopyObjectCommand,
	NoSuchKey
} from '@aws-sdk/client-s3';
import type {
	IStorageProvider,
	StorageObject,
	StorageMoveResult,
	UploadOptions
} from '../provider.interface';

interface R2Config {
	accountId:       string;
	accessKeyId:     string;
	secretAccessKey: string;
	bucketName:      string;
	publicUrl:       string;
}

export class R2StorageProvider implements IStorageProvider {
	readonly type = 'r2' as const;

	private readonly client: S3Client;
	private readonly bucketName: string;
	private readonly publicUrlBase: string;

	constructor(config: R2Config) {
		this.bucketName    = config.bucketName;
		this.publicUrlBase = config.publicUrl.replace(/\/$/, '');

		this.client = new S3Client({
			region:   'auto',
			endpoint: `https://${config.accountId}.r2.cloudflarestorage.com`,
			credentials: {
				accessKeyId:     config.accessKeyId,
				secretAccessKey: config.secretAccessKey
			}
		});
	}

	async upload(key: string, data: Buffer, options?: UploadOptions): Promise<StorageObject> {
		await this.client.send(new PutObjectCommand({
			Bucket:      this.bucketName,
			Key:         key,
			Body:        data,
			ContentType: options?.mimeType ?? 'application/octet-stream',
			ContentLength: options?.sizeBytes ?? data.byteLength,
			Metadata:    options?.metadata
		}));

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
		const response = await this.client.send(new GetObjectCommand({
			Bucket: this.bucketName,
			Key:    key
		}));

		if (!response.Body) throw new Error(`Empty body for key: ${key}`);
		const bytes = await response.Body.transformToByteArray();
		return Buffer.from(bytes);
	}

	async delete(key: string): Promise<void> {
		try {
			await this.client.send(new DeleteObjectCommand({
				Bucket: this.bucketName,
				Key:    key
			}));
		} catch (e) {
			if (e instanceof NoSuchKey) return; // Already gone
			throw e;
		}
	}

	async exists(key: string): Promise<boolean> {
		try {
			await this.client.send(new HeadObjectCommand({
				Bucket: this.bucketName,
				Key:    key
			}));
			return true;
		} catch {
			return false;
		}
	}

	getPublicUrl(key: string): string {
		return `${this.publicUrlBase}/${key.replace(/^\//, '')}`;
	}

	async move(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult> {
		const object = (await this.copy(fromKey, toKey, options)).object;
		await this.delete(fromKey);
		return { source: fromKey, destination: toKey, object };
	}

	async copy(fromKey: string, toKey: string, options?: UploadOptions): Promise<StorageMoveResult> {
		await this.client.send(new CopyObjectCommand({
			Bucket:     this.bucketName,
			CopySource: `${this.bucketName}/${fromKey}`,
			Key:        toKey,
			ContentType: options?.mimeType
		}));

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
