/**
 * Cryptographic Utilities
 *
 * HMAC verification, hashing, and token generation.
 * Used for: Cashfree webhook signature verification, audit log integrity.
 *
 * All operations use the Web Crypto API — compatible with Cloudflare Workers.
 */

/**
 * Compute HMAC-SHA256 signature.
 * Returns base64-encoded result.
 */
export async function hmacSha256Base64(
	secret: string,
	message: string
): Promise<string> {
	const encoder = new TextEncoder();
	const keyMaterial = await crypto.subtle.importKey(
		'raw',
		encoder.encode(secret),
		{ name: 'HMAC', hash: 'SHA-256' },
		false,
		['sign']
	);
	const signature = await crypto.subtle.sign(
		'HMAC',
		keyMaterial,
		encoder.encode(message)
	);
	return btoa(String.fromCharCode(...new Uint8Array(signature)));
}

/**
 * Constant-time comparison to prevent timing attacks.
 * Use when comparing HMAC signatures.
 */
export function constantTimeEqual(a: string, b: string): boolean {
	if (a.length !== b.length) return false;
	let mismatch = 0;
	for (let i = 0; i < a.length; i++) {
		mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
	}
	return mismatch === 0;
}

/**
 * SHA-256 hash of a string. Returns hex-encoded digest.
 * Used for hashing IP addresses before storage (privacy).
 */
export async function sha256Hex(input: string): Promise<string> {
	const encoder = new TextEncoder();
	const hashBuffer = await crypto.subtle.digest('SHA-256', encoder.encode(input));
	const hashArray = Array.from(new Uint8Array(hashBuffer));
	return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Generate a cryptographically random hex string of given byte length.
 */
export function randomHex(bytes = 16): string {
	const arr = new Uint8Array(bytes);
	crypto.getRandomValues(arr);
	return Array.from(arr)
		.map((b) => b.toString(16).padStart(2, '0'))
		.join('');
}
