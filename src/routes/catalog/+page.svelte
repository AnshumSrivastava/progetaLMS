<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, Filter, BookOpen, Calendar, FileBadge2, Download, Star, Clock } from 'lucide-svelte';
	
	let { data } = $props();
	
	let activeTab = $state('courses');

	const categories = ['All', 'Network Security', 'Cloud Security', 'Penetration Testing', 'Compliance'];
	const levels = ['Beginner', 'Intermediate', 'Advanced'];
</script>

<svelte:head>
	<title>Catalog — {APP_NAME}</title>
</svelte:head>

<div class="catalog-page">
	<!-- Ultra Minimal Hero -->
	<div class="catalog-header-minimal">
		<div class="container">
			<h1 class="page-title">Discover Your Next Skill</h1>
			<p class="page-subtitle">Browse world-class courses, resources, events, and certifications.</p>
			
			<form method="GET" action="/catalog" class="search-wrapper">
				<Search size={20} class="search-icon" />
				<input type="text" name="q" value={data.search} placeholder="What do you want to learn today?" />
				{#if data.search}
					<a href="/catalog" class="clear-search" style="margin-left: auto; text-decoration: none; color: var(--text-muted); font-size: 14px; font-weight: 500;">Clear</a>
				{/if}
			</form>

			<!-- Horizontal Pill Navigation -->
			<div class="pill-nav">
				<button class="pill" class:active={activeTab === 'courses'} onclick={() => activeTab = 'courses'}>
					<BookOpen size={16} /> Courses
				</button>
				<button class="pill" class:active={activeTab === 'resources'} onclick={() => activeTab = 'resources'}>
					<Download size={16} /> Resources
				</button>
				<button class="pill" class:active={activeTab === 'certs'} onclick={() => activeTab = 'certs'}>
					<FileBadge2 size={16} /> Certifications
				</button>
			</div>
		</div>
	</div>

	<div class="container catalog-body">
		<!-- Main Content (Full Width) -->
		<main class="catalog-main">
			
			<div class="results-header">
				<h2>
					{#if activeTab === 'courses'}All Courses
					{:else if activeTab === 'resources'}Digital Resources
					{:else}Certification Exams{/if}
				</h2>
				
				{#if activeTab === 'courses'}
					<form method="GET" action="/catalog" class="inline-filters">
						{#if data.search}
							<input type="hidden" name="q" value={data.search} />
						{/if}
						<select name="category" class="filter-dropdown" value={data.category || ""} onchange={(e) => e.currentTarget.form.submit()}>
							<option value="">All Categories</option>
							{#each categories as cat}
								{#if cat !== 'All'}<option value={cat}>{cat}</option>{/if}
							{/each}
						</select>
						<select name="level" class="filter-dropdown" value={data.level || ""} onchange={(e) => e.currentTarget.form.submit()}>
							<option value="">All Levels</option>
							{#each levels as lvl}
								<option value={lvl}>{lvl}</option>
							{/each}
						</select>
					</form>
				{/if}
			</div>

			<!-- Grid -->
			<div class="item-grid" class:course-grid={activeTab === 'courses'}>
				{#if activeTab === 'courses'}
					{#each data.courses as course}
						<a href={`/catalog/${course.id}`} class="course-card">
							<div class="course-img" style="background-image: url({course.thumbnail || 'https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&w=600&q=80'})">
								<span class="level-badge">{course.metadata?.level || 'Beginner'}</span>
							</div>
							<div class="course-content">
								<h3 class="course-title">{course.title}</h3>
								<p class="course-author">{course.metadata?.instructor || 'Instructor'}</p>
								<div class="course-meta">
									<div class="rating">
										<Star size={14} class="star-icon" fill="currentColor" />
										<strong>5.0</strong>
										<span>(0)</span>
									</div>
									<div class="duration">
										<Clock size={14} /> {course.metadata?.duration || 'Self-paced'}
									</div>
								</div>
								<div class="course-footer">
									<span class="course-price">{course.pricePaise === 0 ? 'Free' : `₹${(course.pricePaise / 100).toFixed(2)}`}</span>
								</div>
							</div>
						</a>
					{:else}
						<div class="empty-state" style="padding: 4rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px;">
							<BookOpen size={48} style="opacity: 0.5;" />
							<h3 style="color: var(--text-primary); font-size: 1.25rem;">No courses found</h3>
							<p>Try adjusting your search or filters.</p>
						</div>
					{/each}
				{:else if activeTab === 'resources'}
					{#each data.resources as item}
						<div class="generic-card">
							<div class="icon-wrap"><Download size={24} /></div>
							<div class="generic-info">
								<h3>{item.title}</h3>
								<p>{item.type === 'pdf' ? 'PDF Template' : 'Resource'}</p>
							</div>
							<div class="generic-action">
								<span class="price">{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(2)}`}</span>
								<a href={`/checkout/${item.id}`} class="buy-btn" style="text-decoration:none;">Get Resource</a>
							</div>
						</div>
					{:else}
						<div class="empty-state" style="padding: 4rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px;">
							<Download size={48} style="opacity: 0.5;" />
							<h3 style="color: var(--text-primary); font-size: 1.25rem;">No resources found</h3>
							<p>Try adjusting your search or filters.</p>
						</div>
					{/each}
				{:else}
					{#each data.certifications as item}
						<div class="generic-card">
							<div class="icon-wrap"><FileBadge2 size={24} /></div>
							<div class="generic-info">
								<h3>{item.title}</h3>
								<p>{item.metadata?.questions || 0} Questions • {item.metadata?.duration || '60 Mins'}</p>
							</div>
							<div class="generic-action">
								<span class="price">{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(2)}`}</span>
								<a href={`/certifications/${item.id}`} class="buy-btn" style="text-decoration:none;">View Details</a>
							</div>
						</div>
					{:else}
						<div class="empty-state" style="padding: 4rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px;">
							<FileBadge2 size={48} style="opacity: 0.5;" />
							<h3 style="color: var(--text-primary); font-size: 1.25rem;">No certifications found</h3>
							<p>Try adjusting your search or filters.</p>
						</div>
					{/each}
				{/if}
			</div>
		</main>
	</div>
</div>

<style>
	.catalog-page {
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}
	.container {
		max-width: 1280px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	/* Ultra Minimal Hero */
	.catalog-header-minimal {
		background: transparent;
		padding: 4rem 0 2rem;
		text-align: center;
		border-bottom: 1px solid var(--border-subtle);
	}
	.page-title {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.03em;
		margin-bottom: 8px;
	}
	.page-subtitle {
		font-size: 1.1rem;
		color: var(--text-secondary);
		margin-bottom: 2.5rem;
	}

	.search-wrapper {
		max-width: 600px;
		margin: 0 auto 2rem;
		position: relative;
	}
	.search-icon {
		position: absolute;
		left: 16px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}
	.search-wrapper input {
		width: 100%;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 16px 16px 16px 48px;
		font-size: 1.05rem;
		color: var(--text-primary);
		transition: all 0.2s;
	}
	.search-wrapper input:focus {
		outline: none;
		border-color: var(--accent);
		background: var(--bg);
		box-shadow: 0 0 0 4px var(--accent-muted);
	}

	/* Horizontal Pill Nav */
	.pill-nav {
		display: flex;
		justify-content: center;
		gap: 12px;
		flex-wrap: wrap;
	}
	.pill {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 999px;
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.2s;
	}
	.pill:hover {
		border-color: var(--border-strong);
		color: var(--text-primary);
	}
	.pill.active {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
	}

	/* Layout */
	.catalog-body {
		padding: 3rem 1.5rem 5rem;
	}
	.catalog-main {
		width: 100%;
	}
	
	.results-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		flex-wrap: wrap;
		gap: 1rem;
		margin-bottom: 2rem;
	}
	.results-header h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.inline-filters {
		display: flex;
		gap: 12px;
	}
	.filter-dropdown {
		padding: 8px 36px 8px 16px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		appearance: none;
		background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23666%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
		background-repeat: no-repeat;
		background-position: right 12px top 50%;
		background-size: 10px auto;
	}
	.filter-dropdown:focus {
		outline: none;
		border-color: var(--accent);
	}

	/* Cards & Grids (Full Width) */
	.item-grid {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.item-grid.course-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 2rem;
	}

	.course-card {
		display: flex;
		flex-direction: column;
		background: var(--bg);
		border: none;
		box-shadow: var(--shadow-sm);
		border-radius: 12px;
		overflow: hidden;
		text-decoration: none;
		transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.course-card:hover {
		transform: translateY(-4px);
		box-shadow: var(--shadow-lg);
	}
	.course-card:hover .course-img {
		transform: scale(1.05);
	}
	.course-img {
		height: 160px;
		background-size: cover;
		background-position: center;
		position: relative;
		transition: transform 0.5s cubic-bezier(0.4, 0, 0.2, 1);
	}
	.level-badge {
		position: absolute;
		bottom: 12px;
		right: 12px;
		background: rgba(0,0,0,0.7);
		backdrop-filter: blur(4px);
		color: #fff;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.course-content {
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		flex: 1;
	}
	.course-title {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 6px;
		line-height: 1.3;
	}
	.course-author {
		font-size: 0.85rem;
		color: var(--text-secondary);
		margin-bottom: 12px;
	}
	.course-meta {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 1rem;
		margin-top: auto;
	}
	.rating {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.85rem;
	}
	.star-icon {
		color: #f59e0b;
	}
	.rating strong {
		color: var(--text-primary);
	}
	.rating span {
		color: var(--text-muted);
	}
	.duration {
		display: flex;
		align-items: center;
		gap: 4px;
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.course-footer {
		padding-top: 1rem;
		border-top: 1px solid var(--border-subtle);
	}
	.course-price {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Generic List Cards */
	.generic-card {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		background: var(--bg-subtle);
		border: none;
		box-shadow: var(--shadow-sm);
		border-radius: 12px;
		gap: 1.5rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.generic-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	.icon-wrap {
		width: 56px;
		height: 56px;
		background: var(--bg-elevated);
		border-radius: 12px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
	}
	.generic-info {
		flex: 1;
	}
	.generic-info h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.generic-info p {
		font-size: 0.9rem;
		color: var(--text-muted);
	}
	.generic-action {
		display: flex;
		align-items: center;
		gap: 1.5rem;
	}
	.generic-action .price {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.buy-btn {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 8px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.buy-btn:hover {
		opacity: 0.9;
	}

	@media (max-width: 600px) {
		.generic-card {
			flex-direction: column;
			align-items: flex-start;
			gap: 1rem;
		}
		.generic-action {
			width: 100%;
			justify-content: space-between;
		}
		.inline-filters {
			width: 100%;
		}
		.filter-dropdown {
			flex: 1;
		}
	}
</style>
