// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces

import type { AuthUser, AuthSession } from '$lib/server/auth/auth.types';

declare global {
	namespace App {
		// interface Error {}

		interface Locals {
			user: AuthUser | null;
			session: AuthSession | null;
			isImpersonating?: boolean;
		}

		// interface PageData {}

		// interface PageState {}

		interface Platform {
			env: {
				// Cloudflare R2 (if using binding instead of S3 API)
				// ASSETS: R2Bucket;
			};
			context: {
				waitUntil(promise: Promise<unknown>): void;
			};
			caches: CacheStorage & { default: Cache };
		}
	}
}

export {};
