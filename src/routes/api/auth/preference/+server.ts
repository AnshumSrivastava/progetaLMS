import { json } from '@sveltejs/kit';
import { db } from '$lib/server/db/client';
import { users, identityProfiles } from '$lib/server/db/schema/identity.schema';
import { eq } from 'drizzle-orm';

export async function POST({ request }) {
	try {
		const { email } = await request.json();
		if (!email) return json({ preference: 'otp' });

		// Find user
		const user = await db.query.users.findFirst({
			where: eq(users.email, email)
		});

		if (!user) {
			// New users always default to OTP since they don't exist yet
			return json({ preference: 'otp' });
		}

		// Find profile
		const profile = await db.query.identityProfiles.findFirst({
			where: eq(identityProfiles.userId, user.id)
		});

		return json({ preference: profile?.loginPreference || 'otp' });
	} catch (e) {
		return json({ preference: 'otp' });
	}
}
