<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { authClient } from '$lib/auth.client';
	import { goto } from '$app/navigation';
	import { BookOpen, FileBadge2, Calendar, Download, Play, Trophy, Clock, ArrowRight, Plus } from 'lucide-svelte';

	let { data } = $props();

	// Student Dashboard state
	let activeTab = $state('courses');
</script>

<svelte:head>
	<title>Student Dashboard — {APP_NAME}</title>
</svelte:head>

<!-- ── DASHBOARD LAYOUT ── -->
<div class="dash-layout">
	
	<!-- Sidebar (Desktop) -->
	<aside class="dash-sidebar">
		<div class="user-profile">
			<div class="avatar">{data.user.name[0]}</div>
			<div class="user-details">
				<strong>{data.user.name}</strong>
				<span>Student</span>
			</div>
		</div>

		<nav class="sidebar-nav">
			<button class="nav-item" class:active={activeTab === 'courses'} onclick={() => activeTab = 'courses'}>
				<BookOpen size={18} /> <span>My Courses</span>
			</button>
			<button class="nav-item" class:active={activeTab === 'resources'} onclick={() => activeTab = 'resources'}>
				<Download size={18} /> <span>My Resources</span>
			</button>

			<button class="nav-item" class:active={activeTab === 'certs'} onclick={() => activeTab = 'certs'}>
				<FileBadge2 size={18} /> <span>My Certifications</span>
			</button>
		</nav>
	</aside>

	<!-- Main Content Area -->
	<main class="dash-main">
		
		<div class="dash-header">
			<div class="welcome-text">
				<h2>Welcome back, {data.user.name}!</h2>
				<p>Ready to continue your learning journey?</p>
			</div>
		</div>

		<div class="dash-content-area">
			{#if activeTab === 'courses'}
				<!-- COURSES TAB -->
				<div class="section-header">
					<h3>Continue Learning</h3>
				</div>
				
				<div class="course-grid">
					{#each data.ownedCourses as course}
						<div class="course-card">
							<div class="course-info">
								<h4>{course.title}</h4>
								<div class="progress-wrap">
									<div class="progress-bar">
										<div class="progress-fill" style="width: 0%"></div>
									</div>
									<span class="progress-text">0% Complete</span>
								</div>
							</div>
							<div class="course-action">
								<div class="next-up">
									<span class="label">Up Next:</span>
									<span class="title">
										Start Learning
									</span>
								</div>
								<button class="resume-btn" onclick={() => goto(`/learn/${course.id}`)}>
									Resume <ArrowRight size={14} />
								</button>
							</div>
						</div>
					{:else}
						<div class="empty-state" style="padding: 4rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-subtle);">
							<BookOpen size={48} style="opacity: 0.5;" />
							<h3 style="color: var(--text-primary); font-size: 1.25rem;">No courses yet</h3>
							<p>Browse the catalog to find your first course.</p>
							<a href="/catalog" class="action-btn" style="text-decoration:none; padding: 10px 16px; background: var(--text-primary); color: var(--bg); border-radius: 6px;">Browse Catalog →</a>
						</div>
					{/each}

					{#if data.ownedCourses.length > 0}
						<!-- Browse More Card -->
						<a href="/catalog" class="browse-card">
							<div class="browse-icon"><Plus size={24} /></div>
							<h4>Browse Courses</h4>
							<p>Discover new skills in the catalog</p>
						</a>
					{/if}
				</div>

			{:else if activeTab === 'resources'}
				<!-- RESOURCES TAB -->
				<div class="section-header">
					<h3>My Digital Resources</h3>
				</div>
				
				<div class="generic-grid">
					{#each data.ownedResources as item}
						<div class="item-card">
							<div class="icon-wrap"><Download size={24} /></div>
							<div class="item-info">
								<h4>{item.title}</h4>
								<p>{item.type === 'pdf' ? 'PDF' : item.type} • <span class="tag">Owned</span></p>
							</div>
							<a href={`/learn/${item.id}`} class="action-btn outline" style="text-decoration:none;">View</a>
						</div>
					{:else}
						<div class="empty-state" style="padding: 4rem; text-align: center; color: var(--text-muted); grid-column: 1 / -1; display: flex; flex-direction: column; align-items: center; gap: 12px; border: 1px solid var(--border); border-radius: 8px; background: var(--bg-subtle);">
							<Download size={48} style="opacity: 0.5;" />
							<h3 style="color: var(--text-primary); font-size: 1.25rem;">No resources yet</h3>
							<p>Browse the catalog to find digital resources.</p>
							<a href="/catalog" class="action-btn" style="text-decoration:none; padding: 10px 16px; background: var(--text-primary); color: var(--bg); border-radius: 6px;">Browse Catalog →</a>
						</div>
					{/each}

					{#if data.ownedResources.length > 0}
						<a href="/catalog" class="browse-card small">
							<div class="browse-icon"><Plus size={20} /></div>
							<h4>Find More Resources</h4>
						</a>
					{/if}
				</div>



			{:else if activeTab === 'certs'}
				<!-- CERTIFICATIONS TAB -->
				<div class="section-header">
					<h3>My Certifications</h3>
				</div>
				
				<div class="generic-grid">
					{#each data.ownedCerts as item}
						<div class="item-card">
							<div class="icon-wrap">
								<FileBadge2 size={24} />
							</div>
							<div class="item-info">
								<h4>{item.title}</h4>
								<p>Status: <strong>Available</strong> 
								</p>
							</div>
							<a href={`/learn/${item.id}`} class="action-btn" style="text-decoration:none;">Take Exam</a>
						</div>
					{/each}

					<a href="/catalog" class="browse-card small">
						<div class="browse-icon"><Plus size={20} /></div>
						<h4>Browse Certifications</h4>
					</a>
				</div>
			{/if}
		</div>
	</main>
</div>

<!-- Mobile Horizontal Tabs (Fallback for mobile screens before MobileTabBar handles routing, or as a secondary nav) -->
<div class="mobile-tabs-fallback">
	<button class="tab" class:active={activeTab === 'courses'} onclick={() => activeTab = 'courses'}>
		Courses
	</button>
	<button class="tab" class:active={activeTab === 'resources'} onclick={() => activeTab = 'resources'}>
		Resources
	</button>
	<button class="tab" class:active={activeTab === 'events'} onclick={() => activeTab = 'events'}>
		Events
	</button>
	<button class="tab" class:active={activeTab === 'certs'} onclick={() => activeTab = 'certs'}>
		Certs
	</button>
</div>

<style>
	/* Layout Base */
	.dash-layout {
		display: grid;
		grid-template-columns: 240px 1fr;
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	/* Sidebar */
	.dash-sidebar {
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		padding: 2rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 2rem;
	}

	.user-profile {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 0 0.5rem;
	}
	.avatar {
		width: 40px;
		height: 40px;
		border-radius: 50%;
		background: var(--accent-gradient);
		color: white;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.2rem;
	}
	.user-details {
		display: flex;
		flex-direction: column;
	}
	.user-details strong {
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.user-details span {
		font-size: 0.8rem;
		color: var(--text-secondary);
	}

	.sidebar-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		width: 100%;
		padding: 10px 14px;
		border-radius: 8px;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 500;
		text-align: left;
		cursor: pointer;
		transition: all 0.2s;
	}
	.nav-item:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}
	.nav-item.active {
		background: var(--accent-muted);
		color: var(--accent);
		font-weight: 600;
	}

	/* Main Content Area */
	.dash-main {
		display: flex;
		flex-direction: column;
		min-width: 0; /* allows grids to shrink properly */
	}

	.dash-header {
		padding: 2.5rem 3rem 1.5rem;
		border-bottom: 1px solid var(--border-subtle);
		background: var(--bg);
	}
	.welcome-text h2 {
		font-size: 1.8rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.welcome-text p {
		color: var(--text-secondary);
		font-size: 1rem;
	}

	.dash-content-area {
		padding: 2.5rem 3rem 4rem;
		flex: 1;
	}

	.section-header {
		margin-bottom: 1.5rem;
	}
	.section-header h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	/* Grids */
	.course-grid, .generic-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
		gap: 1.5rem;
	}

	/* Course Card */
	.course-card {
		background: var(--bg-subtle);
		border: none;
		border-radius: 12px;
		display: flex;
		flex-direction: column;
		overflow: hidden;
		box-shadow: var(--shadow-sm);
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.course-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	.course-info {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.course-info h4 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
		line-height: 1.4;
	}
	.progress-wrap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.progress-bar {
		height: 6px;
		background: var(--bg-elevated);
		border-radius: 999px;
		overflow: hidden;
	}
	@keyframes fillProgress {
		from { width: 0; }
	}
	.progress-fill {
		height: 100%;
		background: var(--accent-gradient);
		border-radius: 999px;
		animation: fillProgress 1.2s cubic-bezier(0.2, 0.8, 0.2, 1) forwards;
	}
	.progress-text {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 600;
	}
	.course-action {
		padding: 1rem 1.5rem;
		background: var(--bg);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.next-up {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.next-up .label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.next-up .title {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 6px;
	}
	.icon-vid {
		color: var(--accent);
	}
	.resume-btn {
		display: flex;
		align-items: center;
		gap: 6px;
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
	.resume-btn:hover {
		opacity: 0.9;
	}

	/* Generic Cards */
	.item-card {
		display: flex;
		align-items: center;
		padding: 1.5rem;
		background: var(--bg-subtle);
		border: none;
		box-shadow: var(--shadow-sm);
		border-radius: 12px;
		gap: 1.25rem;
		transition: transform 0.2s, box-shadow 0.2s;
	}
	.item-card:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-md);
	}
	.icon-wrap {
		width: 50px;
		height: 50px;
		background: var(--bg);
		border-radius: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
		flex-shrink: 0;
		box-shadow: var(--shadow-sm);
	}
	.icon-wrap.success {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.item-info {
		flex: 1;
	}
	.item-info h4 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.item-info p {
		font-size: 0.85rem;
		color: var(--text-secondary);
	}
	.tag {
		background: var(--bg-elevated);
		padding: 2px 6px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}
	.text-success {
		color: #10b981;
	}

	.action-btn {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 8px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.action-btn.outline {
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
	}

	/* Browse More Card */
	.browse-card {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 2rem;
		background: transparent;
		border: 2px dashed var(--border-strong);
		border-radius: 12px;
		text-decoration: none;
		text-align: center;
		transition: all 0.2s;
		min-height: 200px;
	}
	.browse-card.small {
		min-height: auto;
		flex-direction: row;
		gap: 12px;
		padding: 1.5rem;
		justify-content: flex-start;
	}
	.browse-card:hover {
		border-color: var(--accent);
		background: var(--accent-muted);
		transform: translateY(-2px);
		box-shadow: var(--shadow-sm);
	}
	.browse-card:hover .browse-icon {
		background: var(--accent-gradient);
		color: white;
		transform: scale(1.1);
	}
	.browse-icon {
		width: 48px;
		height: 48px;
		background: var(--bg);
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
		margin-bottom: 1rem;
		box-shadow: 0 4px 12px rgba(0,0,0,0.05);
		transition: all 0.3s ease;
	}
	.browse-card.small .browse-icon {
		width: 36px;
		height: 36px;
		margin-bottom: 0;
	}
	.browse-card h4 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.browse-card p {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}

	/* Mobile Fallbacks */
	.mobile-tabs-fallback {
		display: none;
	}

	@media (max-width: 900px) {
		.dash-layout {
			display: block; /* stack layout on mobile */
		}
		.dash-sidebar {
			display: none; /* hidden on mobile, replaced by MobileTabBar */
		}
		.dash-header {
			padding: 2rem 1.5rem 1rem;
		}
		.dash-content-area {
			padding: 1.5rem 1.5rem 2rem;
		}
		
		/* Show horizontal scrollable tabs on mobile instead of sidebar */
		.mobile-tabs-fallback {
			display: flex;
			gap: 1.5rem;
			overflow-x: auto;
			padding: 0 1.5rem 1rem;
			border-bottom: 1px solid var(--border);
			-webkit-overflow-scrolling: touch;
			scrollbar-width: none;
		}
		.mobile-tabs-fallback::-webkit-scrollbar {
			display: none;
		}
		.mobile-tabs-fallback .tab {
			background: none;
			border: none;
			padding: 8px 0;
			color: var(--text-secondary);
			font-weight: 600;
			font-size: 0.95rem;
			border-bottom: 2px solid transparent;
			white-space: nowrap;
		}
		.mobile-tabs-fallback .tab.active {
			color: var(--accent);
			border-bottom-color: var(--accent);
		}
	}
</style>
