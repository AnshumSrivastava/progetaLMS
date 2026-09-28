import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users, identityProfiles, accounts } from '$lib/server/db/schema/identity.schema';
import { eq, and, isNotNull } from 'drizzle-orm';

export async function POST({ request }) {
	try {
		const { email } = await request.json();
		if (!email) return json({ preference: 'otp' });

		const normalizedEmail = email.trim().toLowerCase();

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, normalizedEmail)
		});

		if (!user) {
			// New users always default to OTP since they don't exist yet
			return json({ preference: 'otp', exists: false });
		}

		// Find profile
		const profile = await db.query.identityProfiles.findFirst({
			where: eq(identityProfiles.userId, user.id)
		});

		if (profile?.loginPreference) {
			return json({
				preference: profile.loginPreference,
				exists: true
			});
		}

		// Fallback: check if user has password credential in accounts table
		const passwordAccount = await db.query.accounts.findFirst({
			where: and(eq(accounts.userId, user.id), isNotNull(accounts.password))
		});

		return json({
			preference: passwordAccount ? 'password' : 'otp',
			exists: true
		});
	} catch (e) {
		return json({ preference: 'otp' });
	}
}
