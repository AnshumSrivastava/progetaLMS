<script lang="ts">
	import { APP_COMPANY, APP_DOMAIN, SUPPORT_EMAIL } from '$lib/shared/constants';

	const navCols = [
		{
			heading: 'Platform',
			links: [
				{ href: '/catalog',        label: 'Asset Catalog' },
				{ href: '/certifications', label: 'Certifications' },
				{ href: '/mentoring',      label: 'Mentoring' },
			],
		},
		{
			heading: 'Legal',
			links: [
				{ href: '/terms',   label: 'Terms of Service' },
				{ href: '/privacy', label: 'Privacy Policy' },
				{ href: '/refunds', label: 'Refund Policy' },
			],
		},
	];

	const year = new Date().getFullYear();
</script>

<footer class="footer">
	<div class="f-inner">

		<!-- ── Statement Row ─────────────────────────────── -->
		<div class="statement-row">
			<div class="brand-block">
				<a href="/" class="wordmark">
					<svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
						<rect width="20" height="20" rx="5" fill="currentColor"/>
						<path d="M5.5 14.5L10 5.5l4.5 9" stroke="var(--bg)" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Launchpad
				</a>
			</div>
			<p class="statement">
				Skills that are provable.<br />
				Credentials that are permanent.
			</p>
		</div>

		<!-- ── Main Footer Grid ──────────────────────────── -->
		<div class="footer-grid">

			<!-- Brand info column -->
			<div class="brand-col">
				<p class="brand-copy">
					A professional learning platform built for clarity. Browse, learn, certify.
				</p>
				<a href="mailto:{SUPPORT_EMAIL}" class="email-link">{SUPPORT_EMAIL}</a>
			</div>

			<!-- Nav columns -->
			{#each navCols as col}
				<div class="nav-col">
					<p class="nav-heading">{col.heading}</p>
					<ul class="nav-links">
						{#each col.links as link}
							<li><a href={link.href}>{link.label}</a></li>
						{/each}
					</ul>
				</div>
			{/each}

		</div>

		<!-- ── Bottom bar ────────────────────────────────── -->
		<div class="footer-bottom">
			<span class="copy">&copy; {year} {APP_COMPANY}. All rights reserved.</span>
			<span class="domain">{APP_DOMAIN}</span>
		</div>
	</div>
</footer>

<style>
	.footer {
		border-top: 1px solid var(--border);
		background: var(--bg-subtle);
	}

	.f-inner {
		max-width: 1160px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	/* ── Statement Row ───────────────────────────────────────── */
	.statement-row {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 3rem;
		padding: 3rem 0 2.5rem;
		border-bottom: 1px solid var(--border);
		flex-wrap: wrap;
	}

	.brand-block {
		flex-shrink: 0;
	}

	.wordmark {
		display: inline-flex;
		align-items: center;
		gap: 9px;
		color: var(--text-primary);
		text-decoration: none;
		font-size: 1.375rem;
		font-weight: 700;
		letter-spacing: -0.03em;
		line-height: 1;
		transition: opacity var(--t-fast);
	}

	.wordmark:hover { opacity: 0.65; }

	.statement {
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-secondary);
		line-height: 1.6;
		letter-spacing: -0.01em;
		text-align: right;
		flex-shrink: 0;
	}

	/* ── Footer Grid ─────────────────────────────────────────── */
	.footer-grid {
		display: grid;
		grid-template-columns: 1fr auto auto;
		gap: 4rem;
		padding: 2.75rem 0 2.5rem;
		border-bottom: 1px solid var(--border);
	}

	/* Brand col */
	.brand-col {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.brand-copy {
		font-size: 0.8125rem;
		color: var(--text-muted);
		line-height: 1.65;
		max-width: 260px;
	}

	.email-link {
		font-size: 0.78125rem;
		color: var(--text-muted);
		text-decoration: none;
		width: fit-content;
		transition: color var(--t-fast);
	}

	.email-link:hover { color: var(--text-primary); }

	/* Nav cols */
	.nav-col { display: flex; flex-direction: column; }

	.nav-heading {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 16px;
	}

	.nav-links {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 11px;
	}

	.nav-links a {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		text-decoration: none;
		white-space: nowrap;
		transition: color var(--t-fast);
	}

	.nav-links a:hover { color: var(--text-primary); }

	/* ── Bottom Bar ──────────────────────────────────────────── */
	.footer-bottom {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 0;
	}

	.copy {
		font-size: 0.71875rem;
		color: var(--text-muted);
	}

	.domain {
		font-size: 0.71875rem;
		color: var(--text-muted);
		letter-spacing: 0.02em;
	}

	/* ── Responsive ──────────────────────────────────────────── */
	@media (max-width: 768px) {
		.f-inner { padding: 0 1.5rem; }

		.statement-row {
			flex-direction: column;
			gap: 1.25rem;
			padding: 2.25rem 0 2rem;
		}

		.statement { text-align: left; }

		.footer-grid {
			grid-template-columns: 1fr 1fr;
			gap: 2.5rem;
		}

		.brand-col { grid-column: 1 / -1; }

		.footer-bottom { flex-direction: column; align-items: flex-start; gap: 4px; }
	}
</style>
