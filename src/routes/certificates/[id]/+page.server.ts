import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/public';
import { getCertificateSVG } from '$lib/server/pdf/template';
import fs from 'fs';
import path from 'path';

export const load: PageServerLoad = async ({ params, url }) => {
	const certId = params.id;
	
	const results = await db.select().from(certificates).where(eq(certificates.id, certId));
	
	if (results.length === 0) {
		throw error(404, 'Certificate not found');
	}
	
	const certificate = results[0];
	
	// Generate QR Code
	const baseUrl = env.PUBLIC_APP_URL || url.origin;
	const verifyUrlFull = `${baseUrl}${certificate.verifyUrl}`;
	const qrCodeDataUrl = await QRCode.toDataURL(verifyUrlFull, {
		width: 150,
		margin: 1,
		color: {
			dark: '#0f172a',
			light: '#ffffff'
		}
	});

	// Get Logo Base64
	let logoBase64 = '';
	try {
		const logoBuffer = await fs.promises.readFile(path.resolve(process.cwd(), 'static/progeta-logo.png'));
		logoBase64 = `data:image/png;base64,${logoBuffer.toString('base64')}`;
	} catch (e) {
		console.error('Failed to load logo', e);
	}

	const metadata = certificate.metadata as any;
	const studentName = metadata.studentName || 'Student Name';
	const testName = metadata.testName || 'Course Name';
	const date = metadata.date ? new Date(metadata.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(certificate.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	const formattedCertId = certificate.id.toUpperCase();

	const svgString = getCertificateSVG(studentName, testName, date, formattedCertId, logoBase64, qrCodeDataUrl);
	
	return {
		certificate,
		svg: svgString
	};
};
