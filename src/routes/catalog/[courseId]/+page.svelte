<script lang="ts">
	import { PlaySquare, FileText, CheckSquare, Presentation, Star, Clock, Globe, Shield, User } from 'lucide-svelte';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';

	let { data } = $props();

	// Mock curriculum syllabus
	const modules = [
		{
			id: 'm1',
			title: 'Module 1: Threat Landscape',
			lessons: [
				{ id: 'l1', title: 'Introduction to Cybersecurity', type: 'video', duration: '12m', icon: PlaySquare },
				{ id: 'l2', title: 'Common Attack Vectors', type: 'reading', duration: '5m', icon: FileText },
				{ id: 'l3', title: 'Threat Actors and Motivations', type: 'slides', duration: '15m', icon: Presentation },
				{ id: 'l4', title: 'Module 1 Quiz', type: 'quiz', duration: '5 Qs', icon: CheckSquare },
			]
		},
		{
			id: 'm2',
			title: 'Module 2: Network Defense',
			lessons: [
				{ id: 'l5', title: 'Firewalls and IDS/IPS', type: 'video', duration: '18m', icon: PlaySquare },
				{ id: 'l6', title: 'Network Segmentation', type: 'reading', duration: '10m', icon: FileText },
			]
		}
	];

	function enroll() {
		if (data.alreadyOwned) {
			goto(`/learn/${data.asset.id}`);
		} else {
			goto(`/checkout/${data.asset.id}`);
		}
	}
</script>

<svelte:head>
	<title>{data.asset.title} — Launchpad</title>
</svelte:head>

<!-- Hero Section -->
<div class="course-hero">
	<div class="hero-bg" style="background-image: url({data.asset.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'})">
		<div class="hero-overlay"></div>
	</div>
	
	<div class="container hero-content">
		<div class="hero-main">
			<div class="breadcrumbs">
				<a href="/catalog">Catalog</a> &rsaquo; <span>{data.asset.title}</span>
			</div>
			<h1 class="hero-title">{data.asset.title}</h1>
			<p class="hero-desc">{data.asset.description || 'No description available.'}</p>
			
			<div class="hero-meta">
				<div class="meta-item rating">
					<Star size={16} class="star-icon" fill="currentColor" />
					<strong>5.0</strong>
					<span>(0 reviews)</span>
				</div>
				<div class="meta-item"><User size={16}/> {data.instructorName}</div>
				<div class="meta-item"><Clock size={16}/> {data.asset.metadata?.duration || 'Self-paced'}</div>
				<div class="meta-item"><Globe size={16}/> English</div>
			</div>
		</div>

		<!-- Enrollment Sticky Card (Desktop) -->
		<div class="enroll-card-wrap">
			<div class="enroll-card">
				<div class="card-img" style="background-image: url({data.asset.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=1200&q=80'})"></div>
				<div class="card-body">
					<div class="price-val">{data.asset.pricePaise === 0 ? 'Free' : `₹${(data.asset.pricePaise / 100).toFixed(2)}`}</div>
					<button class="enroll-btn" onclick={enroll}>
						{data.alreadyOwned ? 'Go to Course' : 'Enroll Now'}
					</button>
					<p class="guarantee">30-Day Money-Back Guarantee</p>
					
					<ul class="includes-list">
						<li><strong>This course includes:</strong></li>
						<li>4.5 hours on-demand video</li>
						<li>12 reading articles</li>
						<li>4 downloadable resources</li>
						<li>Certificate of completion</li>
						<li>Lifetime access</li>
					</ul>
				</div>
			</div>
		</div>
	</div>
</div>

