<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, Award, ShieldCheck, Check } from 'lucide-svelte';
	import CertificationCard from '$lib/components/ui/CertificationCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedLevel = $state<string | null>(null);
	let onlyProctored = $state(false);
	let sortBy = $state('default');

	const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

	const filtered = $derived(() => {
		let list = data.certs;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((c: any) =>
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				(c.metadata?.tags || []).some((t: string) => t.toLowerCase().includes(q))
			);
		}

		if (selectedLevel && selectedLevel !== 'All') {
			list = list.filter((c: any) => (c.metadata?.level || 'Intermediate').toLowerCase() === selectedLevel?.toLowerCase());
		}

		if (onlyProctored) {
			list = list.filter((c: any) => c.metadata?.isProctored !== false);
		}

		if (sortBy === 'price-asc') list = [...list].sort((a: any, b: any) => (a.pricePaise || 0) - (b.pricePaise || 0));
		if (sortBy === 'price-desc') list = [...list].sort((a: any, b: any) => (b.pricePaise || 0) - (a.pricePaise || 0));
		if (sortBy === 'questions') list = [...list].sort((a: any, b: any) => (b.metadata?.questions || 0) - (a.metadata?.questions || 0));

		return list;
	});

	const hasFilters = $derived(!!selectedLevel && selectedLevel !== 'All' || onlyProctored || searchQuery.trim() !== '');

	function clearAll() {
		searchQuery = '';
		selectedLevel = null;
		onlyProctored = false;
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Certifications — {APP_NAME}</title>
	<meta name="description" content="Rigorous, timed certification exams with permanent cryptographic proof of mastery." />
</svelte:head>

<div class="certs-page">
	<!-- ── WORKLY-STYLE TOP HEADER & SEARCH ──────────────── -->
	<header class="certs-header">
		<div class="container-custom">
			<div class="header-main-row">
				<div>
					<span class="meta-label">STANDARDS & ASSESSMENTS</span>
					<h1 class="page-title">Verifiable Certifications</h1>
					<p class="page-subtitle">Rigorous practitioner-reviewed examinations yielding permanent cryptographic proof of mastery.</p>
				</div>

				<!-- Search Input (Workly Reference Style) -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search exams, domains, or skills..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Filter Level Pills & Proctored Toggle -->
			<div class="filter-strip">
				<div class="level-pills">
					{#each levels as lvl}
						<button
							type="button"
							class="filter-pill"
							class:active={(lvl === 'All' && !selectedLevel) || selectedLevel === lvl}
							onclick={() => (selectedLevel = lvl === 'All' ? null : lvl)}
						>
							{lvl === 'All' ? 'All Difficulties' : lvl}
						</button>
					{/each}
				</div>

				<button
					type="button"
					class="proctored-toggle-pill"
					class:active={onlyProctored}
					onclick={() => (onlyProctored = !onlyProctored)}
				>
					<span class="toggle-dot" class:checked={onlyProctored}></span>
					<span>Proctored Only</span>
				</button>
			</div>

			<!-- Meta & Secondary Controls Strip -->
			<div class="header-sub-strip">
				<div class="results-count">
					Showing <strong>{filtered().length}</strong> of {data.certs.length} certifications
				</div>

				<div class="filter-controls">
					<!-- Sort Selector -->
					<div class="select-wrap">
						<span class="select-label">Sort by:</span>
						<select bind:value={sortBy} class="control-select">
							<option value="default">Recommended</option>
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
							<option value="questions">Question Count</option>
						</select>
					</div>

					{#if hasFilters}
						<button type="button" class="btn-reset" onclick={clearAll}>
							Reset filters
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- ── CERTIFICATION CARDS CANVAS ─────────────────────── -->
	<main class="container-custom content-canvas">
		{#if filtered().length > 0}
			<div class="workly-grid">
				{#each filtered() as cert}
					<CertificationCard {cert} />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No certifications found"
				description="No assessment exams match your chosen search query or difficulty filters."
				actionText="Clear all filters"
				onaction={clearAll}
			/>
		{/if}
	</main>
</div>

<style>
	.certs-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.certs-header {
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
		color: #7c3aed;
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
		border-color: #7c3aed;
		box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.12);
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

	/* Filter Strip */
	.filter-strip {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		flex-wrap: wrap;
		margin-bottom: 20px;
	}

	.level-pills {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.filter-pill {
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

	.filter-pill:hover {
		color: #7c3aed;
		border-color: rgba(124, 58, 237, 0.3);
		background: rgba(124, 58, 237, 0.04);
	}

	.filter-pill.active {
		color: #ffffff;
		background: #7c3aed;
		border-color: #7c3aed;
		box-shadow: 0 2px 8px -2px rgba(124, 58, 237, 0.4);
	}

	.proctored-toggle-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 14px;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary, #64748b);
		background: var(--bg, #f8fafc);
		border: 1px solid var(--border);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.proctored-toggle-pill:hover {
		border-color: #7c3aed;
		color: var(--text-primary);
	}

	.proctored-toggle-pill.active {
		border-color: #7c3aed;
		background: rgba(124, 58, 237, 0.08);
		color: #7c3aed;
	}

	.toggle-dot {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: var(--text-muted);
		transition: background 0.15s ease;
	}

	.toggle-dot.checked {
		background: #7c3aed;
		box-shadow: 0 0 0 2px rgba(124, 58, 237, 0.25);
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
		border-color: #7c3aed;
	}

	.btn-reset {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #7c3aed;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.btn-reset:hover {
		background: rgba(124, 58, 237, 0.08);
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
