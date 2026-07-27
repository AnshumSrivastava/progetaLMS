<script lang="ts">
	const columns = [
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
</script>

<footer style="border-top: 1px solid var(--border); padding: 48px 0 32px;">
	<div class="container">
		<div class="grid grid-cols-2 md:grid-cols-4 gap-10 mb-12">
			<!-- Brand column -->
			<div class="col-span-2 md:col-span-2 space-y-3">
				<a
					href="/"
					style="color: var(--text-primary); font-weight: 600; font-size: 0.9375rem;"
					class="flex items-center gap-2 w-fit hover:opacity-70 transition-opacity duration-[120ms]"
				>
					<svg width="16" height="16" viewBox="0 0 18 18" fill="none" aria-hidden="true">
						<rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.9"/>
						<path d="M5 13L9 5l4 8" stroke="var(--bg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
					</svg>
					Launchpad
				</a>
				<p style="font-size: 0.8125rem; color: var(--text-muted); max-width: 240px; line-height: 1.6;">
					Own your learning. Build skills that last.
				</p>
			</div>

			<!-- Link columns -->
			{#each columns as col}
				<div class="space-y-3">
					<p style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.06em; text-transform: uppercase;">
						{col.heading}
					</p>
					<ul class="space-y-2">
						{#each col.links as link}
							<li>
								<a
									href={link.href}
									style="font-size: 0.8125rem; color: var(--text-secondary);"
									class="hover:text-[var(--text-primary)] transition-colors duration-[120ms]"
								>
									{link.label}
								</a>
							</li>
						{/each}
					</ul>
				</div>
			{/each}
		</div>

		<!-- Bottom bar -->
		<div style="border-top: 1px solid var(--border); padding-top: 24px; display: flex; align-items: center; justify-content: space-between; flex-wrap: wrap; gap: 8px;">
			<p style="font-size: 0.75rem; color: var(--text-muted);">
				&copy; {new Date().getFullYear()} Progeta Technologies
			</p>
			<p style="font-size: 0.75rem; color: var(--text-muted);">
				lms.progeta.in
			</p>
		</div>
	</div>
</footer>
