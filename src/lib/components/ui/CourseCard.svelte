<script lang="ts">
	import { ChevronRight, ArrowRight, Clock, Award, BookOpen } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const category = $derived(course.metadata?.category || 'CORE CURRICULUM');
	const level = $derived((course.metadata?.level || 'Intermediate').toUpperCase());
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '8 Hours');
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`);
	
	// Chapter / focus topic derived from metadata or title
	const chapterLabel = $derived(course.metadata?.chapter || (course.metadata?.category ? `${course.metadata.category}` : 'MODULE 1').toUpperCase());
	
	// Key topic highlight for the right panel header
	const topicHighlight = $derived(
		course.metadata?.topic ||
		course.metadata?.subtitle ||
		(course.title.includes('&') ? course.title.split('&')[1].trim() : course.title.split(':')[1]?.trim() || 'Core Applied Concepts')
	);

	// Challenges / module count
	const challengesTotal = $derived(course.metadata?.challenges || course.metadata?.modules || 8);
	const challengesDone = $derived(course.metadata?.completedChallenges || Math.min(5, challengesTotal - 2));
</script>

<article class="course-banner-card">
	<!-- ── LEFT PANEL (Deep Indigo / Violet) ──────────────── -->
	<div class="left-panel">
		{#if course.deliveryFormat === 'live_batch'}
			<div class="panel-kicker live-kicker">
				<span class="live-dot-sm"></span> LIVE BATCH
			</div>
		{:else}
			<div class="panel-kicker">SELF-PACED</div>
		{/if}
		
		<h3 class="course-title">
			<a href={`/catalog/${course.id}`} class="title-link">
				{course.title}
			</a>
		</h3>

		<a href={`/catalog/${course.id}`} class="view-chapters-link">
			<span>{course.deliveryFormat === 'live_batch' ? 'View batch schedule' : 'View all chapters'}</span>
			<ChevronRight size={14} />
		</a>
	</div>

	<!-- ── RIGHT PANEL (White / Light with Chapter, Progress & Action) ──── -->
	<div class="right-panel">
		<!-- Top Row: Chapter Kicker + Progress Bar / Challenges -->
		<div class="right-top-row">
			<span class="chapter-kicker">{chapterLabel}</span>

			<div class="progress-block">
				<div class="progress-track" aria-hidden="true">
					<div class="progress-fill" style="width: {(challengesDone / challengesTotal) * 100}%;"></div>
				</div>
				<span class="challenges-text">{challengesDone}/{challengesTotal} Challenges</span>
			</div>
		</div>

		<!-- Main Center: Topic Headline -->
		<div class="topic-content">
			<h4 class="topic-title">{topicHighlight}</h4>
			<p class="course-summary">
				{course.description || 'Hands-on technical modules with browser-based labs and practical mastery challenges.'}
			</p>
		</div>

		<!-- Bottom Row: Price / Level Meta & Continue Pill Button -->
		<div class="right-bottom-row">
			<div class="meta-pills">
				<span class="price-chip" class:is-free={free}>{priceFormatted}</span>
				<span class="level-pill">{level}</span>
			</div>

			<a href={`/catalog/${course.id}`} class="btn-continue">
				<span>{course.deliveryFormat === 'live_batch' ? 'Enroll Batch' : 'Continue'}</span>
			</a>
		</div>
	</div>
</article>

<style>
	.course-banner-card {
		display: grid;
		grid-template-columns: minmax(210px, 34%) 1fr;
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 4px 20px -4px rgba(0, 0, 0, 0.05), 0 2px 6px -1px rgba(0, 0, 0, 0.02);
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
		min-height: 190px;
		width: 100%;
	}

	.course-banner-card:hover {
		transform: translateY(-3px);
		border-color: rgba(36, 30, 78, 0.25);
		box-shadow: 0 16px 32px -6px rgba(28, 22, 65, 0.12), 0 6px 12px -2px rgba(28, 22, 65, 0.04);
	}

	:global([data-theme="dark"]) .course-banner-card:hover {
		border-color: rgba(147, 133, 230, 0.3);
		box-shadow: 0 16px 32px -6px rgba(0, 0, 0, 0.5);
	}

	/* ── LEFT PANEL ─────────────────────────────────────── */
	.left-panel {
		background: #201948;
		color: #ffffff;
		padding: 24px 22px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		position: relative;
	}

	:global([data-theme="dark"]) .left-panel {
		background: #191338;
	}

	.panel-kicker {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.12em;
		color: #9d95c9;
		text-transform: uppercase;
		margin-bottom: 8px;
	}

	.panel-kicker.live-kicker {
		color: #34d399;
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.live-dot-sm {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 9999px;
		box-shadow: 0 0 6px #10b981;
		animation: pulse-sm 1.5s infinite;
	}

	@keyframes pulse-sm {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.85); }
	}

	.course-title {
		font-size: clamp(1.2rem, 1.8vw, 1.45rem);
		font-weight: 700;
		line-height: 1.25;
		letter-spacing: -0.02em;
		margin-bottom: auto;
		padding-bottom: 16px;
	}

	.title-link {
		color: #ffffff;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.title-link:hover {
		color: #c4bbf0;
	}

	.view-chapters-link {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: #a89fd6;
		text-decoration: none;
		margin-top: 14px;
		transition: color 0.15s ease, transform 0.1s ease;
	}

	.view-chapters-link:hover {
		color: #ffffff;
		transform: translateX(2px);
	}

	/* ── RIGHT PANEL ────────────────────────────────────── */
	.right-panel {
		background: var(--bg-elevated, #ffffff);
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	:global([data-theme="dark"]) .right-panel {
		background: #12111d;
	}

	.right-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 12px;
	}

	.chapter-kicker {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: var(--text-secondary, #64748b);
		text-transform: uppercase;
	}

	.progress-block {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 4px;
	}

	.progress-track {
		width: 100px;
		height: 4px;
		background: var(--border, #e2e8f0);
		border-radius: 9999px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: #201948;
		border-radius: 9999px;
		transition: width 0.3s ease;
	}

	:global([data-theme="dark"]) .progress-fill {
		background: #8b7ef8;
	}

	.challenges-text {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-muted, #94a3b8);
		letter-spacing: 0.02em;
	}

	/* Center Content */
	.topic-content {
		margin-bottom: 14px;
		flex-grow: 1;
	}

	.topic-title {
		font-size: clamp(1.15rem, 1.6vw, 1.35rem);
		font-weight: 700;
		color: #1e1b4b;
		letter-spacing: -0.02em;
		line-height: 1.3;
		margin-bottom: 6px;
	}

	:global([data-theme="dark"]) .topic-title {
		color: #e2e8f0;
	}

	.course-summary {
		font-size: 0.8125rem;
		color: var(--text-secondary, #64748b);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	/* Bottom Row */
	.right-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 10px;
		margin-top: auto;
	}

	.meta-pills {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.price-chip {
		font-size: 0.75rem;
		font-weight: 700;
		padding: 3px 9px;
		border-radius: 6px;
		background: rgba(245, 158, 11, 0.1);
		color: #b45309;
		border: 1px solid rgba(245, 158, 11, 0.2);
	}

	.price-chip.is-free {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
		border-color: rgba(16, 185, 129, 0.2);
	}

	:global([data-theme="dark"]) .price-chip.is-free {
		color: #34d399;
	}

	.level-pill {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-muted, #94a3b8);
	}

	.btn-continue {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		padding: 7px 22px;
		border-radius: 9999px;
		background: #201948;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		letter-spacing: -0.01em;
		box-shadow: 0 4px 12px -2px rgba(32, 25, 72, 0.35);
		transition: background 0.15s ease, transform 0.1s ease, box-shadow 0.15s ease;
	}

	:global([data-theme="dark"]) .btn-continue {
		background: #6352c7;
		box-shadow: 0 4px 12px -2px rgba(99, 82, 199, 0.4);
	}

	.btn-continue:hover {
		background: #151030;
		transform: scale(1.02);
		box-shadow: 0 6px 16px -2px rgba(32, 25, 72, 0.45);
	}

	:global([data-theme="dark"]) .btn-continue:hover {
		background: #5242b5;
	}

	/* Responsive Stacking for small viewports */
	@media (max-width: 639px) {
		.course-banner-card {
			grid-template-columns: 1fr;
		}

		.left-panel {
			border-radius: 18px 18px 0 0;
			padding: 20px;
		}

		.right-panel {
			border-radius: 0 0 18px 18px;
			padding: 18px 20px;
		}
	}
</style>
