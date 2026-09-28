<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';

	let {
		title = 'Nothing here yet',
		description = 'Explore Launchpad and find something worth learning.',
		actionText = '',
		actionHref = '',
		onaction = undefined
	}: {
		title?: string;
		description?: string;
		actionText?: string;
		actionHref?: string;
		onaction?: () => void;
	} = $props();
</script>

<div class="empty-state-root">
	<h4 class="empty-title">{title}</h4>
	<p class="empty-desc">{description}</p>

	{#if actionText}
		<Button
			variant="primary"
			size="sm"
			href={actionHref}
			onclick={onaction}
		>
			{actionText}
		</Button>
	{/if}
</div>

<style>
	.empty-state-root {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		text-align: center;
		padding: 48px 24px;
		background: var(--color-surface);
		border: 1px dashed var(--color-border);
		border-radius: var(--radius-md);
		max-width: 480px;
		margin: 24px auto;
	}

	.empty-title {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--color-text);
		margin-bottom: 6px;
	}

	.empty-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		max-width: 320px;
		line-height: 1.5;
		margin-bottom: 20px;
	}
</style>
