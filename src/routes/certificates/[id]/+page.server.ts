import { error } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { eq } from 'drizzle-orm';
import QRCode from 'qrcode';
import { env } from '$env/dynamic/public';
import { getCertificateSVG } from '$lib/server/pdf/template';
import { Buffer } from 'node:buffer';

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
	const qrSvg = await QRCode.toString(verifyUrlFull, {
		type: 'svg',
		width: 150,
		margin: 1,
		color: {
			dark: '#0f172a',
			light: '#ffffff'
		}
	});
	
	// Convert SVG string to base64 data URL to embed in the main SVG template
	const qrCodeDataUrl = `data:image/svg+xml;base64,${Buffer.from(qrSvg).toString('base64')}`;

	const metadata = (certificate.metadata || {}) as any;
	const studentName = metadata.studentName || 'Student Name';
	const testName = metadata.testName || 'Course Name';
	const date = metadata.date ? new Date(metadata.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(certificate.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	const formattedCertId = certificate.id.toUpperCase();

	const svgString = getCertificateSVG(studentName, testName, date, formattedCertId, qrCodeDataUrl);
	
	return {
		certificate,
		svg: svgString
	};
};
