import { json } from '@sveltejs/kit';

export async function POST({ cookies, locals }) {
	if (locals.user?.email === 'admin@progetalms.com') {
		cookies.set('admin_pwd_changed', '1', { path: '/', maxAge: 60 * 60 * 24 * 365 });
	}
	return json({ success: true });
}
