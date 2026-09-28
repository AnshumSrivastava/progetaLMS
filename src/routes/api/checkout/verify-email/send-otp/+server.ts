import { json, error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { users, verifications } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';
import { randomUUID } from 'node:crypto';
import { emailService } from '$lib/server/emails';

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json().catch(() => ({}));
	const rawEmail = body.email as string;
	const firstName = body.firstName as string;

	if (!rawEmail || typeof rawEmail !== 'string') {
		throw error(400, 'A valid email address is required');
	}

	const email = rawEmail.trim().toLowerCase();
	const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
	if (!emailRegex.test(email)) {
		throw error(400, 'Invalid email format');
	}

	// 1. Check if user already exists
	const [existingUser] = await db
		.select({ id: users.id, name: users.name, email: users.email })
		.from(users)
		.where(eq(users.email, email))
		.limit(1);

	const userExists = !!existingUser;

	// 2. Generate 6-digit numeric OTP
	const otp = Math.floor(100000 + Math.random() * 900000).toString();
	const identifier = `checkout-otp:${email}`;
	const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

	// 3. Remove any previous unexpired OTPs for this email to prevent reuse
	await db.delete(verifications).where(eq(verifications.identifier, identifier));

	// 4. Save new OTP
	await db.insert(verifications).values({
		id: randomUUID(),
		identifier,
		value: otp,
		expiresAt
	});

	// 5. Send OTP email
	const recipientName = existingUser?.name || firstName || 'Learner';
	await emailService.sendCheckoutOtp(email, otp, recipientName);

	return json({
		success: true,
		exists: userExists,
		message: userExists
			? `Account found for ${email}. We sent a 6-digit verification code to confirm your email before payment.`
			: `We sent a 6-digit verification code to ${email}. Confirm your email to proceed to checkout.`
	});
};
