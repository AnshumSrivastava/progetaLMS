<script lang="ts">
	interface Option {
		value: string;
		label: string;
		count?: number;
	}

	let {
		options = [],
		selected,
		onSelect
	}: {
		options: Option[];
		selected: string;
		onSelect: (val: string) => void;
	} = $props();
</script>

<div class="filter-pills-container">
	{#each options as opt}
		{@const isActive = selected === opt.value}
		<button
			type="button"
			class="filter-pill"
			class:active={isActive}
			onclick={() => onSelect(opt.value)}
		>
			<span>{opt.label}</span>
			{#if typeof opt.count === 'number'}
				<span class="pill-count" class:pill-count-active={isActive}>
					{opt.count}
				</span>
			{/if}
		</button>
	{/each}
</div>

<style>
	.filter-pills-container {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		scrollbar-width: none;
		-ms-overflow-style: none;
		padding: 4px 2px;
	}

	.filter-pills-container::-webkit-scrollbar {
		display: none;
	}

	.filter-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 16px;
		border-radius: 9999px;
		font-size: 0.825rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--color-surface);
		border: 1px solid var(--border);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
		user-select: none;
	}

	.filter-pill:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
		background: var(--color-surface-elevated);
	}

	.filter-pill.active {
		color: #ffffff;
		background: #09090b;
		border-color: #27272a;
		font-weight: 600;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
	}

	:global([data-theme="dark"]) .filter-pill.active {
		background: #ffffff;
		color: #09090b;
		border-color: #ffffff;
	}

	.pill-count {
		font-size: 0.725rem;
		padding: 1px 6px;
		border-radius: 9999px;
		background: var(--color-surface-subtle);
		color: var(--text-muted);
	}

	.pill-count-active {
		background: rgba(255, 255, 255, 0.2);
		color: #ffffff;
	}

	:global([data-theme="dark"]) .pill-count-active {
		background: rgba(0, 0, 0, 0.15);
		color: #09090b;
	}
</style>

