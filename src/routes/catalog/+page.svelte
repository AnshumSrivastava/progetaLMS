<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, ArrowRight, ChevronLeft, ChevronRight, BookOpen, Award, Users, Download, Video, Calendar, SlidersHorizontal } from 'lucide-svelte';
	import CourseCard from '$lib/components/ui/CourseCard.svelte';
	import LiveBatchCard from '$lib/components/ui/LiveBatchCard.svelte';
	import CertificationCard from '$lib/components/ui/CertificationCard.svelte';
	import MentorCard from '$lib/components/ui/MentorCard.svelte';
	import EmptyState from '$lib/components/ui/EmptyState.svelte';
	import { page } from '$app/stores';

	let { data } = $props();

	let searchQuery = $state(data.search || '');
	let liveClassesScrollEl = $state<HTMLElement | null>(null);
	let coursesScrollEl = $state<HTMLElement | null>(null);
	let certsScrollEl = $state<HTMLElement | null>(null);
	let mentorsScrollEl = $state<HTMLElement | null>(null);

	function scrollRow(el: HTMLElement | null, direction: 'left' | 'right') {
		if (!el) return;
		const offset = direction === 'left' ? -340 : 340;
		el.scrollBy({ left: offset, behavior: 'smooth' });
	}

	const totalItems = $derived(
		(data.courses?.length || 0) +
		(data.liveClasses?.length || 0) +
		(data.certifications?.length || 0) +
		(data.mentors?.length || 0) +
		(data.resources?.length || 0)
	);

	const isSearching = $derived(searchQuery.trim().length > 0);

	const searchFilteredLiveClasses = $derived(
		(data.liveClasses || []).filter((c: any) =>
			!isSearching ||
			c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const searchFilteredCourses = $derived(
		(data.courses || []).filter((c: any) =>
			!isSearching ||
			c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const searchFilteredCerts = $derived(
		(data.certifications || []).filter((c: any) =>
			!isSearching ||
			c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(c.description || '').toLowerCase().includes(searchQuery.toLowerCase())
		)
	);

	const searchFilteredMentors = $derived(
		(data.mentors || []).filter((m: any) =>
			!isSearching ||
			m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
			(m.headline || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
			(m.specialties || []).some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()))
		)
	);
</script>

<svelte:head>
	<title>Explore — {APP_NAME}</title>
	<meta name="description" content="Discover courses, industry certifications, and 1-on-1 practitioner mentoring on Launchpad." />
</svelte:head>

<div class="explore-page">
	<!-- ── TOP WORKLY-STYLE SEARCH & HEADER BAR ──────────────── -->
	<header class="explore-header">
		<div class="container-custom">
			<div class="header-top-line">
				<div>
					<span class="meta-label">LEARNING MARKETPLACE</span>
					<h1 class="page-title">Explore Launchpad</h1>
				</div>

				<!-- Search Bar in Workly Reference Style -->
				<div class="search-wrap">
					<Search size={16} class="search-icon" />
					<input
						type="text"
						bind:value={searchQuery}
						placeholder="Search courses, certifications, mentors..."
						class="workly-search-input"
					/>
					{#if searchQuery}
						<button class="clear-btn" onclick={() => (searchQuery = '')} aria-label="Clear search">
							<X size={14} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Secondary Bar: Count and Navigation Quick-links -->
			<div class="header-sub-strip">
				<div class="results-count">
					{#if isSearching}
						Showing search results for "<strong>{searchQuery}</strong>"
					{:else}
						Showing <strong>{totalItems}</strong> learning experiences
					{/if}
				</div>

				<nav class="quick-nav">
					{#if (data.liveClasses?.length || 0) > 0}
						<a href="/live-classes" class="quick-link live-quick-link">
							<Video size={14} class="text-emerald-500" />
							<span>Live Classes ({data.liveClasses.length})</span>
						</a>
					{/if}
					<a href="/courses" class="quick-link">
						<BookOpen size={14} />
						<span>Courses ({data.courses.length})</span>
					</a>
					<a href="/certifications" class="quick-link">
						<Award size={14} />
						<span>Certifications ({data.certifications.length})</span>
					</a>
					<a href="/mentoring" class="quick-link">
						<Users size={14} />
						<span>Mentors ({data.mentors?.length || 0})</span>
					</a>
					<a href="/resources" class="quick-link">
						<Download size={14} />
						<span>Resources ({data.resources?.length || 0})</span>
					</a>
				</nav>
			</div>
		</div>
	</header>

	<main class="container-custom content-canvas">
		{#if isSearching}
			<!-- ── SEARCH RESULTS MODE ──────────────────────────── -->
			<div class="search-results-section">
				{#if searchFilteredLiveClasses.length > 0}
					<div class="mb-10">
						<h2 class="section-title text-emerald-600 dark:text-emerald-400">Live Classroom Batches ({searchFilteredLiveClasses.length})</h2>
						<div class="workly-grid">
							{#each searchFilteredLiveClasses as course}
								<LiveBatchCard {course} />
							{/each}
						</div>
					</div>
				{/if}

				{#if searchFilteredCourses.length > 0}
					<div class="mb-10">
						<h2 class="section-title">Self-Paced Courses ({searchFilteredCourses.length})</h2>
						<div class="workly-grid">
							{#each searchFilteredCourses as course}
								<CourseCard {course} />
							{/each}
						</div>
					</div>
				{/if}

				{#if searchFilteredCerts.length > 0}
					<div class="mb-10">
						<h2 class="section-title">Certifications ({searchFilteredCerts.length})</h2>
						<div class="workly-grid">
							{#each searchFilteredCerts as cert}
								<CertificationCard {cert} />
							{/each}
						</div>
					</div>
				{/if}

				{#if searchFilteredMentors.length > 0}
					<div class="mb-10">
						<h2 class="section-title">Mentors ({searchFilteredMentors.length})</h2>
						<div class="workly-grid">
							{#each searchFilteredMentors as mentor}
								<MentorCard {mentor} />
							{/each}
						</div>
					</div>
				{/if}

				{#if searchFilteredLiveClasses.length === 0 && searchFilteredCourses.length === 0 && searchFilteredCerts.length === 0 && searchFilteredMentors.length === 0}
					<EmptyState
						title="No matching learning experiences"
						description="We couldn't find any courses, exams, or mentors matching your query."
						actionText="Clear Search"
						actionHref="/catalog"
					/>
				{/if}
			</div>

		{:else}
			<!-- ── DEFAULT MODE: CURATED SECTIONS WITH HEADINGS & SCROLLS ──── -->

			<!-- 1. LIVE COHORTS & INTERACTIVE CLASSES SECTION -->
			{#if data.liveClasses && data.liveClasses.length > 0}
				<section class="catalog-section" id="live-classes">
					<div class="section-header">
						<div>
							<div class="section-kicker">
								<span class="dot-indicator dot-green"></span>
								<span>LIVE CLASSROOMS & COHORTS</span>
							</div>
							<h2 class="section-heading">Live Interactive Classes</h2>
							<p class="section-desc">Scheduled instructor-led cohorts with external live sessions (Meet/Zoom), group support, and restricted seat counts.</p>
						</div>

						<div class="section-actions">
							<a href="/live-classes" class="see-all-btn">
								<span>All live classes</span>
								<ArrowRight size={13} />
							</a>
							{#if data.liveClasses.length > 2}
								<div class="scroll-arrows">
									<button class="arrow-btn" onclick={() => scrollRow(liveClassesScrollEl, 'left')} aria-label="Scroll left">
										<ChevronLeft size={16} />
									</button>
									<button class="arrow-btn" onclick={() => scrollRow(liveClassesScrollEl, 'right')} aria-label="Scroll right">
										<ChevronRight size={16} />
									</button>
								</div>
							{/if}
						</div>
					</div>

					<div class="horizontal-scroll-container" bind:this={liveClassesScrollEl}>
						{#each data.liveClasses as course}
							<div class="scroll-card-item-wide">
								<LiveBatchCard {course} />
							</div>
						{/each}
					</div>
				</section>
			{/if}

			<!-- 2. POPULAR SELF-PACED COURSES SECTION -->
			<section class="catalog-section">
				<div class="section-header">
					<div>
						<div class="section-kicker">
							<span class="dot-indicator dot-blue"></span>
							<span>SELF-PACED CURRICULUM</span>
						</div>
						<h2 class="section-heading">Self-Paced Courses</h2>
						<p class="section-desc">Hands-on pathways and on-demand lessons designed for immediate technical application at your own pace.</p>
					</div>

					<div class="section-actions">
						<a href="/courses" class="see-all-btn">
							<span>All courses</span>
							<ArrowRight size={13} />
						</a>
						{#if data.courses.length > 3}
							<div class="scroll-arrows">
								<button class="arrow-btn" onclick={() => scrollRow(coursesScrollEl, 'left')} aria-label="Scroll left">
									<ChevronLeft size={16} />
								</button>
								<button class="arrow-btn" onclick={() => scrollRow(coursesScrollEl, 'right')} aria-label="Scroll right">
									<ChevronRight size={16} />
								</button>
							</div>
						{/if}
					</div>
				</div>

				{#if data.courses && data.courses.length > 0}
					<div class="horizontal-scroll-container" bind:this={coursesScrollEl}>
						{#each data.courses as course}
							<div class="scroll-card-item-wide">
								<CourseCard {course} />
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-tray">
						<BookOpen size={20} class="text-[var(--text-muted)]" />
						<p>Courses are being scheduled. Check back soon.</p>
					</div>
				{/if}
			</section>

			<!-- 2. VERIFIABLE CERTIFICATIONS SECTION -->
			<section class="catalog-section">
				<div class="section-header">
					<div>
						<div class="section-kicker">
							<span class="dot-indicator dot-purple"></span>
							<span>STANDARDS & ASSESSMENTS</span>
						</div>
						<h2 class="section-heading">Verifiable Certifications</h2>
						<p class="section-desc">Rigorous examinations yielding permanent, cryptographically provable credentials.</p>
					</div>

					<div class="section-actions">
						<a href="/certifications" class="see-all-btn">
							<span>All certifications</span>
							<ArrowRight size={13} />
						</a>
						{#if data.certifications.length > 3}
							<div class="scroll-arrows">
								<button class="arrow-btn" onclick={() => scrollRow(certsScrollEl, 'left')} aria-label="Scroll left">
									<ChevronLeft size={16} />
								</button>
								<button class="arrow-btn" onclick={() => scrollRow(certsScrollEl, 'right')} aria-label="Scroll right">
									<ChevronRight size={16} />
								</button>
							</div>
						{/if}
					</div>
				</div>

				{#if data.certifications && data.certifications.length > 0}
					<div class="horizontal-scroll-container" bind:this={certsScrollEl}>
						{#each data.certifications as cert}
							<div class="scroll-card-item">
								<CertificationCard {cert} />
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-tray">
						<Award size={20} class="text-[var(--text-muted)]" />
						<p>Certification exam cohorts are being finalized.</p>
					</div>
				{/if}
			</section>

			<!-- 3. EXPERT MENTORS SECTION -->
			<section class="catalog-section">
				<div class="section-header">
					<div>
						<div class="section-kicker">
							<span class="dot-indicator dot-green"></span>
							<span>1-ON-1 SESSIONS</span>
						</div>
						<h2 class="section-heading">Expert Practitioners & Mentors</h2>
						<p class="section-desc">Book dedicated 1-on-1 coaching, architecture reviews, and code guidance.</p>
					</div>

					<div class="section-actions">
						<a href="/mentoring" class="see-all-btn">
							<span>All mentors</span>
							<ArrowRight size={13} />
						</a>
						{#if data.mentors && data.mentors.length > 3}
							<div class="scroll-arrows">
								<button class="arrow-btn" onclick={() => scrollRow(mentorsScrollEl, 'left')} aria-label="Scroll left">
									<ChevronLeft size={16} />
								</button>
								<button class="arrow-btn" onclick={() => scrollRow(mentorsScrollEl, 'right')} aria-label="Scroll right">
									<ChevronRight size={16} />
								</button>
							</div>
						{/if}
					</div>
				</div>

				{#if data.mentors && data.mentors.length > 0}
					<div class="horizontal-scroll-container" bind:this={mentorsScrollEl}>
						{#each data.mentors as mentor}
							<div class="scroll-card-item">
								<MentorCard {mentor} />
							</div>
						{/each}
					</div>
				{:else}
					<div class="empty-tray">
						<Users size={20} class="text-[var(--text-muted)]" />
						<p>Practitioner calendar windows will open shortly.</p>
					</div>
				{/if}
			</section>

			<!-- 4. DIGITAL RESOURCES & TOOLKITS SECTION (IF IN DB) -->
			{#if data.resources && data.resources.length > 0}
				<section class="catalog-section">
					<div class="section-header">
						<div>
							<div class="section-kicker">
								<span class="dot-indicator dot-amber"></span>
								<span>TOOLKITS & GUIDES</span>
							</div>
							<h2 class="section-heading">Downloadable Resources</h2>
							<p class="section-desc">Reference manuals, cheatsheets, and practical tools.</p>
						</div>

						<div class="section-actions">
							<a href="/resources" class="see-all-btn">
								<span>All resources</span>
								<ArrowRight size={13} />
							</a>
						</div>
					</div>

					<div class="workly-grid">
						{#each data.resources as res}
							<div class="resource-card">
								<div class="res-icon">
									<Download size={18} />
								</div>
								<h3 class="res-title">{res.title}</h3>
								<p class="res-desc">{res.description || 'Verified downloadable reference document.'}</p>
								<a href={`/catalog/${res.id}`} class="btn-res-link">
									<span>View Resource</span>
									<ArrowRight size={13} />
								</a>
							</div>
						{/each}
					</div>
				</section>
			{/if}
		{/if}
	</main>
</div>

<style>
	.explore-page {
		min-height: 100vh;
		background: var(--bg, #f8fafc);
	}

	.explore-header {
		background: var(--bg-elevated, #ffffff);
		border-bottom: 1px solid var(--border);
		padding: 32px 0 20px 0;
	}

	.header-top-line {
		display: flex;
		flex-direction: column;
		gap: 20px;
		margin-bottom: 24px;
	}

	@media (min-width: 768px) {
		.header-top-line {
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

	.search-wrap {
		position: relative;
		width: 100%;
		max-width: 440px;
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

	.quick-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.quick-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary, #64748b);
		background: var(--bg, #f8fafc);
		border: 1px solid var(--border);
		padding: 5px 12px;
		border-radius: 9999px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.quick-link:hover {
		color: #6366f1;
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.05);
	}

	/* Main Canvas */
	.content-canvas {
		padding-top: 40px;
		padding-bottom: 80px;
	}

	.catalog-section {
		margin-bottom: 56px;
	}

	.section-header {
		display: flex;
		flex-direction: column;
		gap: 12px;
		margin-bottom: 20px;
	}

	@media (min-width: 640px) {
		.section-header {
			flex-direction: row;
			align-items: flex-end;
			justify-content: space-between;
		}
	}

	.section-kicker {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-muted, #94a3b8);
		margin-bottom: 4px;
	}

	.dot-indicator {
		width: 6px;
		height: 6px;
		border-radius: 50%;
	}

	.dot-blue { background: #3b82f6; }
	.dot-purple { background: #8b5cf6; }
	.dot-green { background: #10b981; }
	.dot-amber { background: #f59e0b; }

	.section-heading {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary, #0f172a);
		letter-spacing: -0.02em;
	}

	.section-desc {
		font-size: 0.875rem;
		color: var(--text-secondary, #64748b);
		margin-top: 2px;
	}

	.section-actions {
		display: flex;
		align-items: center;
		gap: 14px;
	}

	.see-all-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6366f1;
		text-decoration: none;
		transition: transform 0.1s ease;
	}

	.see-all-btn:hover {
		text-decoration: underline;
		transform: translateX(2px);
	}

	.scroll-arrows {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.arrow-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.arrow-btn:hover {
		background: var(--bg-subtle, #f1f5f9);
		border-color: #6366f1;
		color: #6366f1;
	}

	/* Horizontal Scroll Container (Smooth Snapping Row) */
	.horizontal-scroll-container {
		display: flex;
		gap: 20px;
		overflow-x: auto;
		scroll-snap-type: x mandatory;
		scroll-behavior: smooth;
		padding: 4px 2px 20px 2px;
		scrollbar-width: none;
		-ms-overflow-style: none;
	}

	.horizontal-scroll-container::-webkit-scrollbar {
		display: none;
	}

	.scroll-card-item {
		flex: 0 0 320px;
		scroll-snap-align: start;
	}

	.scroll-card-item-wide {
		flex: 0 0 460px;
		scroll-snap-align: start;
	}

	@media (max-width: 640px) {
		.scroll-card-item {
			flex: 0 0 280px;
		}

		.scroll-card-item-wide {
			flex: 0 0 310px;
		}
	}

	/* Workly Grid Layout */
	.workly-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(310px, 1fr));
		gap: 20px;
	}

	.empty-tray {
		padding: 40px;
		background: var(--bg-elevated, #ffffff);
		border: 1px dashed var(--border);
		border-radius: 12px;
		text-align: center;
		color: var(--text-secondary);
		font-size: 0.875rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 10px;
	}

	.resource-card {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 1px 3px rgba(0,0,0,0.04);
		transition: transform 0.2s ease, box-shadow 0.2s ease;
	}

	.resource-card:hover {
		transform: translateY(-3px);
		box-shadow: 0 10px 20px -4px rgba(0,0,0,0.08);
	}

	.res-icon {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 14px;
	}

	.res-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
	}

	.res-desc {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 16px;
		flex-grow: 1;
	}

	.btn-res-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: #6366f1;
		text-decoration: none;
	}

	.btn-res-link:hover {
		text-decoration: underline;
	}
</style>
