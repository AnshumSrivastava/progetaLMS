<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, BookOpen, Download, FileBadge2, Clock, ArrowRight } from 'lucide-svelte';
	
	let { data } = $props();
	
	let activeTab = $state('courses');

	const categories = ['All', 'Network Security', 'Cloud Security', 'Penetration Testing', 'Compliance'];
	const levels = ['Beginner', 'Intermediate', 'Advanced'];
</script>

<svelte:head>
	<title>Catalog — {APP_NAME}</title>
</svelte:head>

<div class="catalog-container">
	<!-- Top Bar / Toolbar Header -->
	<header class="catalog-toolbar">
		<div class="toolbar-title">
			<h1>Catalog</h1>
			<p class="subtitle">Explore courses, downloadable assets, and certification exams.</p>
		</div>

		<form method="GET" action="/catalog" class="search-form">
			<Search size={15} class="search-icon" />
			<input type="text" name="q" value={data.search} placeholder="Search catalog..." />
			{#if data.search}
				<a href="/catalog" class="clear-search">Clear</a>
			{/if}
		</form>
	</header>

	<!-- Horizontal Underline Tab Strip -->
	<nav class="catalog-tabs">
		<button class="tab-btn" class:active={activeTab === 'courses'} onclick={() => activeTab = 'courses'}>
			<span>Courses</span>
		</button>
		<button class="tab-btn" class:active={activeTab === 'resources'} onclick={() => activeTab = 'resources'}>
			<span>Resources</span>
		</button>
		<button class="tab-btn" class:active={activeTab === 'certs'} onclick={() => activeTab = 'certs'}>
			<span>Certifications</span>
		</button>
	</nav>

	<!-- Controls & Inline Filters (Courses Tab) -->
	{#if activeTab === 'courses'}
		<div class="filter-bar">
			<span class="results-count">{data.courses.length} courses</span>
			<form method="GET" action="/catalog" class="inline-filters">
				{#if data.search}
					<input type="hidden" name="q" value={data.search} />
				{/if}
				<select name="category" class="select-filter" value={data.category || ""} onchange={(e) => e.currentTarget.form.submit()}>
					<option value="">All Categories</option>
					{#each categories as cat}
						{#if cat !== 'All'}<option value={cat}>{cat}</option>{/if}
					{/each}
				</select>
				<select name="level" class="select-filter" value={data.level || ""} onchange={(e) => e.currentTarget.form.submit()}>
					<option value="">All Levels</option>
					{#each levels as lvl}
						<option value={lvl}>{lvl}</option>
					{/each}
				</select>
			</form>
		</div>
	{/if}

	<!-- Main Content Area -->
	<main class="catalog-content">
		{#if activeTab === 'courses'}
			<div class="course-grid">
				{#each data.courses as course, i}
					<a href={`/catalog/${course.id}`} class="course-card">
						<div class="thumbnail-wrapper">
							<img src={course.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'} alt={course.title} fetchpriority={i === 0 ? "high" : "auto"} loading={i === 0 ? "eager" : "lazy"} />
							<span class="badge-level">{course.metadata?.level || 'Beginner'}</span>
						</div>
						<div class="card-body">
							<h3>{course.title}</h3>
							<p class="instructor">{course.metadata?.instructor || 'Instructor'}</p>
							<div class="card-footer">
								<span class="price">{course.pricePaise === 0 ? 'Free' : `₹${(course.pricePaise / 100).toFixed(2)}`}</span>
								<div class="duration">
									<Clock size={12} />
									<span>{course.metadata?.duration || 'Self-paced'}</span>
								</div>
							</div>
						</div>
					</a>
				{:else}
					<div class="empty-box">
						<BookOpen size={32} class="empty-icon" />
						<p>No courses match your criteria.</p>
					</div>
				{/each}
			</div>

		{:else if activeTab === 'resources'}
			<div class="row-list">
				{#each data.resources as item}
					<div class="list-row">
						<div class="row-icon">
							<Download size={16} />
						</div>
						<div class="row-main">
							<h4>{item.title}</h4>
							<span class="row-sub">{item.type === 'pdf' ? 'PDF Document' : 'Resource Asset'}</span>
						</div>
						<div class="row-side">
							<span class="price-tag">{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(2)}`}</span>
							<a href={`/checkout/${item.id}`} class="action-link">Get Resource</a>
						</div>
					</div>
				{:else}
					<div class="empty-box">
						<Download size={32} class="empty-icon" />
						<p>No downloadable resources found.</p>
					</div>
				{/each}
			</div>

		{:else}
			<div class="row-list">
				{#each data.certifications as item}
					<div class="list-row">
						<div class="row-icon">
							<FileBadge2 size={16} />
						</div>
						<div class="row-main">
							<h4>{item.title}</h4>
							<span class="row-sub">{item.metadata?.questions || 0} Questions • {item.metadata?.duration || '60 Mins'}</span>
						</div>
						<div class="row-side">
							<span class="price-tag">{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(2)}`}</span>
							<a href={`/certifications/${item.id}`} class="action-link">View Exam</a>
						</div>
					</div>
				{:else}
					<div class="empty-box">
						<FileBadge2 size={32} class="empty-icon" />
						<p>No certification exams found.</p>
					</div>
				{/each}
			</div>
		{/if}
	</main>
</div>

<style>
	.catalog-container {
		max-width: 1040px;
		margin: 0 auto;
		padding: 2rem 1.5rem 4rem;
	}

	.catalog-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		gap: 1rem;
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
	}

	.toolbar-title h1 {
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.toolbar-title .subtitle {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.search-form {
		position: relative;
		width: 280px;
	}

	.search-icon {
		position: absolute;
		left: 10px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
		pointer-events: none;
	}

	.search-form input {
		width: 100%;
		height: 34px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 0 10px 0 32px;
		font-size: 0.8125rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color var(--t-fast);
	}

	.search-form input:focus {
		border-color: var(--border-strong);
	}

	.clear-search {
		position: absolute;
		right: 10px;
		top: 50%;
		transform: translateY(-50%);
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.catalog-tabs {
		display: flex;
		gap: 20px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.25rem;
	}

	.tab-btn {
		background: none;
		border: none;
		padding: 8px 0;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		position: relative;
		transition: color var(--t-fast);
	}

	.tab-btn:hover {
		color: var(--text-primary);
	}

	.tab-btn.active {
		color: var(--text-primary);
		font-weight: 600;
	}

	.tab-btn.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--text-primary);
	}

	.filter-bar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.25rem;
	}

	.results-count {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.inline-filters {
		display: flex;
		gap: 8px;
	}

	.select-filter {
		height: 30px;
		padding: 0 8px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: var(--text-primary);
		cursor: pointer;
	}

	.course-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
		gap: 1.25rem;
	}

	.course-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		transition: border-color var(--t-fast);
		display: flex;
		flex-direction: column;
	}

	.course-card:hover {
		border-color: var(--border-strong);
	}

	.thumbnail-wrapper {
		position: relative;
		width: 100%;
		height: 130px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.thumbnail-wrapper img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.badge-level {
		position: absolute;
		bottom: 8px;
		right: 8px;
		background: rgba(9, 9, 11, 0.8);
		color: #ffffff;
		padding: 2px 6px;
		border-radius: var(--radius-sm);
		font-size: 0.7rem;
		font-weight: 500;
	}

	.card-body {
		padding: 12px;
		display: flex;
		flex-direction: column;
		flex: 1;
	}

	.card-body h3 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin-bottom: 4px;
		line-height: 1.3;
	}

	.instructor {
		font-size: 0.78125rem;
		color: var(--text-muted);
		margin-bottom: 12px;
	}

	.card-footer {
		margin-top: auto;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 8px;
		border-top: 1px solid var(--border-subtle);
	}

	.price {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.duration {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.row-list {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		background: var(--bg);
	}

	.list-row {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-subtle);
		transition: background var(--t-fast);
		gap: 14px;
	}

	.list-row:last-child {
		border-bottom: none;
	}

	.list-row:hover {
		background: var(--bg-subtle);
	}

	.row-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.row-main {
		flex: 1;
	}

	.row-main h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.row-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.row-side {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.price-tag {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.action-link {
		padding: 5px 10px;
		background: var(--text-primary);
		color: var(--bg);
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		font-weight: 500;
		text-decoration: none;
	}

	.empty-box {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}
</style>
