import path from 'path';
import { Buffer } from 'buffer';
import PDFDocument from 'pdfkit';
import SVGtoPDF from 'svg-to-pdfkit';
import { getCertificateSVG } from './template';
import QRCode from 'qrcode';
import { logoBase64 } from './logo-base64';

import { read } from '$app/server';
import outfitRegularUrl from '@fontsource/outfit/files/outfit-latin-400-normal.woff?url';
import outfitMediumUrl from '@fontsource/outfit/files/outfit-latin-500-normal.woff?url';
import outfitBoldUrl from '@fontsource/outfit/files/outfit-latin-700-normal.woff?url';
import dancingScriptUrl from '@fontsource/dancing-script/files/dancing-script-latin-600-normal.woff?url';

let cachedFonts: [ArrayBuffer, ArrayBuffer, ArrayBuffer, ArrayBuffer] | null = null;

export async function generateCertificatePDF(studentName: string, testName: string, date: string, certId: string): Promise<Buffer> {
	// Read fonts concurrently to save time, cache them to prevent race conditions during concurrent generation
	if (!cachedFonts) {
		cachedFonts = await Promise.all([
			read(outfitRegularUrl).arrayBuffer(),
			read(outfitMediumUrl).arrayBuffer(),
			read(outfitBoldUrl).arrayBuffer(),
			read(dancingScriptUrl).arrayBuffer()
		]);
	}
	const [outfitReq, outfitMedReq, outfitBoldReq, dancingReq] = cachedFonts;

	return new Promise((resolve, reject) => {
		try {
			// A4 Landscape is 841.89 x 595.28 points
			const doc = new PDFDocument({
				size: [841.89, 595.28], // Standard A4 Landscape
				margin: 0
			});

			// Register Fonts
			doc.registerFont('Outfit', outfitReq);
			doc.registerFont('Outfit-Medium', outfitMedReq);
			doc.registerFont('Outfit-Bold', outfitBoldReq);
			doc.registerFont('Dancing Script', dancingReq);

			const buffers: Buffer[] = [];
			doc.on('data', buffers.push.bind(buffers));
			doc.on('end', () => {
				resolve(Buffer.concat(buffers));
			});
			doc.on('error', reject);

			// We need to resolve QR code to Base64 for the SVG
			Promise.all([
				QRCode.toDataURL(`http://localhost:5173/certificates/verify/${certId}`, {
					width: 150,
					margin: 1,
					color: { dark: '#0f172a', light: '#ffffff' }
				})
			]).then(([qrCodeBase64]) => {
				const svgString = getCertificateSVG(studentName, testName, date, certId, logoBase64, qrCodeBase64);

				SVGtoPDF(doc, svgString, 0, 0, {
					width: 841.89,
					height: 595.28,
					preserveAspectRatio: 'xMidYMid meet',
					fontCallback: (family, bold, italic, fontOptions) => {
						if (family === 'Outfit-Bold') return 'Outfit-Bold';
						if (family === 'Outfit-Medium') return 'Outfit-Medium';
						if (family === 'Outfit' || family === "'Outfit', sans-serif") return 'Outfit';
						if (family === 'Dancing Script' || family === "'Dancing Script', cursive") return 'Dancing Script';
						return 'Helvetica';
					}
				});

				doc.end();
			}).catch(err => reject(err));
		} catch (err) {
			reject(err);
		}
	});
}
