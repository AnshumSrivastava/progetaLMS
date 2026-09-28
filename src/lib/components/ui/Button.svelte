<script lang="ts">
	let {
		variant = 'primary',
		size = 'md',
		type = 'button',
		disabled = false,
		href = '',
		target = '',
		rel = '',
		onclick = undefined,
		children
	}: {
		variant?: 'primary' | 'secondary' | 'tertiary' | 'danger';
		size?: 'sm' | 'md' | 'lg';
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		href?: string;
		target?: string;
		rel?: string;
		onclick?: (e: MouseEvent) => void;
		children?: any;
	} = $props();
</script>

{#if href}
	<a
		{href}
		{target}
		{rel}
		class="lp-btn lp-btn-{variant} lp-btn-{size}"
		class:disabled
		role="button"
	>
		{@render children?.()}
	</a>
{:else}
	<button
		{type}
		{disabled}
		class="lp-btn lp-btn-{variant} lp-btn-{size}"
		{onclick}
	>
		{@render children?.()}
	</button>
{/if}

<style>
	.lp-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 7px;
		font-family: var(--font-sans);
		font-weight: 600;
		border-radius: var(--radius-sm);
		cursor: pointer;
		text-decoration: none;
		white-space: nowrap;
		transition: all var(--t-fast);
		line-height: 1;
		outline: none;
	}

	.lp-btn:disabled, .lp-btn.disabled {
		opacity: 0.45;
		cursor: not-allowed;
		pointer-events: none;
	}

	/* Sizes */
	.lp-btn-sm {
		height: 32px;
		padding: 0 10px;
		font-size: 0.78125rem;
	}

	.lp-btn-md {
		height: 38px;
		padding: 0 14px;
		font-size: 0.84rem;
	}

	.lp-btn-lg {
		height: 44px;
		padding: 0 20px;
		font-size: 0.9375rem;
	}

	/* Variants (Section 10) */
	/* Primary: Black background */
	.lp-btn-primary {
		background: var(--color-primary);
		color: var(--color-surface);
		border: 1px solid var(--color-primary);
	}

	.lp-btn-primary:hover:not(:disabled) {
		background: var(--color-primary-hover);
		border-color: var(--color-primary-hover);
	}

	/* Secondary: White background + border */
	.lp-btn-secondary {
		background: var(--color-surface);
		color: var(--color-text);
		border: 1px solid var(--color-border);
	}

	.lp-btn-secondary:hover:not(:disabled) {
		border-color: var(--color-border-strong);
		background: var(--color-surface-subtle);
	}

	/* Tertiary: Text only with arrow */
	.lp-btn-tertiary {
		background: transparent;
		color: var(--color-text-secondary);
		border: 1px solid transparent;
		padding-inline: 4px;
	}

	.lp-btn-tertiary:hover:not(:disabled) {
		color: var(--color-text);
	}

	/* Destructive / Danger */
	.lp-btn-danger {
		background: #333;
		color: #ffffff;
		border: 1px solid #333;
	}

	.lp-btn-danger:hover:not(:disabled) {
		background: #111;
		border-color: #111;
	}
</style>
