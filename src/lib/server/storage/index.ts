/**
 * Storage Service Singleton
 *
 * Resolves the active provider from environment variables at module load time.
 * Import `storage` anywhere in server-side code.
 *
 * Usage:
 *   import { storage } from '$lib/server/storage';
 *   const obj = await storage.upload('certificates/abc.pdf', buffer, { mimeType: 'application/pdf' });
 */
import { env } from '$env/dynamic/private';
import { db } from '../db/client';
import { createStorageProvider } from './storage.factory';
import { StorageService }        from './storage.service';

const provider = createStorageProvider({
	provider: env.UPLOAD_PROVIDER ?? 'local',

	// Local
	uploadDirectory: env.UPLOAD_DIRECTORY,
	publicUploadUrl: env.PUBLIC_UPLOAD_URL,

	// R2
	r2AccountId:       env.R2_ACCOUNT_ID,
	r2AccessKeyId:     env.R2_ACCESS_KEY_ID,
	r2SecretAccessKey: env.R2_SECRET_ACCESS_KEY,
	r2BucketName:      env.R2_BUCKET_NAME,
	r2PublicUrl:       env.R2_PUBLIC_URL,

	// Supabase
	supabaseUrl:            env.SUPABASE_URL,
	supabaseStorageBucket:  env.SUPABASE_STORAGE_BUCKET,
	supabaseServiceRoleKey: env.SUPABASE_SERVICE_ROLE_KEY
});

export const storage = new StorageService(provider, db);

// Re-export types so callers don't need to reach into internals
export type { StorageObject, IStorageProvider, UploadOptions, StorageMoveResult } from './provider.interface';
