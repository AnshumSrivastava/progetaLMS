<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, SlidersHorizontal, BookOpen, Layers, Video, Calendar, Users } from 'lucide-svelte';
	import CourseCard from '$lib/components/ui/CourseCard.svelte';
	import LiveBatchCard from '$lib/components/ui/LiveBatchCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.initialSearch || '');
	let selectedCategory = $state(data.initialCategory || 'All');
	let selectedLevel = $state(data.initialLevel || 'All');
	let formatTab = $state<'all' | 'live' | 'self_paced'>('all');
	let sortBy = $state('default');

	const predefinedCategories = ['All', 'Network Security', 'Cloud Security', 'Penetration Testing', 'Compliance'];
	
	// Dynamic categories from database courses
	const categories = $derived(() => {
		const cats = new Set(predefinedCategories);
		for (const c of [...(data.courses || []), ...(data.liveClasses || [])]) {
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

	const filteredCourses = $derived(() => {
		let list = data.courses;

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
		formatTab = 'all';
		sortBy = 'default';
	}
</script>

<svelte:head>
	<title>Courses — {APP_NAME}</title>
	<meta name="description" content="Browse focused practitioner-led courses from Launchpad and verified instructors." />
</svelte:head>

<div class="courses-page">
	<!-- ── WORKLY-STYLE TOP HEADER & SEARCH ──────────────── -->
	<header class="courses-header">
		<div class="container-custom">
			<div class="header-main-row">
				<div>
					<span class="meta-label">CURRICULUM & PATHWAYS</span>
					<h1 class="page-title">Explore Courses</h1>
					<p class="page-subtitle">Hands-on pathways and technical lessons designed for immediate practical application.</p>
				</div>

				<!-- Search Input (Workly Reference Style) -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search courses, skills, or topics..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Format Switcher & Category Pills -->
			<div class="format-and-category-row">
				<div class="format-tabs">
					<button
						type="button"
						class="format-tab-btn"
						class:active={formatTab === 'all'}
						onclick={() => (formatTab = 'all')}
					>
						<Layers size={14} />
						<span>All ({filteredLiveClasses().length + filteredCourses().length})</span>
					</button>
					<button
						type="button"
						class="format-tab-btn live-tab-btn"
						class:active={formatTab === 'live'}
						onclick={() => (formatTab = 'live')}
					>
						<span class="live-dot-mini"></span>
						<span>Live Classes ({filteredLiveClasses().length})</span>
					</button>
					<button
						type="button"
						class="format-tab-btn"
						class:active={formatTab === 'self_paced'}
						onclick={() => (formatTab = 'self_paced')}
					>
						<BookOpen size={14} />
						<span>Self-Paced ({filteredCourses().length})</span>
					</button>
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
			</div>

			<!-- Meta & Secondary Controls Strip -->
			<div class="header-sub-strip">
				<div class="results-count">
					Showing <strong>
						{formatTab === 'all'
							? filteredLiveClasses().length + filteredCourses().length
							: formatTab === 'live'
								? filteredLiveClasses().length
								: filteredCourses().length}
					</strong> learning programs
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
							<option value="default">Most Popular</option>
							<option value="price-asc">Price: Low to High</option>
							<option value="price-desc">Price: High to Low</option>
						</select>
					</div>

					{#if selectedCategory !== 'All' || selectedLevel !== 'All' || searchQuery || formatTab !== 'all'}
						<button type="button" class="btn-reset" onclick={clearFilters}>
							Reset
						</button>
					{/if}
				</div>
			</div>
		</div>
	</header>

	<!-- ── COURSES CARDS CANVAS ───────────────────────────── -->
	<main class="container-custom content-canvas">
		{#if (formatTab === 'all' || formatTab === 'live') && filteredLiveClasses().length > 0}
			<section class="mb-12">
				<div class="section-title-wrap">
					<div class="flex items-center gap-2">
						<span class="live-dot-mini"></span>
						<h2 class="text-xl font-bold text-[var(--text-primary)]">Live Classroom Cohorts</h2>
					</div>
					<p class="text-xs text-[var(--text-secondary)] mt-0.5">
						Interactive scheduled live batches hosted externally with practitioner mentorship and peer group access.
					</p>
				</div>
				<div class="workly-grid">
					{#each filteredLiveClasses() as course}
						<LiveBatchCard {course} />
					{/each}
				</div>
			</section>
		{/if}

		{#if (formatTab === 'all' || formatTab === 'self_paced') && filteredCourses().length > 0}
			<section class="mb-12">
				<div class="section-title-wrap">
					<h2 class="text-xl font-bold text-[var(--text-primary)]">Self-Paced Courses</h2>
					<p class="text-xs text-[var(--text-secondary)] mt-0.5">
						On-demand curriculum with instant access, hands-on modules, and self-directed completion.
					</p>
				</div>
				<div class="workly-grid">
					{#each filteredCourses() as course}
						<CourseCard {course} />
					{/each}
				</div>
			</section>
		{/if}

		{#if filteredLiveClasses().length === 0 && filteredCourses().length === 0}
			<EmptyState
				title="No courses found"
				description="No courses match your selected search or subject category. Try clearing your filters."
				actionText="Clear all filters"
				onaction={clearFilters}
			/>
		{/if}
	</main>
</div>

<style>
	.courses-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.courses-header {
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
		color: #6366f1;
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
		border-color: #6366f1;
		box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.12);
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

	/* Format & Category Row */
	.format-and-category-row {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-bottom: 20px;
	}

	@media (min-width: 900px) {
		.format-and-category-row {
			flex-direction: row;
			align-items: center;
			justify-content: space-between;
		}
	}

	.format-tabs {
		display: inline-flex;
		align-items: center;
		padding: 4px;
		background: var(--bg-subtle, #f1f5f9);
		border: 1px solid var(--border);
		border-radius: 9999px;
		gap: 4px;
		width: fit-content;
	}

	:global([data-theme="dark"]) .format-tabs {
		background: #141b28;
	}

	.format-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 9999px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: transparent;
		border: none;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.format-tab-btn:hover {
		color: var(--text-primary);
	}

	.format-tab-btn.active {
		background: var(--bg-elevated, #ffffff);
		color: var(--text-primary);
		box-shadow: 0 2px 6px -1px rgba(0, 0, 0, 0.08);
	}

	:global([data-theme="dark"]) .format-tab-btn.active {
		background: #1e293b;
		color: #ffffff;
	}

	.format-tab-btn.live-tab-btn.active {
		color: #059669;
	}

	:global([data-theme="dark"]) .format-tab-btn.live-tab-btn.active {
		color: #34d399;
	}

	.live-dot-mini {
		width: 7px;
		height: 7px;
		background: #10b981;
		border-radius: 9999px;
		box-shadow: 0 0 6px #10b981;
	}

	/* Category Pills Strip */
	.category-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		overflow-x: auto;
		padding-bottom: 4px;
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
		color: #6366f1;
		border-color: rgba(99, 102, 241, 0.3);
		background: rgba(99, 102, 241, 0.04);
	}

	.category-pill.active {
		color: #ffffff;
		background: #6366f1;
		border-color: #6366f1;
		box-shadow: 0 2px 8px -2px rgba(99, 102, 241, 0.4);
	}

	/* Sub-strip: Results count & filter/sort selects */
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
		border-color: #6366f1;
	}

	.btn-reset {
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6366f1;
		background: none;
		border: none;
		cursor: pointer;
		padding: 4px 8px;
		border-radius: 6px;
		transition: background 0.15s ease;
	}

	.btn-reset:hover {
		background: rgba(99, 102, 241, 0.08);
	}

	/* Grid Canvas */
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
