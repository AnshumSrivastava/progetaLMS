<script lang="ts">
	import { APP_COMPANY, APP_DOMAIN, SUPPORT_EMAIL } from '$lib/shared/constants';
	import LaunchpadLogo from './LaunchpadLogo.svelte';

	const platformLinks = [
		{ href: '/catalog', label: 'Explore' },
		{ href: '/live-classes', label: 'Live Classes' },
		{ href: '/courses', label: 'Courses' },
		{ href: '/certifications', label: 'Certifications' },
		{ href: '/mentoring', label: 'Mentoring' },
		{ href: '/resources', label: 'Resources' }
	];

	const legalLinks = [
		{ href: '/terms', label: 'Terms' },
		{ href: '/privacy', label: 'Privacy' },
		{ href: '/refunds', label: 'Refunds' }
	];

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="f-inner">
		<!-- ── Compact Main Row ──────────────────────────── -->
		<div class="footer-main">
			<!-- Brand & Tagline -->
			<div class="brand-section">
				<div class="brand-row">
					<a href="/" class="wordmark">
						<LaunchpadLogo class="w-5 h-5 text-[var(--text-primary)]" />
						<span>Launchpad</span>
					</a>
					<span class="tagline">Provable skills & permanent certifications.</span>
				</div>
				<p class="brand-contact">
					<span>A professional learning platform built for clarity.</span>
					<a href="mailto:{SUPPORT_EMAIL}" class="email-link">{SUPPORT_EMAIL}</a>
				</p>
			</div>

			<!-- Horizontal Navigation Groups -->
			<div class="nav-groups">
				<div class="nav-group">
					<span class="group-label">Platform</span>
					<nav class="links-horizontal" aria-label="Platform navigation">
						{#each platformLinks as link}
							<a href={link.href}>{link.label}</a>
						{/each}
					</nav>
				</div>

				<div class="nav-group">
					<span class="group-label">Legal</span>
					<nav class="links-horizontal" aria-label="Legal navigation">
						{#each legalLinks as link}
							<a href={link.href}>{link.label}</a>
						{/each}
					</nav>
				</div>
			</div>
		</div>

		<!-- ── Bottom Strip ──────────────────────────────── -->
		<div class="footer-bottom">
			<span class="copy">&copy; {year} {APP_COMPANY}. All rights reserved.</span>
			<span class="domain">{APP_DOMAIN}</span>
		</div>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--border);
		background: var(--bg-subtle, #f8fafc);
	}

	.f-inner {
		max-width: 1200px;
		margin: 0 auto;
		padding: 1.5rem 2rem 1.25rem;
	}

	.footer-main {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 2rem;
		flex-wrap: wrap;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border);
	}

	/* Brand & Tagline */
	.brand-section {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.brand-row {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.wordmark {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text-primary);
		text-decoration: none;
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		transition: opacity var(--t-fast, 0.15s ease);
	}

	.wordmark:hover {
		opacity: 0.75;
	}

	.tagline {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.brand-contact {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.75rem;
		color: var(--text-muted);
		flex-wrap: wrap;
	}

	.email-link {
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--t-fast, 0.15s ease);
	}

	.email-link:hover {
		color: var(--text-primary);
		text-decoration: underline;
	}

	/* Horizontal Nav Groups */
	.nav-groups {
		display: flex;
		align-items: center;
		gap: 2.5rem;
		flex-wrap: wrap;
	}

	.nav-group {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.group-label {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.links-horizontal {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.links-horizontal a {
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--t-fast, 0.15s ease);
	}

	.links-horizontal a:hover {
		color: var(--text-primary);
	}

	/* Bottom Bar */
	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 1rem;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.copy, .domain {
		font-size: 0.71875rem;
		color: var(--text-muted);
	}

	@media (max-width: 860px) {
		.footer-main {
			flex-direction: column;
			align-items: flex-start;
			gap: 1.25rem;
		}

		.nav-groups {
			flex-direction: column;
			align-items: flex-start;
			gap: 0.75rem;
		}

		.links-horizontal {
			flex-wrap: wrap;
			gap: 10px;
		}
	}

	@media (max-width: 640px) {
		.f-inner {
			padding: 1.25rem 1rem 1rem;
		}

		.footer-bottom {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
		}
	}
</style>