<!-- Main Content -->
<div class="container page-body">
	<div class="content-left">
		<section class="syllabus-section">
			<h2>Course Syllabus</h2>
			<p class="section-sub">2 modules • 6 lessons • {data.asset.metadata?.duration || 'Self-paced'} total length</p>
			
			<div class="curriculum-list">
				{#each modules as mod}
					<div class="module-block">
						<div class="module-header">
							<h3>{mod.title}</h3>
							<span>{mod.lessons.length} lessons</span>
						</div>
						<div class="lesson-list">
							{#each mod.lessons as lesson}
								<div class="lesson-row">
									<div class="lesson-left">
										<lesson.icon size={16} class="lesson-icon" />
										<span class="lesson-title">{lesson.title}</span>
									</div>
									<div class="lesson-right">
										{#if lesson.type === 'video'}
											<span class="preview-tag">Preview</span>
										{/if}
										<span class="lesson-duration">{lesson.duration}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/each}
			</div>
		</section>

		<section class="instructor-section">
			<h2>Your Instructor</h2>
			<div class="instructor-card">
				<div class="inst-avatar">{data.instructorName[0]}</div>
				<div class="inst-info">
					<h3>{data.instructorName}</h3>
					<p class="inst-title">Instructor</p>
					<p class="inst-bio">An experienced instructor on the Launchpad platform.</p>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Hero */
	.course-hero {
		position: relative;
		background: #111827; /* Dark bg for contrast */
		color: #fff;
		padding: 4rem 0;
	}
	.hero-bg {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		background-size: cover;
		background-position: center;
		z-index: 1;
	}
	.hero-overlay {
		position: absolute;
		top: 0; left: 0; right: 0; bottom: 0;
		background: linear-gradient(to right, rgba(17,24,39,1) 0%, rgba(17,24,39,0.95) 40%, rgba(17,24,39,0.4) 100%);
	}

	.hero-content {
		position: relative;
		z-index: 2;
		display: flex;
		gap: 3rem;
	}

	.hero-main {
		flex: 1;
		max-width: 700px;
	}
	.breadcrumbs {
		font-size: 0.85rem;
		color: #9ca3af;
		margin-bottom: 1.5rem;
	}
	.breadcrumbs a {
		color: #d1d5db;
		text-decoration: none;
	}
	.breadcrumbs a:hover {
		color: #fff;
		text-decoration: underline;
	}
	.hero-title {
		font-size: 2.5rem;
		font-weight: 800;
		line-height: 1.2;
		margin-bottom: 1rem;
		letter-spacing: -0.02em;
	}
	.hero-desc {
		font-size: 1.1rem;
		color: #d1d5db;
		line-height: 1.6;
		margin-bottom: 2rem;
	}

	.hero-meta {
		display: flex;
		flex-wrap: wrap;
		gap: 1.5rem;
		font-size: 0.9rem;
	}
	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
		color: #e5e7eb;
	}
	.star-icon {
		color: #f59e0b;
	}
	.rating strong {
		color: #f59e0b;
	}

	/* Sticky Card */
	.enroll-card-wrap {
		width: 340px;
		flex-shrink: 0;
		position: relative;
	}
	.enroll-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
		box-shadow: 0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
		position: absolute;
		top: -2rem; /* Pulls it up into the hero */
		width: 100%;
		color: var(--text-primary);
	}
	.card-img {
		height: 180px;
		background-size: cover;
		background-position: center;
	}
	.card-body {
		padding: 1.5rem;
	}
	.price-val {
		font-size: 2rem;
		font-weight: 800;
		margin-bottom: 1rem;
	}
	.enroll-btn {
		width: 100%;
		background: var(--accent);
		color: #fff;
		border: none;
		padding: 14px;
		border-radius: 8px;
		font-size: 1.05rem;
		font-weight: 700;
		cursor: pointer;
		margin-bottom: 12px;
		transition: opacity 0.2s;
	}
	.enroll-btn:hover {
		opacity: 0.9;
	}
	.guarantee {
		text-align: center;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 1.5rem;
	}
	.includes-list {
		list-style: none;
		padding: 0;
		margin: 0;
		font-size: 0.9rem;
		color: var(--text-secondary);
	}
	.includes-list li {
		margin-bottom: 8px;
	}
	.includes-list li:first-child {
		margin-bottom: 12px;
		color: var(--text-primary);
	}

	/* Page Body */
	.page-body {
		padding: 4rem 1.5rem;
		display: flex;
		gap: 3rem;
	}
	.content-left {
		flex: 1;
		max-width: 700px;
	}

	.syllabus-section {
		margin-bottom: 4rem;
	}
	.syllabus-section h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.section-sub {
		font-size: 0.95rem;
		color: var(--text-muted);
		margin-bottom: 2rem;
	}

	.curriculum-list {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.module-block {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.module-header {
		padding: 1.25rem 1.5rem;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.module-header h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.module-header span {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	
	.lesson-list {
		display: flex;
		flex-direction: column;
	}
	.lesson-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.lesson-row:last-child {
		border-bottom: none;
	}
	.lesson-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.lesson-icon {
		color: var(--accent);
	}
	.lesson-title {
		font-size: 0.95rem;
		color: var(--text-secondary);
	}
	.lesson-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.preview-tag {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--accent);
		text-transform: uppercase;
		text-decoration: underline;
		cursor: pointer;
	}
	.lesson-duration {
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.instructor-section h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
	}
	.instructor-card {
		display: flex;
		gap: 1.5rem;
	}
	.inst-avatar {
		width: 80px;
		height: 80px;
		border-radius: 50%;
		background: var(--accent-muted);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 2rem;
		font-weight: 700;
		flex-shrink: 0;
	}
	.inst-info h3 {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
		text-decoration: underline;
		cursor: pointer;
	}
	.inst-title {
		font-size: 0.95rem;
		color: var(--text-muted);
		margin-bottom: 12px;
	}
	.inst-bio {
		font-size: 0.95rem;
		color: var(--text-secondary);
		line-height: 1.6;
	}

	@media (max-width: 900px) {
		.hero-content {
			flex-direction: column;
		}
		.enroll-card {
			position: relative;
			top: 0;
			margin-top: 2rem;
		}
		.enroll-card-wrap {
			width: 100%;
		}
		.page-body {
			padding-top: 2rem;
		}
	}
</style>
