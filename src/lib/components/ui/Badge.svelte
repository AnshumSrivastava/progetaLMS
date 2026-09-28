<script lang="ts">
	let {
		variant = 'neutral',
		size = 'md',
		children
	}: {
		variant?: 'neutral' | 'verified' | 'success' | 'warning' | 'info';
		size?: 'sm' | 'md';
		children?: any;
	} = $props();
</script>

<span class="lp-badge lp-badge-{variant} lp-badge-{size}">
	{@render children?.()}
</span>

<style>
	.lp-badge {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-family: var(--font-mono);
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		border-radius: var(--radius-sm);
		border: 1px solid transparent;
		line-height: 1;
		white-space: nowrap;
		user-select: none;
	}

	.lp-badge-sm {
		font-size: 0.65rem;
		padding: 2.5px 6px;
	}

	.lp-badge-md {
		font-size: 0.72rem;
		padding: 4px 8px;
	}

	/* Neutral (Text difficulty: BEGINNER, INTERMEDIATE, ADVANCED) */
	.lp-badge-neutral {
		background: var(--color-surface-subtle);
		color: var(--color-text-secondary);
		border-color: var(--color-border);
	}

	/* Verified (Restrained Green) */
	.lp-badge-verified,
	.lp-badge-success {
		background: var(--color-success-bg);
		color: var(--color-success);
		border-color: var(--color-success-border);
	}

	/* Warning */
	.lp-badge-warning {
		background: #F0F0F0;
		color: #444;
		border-color: #D0D0D0;
	}

	/* Info */
	.lp-badge-info {
		background: #F0F0F0;
		color: #444;
		border-color: #D0D0D0;
	}
</style>
