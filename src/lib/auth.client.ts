/**
 * Better Auth — Browser Client
 *
 * Import `authClient` anywhere in client-side Svelte code.
 * Do NOT import this in +server.ts or hooks.server.ts — those use auth.config.ts directly.
 *
 * Usage:
 *   import { authClient } from '$lib/auth.client';
 *   const { data: session } = authClient.useSession();
 *   await authClient.signOut();
 */
import { createAuthClient } from 'better-auth/svelte';
import { emailOTPClient } from 'better-auth/client/plugins';
import { PUBLIC_APP_URL } from '$env/static/public';

export const authClient = createAuthClient({
	baseURL: PUBLIC_APP_URL,
	plugins: [emailOTPClient()]
});

export type Session = typeof authClient.$Infer.Session;
