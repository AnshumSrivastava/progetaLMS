<script lang="ts">
	import { page } from '$app/stores';
	import { theme } from '$lib/stores/theme';
	import { layoutMode } from '$lib/stores/layoutMode';

	let { data } = $props();

	// Derived state
	let groupedModules = $derived([
		{
			id: 'main',
			title: 'Course Content',
			lessons: data.modules.map((m: any, idx: number) => ({
				id: m.id,
				title: `Lesson ${idx + 1}`,
				type: m.contentType,
				completed: false
			}))
		}
	]);

	let isSidebarOpen = $state(false);

	// Derived state
	let mode = $derived($layoutMode);
	let showSidebar = $derived(mode === 'default');
	let isImmersive = $derived(mode === 'immersive');
	let isExam = $derived(mode === 'exam');
</script>

<svelte:head>
	<title>{data.course.title} - Launchpad</title>
</svelte:head>

<div class="shell" class:shell-immersive={isImmersive} class:shell-exam={isExam}>

	<!-- ── TOP NAVIGATION BAR ───────────────────────────────── -->
	<header class="topbar">
		<div class="topbar-left">
			<a href="/dashboard" class="back-link" title="Back to Dashboard">
				<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
			</a>

			{#if !isImmersive}
				<div class="topbar-divider"></div>
				<h1 class="course-title">{data.course.title}</h1>
			{/if}

			{#if isExam}
				<div class="exam-badge">EXAM MODE</div>
			{/if}
		</div>

		<div class="topbar-right">
			{#if !isImmersive && !isExam}
				<!-- Progress -->
				<div class="progress-pill">
					<span class="progress-pct">0%</span>
					<div class="progress-track">
						<div class="progress-fill" style="width: 0%"></div>
					</div>
				</div>
			{/if}

			{#if isExam}
				<!-- Exam timer placeholder -->
				<div class="exam-timer">
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
					Untimed
				</div>
			{/if}

			<!-- Sidebar toggle on mobile (only when sidebar mode) -->
			{#if showSidebar}
				<button
					class="sidebar-toggle"
					onclick={() => isSidebarOpen = !isSidebarOpen}
					aria-label="Toggle curriculum"
				>
					<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						{#if isSidebarOpen}
							<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
						{:else}
							<line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line>
						{/if}
					</svg>
				</button>
			{/if}

			<!-- Theme toggle -->
			<button
				onclick={() => theme.toggle()}
				class="theme-btn"
				title="Toggle {$theme === 'light' ? 'dark' : 'light'} mode"
			>
				{#if $theme === 'dark'}
					<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="5"></circle>
						<line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line>
						<line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
						<line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line>
						<line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
					</svg>
				{:else}
					<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
						<path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
					</svg>
				{/if}
			</button>
		</div>
	</header>

	<!-- ── BODY ───────────────────────────────────────────────── -->
	<div class="body">

		{#if showSidebar}
			<!-- Mobile overlay -->
			{#if isSidebarOpen}
				<div class="overlay" onclick={() => isSidebarOpen = false}></div>
			{/if}

			<!-- ── COURSE SIDEBAR ──────────────────────────── -->
			<aside class="sidebar" class:sidebar-open={isSidebarOpen}>
				<div class="sidebar-head">
					<span class="sidebar-label">CURRICULUM</span>
				</div>

				<nav class="sidebar-nav">
					{#each groupedModules as module}
						<div class="module-group">
							<div class="module-title">{module.title}</div>
							{#each module.lessons as lesson}
								{@const isActive = $page.url.pathname.includes(lesson.id)}
								<a
									href="/learn/{data.course.id}/{lesson.id}"
									class="lesson-link"
									class:lesson-active={isActive}
									onclick={() => isSidebarOpen = false}
								>
									{#if isActive}
										<span class="active-bar"></span>
									{/if}

									<!-- Type icon -->
									<span class="lesson-icon" class:lesson-icon-active={isActive}>
										{#if lesson.type === 'slides'}
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg>
										{:else if lesson.type === 'test'}
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
										{:else if lesson.type === 'video'}
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"/></svg>
										{:else}
											<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
										{/if}
									</span>

									<span class="lesson-info">
										<span class="lesson-name" class:lesson-name-active={isActive}>{lesson.title}</span>
										{#if lesson.completed}
											<span class="lesson-done">
												<svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
												Completed
											</span>
										{/if}
									</span>
								</a>
							{/each}
						</div>
					{/each}
				</nav>
			</aside>
		{/if}

		<!-- ── MAIN CONTENT ──────────────────────────────────── -->
		<main class="content">
			<slot />
		</main>

	</div>
</div>

<style>
	/* ── Shell ── */
	.shell {
		height: 100dvh;
		width: 100vw;
		display: flex;
		flex-direction: column;
		background: var(--bg);
		color: var(--text-primary);
		font-family: var(--font-sans);
		overflow: hidden;
	}

	/* ── Top Bar ── */
	.topbar {
		height: 52px;
		min-height: 52px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 20px;
		background: var(--bg-subtle);
		border-bottom: 1px solid var(--border);
		z-index: 30;
		gap: 12px;
	}
	.shell-immersive .topbar {
		background: transparent;
		border-bottom: none;
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		z-index: 100;
	}
	.shell-exam .topbar {
		background: var(--bg-subtle);
		border-bottom: 1px solid var(--border);
	}

	.topbar-left {
		display: flex;
		align-items: center;
		gap: 12px;
		min-width: 0;
		flex: 1;
	}
	.topbar-right {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-shrink: 0;
	}

	.back-link {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		flex-shrink: 0;
		transition: all 0.18s;
	}
	.back-link:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.topbar-divider {
		width: 1px;
		height: 20px;
		background: var(--border);
		flex-shrink: 0;
	}

	.course-title {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.01em;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.exam-badge {
		display: inline-flex;
		align-items: center;
		padding: 3px 10px;
		background: rgba(239, 68, 68, 0.12);
		color: #ef4444;
		border: 1px solid rgba(239, 68, 68, 0.3);
		border-radius: 9999px;
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.exam-timer {
		display: flex;
		align-items: center;
		gap: 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		padding: 5px 12px;
		border-radius: 8px;
	}

	.progress-pill {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.progress-pct {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		white-space: nowrap;
	}
	.progress-track {
		width: 80px;
		height: 4px;
		background: var(--border);
		border-radius: 9999px;
		overflow: hidden;
	}
	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 9999px;
	}

	.sidebar-toggle {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		display: none; /* shown on mobile */
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.18s;
	}
	.sidebar-toggle:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	.theme-btn {
		width: 34px;
		height: 34px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.18s;
	}
	.theme-btn:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}

	/* ── Body ── */
	.body {
		flex: 1;
		display: flex;
		overflow: hidden;
		position: relative;
	}
	.shell-immersive .body {
		position: static; /* immersive fills shell directly */
	}

	/* Mobile overlay */
	.overlay {
		position: absolute;
		inset: 0;
		background: rgba(0,0,0,0.45);
		z-index: 20;
		backdrop-filter: blur(2px);
		animation: fadeIn 0.2s ease;
	}
	@keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }

	/* ── Course Sidebar ── */
	.sidebar {
		width: 272px;
		min-width: 272px;
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		overflow: hidden;
		z-index: 25;
		transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1);
	}

	.sidebar-head {
		padding: 16px 20px 12px;
		border-bottom: 1px solid var(--border);
		flex-shrink: 0;
	}
	.sidebar-label {
		font-size: 0.7rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.sidebar-nav {
		flex: 1;
		overflow-y: auto;
		padding: 8px 0;
	}

	.module-group {
		margin-bottom: 4px;
	}
	.module-title {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		padding: 12px 20px 6px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.lesson-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 20px;
		position: relative;
		text-decoration: none;
		transition: background 0.15s;
		border-radius: 0;
	}
	.lesson-link:hover {
		background: var(--bg-elevated);
	}
	.lesson-active {
		background: var(--accent-muted);
	}
	.lesson-link:hover.lesson-active {
		background: var(--accent-muted);
	}

	.active-bar {
		position: absolute;
		left: 0;
		top: 6px;
		bottom: 6px;
		width: 3px;
		background: var(--accent);
		border-radius: 0 9999px 9999px 0;
	}

	.lesson-icon {
		color: var(--text-muted);
		flex-shrink: 0;
		display: flex;
	}
	.lesson-icon-active {
		color: var(--accent);
	}

	.lesson-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}
	.lesson-name {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.lesson-name-active {
		color: var(--accent);
		font-weight: 600;
	}
	.lesson-done {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.68rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	/* ── Main Content ── */
	.content {
		flex: 1;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		min-width: 0;
	}
	.shell-immersive .content {
		overflow: visible;
	}

	/* ── Responsive ── */
	@media (max-width: 768px) {
		.sidebar-toggle {
			display: flex;
		}
		.progress-pill {
			display: none;
		}
		.course-title {
			font-size: 0.85rem;
		}

		/* Sidebar slides in from left on mobile */
		.sidebar {
			position: absolute;
			top: 0;
			left: 0;
			bottom: 0;
			transform: translateX(-100%);
			box-shadow: 4px 0 24px rgba(0,0,0,0.15);
		}
		.sidebar.sidebar-open {
			transform: translateX(0);
		}
	}

	@media (min-width: 769px) {
		.sidebar-toggle {
			display: none;
		}
		.sidebar {
			transform: none !important;
		}
	}

	@media (max-width: 480px) {
		.topbar {
			padding: 0 12px;
		}
		.course-title {
			display: none;
		}
		.topbar-divider {
			display: none;
		}
	}
</style>
