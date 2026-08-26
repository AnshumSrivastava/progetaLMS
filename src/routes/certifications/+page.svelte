<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, ShieldCheck, ArrowRight, X, SlidersHorizontal, Award } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	let searchQuery   = $state('');
	let selectedLevel = $state<string | null>(null);
	let onlyProctored = $state(false);
	let sortBy        = $state('default');

	const levels = ['Beginner', 'Intermediate', 'Advanced'];

	let filtered = $derived(() => {
		let list = data.certs;

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(c =>
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				(c.metadata?.tags || []).some((t: string) => t.toLowerCase().includes(q))
			);
		}

		if (selectedLevel) {
			list = list.filter(c => (c.metadata?.level || 'Intermediate') === selectedLevel);
		}

		if (onlyProctored) {
			list = list.filter(c => c.metadata?.isProctored !== false);
		}

		if (sortBy === 'price-asc')  list = [...list].sort((a, b) => a.pricePaise - b.pricePaise);
		if (sortBy === 'price-desc') list = [...list].sort((a, b) => b.pricePaise - a.pricePaise);
		if (sortBy === 'questions')  list = [...list].sort((a, b) => (b.metadata?.questions || 0) - (a.metadata?.questions || 0));

		return list;
	});

	const hasFilters = $derived(!!selectedLevel || onlyProctored || searchQuery.trim() !== '');

	function clearAll() {
		searchQuery   = '';
		selectedLevel = null;
		onlyProctored = false;
		sortBy        = 'default';
	}

	const levelConfig: Record<string, { color: string; label: string }> = {
		Beginner:     { color: '#22c55e', label: 'Beginner'     },
		Intermediate: { color: '#f59e0b', label: 'Intermediate' },
		Advanced:     { color: '#8b5cf6', label: 'Advanced'     },
	};
</script>

<svelte:head>
	<title>Certifications — {APP_NAME}</title>
	<meta name="description" content="Rigorous, timed certification exams with permanent verifiable credentials." />
</svelte:head>

