import { json } from '@sveltejs/kit';

export async function POST({ locals, cookies }) {
	const session = locals.session;
	if (!session) {
		return json({ error: 'Unauthorized: No active session' }, { status: 401 });
	}

	cookies.set('mfa_verified', session.id, {
		path: '/',
		httpOnly: true,
		secure: process.env.NODE_ENV === 'production',
		sameSite: 'lax',
		maxAge: 60 * 60 * 24 * 30 // 30 days
	});

	return json({ success: true, sessionId: session.id });
}
