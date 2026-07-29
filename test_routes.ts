import 'dotenv/config';

async function testRoutes() {
	console.log('Logging in to production...');
	const loginRes = await fetch('https://lms.progeta.in/api/auth/sign-in/email', {
		method: 'POST',
		headers: { 'Content-Type': 'application/json', 'Origin': 'https://lms.progeta.in' },
		body: JSON.stringify({ email: 'test@student.com', password: 'password123' })
	});
	
	const loginData = await loginRes.json();
	if (!loginData || !loginData.token) {
		console.error('Failed to get session token from body', loginData);
		return;
	}
	
	const sessionCookie = `better-auth.session_token=${loginData.token}`;
	
	const routesToTest = [
		'/dashboard/teacher',
		'/dashboard/teacher/courses',
		'/dashboard/teacher/classes',
		'/dashboard/teacher/students',
		'/dashboard/teacher/certifications',
		'/dashboard/teacher/communications',
		'/dashboard/teacher/coupons',
		'/dashboard/teacher/settings'
	];
	
	for (const route of routesToTest) {
		const url = `https://lms.progeta.in${route}`;
		const res = await fetch(url, {
			headers: { 'Cookie': sessionCookie }
		});
		
		console.log(`[${res.status}] GET ${route}`);
		if (res.status === 500) {
			console.error(`ERROR ON ROUTE: ${route}`);
			const text = await res.text();
			console.log(text.substring(0, 1500)); // Show some of the response
		}
	}
	process.exit(0);
}

testRoutes().catch(console.error);
