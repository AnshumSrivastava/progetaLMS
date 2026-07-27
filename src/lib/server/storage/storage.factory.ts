/**
 * Storage Provider Factory
 *
 * Reads UPLOAD_PROVIDER from the environment and returns the appropriate
 * provider instance. This is the ONLY place provider-specific code is referenced.
 *
 * Business logic receives an IStorageProvider — it never calls this factory.
 * Only StorageService (or application bootstrap) calls this.
 *
 * To add a new provider:
 *   1. Create a new file in providers/
 *   2. Implement IStorageProvider
 *   3. Add a case to this factory
 *   4. Document the required env vars
 *
 * That is the entirety of the change required.
 */
import { resolve } from 'node:path';
import type { IStorageProvider, StorageProviderType } from './provider.interface';
import { LocalStorageProvider }    from './providers/local.provider';
import { R2StorageProvider }       from './providers/r2.provider';
import { SupabaseStorageProvider } from './providers/supabase.provider';

export interface StorageFactoryConfig {
	provider: string;

	// Local
	uploadDirectory?: string;
	publicUploadUrl?: string;

	// R2
	r2AccountId?:       string;
	r2AccessKeyId?:     string;
	r2SecretAccessKey?: string;
	r2BucketName?:      string;
	r2PublicUrl?:       string;

	// Supabase
	supabaseUrl?:            string;
	supabaseStorageBucket?:  string;
	supabaseServiceRoleKey?: string;
}

export function createStorageProvider(config: StorageFactoryConfig): IStorageProvider {
	const providerType = config.provider as StorageProviderType;

	switch (providerType) {
		case 'local': {
			const uploadDir    = resolve(config.uploadDirectory ?? './uploads');
			const publicUrlBase = config.publicUploadUrl ?? '/uploads';
			return new LocalStorageProvider(uploadDir, publicUrlBase);
		}

		case 'r2': {
			const missing = ['r2AccountId', 'r2AccessKeyId', 'r2SecretAccessKey', 'r2BucketName', 'r2PublicUrl']
				.filter((k) => !config[k as keyof StorageFactoryConfig]);

			if (missing.length > 0) {
				throw new Error(
					`R2 storage provider is missing configuration: ${missing.join(', ')}. ` +
					'Set the corresponding environment variables.'
				);
			}

			return new R2StorageProvider({
				accountId:       config.r2AccountId!,
				accessKeyId:     config.r2AccessKeyId!,
				secretAccessKey: config.r2SecretAccessKey!,
				bucketName:      config.r2BucketName!,
				publicUrl:       config.r2PublicUrl!
			});
		}

		case 'supabase': {
			const missing = ['supabaseUrl', 'supabaseStorageBucket', 'supabaseServiceRoleKey']
				.filter((k) => !config[k as keyof StorageFactoryConfig]);

			if (missing.length > 0) {
				throw new Error(
					`Supabase storage provider is missing configuration: ${missing.join(', ')}. ` +
					'Set the corresponding environment variables.'
				);
			}

			return new SupabaseStorageProvider({
				url:            config.supabaseUrl!,
				bucketName:     config.supabaseStorageBucket!,
				serviceRoleKey: config.supabaseServiceRoleKey!
			});
		}

		default:
			throw new Error(
				`Unknown storage provider: '${providerType}'. ` +
				"Valid options: 'local', 'r2', 'supabase'."
			);
	}
}
