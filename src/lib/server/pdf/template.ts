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
		if ((currentLine + word).length > 20) {
			if (currentLine) lines.push(currentLine.trim());
			currentLine = word + ' ';
		} else {
			currentLine += word + ' ';
		}
	}
	if (currentLine) lines.push(currentLine.trim());

	const courseNameTspans = lines
		.map((line, i) => `<tspan x="100" dy="${i === 0 ? 0 : 24}">${line}</tspan>`)
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
				text { font-family: 'Outfit', -apple-system, BlinkMacSystemFont, sans-serif; }
				.signature { font-family: 'Dancing Script', cursive; }
				.bg-pattern { fill: url(#pattern); }
				.text-blue { fill: #0f172a; }
				.text-accent { fill: #2563eb; }
				.text-dark { fill: #09090b; }
				.text-slate { fill: #64748b; }
			</style>
			
			<pattern id="pattern" width="24" height="24" patternUnits="userSpaceOnUse">
				<circle cx="2" cy="2" r="0.75" fill="#cbd5e1" opacity="0.45"/>
			</pattern>

			<linearGradient id="badge-grad-1" x1="20" y1="10" x2="180" y2="190" gradientUnits="userSpaceOnUse">
				<stop stop-color="#09090b"/>
				<stop offset="0.6" stop-color="#18181b"/>
				<stop offset="1" stop-color="#27272a"/>
			</linearGradient>

			<linearGradient id="gold-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
				<stop stop-color="#2563eb"/>
				<stop offset="1" stop-color="#3b82f6"/>
			</linearGradient>
		</defs>

		<!-- Outer Background -->
		<rect width="1150" height="813" fill="#ffffff" stroke="#e2e8f0" stroke-width="2"/>
		<rect width="1150" height="813" class="bg-pattern" pointer-events="none" />

		<!-- Elegant Inner Border -->
		<rect x="24" y="24" width="1102" height="765" fill="none" stroke="#f1f5f9" stroke-width="2" rx="4"/>
		<rect x="32" y="32" width="1086" height="749" fill="none" stroke="#09090b" stroke-width="1" stroke-opacity="0.08" rx="2"/>

		<!-- Main Content Wrapper (Shifted up to balance top/bottom margins) -->
		<g transform="translate(0, -20)">
			<!-- Launchpad Brand Logo: Raw SVG Icon with No Background Box -->
			<g transform="translate(100, 72)">
				<g transform="translate(0, 0)">
					<!-- Original Launchpad Icon Path as-such -->
					<g transform="translate(0, 0) scale(1.05)">
						<g transform="translate(-546.23229, 572.1617)">
							<path
								fill="#09090b"
								d="m 562.73892,-572.15808 -0.0692,0.0606 v 0.003 l -16.43742,14.37098 v 9.28315 l 16.50685,-14.43006 16.50684,14.43006 v -9.28315 l -16.43393,-14.37098 -0.0692,-0.0672 z m 0.003,11.86008 v 0.12494 l -16.43742,14.371 v 6.74446 h 2.9034 l 13.60345,-11.89132 13.60352,11.89132 h 2.90333 v -6.74446 l -16.43386,-14.371 v -0.12494 l -0.0732,0.0605 z m 0,11.8913 v 0.12496 l -10.55076,9.22414 h 10.62019 10.62026 l -10.54727,-9.22414 v -0.12496 l -0.0732,0.0605 z" />
						</g>
					</g>
				</g>
				<text x="44" y="27" font-size="28" font-weight="800" class="text-dark" letter-spacing="-0.5">Launchpad</text>
			</g>

			<!-- Powered By -->
			<g transform="translate(860, 95) scale(1.6)">
				<text x="-5" y="-4" font-size="9" font-weight="700" class="text-slate" text-anchor="end" letter-spacing="1">POWERED BY</text>
				<image href="/progeta-logo.png" x="5" y="-20" width="100" height="26" opacity="0.75" style="mix-blend-mode: multiply;" preserveAspectRatio="xMidYMid meet" />
			</g>

			<!-- Left Text Details -->
			<g transform="translate(100, 240)">
				<text x="0" y="0" font-size="16" font-weight="700" class="text-accent" letter-spacing="4">CERTIFICATE OF COMPLETION</text>
				
				<text x="0" y="90" font-size="88" font-weight="600" class="text-dark" letter-spacing="-1.5">${firstName}</text>
				${lastName ? `<text x="0" y="185" font-size="88" font-weight="600" class="text-dark" letter-spacing="-1.5">${lastName}</text>` : ''}
				
				<text x="0" y="270" font-size="21" class="text-slate">
					<tspan x="0" dy="0">has successfully demonstrated mastery and</tspan>
					<tspan x="0" dy="30">completed the required professional assessment.</tspan>
				</text>
			</g>

			<!-- Right Geometric Badge -->
			<g transform="translate(710, 180) scale(1.6)">
				<!-- Hexagon -->
				<path d="M100 10L180 50V150L100 190L20 150V50L100 10Z" fill="url(#badge-grad-1)"/>
				<path d="M100 24L166 57V143L100 176L34 143V57L100 24Z" fill="#ffffff"/>
				
				<!-- Checkmark -->
				<path d="M130 70L85 125L65 105" stroke="#09090b" stroke-width="13" stroke-linecap="round" stroke-linejoin="round" fill="none"/>
				
				<text x="100" y="235" font-size="11" font-weight="700" class="text-slate" text-anchor="middle" letter-spacing="2.5">OFFICIAL CERTIFICATION</text>
				
				<!-- Course title tspans -->
				<text x="100" y="270" font-size="18" font-weight="700" class="text-dark" text-anchor="middle">${courseNameTspans}</text>
			</g>

			<!-- Verification & QR placed above the signature -->
			<g transform="translate(100, 560)">
				<rect x="0" y="0" width="80" height="80" fill="#ffffff" rx="8" stroke="#e2e8f0" stroke-width="1" />
				<image href="${qrCodeBase64}" x="8" y="8" width="64" height="64" style="mix-blend-mode: multiply;" preserveAspectRatio="xMidYMid meet" />
				
				<text x="100" y="30" font-size="13" font-weight="700" fill="#10b981" letter-spacing="1.5">VERIFIED SECURE</text>
				<rect x="95" y="40" width="150" height="30" fill="#f8fafc" stroke="#e2e8f0" stroke-width="1" rx="4"/>
				<text x="105" y="60" font-size="12" font-weight="600" class="text-dark">ID: ${certId}</text>
			</g>

			<!-- Bottom Footer section -->
			<g transform="translate(100, 730)">
				<line x1="0" y1="-2" x2="950" y2="-2" stroke="#e2e8f0" stroke-width="1.5" />
				
				<!-- Signature -->
				<text x="0" y="45" font-size="44" class="signature text-dark">Sadhana Srivastava</text>
				<line x1="0" y1="55" x2="280" y2="55" stroke="#cbd5e1" stroke-width="1.5" />
				<text x="0" y="78" font-size="13" font-weight="700" class="text-slate" letter-spacing="2">ACADEMIC DIRECTOR</text>
				
				<!-- Date -->
				<text x="670" y="42" font-size="26" font-weight="600" class="text-dark">${date}</text>
				<line x1="670" y1="55" x2="950" y2="55" stroke="#cbd5e1" stroke-width="1.5" />
				<text x="670" y="78" font-size="13" font-weight="700" class="text-slate" letter-spacing="2">DATE ISSUED</text>
			</g>
		</g>
	</svg>
	`;
}
