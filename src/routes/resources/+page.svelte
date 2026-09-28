<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, Download, FileText, CheckCircle2 } from 'lucide-svelte';
	import ResourceCard from '$lib/components/ui/ResourceCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedSource = $state('All'); // 'All' | 'official' | 'mentor'
	let sortBy = $state('default');

	const sources = [
		{ id: 'All', label: 'All Resources' },
		{ id: 'official', label: 'Launchpad Official' },
		{ id: 'mentor', label: 'Mentor Shared' }
	];

	const filteredResources = $derived(() => {
		let list = data.resources;

		// Source filter
		if (selectedSource === 'official') {
			list = list.filter((r) => r.source === 'platform');
		} else if (selectedSource === 'mentor') {
			list = list.filter((r) => r.source === 'mentor');
		}

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((r) =>
				r.title.toLowerCase().includes(q) ||
				(r.description || '').toLowerCase().includes(q) ||
				(r.ownerName || '').toLowerCase().includes(q) ||
				((r.metadata as any)?.category || '').toLowerCase().includes(q) ||
				((r.metadata as any)?.format || '').toLowerCase().includes(q)
			);
		}

		// Sort
		if (sortBy === 'free-first') {
			list = [...list].sort((a, b) => (a.pricePaise || 0) - (b.pricePaise || 0));
		} else if (sortBy === 'price-desc') {
			list = [...list].sort((a, b) => (b.pricePaise || 0) - (a.pricePaise || 0));
		}

		return list;
	});

	const hasFilters = $derived(selectedSource !== 'All' || searchQuery.trim() !== '');

	function clearFilters() {
		searchQuery = '';
		selectedSource = 'All';
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Technical Resources & Downloads — {APP_NAME}</title>
	<meta name="description" content="Download practical cheatsheets, security checklists, and reference guides provided by Launchpad and verified practitioners." />
</svelte:head>

<div class="resources-page">
	<!-- ── WORKLY-STYLE TOP HEADER & SEARCH ──────────────── -->
	<header class="resources-header">
		<div class="container-custom">
			<div class="header-main-row">
				<div>
					<span class="meta-label">TOOLKITS & GUIDES</span>
					<h1 class="page-title">Technical Resources</h1>
					<p class="page-subtitle">Production checklists, reference cheatsheets, and digital guides provided by Launchpad and verified mentors.</p>
				</div>

				<!-- Search Input (Workly Reference Style) -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search resources, topics, or mentors..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Source Filter Pills Strip -->
			<div class="filter-strip">
				<div class="source-pills">
					{#each sources as src}
						<button
							type="button"
							class="source-pill"
							class:active={selectedSource === src.id}
							onclick={() => (selectedSource = src.id)}
						>
							{src.label}
						</button>
					{/each}
				</div>
			</div>

			<!-- Meta & Secondary Controls Strip -->
			<div class="header-sub-strip">
				<div class="results-count">
					Showing <strong>{filteredResources().length}</strong> of {data.resources.length} resources
				</div>

				<div class="filter-controls">
					<!-- Sort Selector -->
					<div class="select-wrap">
						<span class="select-label">Sort by:</span>
						<select bind:value={sortBy} class="control-select">
							<option value="default">Recommended</option>
							<option value="free-first">Free First</option>
							<option value="price-desc">Price: High to Low</option>
						</select>
					</div>

					{#if hasFilters}
						<button type="button" class="btn-reset" onclick={clearFilters}>
							Reset filters
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- ── RESOURCE CARDS CANVAS ──────────────────────────── -->
	<main class="container-custom content-canvas">
		{#if filteredResources().length > 0}
			<div class="workly-grid">
				{#each filteredResources() as resource}
					<ResourceCard {resource} />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No resources found"
				description="No downloadable guides match your chosen search or category filter. Try clearing your filters."
				actionText="Clear all filters"
				onaction={clearFilters}
			/>
		{/if}
	</main>
</div>

<style>
	.resources-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.resources-header {
		background: var(--bg-elevated, #ffffff);
		border-bottom: 1px solid var(--border);
		padding: 32px 0 20px 0;
	}

	.header-main-row {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 24px;
	}

	@media (min-width: 768px) {
		.header-main-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.meta-label {
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #f59e0b;
		text-transform: uppercase;
	}

	.page-title {
		font-size: clamp(1.75rem, 3vw, 2.25rem);
		font-weight: 800;
		color: var(--text-primary, #0f172a);
		letter-spacing: -0.03em;
		margin-top: 4px;
	}

	.page-subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary, #64748b);
		margin-top: 4px;
		max-width: 580px;
	}

	.search-wrap {
		position: relative;
		width: 100%;
		max-width: 420px;
	}

	.workly-search-input {
		width: 100%;
		height: 46px;
		background: var(--bg, #f1f5f9);
		border: 1px solid var(--border);
		border-radius: 9999px;
		padding: 0 40px 0 42px;
		font-size: 0.9375rem;
		color: var(--text-primary);
		outline: none;
		transition: all 0.2s ease;
	}

	.workly-search-input:focus {
		background: var(--bg-elevated, #ffffff);
		border-color: #f59e0b;
		box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
	}

	:global(.search-icon) {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted, #94a3b8);
		pointer-events: none;
	}

	.clear-btn {
		position: absolute;
		right: 14px;
		top: 50%;
		transform: translateY(-50%);
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Source Pills Strip */
	.filter-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 20px;
		overflow-x: auto;
		scrollbar-width: none;
	}

	.filter-strip::-webkit-scrollbar {
		display: none;
	}

	.source-pills {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.source-pill {
		display: inline-flex;
		align-items: center;
		padding: 6px 14px;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary, #64748b);
		background: var(--bg, #f8fafc);
		border: 1px solid var(--border);
		cursor: pointer;
		white-space: nowrap;
		transition: all 0.15s ease;
	}

	.source-pill:hover {
		color: #f59e0b;
		border-color: rgba(245, 158, 11, 0.3);
		background: rgba(245, 158, 11, 0.04);
	}

	.source-pill.active {
		color: #ffffff;
		background: #f59e0b;
		border-color: #f59e0b;
		box-shadow: 0 2px 8px -2px rgba(245, 158, 11, 0.4);
	}

	/* Sub-strip */
	.header-sub-strip {
		display: flex;
		flex-direction: column;
		gap: 12px;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}

	@media (min-width: 768px) {
		.header-sub-strip {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.results-count {
		font-size: 0.875rem;
		color: var(--text-secondary, #64748b);
	}

	.results-count strong {
		color: var(--text-primary, #0f172a);
	}

	.filter-controls {
		display: flex;
		align-items: center;
		gap: 12px;
		flex-wrap: wrap;
	}

	.select-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
	}

	.select-label {
		color: var(--text-muted, #94a3b8);
		font-weight: 500;
	}

	.control-select {
		background: var(--bg, #f1f5f9);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 5px 10px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		outline: none;
		cursor: pointer;
		transition: border-color 0.15s ease;
	}

	.control-select:focus {
		border-color: #f59e0b;
	}

	.btn-reset {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #f59e0b;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.btn-reset:hover {
		background: rgba(245, 158, 11, 0.08);
	}

	/* Grid Canvas */
	.content-canvas {
		padding-top: 36px;
		padding-bottom: 80px;
	}

	.workly-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
		gap: 20px;
	}
</style>
