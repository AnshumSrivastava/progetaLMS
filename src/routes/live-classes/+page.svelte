<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, Video, Calendar, Users, Clock, ShieldCheck, Sparkles } from 'lucide-svelte';
	import LiveBatchCard from '$lib/components/ui/LiveBatchCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.initialSearch || '');
	let selectedCategory = $state(data.initialCategory || 'All');
	let selectedLevel = $state(data.initialLevel || 'All');
	let sortBy = $state('default');

	const predefinedCategories = ['All', 'Cybersecurity', 'Cloud Security', 'Network Defense'];

	// Dynamic categories from live batches
	const categories = $derived(() => {
		const cats = new Set(predefinedCategories);
		for (const c of data.liveClasses) {
			const cat = (c.metadata as any)?.category;
			if (cat) cats.add(cat);
		}
		return Array.from(cats);
	});

	const levels = ['All', 'Beginner', 'Intermediate', 'Advanced'];

	const filteredLiveClasses = $derived(() => {
		let list = data.liveClasses || [];

		// Category filter
		if (selectedCategory && selectedCategory !== 'All') {
			list = list.filter((c: any) => (c.metadata as any)?.category === selectedCategory);
		}

		// Level filter
		if (selectedLevel && selectedLevel !== 'All') {
			list = list.filter((c: any) => {
				const lvl = ((c.metadata as any)?.level || 'Intermediate').toLowerCase();
				return lvl === selectedLevel.toLowerCase();
			});
		}

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((c: any) =>
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				((c.metadata as any)?.category || '').toLowerCase().includes(q)
			);
		}

		// Sort
		if (sortBy === 'price-asc') {
			list = [...list].sort((a: any, b: any) => (a.pricePaise || 0) - (b.pricePaise || 0));
		} else if (sortBy === 'price-desc') {
			list = [...list].sort((a: any, b: any) => (b.pricePaise || 0) - (a.pricePaise || 0));
		}

		return list;
	});

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'All';
		selectedLevel = 'All';
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Live Classes & Cohorts — {APP_NAME}</title>
	<meta name="description" content="Explore scheduled instructor-led live classroom cohorts with external sessions, interactive mentorship, and limited seats on Launchpad." />
</svelte:head>

<div class="live-classes-page">
	<!-- ── TOP HERO HEADER & SEARCH BAR ──────────────────── -->
	<header class="live-header">
		<div class="container-custom">
			<div class="header-main-row">
				<div>
					<div class="flex items-center gap-2 mb-1.5">
						<span class="live-status-pill">
							<span class="live-pulsing-dot"></span>
							<span>LIVE CLASSROOMS</span>
						</span>
						<span class="text-xs font-mono text-[var(--text-muted)] font-semibold">INTERACTIVE COHORTS</span>
					</div>
					<h1 class="page-title">Live Classes & Cohorts</h1>
					<p class="page-subtitle">
						Instructor-guided live learning cohorts with structured weekend/evening sessions, private WhatsApp groups, and direct practitioner mentorship.
					</p>
				</div>

				<!-- Search Input -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search live batches, skills..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Category Pills Navigation Strip -->
			<div class="category-strip">
				{#each categories() as cat}
					<button
						type="button"
						class="category-pill"
						class:active={selectedCategory === cat}
						onclick={() => (selectedCategory = cat)}
					>
						{cat === 'All' ? 'All Subjects' : cat}
					</button>
				{/each}
			</div>

			<!-- Meta & Secondary Controls Strip -->
			<div class="header-sub-strip">
				<div class="results-count">
					Showing <strong>{filteredLiveClasses().length}</strong> scheduled live cohorts
				</div>

				<div class="filter-controls">
					<!-- Level Selector -->
					<div class="select-wrap">
						<span class="select-label">Level:</span>
						<select bind:value={selectedLevel} class="control-select">
							{#each levels as lvl}
								<option value={lvl}>{lvl === 'All' ? 'All Levels' : lvl}</option>
							{/each}
						</select>
					</div>

					<!-- Sort Selector -->
					<div class="select-wrap">
						<span class="select-label">Sort by:</span>
						<select bind:value={sortBy} class="control-select">
							<option value="default">Upcoming Batches</option>
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
						</select>
					</div>

					{#if selectedCategory !== 'All' || selectedLevel !== 'All' || searchQuery}
						<button type="button" class="btn-reset" onclick={clearFilters}>
							Reset
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- ── COHORT CARDS CANVAS ─────────────────────────────── -->
	<main class="container-custom content-canvas">
		{#if filteredLiveClasses().length > 0}
			<div class="workly-grid">
				{#each filteredLiveClasses() as course}
					<LiveBatchCard {course} />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No live batches found"
				description="No scheduled cohorts match your filter criteria. Try clearing filters or checking back as new dates are added."
				actionText="Clear all filters"
				onaction={clearFilters}
			/>
		{/if}
	</main>
</div>

<style>
	.live-classes-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.live-header {
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

	.live-status-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 9px;
		border-radius: 9999px;
		background: rgba(16, 185, 129, 0.12);
		border: 1px solid rgba(16, 185, 129, 0.28);
		color: #059669;
		font-size: 0.6875rem;
		font-weight: 800;
		letter-spacing: 0.06em;
	}

	:global([data-theme="dark"]) .live-status-pill {
		color: #34d399;
	}

	.live-pulsing-dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 9999px;
		box-shadow: 0 0 6px #10b981;
		animation: pulse-dot 1.5s infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
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
		margin-top: 6px;
		max-width: 600px;
		line-height: 1.5;
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
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
	}

	:global(.search-icon) {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
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
		padding: 4px;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Category Pills Strip */
	.category-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 8px;
		margin-bottom: 20px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.category-strip::-webkit-scrollbar {
		display: none;
	}

	.category-pill {
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

	.category-pill:hover {
		color: #059669;
		border-color: rgba(16, 185, 129, 0.3);
		background: rgba(16, 185, 129, 0.04);
	}

	.category-pill.active {
		color: #ffffff;
		background: #059669;
		border-color: #059669;
		box-shadow: 0 2px 8px -2px rgba(5, 150, 105, 0.4);
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
		border-color: #10b981;
	}

	.btn-reset {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #059669;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.btn-reset:hover {
		background: rgba(16, 185, 129, 0.08);
	}

	/* Canvas */
	.content-canvas {
		padding-top: 36px;
		padding-bottom: 80px;
	}

	.workly-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(460px, 1fr));
		gap: 20px;
	}

	@media (max-width: 640px) {
		.workly-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
