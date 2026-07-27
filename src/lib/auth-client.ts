import { createAuthClient } from 'better-auth/svelte';
import { emailOTPClient } from 'better-auth/client/plugins';
import { PUBLIC_APP_URL } from '$env/static/public';

export const authClient = createAuthClient({
	baseURL: PUBLIC_APP_URL,
	plugins: [
		emailOTPClient()
	]
});

export const {
	signIn,
	signUp,
	signOut,
	useSession
} = authClient;
