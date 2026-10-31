<script lang="ts">
	import { APP_COMPANY } from '$lib/shared/constants';
	import LaunchpadLogo from './LaunchpadLogo.svelte';

	const platformLinks = [
		{ href: '/catalog', label: 'Explore' },
		{ href: '/live-classes', label: 'Live Classes' },
		{ href: '/courses', label: 'Courses' },
		{ href: '/labs', label: 'Labs & CTF' }
	];

	const moreLinks = [
		{ href: '/certifications', label: 'Certifications' },
		{ href: '/mentoring', label: 'Mentorship' },
		{ href: '/resources', label: 'Resources' },
		{ href: '/courses', label: 'Pricing' }
	];

	const legalLinks = [
		{ href: '/privacy', label: 'Privacy' },
		{ href: '/terms', label: 'Terms' },
		{ href: '/refunds', label: 'Refunds' }
	];

	const year = 2026;
</script>

<footer class="footer-root">
	<div class="footer-container">
		<div class="footer-grid">
			<!-- Brand Info -->
			<div class="brand-column">
				<a href="/" class="brand-link" aria-label="Launchpad Home">
					<LaunchpadLogo class="brand-icon" />
					<span class="brand-name">Launchpad</span>
				</a>
				<p class="brand-desc">
					A learning platform by Progeta Technologies.<br />
					Practical skills. Real opportunities.
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
					<h3 class="col-title">More</h3>
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
						href="https://github.com"
						target="_blank"
						rel="noopener noreferrer"
						class="social-btn"
						aria-label="GitHub"
					>
						<svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
							<path fill-rule="evenodd" clip-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
						</svg>
					</a>
				</div>
				<p class="copyright">
					&copy; {year} Progeta Technologies.<br class="hidden sm:inline" />
					All rights reserved.
				</p>
			</div>
		</div>
	</div>
</footer>

<style>
	.footer-root {
		position: relative;
		z-index: 40;
		background: #080b11;
		border-top: 1px solid rgba(255, 255, 255, 0.07);
		color: #94a3b8;
		padding: 48px 0 36px 0;
	}

	.footer-container {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 28px;
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
		font-weight: 700;
		color: #ffffff;
		letter-spacing: -0.02em;
	}

	.brand-desc {
		font-size: 0.82rem;
		color: #64748b;
		line-height: 1.6;
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
		font-size: 0.82rem;
		font-weight: 600;
		color: #ffffff;
		letter-spacing: -0.01em;
	}

	.col-list {
		list-style: none;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.footer-nav-link {
		font-size: 0.82rem;
		color: #64748b;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.footer-nav-link:hover {
		color: #f1f5f9;
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
		color: #64748b;
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
		color: #475569;
		line-height: 1.5;
	}
</style>
