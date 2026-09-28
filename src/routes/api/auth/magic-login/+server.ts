import { redirect } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users, sessions, verifications } from '$lib/server/db/schema/identity.schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'node:crypto';

export const GET: RequestHandler = async ({ url, cookies }) => {
	const token = url.searchParams.get('token');
	const redirectUrl = url.searchParams.get('redirect') || '/dashboard';

	if (!token) {
		throw redirect(302, '/');
	}

	try {
		const identifier = `magic-login:${token}`;
		const now = new Date();

		// Find unused and unexpired magic login token
		const [record] = await db
			.select()
			.from(verifications)
			.where(
				and(
					eq(verifications.identifier, identifier),
					gt(verifications.expiresAt, now)
				)
			)
			.limit(1);

		if (!record) {
			console.warn('[MagicLogin] Token not found or expired:', token);
			throw redirect(302, '/?error=invalid_magic_link');
		}

		// Find corresponding user
		const [user] = await db
			.select()
			.from(users)
			.where(eq(users.id, record.value))
			.limit(1);

		if (!user) {
			console.warn('[MagicLogin] User not found for ID:', record.value);
			throw redirect(302, '/');
		}

		// Delete token to guarantee single-use security
		await db.delete(verifications).where(eq(verifications.id, record.id));

		// Create a brand new valid Better-Auth session
		const sessionToken = randomBytes(32).toString('hex');
		const sessionId = randomUUID();
		const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

		await db.insert(sessions).values({
			id: sessionId,
			token: sessionToken,
			userId: user.id,
			expiresAt,
			createdAt: new Date(),
			updatedAt: new Date()
		});

		// Set the Better-Auth session cookie
		cookies.set('better-auth.session_token', sessionToken, {
			path: '/',
			httpOnly: true,
			sameSite: 'lax',
			secure: process.env.NODE_ENV === 'production',
			maxAge: 30 * 24 * 60 * 60
		});

		console.log(`[MagicLogin] Successfully logged in user: ${user.email} (${user.id})`);
	} catch (err: any) {
		// If redirect already thrown, re-throw it
		if (err?.status && err?.location) throw err;
		console.error('[MagicLogin Error]', err);
		throw redirect(302, '/?error=auth_failed');
	}

	throw redirect(302, redirectUrl);
};
