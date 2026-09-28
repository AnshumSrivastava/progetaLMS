import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users, sessions, verifications, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq, and, gt } from 'drizzle-orm';
import { randomUUID, randomBytes } from 'node:crypto';

export const POST: RequestHandler = async ({ request, cookies }) => {
	const body = await request.json().catch(() => ({}));
	const rawEmail = body.email as string;
	const otp = (body.otp as string || '').trim();
	const firstName = (body.firstName as string || '').trim();
	const lastName = (body.lastName as string || '').trim();

	if (!rawEmail || !otp) {
		throw error(400, 'Email and 6-digit OTP code are required');
	}

	const email = rawEmail.trim().toLowerCase();
	const identifier = `checkout-otp:${email}`;
	const now = new Date();

	// 1. Verify OTP
	const [record] = await db
		.select()
		.from(verifications)
		.where(
			and(
				eq(verifications.identifier, identifier),
				eq(verifications.value, otp),
				gt(verifications.expiresAt, now)
			)
		)
		.limit(1);

	if (!record) {
		return json({
			success: false,
			error: 'Invalid or expired verification code. Please check your email or request a new code.'
		}, { status: 400 });
	}

	// 2. Consume OTP
	await db.delete(verifications).where(eq(verifications.id, record.id));

	// 3. Find or Create User
	let [user] = await db
		.select()
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	let isNewUser = false;

	if (!user) {
		isNewUser = true;
		const userId = randomUUID();
		const fullName = [firstName, lastName].filter(Boolean).join(' ') || 'Student';

		// Create user record
		const [createdUser] = await db.insert(users).values({
			id: userId,
			email,
			name: fullName,
			role: 'student',
			emailVerified: true
		}).returning();

		user = createdUser;

		// Create default profile
		await db.insert(identityProfiles).values({
			id: randomUUID(),
			userId,
			displayName: fullName,
			loginPreference: 'otp'
		});
	} else if (!user.name && (firstName || lastName)) {
		// Update name if it was empty
		const fullName = [firstName, lastName].filter(Boolean).join(' ');
		if (fullName) {
			await db.update(users).set({ name: fullName }).where(eq(users.id, user.id));
			user.name = fullName;
		}
	}

	// 4. Create Better-Auth Session so they are immediately authenticated
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

	cookies.set('better-auth.session_token', sessionToken, {
		path: '/',
		httpOnly: true,
		sameSite: 'lax',
		secure: process.env.NODE_ENV === 'production',
		maxAge: 30 * 24 * 60 * 60
	});

	return json({
		success: true,
		userId: user.id,
		email: user.email,
		name: user.name,
		isNewUser
	});
};
