import { json } from '@sveltejs/kit';
import { generateCertificatePDF } from '$lib/server/pdf/certificate';

export const GET = async () => {
	try {
		await generateCertificatePDF("Test Name", "Test Course", "Jan 1, 2026", "12345");
		return json({ success: true });
	} catch (err: any) {
		return json({ success: false, error: err.message, stack: err.stack });
	}
};
