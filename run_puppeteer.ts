import puppeteer from 'puppeteer';
import * as fs from 'fs';
import * as path from 'path';

const artifactsDir = '/home/ducus/.gemini/antigravity-ide/brain/62cd194d-7008-44fa-8c97-2ad196434190';

async function delay(ms) {
	return new Promise(r => setTimeout(r, ms));
}

async function run() {
	console.log('Launching browser...');
	const browser = await puppeteer.launch({ args: ['--no-sandbox', '--disable-setuid-sandbox'] });
	const page = await browser.newPage();
	
	// Set viewport
	await page.setViewport({ width: 1280, height: 800 });

	console.log('Navigating to login...');
	await page.goto('https://lms.progeta.in/sign-in', { waitUntil: 'networkidle2' });
	
	console.log('Typing credentials...');
	await page.waitForSelector('#email-input');
	await page.type('#email-input', 'test@student.com');
	await page.type('#password-input', 'password123');
	
	console.log('Clicking login...');
	await Promise.all([
		page.waitForNavigation({ waitUntil: 'networkidle0' }),
		page.click('button[type="submit"]')
	]);
	
	await page.screenshot({ path: path.join(artifactsDir, 'login_success.png') });
	console.log('Saved login_success.png');
	
	// Try creating a course
	console.log('Going to courses...');
	await page.goto('https://lms.progeta.in/dashboard/teacher/courses');
	await page.screenshot({ path: path.join(artifactsDir, 'courses_page.png') });
	
	// Click 'Create Course' if exists
	console.log('Attempting to create course...');
	try {
		await page.type('input[name="title"]', 'Test Course by Puppeteer');
		await Promise.all([
			page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }),
			page.click('form[action="?/create"] button[type="submit"]')
		]);
		await page.screenshot({ path: path.join(artifactsDir, 'course_created.png') });
	} catch(e) {
		console.log('No create course form or timeout: ', e.message);
	}

	// Go to Certifications
	console.log('Going to certifications...');
	await page.goto('https://lms.progeta.in/dashboard/teacher/certifications');
	await page.screenshot({ path: path.join(artifactsDir, 'certs_page.png') });

	// Click 'Create Certification'
	console.log('Attempting to create cert...');
	try {
		await page.type('input[name="title"]', 'Test Cert by Puppeteer');
		await Promise.all([
			page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 5000 }),
			page.click('form[action="?/create"] button[type="submit"]')
		]);
		await page.screenshot({ path: path.join(artifactsDir, 'cert_created.png') });
	} catch(e) {
		console.log('No create cert form or timeout: ', e.message);
	}
	
	// Check Settings
	console.log('Going to settings...');
	await page.goto('https://lms.progeta.in/dashboard/teacher/settings');
	await page.screenshot({ path: path.join(artifactsDir, 'settings_page.png') });

	await browser.close();
}

run().catch(console.error);
