<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, Users, Calendar } from 'lucide-svelte';
	import MentorCard from '$lib/components/ui/MentorCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedSpecialty = $state('All');
	let sortBy = $state('default');

	const allSpecialties = $derived(() => {
		const specs = new Set(['All']);
		for (const m of data.mentors) {
			for (const s of m.specialties || []) {
				if (s) specs.add(s);
			}
		}
		return Array.from(specs);
	});

	const filteredMentors = $derived(() => {
		let list = data.mentors;

		// Specialty filter
		if (selectedSpecialty && selectedSpecialty !== 'All') {
			list = list.filter((m: any) =>
				(m.specialties || []).some((s: string) => s.toLowerCase() === selectedSpecialty.toLowerCase())
			);
		}

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((m: any) =>
				m.name.toLowerCase().includes(q) ||
				(m.bio && m.bio.toLowerCase().includes(q)) ||
				(m.headline && m.headline.toLowerCase().includes(q)) ||
				(m.specialties && m.specialties.some((s: string) => s.toLowerCase().includes(q)))
			);
		}

		// Sort
		if (sortBy === 'price-asc') {
			list = [...list].sort((a: any, b: any) => (a.lowestPricePaise || 0) - (b.lowestPricePaise || 0));
		} else if (sortBy === 'price-desc') {
			list = [...list].sort((a: any, b: any) => (b.lowestPricePaise || 0) - (a.lowestPricePaise || 0));
		}

		return list;
	});

	const hasFilters = $derived(selectedSpecialty !== 'All' || searchQuery.trim() !== '');

	function clearFilters() {
		searchQuery = '';
		selectedSpecialty = 'All';
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Mentoring & 1-on-1 Sessions — {APP_NAME}</title>
	<meta name="description" content="Book 1-on-1 mentoring sessions with vetted cybersecurity practitioners, architects, and instructors." />
</svelte:head>

<div class="mentoring-page">
	<!-- ── WORKLY-STYLE TOP HEADER & SEARCH ──────────────── -->
	<header class="mentoring-header">
		<div class="container-custom">
			<div class="header-main-row">
				<div>
					<span class="meta-label">PRACTITIONER MENTORSHIP</span>
					<h1 class="page-title">1-on-1 Mentoring</h1>
					<p class="page-subtitle">Book dedicated coaching, architecture reviews, and code guidance with vetted practitioners.</p>
				</div>

				<!-- Search Input (Workly Reference Style) -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search by mentor name, topic, or skills..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Specialty Filter Pills Strip -->
			<div class="specialty-strip">
				{#each allSpecialties() as spec}
					<button
						type="button"
						class="specialty-pill"
						class:active={selectedSpecialty === spec}
						onclick={() => (selectedSpecialty = spec)}
					>
						{spec === 'All' ? 'All Specialties' : spec}
					</button>
				{/each}
			</div>

			<!-- Meta & Secondary Controls Strip -->
			<div class="header-sub-strip">
				<div class="results-count">
					Showing <strong>{filteredMentors().length}</strong> of {data.mentors.length} practitioners
				</div>

				<div class="filter-controls">
					<!-- Sort Selector -->
					<div class="select-wrap">
						<span class="select-label">Sort by:</span>
						<select bind:value={sortBy} class="control-select">
							<option value="default">Recommended</option>
							<option value="price-asc">Price: Low to High</option>
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

	<!-- ── MENTOR CARDS CANVAS ────────────────────────────── -->
	<main class="container-custom content-canvas">
		{#if filteredMentors().length > 0}
			<div class="workly-grid">
				{#each filteredMentors() as mentor}
					<MentorCard {mentor} />
				{/each}
			</div>
		{:else}
			<EmptyState
				title="No practitioners found"
				description="No mentors match your selected search or specialty filter. Try clearing your filters."
				actionText="Clear all filters"
				onaction={clearFilters}
			/>
		{/if}
	</main>
</div>

<style>
	.mentoring-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.mentoring-header {
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
		color: #10b981;
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
		border-color: #10b981;
		box-shadow: 0 0 0 3px rgba(16, 185, 129, 0.12);
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

	/* Specialty Strip */
	.specialty-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 8px;
		margin-bottom: 20px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.specialty-strip::-webkit-scrollbar {
		display: none;
	}

	.specialty-pill {
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

	.specialty-pill:hover {
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.3);
		background: rgba(16, 185, 129, 0.04);
	}

	.specialty-pill.active {
		color: #ffffff;
		background: #10b981;
		border-color: #10b981;
		box-shadow: 0 2px 8px -2px rgba(16, 185, 129, 0.4);
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
		color: #10b981;
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
