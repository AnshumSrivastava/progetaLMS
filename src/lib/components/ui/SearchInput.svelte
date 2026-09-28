<script lang="ts">
	let {
		value = '',
		placeholder = 'Search...',
		onsearch = undefined,
		oninput = undefined
	}: {
		value?: string;
		placeholder?: string;
		onsearch?: (q: string) => void;
		oninput?: (e: Event) => void;
	} = $props();

	import { Search, X } from 'lucide-svelte';
</script>

<div class="lp-search-field">
	<Search size={14} class="lp-search-icon" />
	<input
		type="text"
		{placeholder}
		bind:value
		{oninput}
		class="lp-search-input"
		onkeydown={(e) => {
			if (e.key === 'Enter') onsearch?.(value);
		}}
	/>
	{#if value}
		<button
			type="button"
			onclick={() => {
				value = '';
				onsearch?.('');
			}}
			class="lp-search-clear"
			aria-label="Clear search"
		>
			<X size={12} />
		</button>
	{/if}
</div>

<style>
	.lp-search-field {
		display: flex;
		align-items: center;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: 0 10px;
		height: 38px;
		gap: 8px;
		transition: border-color var(--t-fast);
	}

	.lp-search-field:focus-within {
		border-color: var(--color-text);
	}

	:global(.lp-search-icon) {
		color: var(--color-text-muted);
		flex-shrink: 0;
	}

	.lp-search-input {
		width: 100%;
		border: none;
		background: transparent;
		font-family: var(--font-sans);
		font-size: 0.84rem;
		color: var(--color-text);
		outline: none;
	}

	.lp-search-input::placeholder {
		color: var(--color-text-muted);
	}

	.lp-search-clear {
		background: none;
		border: none;
		color: var(--color-text-muted);
		padding: 2px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.lp-search-clear:hover {
		color: var(--color-text);
	}
</style>
