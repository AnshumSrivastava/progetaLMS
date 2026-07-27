<script lang="ts">
	import type { Snippet } from 'svelte';

	let { label, title, updated, children }: {
		label: string;
		title: string;
		updated: string;
		children: Snippet;
	} = $props();
</script>

<div style="padding: 56px 0 40px; border-bottom: 1px solid var(--border);">
	<div class="container">
		<p style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">{label}</p>
		<h1 style="font-size: clamp(1.75rem, 3vw, 2.5rem); margin-bottom: 12px;">{title}</h1>
		<p style="font-size: 0.8125rem; color: var(--text-muted);">Last updated: {updated}</p>
	</div>
</div>

<div style="padding: 48px 0 80px;">
	<div class="container" style="max-width: 720px;">
		<div
			style="font-size: 0.9375rem; line-height: 1.8; color: var(--text-secondary); display: flex; flex-direction: column; gap: 24px;"
		>
			{@render children()}
		</div>
	</div>
</div>
