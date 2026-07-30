export function getCertificateSVG(
	studentName: string, 
	testName: string, 
	date: string, 
	certId: string,
	qrCodeBase64: string
): string {
	const words = testName.split(' ');
	const lines = [];
	let currentLine = '';
	for (const word of words) {
		if ((currentLine + word).length > 18) {
			if (currentLine) lines.push(currentLine.trim());
			currentLine = word + ' ';
		} else {
			currentLine += word + ' ';
		}
	}
	if (currentLine) lines.push(currentLine.trim());

	const courseNameTspans = lines
		.map((line, i) => `<tspan x="100" dy="${i === 0 ? 0 : 26}">${line}</tspan>`)
		.join('');

	// Split name into first and last for better layout
	const nameParts = studentName.trim().split(' ');
	const firstName = nameParts.length > 1 ? nameParts.slice(0, -1).join(' ') : studentName;
	const lastName = nameParts.length > 1 ? nameParts[nameParts.length - 1] : '';

	// 1150 x 813 is roughly the 1.414 aspect ratio of an A4 landscape
	return `
	<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1150 813" width="100%" height="100%">
		<defs>
			<style>
				@import url('https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800&amp;family=Dancing+Script:wght@600&amp;display=swap');
				text { font-family: 'Outfit', sans-serif; }
				.signature { font-family: 'Dancing Script', cursive; }
				.bg-pattern { fill: url(#pattern); }
				.text-blue { fill: #2563eb; }
				.text-dark { fill: #0f172a; }
				.text-slate { fill: #64748b; }
			</style>
			
			<pattern id="pattern" width="20" height="20" patternUnits="userSpaceOnUse">
				<circle cx="2" cy="2" r="1" fill="#cbd5e1" opacity="0.5"/>
			</pattern>

			<linearGradient id="badge-grad-1" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
				<stop stop-color="#38bdf8"/>
				<stop offset="0.5" stop-color="#3b82f6"/>
				<stop offset="1" stop-color="#4f46e5"/>
			</linearGradient>
		</defs>

		<!-- Background -->
		<rect width="1150" height="813" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
		<rect width="1150" height="813" class="bg-pattern" pointer-events="none" />

		<!-- Main Content Wrapper (Shifted up to balance top/bottom margins) -->
		<g transform="translate(0, -25)">
			<!-- Logo -->
			<g transform="translate(100, 70) scale(1.1)">
				<path d="M4.5 16.5C3 17.76 2.5 21.5 2.5 21.5S6.24 21 7.5 19.5L8 19C8 19 5 16 4.5 16.5Z" fill="#38bdf8"/>
				<path d="M12 15L15.38 11.62C16.27 10.73 16.27 9.27 15.38 8.38L12 5L5.44 8.44C5.44 8.44 8.62 11.62 12 15Z" fill="#0ea5e9"/>
				<path d="M12 15L15.5 18.5C16.46 19.46 17.5 19.5 19 19.5L19.5 19.5L17 10L12 15Z" fill="#2563eb"/>
				<text x="32" y="22" font-size="28" font-weight="800" class="text-dark" font-family="Outfit-Bold">Launchpad</text>
			</g>

			<!-- Powered By -->
			<g transform="translate(860, 95) scale(1.6)">
				<text x="-5" y="-4" font-size="9" font-weight="700" class="text-slate" text-anchor="end" letter-spacing="1" font-family="Outfit-Bold">POWERED BY</text>
				<image href="/progeta-logo.png" x="5" y="-20" width="100" height="26" opacity="0.7" style="mix-blend-mode: multiply;" preserveAspectRatio="xMidYMid meet" />
			</g>

			<!-- Left Text Details -->
			<g transform="translate(100, 240)">
				<text x="0" y="0" font-size="20" font-weight="700" class="text-blue" letter-spacing="4" font-family="Outfit-Bold">CERTIFICATE OF COMPLETION</text>
				
				<text x="0" y="95" font-size="90" font-weight="500" class="text-dark" font-family="Outfit-Medium" letter-spacing="-1">${firstName}</text>
				${lastName ? `<text x="0" y="195" font-size="90" font-weight="500" class="text-dark" font-family="Outfit-Medium" letter-spacing="-1">${lastName}</text>` : ''}
				
				<text x="0" y="280" font-size="22" class="text-slate" font-family="Outfit">
					<tspan x="0" dy="0">has successfully demonstrated mastery and</tspan>
					<tspan x="0" dy="32">completed the required assessment.</tspan>
				</text>
			</g>

			<!-- Right Geometric Badge -->
			<g transform="translate(710, 180) scale(1.6)">
				<!-- Hexagon -->
				<path d="M100 10L180 50V150L100 190L20 150V50L100 10Z" fill="url(#badge-grad-1)"/>
				<path d="M100 25L165 57.5V142.5L100 175L35 142.5V57.5L100 25Z" fill="#ffffff"/>
				
				<!-- Checkmark -->
				<path d="M130 70L85 125L65 105" stroke="#2563eb" stroke-width="14" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				
				<text x="100" y="240" font-size="12" font-weight="700" class="text-blue" text-anchor="middle" letter-spacing="2" font-family="Outfit-Bold">CERTIFICATION</text>
				
				<!-- Word wrapping logic for course name using tspan -->
				<text x="100" y="275" font-size="18" font-weight="700" class="text-dark" text-anchor="middle" font-family="Outfit-Bold">${courseNameTspans}</text>
			</g>

			<!-- Verification & QR placed above the signature -->
			<g transform="translate(100, 560)">
				<rect x="0" y="0" width="80" height="80" fill="#ffffff" rx="8" stroke="#e2e8f0" stroke-width="1" />
				<image href="${qrCodeBase64}" x="8" y="8" width="64" height="64" style="mix-blend-mode: multiply;" preserveAspectRatio="xMidYMid meet" />
				
				<text x="100" y="30" font-size="14" font-weight="700" fill="#10b981" letter-spacing="1" font-family="Outfit-Bold">VERIFIED SECURE</text>
				<rect x="95" y="40" width="140" height="30" fill="#f1f5f9" rx="4"/>
				<text x="105" y="60" font-size="13" font-weight="600" class="text-dark" font-family="Outfit-Medium">ID: ${certId}</text>
			</g>

			<!-- Bottom Footer section -->
			<g transform="translate(100, 730)">
				<line x1="0" y1="-2" x2="950" y2="-2" stroke="#e2e8f0" stroke-width="2" />
				
				<!-- Signature -->
				<text x="0" y="45" font-size="44" class="signature text-dark" font-family="'Dancing Script', cursive">Sadhana Srivastava</text>
				<line x1="0" y1="55" x2="280" y2="55" stroke="#cbd5e1" stroke-width="2" />
				<text x="0" y="80" font-size="14" font-weight="700" class="text-slate" letter-spacing="2" font-family="Outfit-Bold">ACADEMIC DIRECTOR</text>
				
				<!-- Date -->
				<text x="670" y="40" font-size="28" font-weight="600" class="text-dark" font-family="Outfit-Medium">${date}</text>
				<line x1="670" y1="55" x2="950" y2="55" stroke="#cbd5e1" stroke-width="2" />
				<text x="670" y="80" font-size="14" font-weight="700" class="text-slate" letter-spacing="2" font-family="Outfit-Bold">DATE ISSUED</text>
			</g>
		</g>
	</svg>
	`;
}
