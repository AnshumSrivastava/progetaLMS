<script lang="ts">
	import { APP_COMPANY } from '$lib/shared/constants';
	import LaunchpadLogo from './LaunchpadLogo.svelte';
	import { ShieldCheck, Award, Lock } from 'lucide-svelte';

	const platformLinks = [
		{ href: '/catalog', label: 'Explore All' },
		{ href: '/courses', label: 'Live Classes' },
		{ href: '/events', label: 'Sessions & Events' },
		{ href: '/mentoring', label: '1-on-1 Mentorship' },
		{ href: '/resources', label: 'Resources Hub' }
	];

	const moreLinks = [
		{ href: '/credits', label: 'Credits Wallet' },
		{ href: '/events', label: 'Upcoming Workshops' },
		{ href: '/mentoring', label: 'Find a Mentor' }
	];

	const legalLinks = [
		{ href: '/privacy', label: 'Privacy Policy' },
		{ href: '/terms', label: 'Terms of Service' },
		{ href: '/refunds', label: 'Refund Policy' }
	];

	const year = 2026;
</script>

<footer class="footer-root">
	<div class="footer-container">
		
		<!-- Trust Badges Strip -->
		<div class="trust-strip">
			<div class="trust-item">
				<ShieldCheck size={18} class="text-emerald-600 shrink-0" />
				<div>
					<span class="trust-title">Verified Practitioners</span>
					<span class="trust-desc">Sessions taught exclusively by vetted cybersecurity engineers</span>
				</div>
			</div>
			<div class="trust-item">
				<Lock size={18} class="text-indigo-600 shrink-0" />
				<div>
					<span class="trust-title">Encrypted Checkout</span>
					<span class="trust-desc">Cashfree PCI-DSS compliant 256-bit secure checkout</span>
				</div>
			</div>
			<div class="trust-item">
				<Award size={18} class="text-amber-600 shrink-0" />
				<div>
					<span class="trust-title">Branded Resource Bundles</span>
					<span class="trust-desc">Official slides, playbooks, and assets upon completion</span>
				</div>
			</div>
		</div>

		<div class="footer-grid">
			<!-- Brand Info -->
			<div class="brand-column">
				<a href="/" class="brand-link" aria-label="Launchpad Home">
					<LaunchpadLogo class="brand-icon" />
					<span class="brand-name">Launchpad</span>
				</a>
				<p class="brand-desc">
					Official technical learning and live events platform by <strong>Progeta Technologies</strong>.<br />
					Real practitioners. Hands-on skills. Trusted outcomes.
				</p>
			</div>

			<!-- Nav Columns -->
			<div class="links-columns">
				<div class="nav-col">
					<h3 class="col-title">Platform</h3>
					<ul class="col-list">
						{#each platformLinks as link}
							<li>
								<a href={link.href} class="footer-nav-link">{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>

				<div class="nav-col">
					<h3 class="col-title">Programs</h3>
					<ul class="col-list">
						{#each moreLinks as link}
							<li>
								<a href={link.href} class="footer-nav-link">{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>

				<div class="nav-col">
					<h3 class="col-title">Legal</h3>
					<ul class="col-list">
						{#each legalLinks as link}
							<li>
								<a href={link.href} class="footer-nav-link">{link.label}</a>
							</li>
						{/each}
					</ul>
				</div>
			</div>

			<!-- Socials & Copyright (Right side) -->
			<div class="social-column">
				<div class="social-icons">
					<a
						href="https://youtube.com"
						target="_blank"
						rel="noopener noreferrer"
						class="social-btn"
						aria-label="YouTube"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
						</svg>
					</a>
					<a
						href="https://linkedin.com"
						target="_blank"
						rel="noopener noreferrer"
						class="social-btn"
						aria-label="LinkedIn"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M19 0h-14c-2.761 0-5 2.239-5 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5v-14c0-2.761-2.238-5-5-5zm-11 19h-3v-11h3v11zm-1.5-12.268c-.966 0-1.75-.79-1.75-1.764s.784-1.764 1.75-1.764 1.75.79 1.75 1.764-.783 1.764-1.75 1.764zm13.5 12.268h-3v-5.604c0-3.368-4-3.113-4 0v5.604h-3v-11h3v1.765c1.396-2.586 7-2.777 7 2.476v6.759z"/>
						</svg>
					</a>
					<a
						href="https://x.com"
						target="_blank"
						rel="noopener noreferrer"
						class="social-btn"
						aria-label="X"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
						</svg>
					</a>
				</div>
				<p class="copyright">
					&copy; {year} Launchpad by {APP_COMPANY}.<br />
					All rights reserved.
				</p>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer-root {
		background: #09090b;
		border-top: 1px solid rgba(255, 255, 255, 0.12);
		padding: 48px 0 36px 0;
		color: #a1a1aa;
	}

	.footer-container {
		width: 100%;
		max-width: 1600px;
		margin-inline: auto;
		padding-inline: clamp(16px, 2.5vw, 48px);
	}

	.trust-strip {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
		padding-bottom: 36px;
		margin-bottom: 36px;
		border-bottom: 1px solid rgba(255, 255, 255, 0.1);
	}

	@media (min-width: 768px) {
		.trust-strip {
			grid-template-columns: repeat(3, 1fr);
		}
	}

	.trust-item {
		display: flex;
		align-items: flex-start;
		gap: 12px;
	}

	.trust-title {
		display: block;
		font-size: 0.85rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.01em;
	}

	.trust-desc {
		display: block;
		font-size: 0.76rem;
		color: #a1a1aa;
		margin-top: 2px;
		line-height: 1.45;
	}

	.footer-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 36px;
	}

	@media (min-width: 900px) {
		.footer-grid {
			grid-template-columns: 1.3fr 2fr 1fr;
			align-items: start;
		}
	}

	.brand-column {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.brand-link {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		color: #ffffff;
		text-decoration: none;
	}

	:global(.brand-icon) {
		width: 22px;
		height: 22px;
		color: #ffffff;
	}

	.brand-name {
		font-size: 1.25rem;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.brand-desc {
		font-size: 0.82rem;
		color: #a1a1aa;
		line-height: 1.6;
	}

	.brand-desc strong {
		color: #ffffff;
	}

	.links-columns {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.nav-col {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.col-title {
		font-size: 0.75rem;
		font-weight: 700;
		color: #ffffff;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		font-family: var(--font-mono);
	}

	.col-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.footer-nav-link {
		font-size: 0.82rem;
		color: #a1a1aa;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-nav-link:hover {
		color: #ffffff;
	}

	.social-column {
		display: flex;
		flex-direction: column;
		gap: 16px;
		align-items: flex-start;
	}

	@media (min-width: 900px) {
		.social-column {
			align-items: flex-end;
			text-align: right;
		}
	}

	.social-icons {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.social-btn {
		color: #71717a;
		transition: color 0.15s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.social-btn:hover {
		color: #ffffff;
	}

	.copyright {
		font-size: 0.78rem;
		color: #71717a;
		line-height: 1.5;
	}
</style>
