import type { PageServerLoad } from './$types';
import { db } from '$lib/server/db/client';
import { assets, assetOwnership } from '$lib/server/db/schema/assets.schema';
import { eq, and } from 'drizzle-orm';

export interface HackathonStage {
	id: string;
	order: number;
	title: string;
	category: string;
	points: number;
	flag: string;
	description: string;
	hint: string;
	solved: boolean;
	locked: boolean;
}

export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user;

	// Query the HackDef hackathon asset from database
	let hackathonAsset: any = null;
	try {
		const [found] = await db
			.select()
			.from(assets)
			.where(eq(assets.id, 'hackdef-2026-ctf-arena'));
		hackathonAsset = found;
	} catch (err) {
		console.error('[Labs Server Load] Failed to query hackathon asset:', err);
	}

	let isEnrolled = false;
	if (user && hackathonAsset) {
		try {
			const [ownership] = await db
				.select()
				.from(assetOwnership)
				.where(
					and(
						eq(assetOwnership.assetId, hackathonAsset.id),
						eq(assetOwnership.ownerId, user.id)
					)
				);
			isEnrolled = !!ownership;
		} catch (err) {
			console.error('[Labs Server Load] Ownership query error:', err);
		}
	} else if (user) {
		// Default to enrolled in demo mode if logged in
		isEnrolled = true;
	}

	const defaultStages: HackathonStage[] = [
		{
			id: 'stage-1',
			order: 1,
			title: 'Reconnaissance & Asset Discovery',
			category: 'OSINT & Recon',
			points: 100,
			flag: 'flag{hackdef_recon_88b1}',
			description: 'Enumerate open ports, uncover hidden subdomains and discover secret API endpoints on the exposed target host.',
			hint: 'Look for robots.txt and inspect hidden HTTP response headers on the gateway service.',
			solved: true,
			locked: false
		},
		{
			id: 'stage-2',
			order: 2,
			title: 'API Authentication Bypass & JWT Forgery',
			category: 'Web Security',
			points: 250,
			flag: 'flag{hackdef_jwt_94f2}',
			description: 'Exploit a weak asymmetric verification algorithm (none/RS256-to-HS256 key confusion) to forge an administrator JWT token.',
			hint: 'The public key PEM is hosted at /.well-known/jwks.json and can be used as the HMAC secret.',
			solved: true,
			locked: false
		},
		{
			id: 'stage-3',
			order: 3,
			title: 'Cryptographic Elliptic Curve Fault Analysis',
			category: 'Cryptography',
			points: 350,
			flag: 'flag{hackdef_crypto_e37a}',
			description: 'Analyze biased ECDSA nonce generation in the session signing service to recover the private key and decrypt the challenge vault.',
			hint: 'The top 8 bits of the nonce k are leaked through execution timing in the signing oracle.',
			solved: false,
			locked: false
		},
		{
			id: 'stage-4',
			order: 4,
			title: 'AWS Cloud Metadata & Container Escape',
			category: 'Cloud Security',
			points: 500,
			flag: 'flag{hackdef_cloud_k8s9}',
			description: 'Abuse an SSRF primitive to query the AWS IMDSv2 token service, assume an IAM instance role, and escape the restricted Kubernetes pod.',
			hint: 'Inject X-Forwarded-For headers to bypass localhost IP checks and fetch IMDS token via PUT request.',
			solved: false,
			locked: true
		},
		{
			id: 'stage-5',
			order: 5,
			title: 'Kernel Ring-0 Exploit & Root Privilege Escalation',
			category: 'Pwn / Kernel',
			points: 750,
			flag: 'flag{hackdef_kernel_root}',
			description: 'Leverage an out-of-bounds write in the custom Linux kernel module to overwrite modprobe_path and execute arbitrary payload as root.',
			hint: 'Trigger the ioctl cmd 0x1337 with crafted payload buffer to redirect execution into commit_creds(prepare_kernel_cred(0)).',
			solved: false,
			locked: true
		}
	];

	return {
		user: user ? { id: user.id, name: user.name, email: user.email } : null,
		isEnrolled,
		hackathon: {
			id: hackathonAsset?.id || 'hackdef-2026-ctf-arena',
			slug: hackathonAsset?.slug || 'hackdef-2026-invitational-ctf',
			title: hackathonAsset?.title || 'HackDef 2026: Collegiate & Practitioner CTF Hackathon Arena',
			description: hackathonAsset?.description || 'The flagship 24-hour multi-stage cybersecurity hackathon. 5 progressive challenge stages with isolated target sandboxes, live scoreboards, and ₹1,00,000 in bounties.',
			pricePaise: hackathonAsset?.pricePaise ?? 149900,
			metadata: hackathonAsset?.metadata || {
				badge: 'HACKATHON CTF',
				level: 'Intermediate → Advanced',
				duration: '24-Hour Live Arena',
				prizePool: '₹1,00,000 Prize Pool',
				totalPoints: 1950,
				stagesCount: 5,
				teamSize: '1–4 Members per Team',
				targetIp: '10.10.14.204',
				eventDates: 'Live 24-Hour Hackathon Arena'
			},
			stages: defaultStages
		}
	};
};
