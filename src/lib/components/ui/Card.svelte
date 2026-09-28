<script lang="ts">
	let {
		as = 'div',
		padding = 'md',
		hoverable = false,
		children
	}: {
		as?: 'div' | 'article' | 'section';
		padding?: 'none' | 'sm' | 'md' | 'lg';
		hoverable?: boolean;
		children?: any;
	} = $props();
</script>

<svelte:element
	this={as}
	class="lp-card-root lp-pad-{padding}"
	class:hoverable
>
	{@render children?.()}
</svelte:element>

<style>
	.lp-card-root {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		transition: border-color var(--t-fast);
	}

	.lp-card-root.hoverable:hover {
		border-color: var(--color-border-strong);
	}

	.lp-pad-none { padding: 0; }
	.lp-pad-sm { padding: 14px; }
	.lp-pad-md { padding: 22px; }
	.lp-pad-lg { padding: 32px; }
</style>