<div class="page">

	<!-- ── HEADER ──────────────────────────────────────────── -->
	<header class="page-header">
		<div class="header-inner">
			<div class="header-left">
				<span class="kicker">Certifications</span>
				<h1>Prove what you know.</h1>
				<p class="header-body">
					Rigorous skill assessments with permanent, verifiable credentials attached to your profile.
				</p>
			</div>
			<div class="header-right">
				<div class="stat-row">
					<div class="stat-block">
						<span class="stat-num">{data.certs.length}</span>
						<span class="stat-desc">Exams available</span>
					</div>
					<div class="stat-sep"></div>
					<div class="stat-block">
						<span class="stat-num">{data.certs.filter(c => c.pricePaise === 0).length}</span>
						<span class="stat-desc">Free of charge</span>
					</div>
					<div class="stat-sep"></div>
					<div class="stat-block">
						<span class="stat-num">3</span>
						<span class="stat-desc">Difficulty tiers</span>
					</div>
				</div>
			</div>
		</div>
	</header>

	<!-- ── BODY ────────────────────────────────────────────── -->
	<div class="body-wrap">

		<!-- ── SIDEBAR ─────────────────────────────────────── -->
		<aside class="sidebar">

			<div class="filter-group">
				<div class="search-field">
					<Search size={13} class="search-ico" />
					<input
						type="text"
						placeholder="Search certifications..."
						bind:value={searchQuery}
						class="search-input"
					/>
					{#if searchQuery}
						<button class="search-clear" onclick={() => searchQuery = ''}>
							<X size={11} />
						</button>
					{/if}
				</div>
			</div>

			<div class="filter-group">
				<span class="group-label">Difficulty</span>
				<div class="level-opts">
					<button
						class="level-opt"
						class:active={selectedLevel === null}
						onclick={() => selectedLevel = null}
					>
						<span class="l-dot" style="background: var(--border-strong);"></span>
						<span class="l-name">All levels</span>
						<span class="l-ct">{data.certs.length}</span>
					</button>
					{#each levels as lvl}
						{@const count = data.certs.filter(c => (c.metadata?.level || 'Intermediate') === lvl).length}
						<button
							class="level-opt"
							class:active={selectedLevel === lvl}
							onclick={() => selectedLevel = selectedLevel === lvl ? null : lvl}
						>
							<span class="l-dot" style="background: {levelConfig[lvl].color};"></span>
							<span class="l-name">{lvl}</span>
							<span class="l-ct">{count}</span>
						</button>
					{/each}
				</div>
			</div>

			<div class="filter-group">
				<label class="toggle-row" for="tog-proctored">
					<div class="toggle-info">
						<span class="group-label" style="margin-bottom:0;">Proctored</span>
						<span class="toggle-hint">Webcam-monitored</span>
					</div>
					<div class="sw" class:on={onlyProctored}>
						<input id="tog-proctored" type="checkbox" class="sr" bind:checked={onlyProctored} />
						<span class="sw-knob"></span>
					</div>
				</label>
			</div>

			<div class="filter-group">
				<span class="group-label">Sort</span>
				<select class="sort-dd" bind:value={sortBy}>
					<option value="default">Default</option>
					<option value="price-asc">Price: low to high</option>
					<option value="price-desc">Price: high to low</option>
					<option value="questions">Most questions</option>
				</select>
			</div>

			{#if hasFilters}
				<button class="clear-all" onclick={clearAll}>
					<X size={11} /> Reset filters
				</button>
			{/if}
		</aside>

		<!-- ── MAIN ─────────────────────────────────────────── -->
		<main class="main">

			<!-- Results bar -->
			<div class="results-bar">
				<p class="result-ct">
					<strong>{filtered().length}</strong>
					<span> of {data.certs.length} exams</span>
				</p>

				{#if hasFilters}
					<div class="chips">
						{#if searchQuery}
							<span class="chip">"{searchQuery}"<button onclick={() => searchQuery = ''}>×</button></span>
						{/if}
						{#if selectedLevel}
							<span class="chip">{selectedLevel}<button onclick={() => selectedLevel = null}>×</button></span>
						{/if}
						{#if onlyProctored}
							<span class="chip">Proctored<button onclick={() => onlyProctored = false}>×</button></span>
						{/if}
					</div>
				{/if}
			</div>

			<!-- Cards -->
			{#if filtered().length > 0}
				<div class="grid">
					{#each filtered() as cert}
						{@const level     = cert.metadata?.level || 'Intermediate'}
						{@const cfg       = levelConfig[level] || levelConfig.Intermediate}
						{@const questions = cert.metadata?.questions || 0}
						{@const duration  = cert.metadata?.duration || '—'}
						{@const passing   = cert.metadata?.passingScore || '75%'}
						{@const proctored = cert.metadata?.isProctored !== false}
						{@const tags      = (cert.metadata?.tags || []) as string[]}
						{@const free      = cert.pricePaise === 0}
						{@const price     = free ? 'Free' : `₹${(cert.pricePaise / 100).toFixed(0)}`}

						<article class="card" style="--c: {cfg.color};">
							<!-- Accent bar — left side -->
							<div class="card-bar"></div>

							<div class="card-body">
								<!-- Top: badges -->
								<div class="card-head">
									<span class="badge-lvl" style="color:{cfg.color};border-color:{cfg.color}30;background:{cfg.color}0e;">
										{level}
									</span>
									{#if proctored}
										<span class="badge-proc">
											<ShieldCheck size={9} /> Proctored
										</span>
									{/if}
								</div>

								<!-- Title -->
								<h2 class="card-title">{cert.title}</h2>

								<!-- Desc -->
								{#if cert.description}
									<p class="card-desc">{cert.description}</p>
								{/if}

								<!-- Tags -->
								{#if tags.length > 0}
									<div class="card-tags">
										{#each tags.slice(0, 4) as tag}
											<span class="tag">#{tag}</span>
										{/each}
									</div>
								{/if}

								<!-- Stats -->
								<div class="card-stats">
									<div class="cs">
										<span class="cs-val">{questions}</span>
										<span class="cs-key">Questions</span>
									</div>
									<div class="cs-sep"></div>
									<div class="cs">
										<span class="cs-val">{duration}</span>
										<span class="cs-key">Duration</span>
									</div>
									<div class="cs-sep"></div>
									<div class="cs">
										<span class="cs-val">{passing}</span>
										<span class="cs-key">Pass mark</span>
									</div>
								</div>

								<!-- Footer -->
								<div class="card-foot">
									<div class="price-col">
										<span class="price" class:free>{price}</span>
										{#if !free}
											<span class="price-note">per attempt</span>
										{/if}
									</div>
									<div class="card-actions">
										<button class="btn-ghost" onclick={() => goto(`/certifications/${cert.id}`)}>
											Details
										</button>
										<button class="btn-solid" onclick={() => goto(`/checkout/${cert.id}`)}>
											{free ? 'Enroll' : 'Buy'} <ArrowRight size={12} />
										</button>
									</div>
								</div>
							</div>
						</article>
					{/each}
				</div>
			{:else}
				<div class="empty">
					<span class="empty-icon"><SlidersHorizontal size={20} /></span>
					<h3>No results</h3>
					<p>
						{#if searchQuery}No exams match "<strong>{searchQuery}</strong>".
						{:else if selectedLevel}No <strong>{selectedLevel}</strong> exams with active filters.
						{:else}Adjust or clear your filters to see exams.{/if}
					</p>
					<button class="empty-btn" onclick={clearAll}>Reset filters</button>
				</div>
			{/if}
		</main>
	</div>
</div>

<style>
	/* ── Shell ─────────────────────────────────────────────── */
	.page {
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	/* ── Header ─────────────────────────────────────────────── */
	.page-header {
		background: var(--bg-subtle);
		border-bottom: 1px solid var(--border);
	}

	.header-inner {
		max-width: 1160px;
		margin: 0 auto;
		padding: 3.5rem 2rem 3rem;
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 3rem;
		flex-wrap: wrap;
	}

	.kicker {
		display: block;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.14em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 16px;
	}

	.header-left h1 {
		font-size: clamp(1.875rem, 4vw, 2.625rem);
		font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		line-height: 1.1;
		margin-bottom: 14px;
	}

	.header-body {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.65;
		max-width: 380px;
	}

	.stat-row {
		display: flex;
		align-items: center;
		gap: 22px;
		padding: 20px 24px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.stat-block { text-align: center; }

	.stat-num {
		display: block;
		font-size: 1.875rem;
		font-weight: 700;
		letter-spacing: -0.04em;
		color: var(--text-primary);
		line-height: 1;
	}

	.stat-desc {
		display: block;
		font-size: 0.625rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-top: 4px;
	}

	.stat-sep {
		width: 1px;
		height: 32px;
		background: var(--border);
	}

	/* ── Body ────────────────────────────────────────────────── */
	.body-wrap {
		max-width: 1160px;
		margin: 0 auto;
		padding: 2.75rem 2rem 6rem;
		display: grid;
		grid-template-columns: 200px 1fr;
		gap: 3rem;
		align-items: start;
	}

	/* ── Sidebar ─────────────────────────────────────────────── */
	.sidebar {
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
		display: flex;
		flex-direction: column;
		gap: 0;
	}

	.filter-group {
		padding: 16px 0;
		border-bottom: 1px solid var(--border-subtle);
	}

	.filter-group:first-child { padding-top: 0; }
	.filter-group:last-of-type { border-bottom: none; }

	.group-label {
		display: block;
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 10px;
	}

	/* Search */
	.search-field {
		position: relative;
		display: flex;
		align-items: center;
	}

	.search-field :global(.search-ico) {
		position: absolute;
		left: 9px;
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-input {
		width: 100%;
		height: 34px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0 28px 0 28px;
		font-size: 0.78125rem;
		color: var(--text-primary);
		font-family: inherit;
		outline: none;
		transition: border-color var(--t-fast), background var(--t-fast);
	}

	.search-input:focus { border-color: var(--border-strong); background: var(--bg); }

	.search-input::placeholder { color: var(--text-muted); }

	.search-clear {
		position: absolute;
		right: 7px;
		background: none;
		border: none;
		padding: 3px;
		cursor: pointer;
		color: var(--text-muted);
		display: flex;
		border-radius: 3px;
	}

	/* Level options */
	.level-opts { display: flex; flex-direction: column; gap: 1px; }

	.level-opt {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 32px;
		padding: 0 7px;
		border-radius: var(--radius-sm);
		background: none;
		border: none;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		transition: background var(--t-fast), color var(--t-fast);
	}

	.level-opt:hover { background: var(--bg-elevated); color: var(--text-primary); }

	.level-opt.active {
		background: var(--bg-elevated);
		color: var(--text-primary);
		font-weight: 600;
	}

	.l-dot {
		width: 7px;
		height: 7px;
		border-radius: 50%;
		flex-shrink: 0;
	}

	.l-name { flex: 1; }

	.l-ct {
		font-size: 0.6875rem;
		color: var(--text-muted);
		font-variant-numeric: tabular-nums;
		margin-left: auto;
	}

	/* Toggle */
	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		cursor: pointer;
		user-select: none;
		gap: 10px;
	}

	.toggle-hint {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
		margin-top: 1px;
	}

	.sw {
		width: 36px;
		height: 20px;
		border-radius: 999px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		position: relative;
		flex-shrink: 0;
		transition: background var(--t-normal), border-color var(--t-normal);
	}

	.sw.on { background: var(--text-primary); border-color: var(--text-primary); }

	.sw-knob {
		position: absolute;
		top: 2px;
		left: 2px;
		width: 14px;
		height: 14px;
		border-radius: 50%;
		background: var(--border-strong);
		transition: transform var(--t-normal), background var(--t-normal);
	}

	.sw.on .sw-knob { transform: translateX(16px); background: var(--bg); }

	.sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0,0,0,0); white-space: nowrap; }

	/* Sort */
	.sort-dd {
		width: 100%;
		height: 34px;
		padding: 0 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		color: var(--text-primary);
		font-family: inherit;
		cursor: pointer;
		outline: none;
	}

	/* Clear all */
	.clear-all {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		margin-top: 14px;
		background: none;
		border: none;
		padding: 0;
		font-size: 0.71875rem;
		color: var(--text-muted);
		cursor: pointer;
		font-family: inherit;
		transition: color var(--t-fast);
	}

	.clear-all:hover { color: var(--text-primary); }

	/* ── Main ───────────────────────────────────────────────── */
	.main { min-width: 0; }

	.results-bar {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.375rem;
		flex-wrap: wrap;
		gap: 8px;
	}

	.result-ct { font-size: 0.8125rem; color: var(--text-muted); }
	.result-ct strong { color: var(--text-primary); font-weight: 700; }

	.chips { display: flex; gap: 5px; flex-wrap: wrap; }

	.chip {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		padding: 2px 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 999px;
		font-size: 0.71875rem;
		color: var(--text-secondary);
	}

	.chip button {
		background: none; border: none; cursor: pointer;
		color: var(--text-muted); padding: 0; font-size: 1rem; line-height: 1; display: flex;
	}

	/* ── Grid ────────────────────────────────────────────────── */
	.grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(295px, 1fr));
		gap: 1rem;
	}

	/* ── Card ────────────────────────────────────────────────── */
	.card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-lg);
		overflow: hidden;
		display: flex;
		flex-direction: row;
		transition: border-color var(--t-fast), box-shadow var(--t-fast), transform var(--t-fast);
	}

	.card:hover {
		border-color: var(--border-strong);
		box-shadow: 0 6px 24px rgba(0,0,0,0.08);
		transform: translateY(-2px);
	}

	/* Left vertical accent bar */
	.card-bar {
		width: 3px;
		flex-shrink: 0;
		background: var(--c);
		align-self: stretch;
	}

	.card-body {
		padding: 20px 20px 18px;
		display: flex;
		flex-direction: column;
		gap: 13px;
		flex: 1;
		min-width: 0;
	}

	/* Head */
	.card-head { display: flex; align-items: center; gap: 6px; }

	.badge-lvl {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 3px 7px;
		border-radius: var(--radius-sm);
		border: 1px solid;
	}

	.badge-proc {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.5625rem;
		font-weight: 600;
		color: var(--text-muted);
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		padding: 3px 7px;
		border-radius: var(--radius-sm);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	/* Title */
	.card-title {
		font-size: 0.9375rem;
		font-weight: 600;
		letter-spacing: -0.015em;
		color: var(--text-primary);
		line-height: 1.35;
	}

	/* Desc */
	.card-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.55;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		margin-top: -4px;
	}

	/* Tags */
	.card-tags { display: flex; gap: 4px; flex-wrap: wrap; }

	.tag {
		font-size: 0.5625rem;
		font-weight: 600;
		letter-spacing: 0.04em;
		color: var(--text-muted);
		padding: 2px 5px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
	}

	/* Stats */
	.card-stats {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
	}

	.cs { display: flex; flex-direction: column; gap: 2px; flex: 1; }

	.cs-val {
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1;
		font-variant-numeric: tabular-nums;
	}

	.cs-key {
		font-size: 0.5625rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.cs-sep {
		width: 1px;
		height: 28px;
		background: var(--border-subtle);
		flex-shrink: 0;
	}

	/* Footer */
	.card-foot {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 10px;
		padding-top: 12px;
		border-top: 1px solid var(--border-subtle);
		margin-top: auto;
	}

	.price-col { display: flex; flex-direction: column; gap: 1px; }

	.price {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.025em;
		line-height: 1;
	}

	.price.free { color: #16a34a; }

	.price-note {
		font-size: 0.5rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.08em;
		font-weight: 600;
	}

	.card-actions { display: flex; gap: 5px; }

	.btn-ghost {
		height: 32px;
		padding: 0 11px;
		background: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		font-family: inherit;
		transition: border-color var(--t-fast), color var(--t-fast);
	}

	.btn-ghost:hover { border-color: var(--border-strong); color: var(--text-primary); }

	.btn-solid {
		height: 32px;
		padding: 0 12px;
		background: var(--text-primary);
		border: 1px solid var(--text-primary);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--bg);
		cursor: pointer;
		font-family: inherit;
		display: inline-flex;
		align-items: center;
		gap: 4px;
		transition: opacity var(--t-fast);
	}

	.btn-solid:hover { opacity: 0.86; }

	/* ── Empty ───────────────────────────────────────────────── */
	.empty {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		padding: 5rem 2rem;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg-subtle);
		gap: 10px;
	}

	.empty-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 46px;
		height: 46px;
		border-radius: var(--radius-md);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-muted);
		margin-bottom: 4px;
	}

	.empty h3 { font-size: 1rem; font-weight: 600; color: var(--text-primary); }

	.empty p { font-size: 0.875rem; color: var(--text-secondary); max-width: 280px; line-height: 1.5; }

	.empty-btn {
		margin-top: 8px;
		height: 34px;
		padding: 0 16px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		cursor: pointer;
		font-family: inherit;
	}

	/* ── Responsive ──────────────────────────────────────────── */
	@media (max-width: 900px) {
		.body-wrap { grid-template-columns: 1fr; padding: 2rem 1.5rem 4rem; }
		.sidebar { position: static; }
		.header-inner { flex-direction: column; align-items: flex-start; padding: 2.5rem 1.5rem 2.25rem; gap: 2rem; }
		.stat-row { gap: 16px; padding: 16px 18px; }
	}

	@media (max-width: 520px) {
		.grid { grid-template-columns: 1fr; }
		.stat-num { font-size: 1.5rem; }
	}
</style>
