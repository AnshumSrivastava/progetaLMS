import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { DailyReportService } from '$lib/server/commerce/DailyReportService';
import { env } from '$env/dynamic/private';

const EXPECTED_SECRET = env.CRON_SECRET || 'progeta-daily-sales-2026';

function isAuthorized(request: Request, locals: App.Locals, url: URL): boolean {
	// 1. Check Bearer token in Authorization header
	const authHeader = request.headers.get('authorization');
	if (authHeader && authHeader.startsWith('Bearer ')) {
		const token = authHeader.substring(7).trim();
		if (token === EXPECTED_SECRET) return true;
	}

	// 2. Check query param key (?key=secret)
	const queryKey = url.searchParams.get('key');
	if (queryKey && queryKey === EXPECTED_SECRET) return true;

	// 3. Check if user is logged in as admin/owner
	if (locals.user && (locals.user.role === 'admin' || locals.user.role === 'owner')) {
		return true;
	}

	return false;
}

export const GET: RequestHandler = async ({ request, locals, url }) => {
	if (!isAuthorized(request, locals, url)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const force = url.searchParams.get('force') === 'true';
	const windowHours = parseInt(url.searchParams.get('hours') || '24', 10);

	try {
		const result = await DailyReportService.generateAndSendDailyDigest(force, windowHours);
		return json({ success: true, ...result });
	} catch (e: any) {
		console.error('[cron/daily-sales-report] Error:', e);
		return json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
	}
};

export const POST: RequestHandler = async ({ request, locals, url }) => {
	if (!isAuthorized(request, locals, url)) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const force = url.searchParams.get('force') === 'true';
	const windowHours = parseInt(url.searchParams.get('hours') || '24', 10);

	try {
		const result = await DailyReportService.generateAndSendDailyDigest(force, windowHours);
		return json({ success: true, ...result });
	} catch (e: any) {
		console.error('[cron/daily-sales-report] Error:', e);
		return json({ success: false, error: e.message || 'Internal error' }, { status: 500 });
	}
};

