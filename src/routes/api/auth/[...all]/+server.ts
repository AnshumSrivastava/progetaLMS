import { auth } from '$lib/server/auth/auth.config';

export async function GET(event) {
	return auth.handler(event.request);
}

export async function POST(event) {
	return auth.handler(event.request);
}
