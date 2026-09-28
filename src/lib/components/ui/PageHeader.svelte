<script lang="ts">
	let {
		eyebrow = '',
		title = '',
		description = '',
		children
	}: {
		eyebrow?: string;
		title?: string;
		description?: string;
		children?: any;
	} = $props();
</script>

<div class="page-header-root">
	<div class="container-custom">
		{#if eyebrow}
			<span class="meta-mono">{eyebrow}</span>
		{/if}
		{#if title}
			<h1 class="page-title">{title}</h1>
		{/if}
		{#if description}
			<p class="page-description">{description}</p>
		{/if}
		{@render children?.()}
	</div>
</div>

<style>
	.page-header-root {
		padding-top: 36px;
		padding-bottom: 24px;
	}

	.page-title {
		margin-top: 6px;
		margin-bottom: 8px;
	}

	.page-description {
		font-size: 1.05rem;
		color: var(--color-text-secondary);
		max-width: 640px;
		line-height: 1.55;
	}
</style>
