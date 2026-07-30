import { error } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { db } from '$lib/server/db/client';
import { certificates } from '$lib/server/db/schema/certificates.schema';
import { eq } from 'drizzle-orm';
import { generateCertificatePDF } from '$lib/server/pdf/certificate';

export const GET: RequestHandler = async ({ params }) => {
	const certId = params.id;

	const results = await db.select().from(certificates).where(eq(certificates.id, certId));
	if (results.length === 0) {
		throw error(404, 'Certificate not found');
	}

	const certificate = results[0];
	const metadata = (certificate.metadata || {}) as any;
	
	const studentName = metadata.studentName || 'Student Name';
	const testName = metadata.testName || 'Course Name';
	const date = metadata.date ? new Date(metadata.date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : new Date(certificate.issuedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
	const formattedCertId = certificate.id.toUpperCase();

	let pdfBuffer: Buffer;
	try {
		pdfBuffer = await generateCertificatePDF(studentName, testName, date, formattedCertId);
	} catch (err) {
		console.error("Failed to generate PDF for download:", err);
		throw error(500, 'Failed to generate PDF');
	}

	return new Response(pdfBuffer, {
		headers: {
			'Content-Type': 'application/pdf',
			'Content-Disposition': `attachment; filename="${studentName.replace(/\s+/g, '_')}_Certificate.pdf"`
		}
	});
};
