<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft, Save, Play, LayoutList, Settings, Users } from 'lucide-svelte';

	let { children } = $props();

	// We extract courseId from the URL params
	const courseId = $derived($page.params.courseId);

	const tabs = [
		{ name: 'Curriculum', path: `/dashboard/teacher/courses/${courseId}/curriculum`, icon: LayoutList },
		{ name: 'Settings & Pricing', path: `/dashboard/teacher/courses/${courseId}/settings`, icon: Settings },
		{ name: 'Access Control', path: `/dashboard/teacher/courses/${courseId}/access`, icon: Users },
	];
</script>

<!-- Full screen overlay to hide the main admin sidebar and navbar for a focused editor experience -->
<div class="course-builder-shell">
	<!-- Top Navbar -->
	<header class="builder-header">
		<div class="header-left">
			<a href="/dashboard/teacher/courses" class="back-btn">
				<ArrowLeft size={18} />
				<span>Back to Courses</span>
			</a>
			<div class="divider"></div>
			<span class="course-title">Draft: Cybersecurity Fundamentals</span>
			<span class="status-badge">Unsaved Changes</span>
		</div>
		<div class="header-right">
			<button class="preview-btn">
				<Play size={16} /> Preview
			</button>
			<button class="save-btn">
				<Save size={16} /> Save & Publish
			</button>
		</div>
	</header>

	<div class="builder-body">
		<!-- Left Sidebar (Tabs) -->
		<aside class="builder-sidebar">
			<nav class="tab-nav">
				{#each tabs as tab}
					{@const active = $page.url.pathname.includes(tab.path)}
					<a href={tab.path} class="tab-item" class:active>
						<tab.icon size={18} />
						{tab.name}
					</a>
				{/each}
			</nav>
		</aside>

		<!-- Main Workspace -->
		<main class="builder-workspace">
			{@render children()}
		</main>
	</div>
</div>

<style>
	/* Fixed overlay covering the whole screen */
	.course-builder-shell {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: var(--bg);
		z-index: 1000;
		display: flex;
		flex-direction: column;
	}

	/* Header */
	.builder-header {
		height: 60px;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		flex-shrink: 0;
	}

	.header-left {
		display: flex;
		align-items: center;
		gap: 16px;
	}
	.back-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		transition: color 0.2s;
	}
	.back-btn:hover {
		color: var(--text-primary);
	}
	.divider {
		width: 1px;
		height: 24px;
		background: var(--border-strong);
	}
	.course-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.status-badge {
		font-size: 0.75rem;
		font-weight: 600;
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
		padding: 4px 8px;
		border-radius: 4px;
	}

	.header-right {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.preview-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--border-strong);
		color: var(--text-primary);
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.preview-btn:hover {
		background: var(--bg-subtle);
	}
	.save-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.save-btn:hover {
		opacity: 0.9;
	}

	/* Body */
	.builder-body {
		display: flex;
		flex: 1;
		min-height: 0;
	}

	.builder-sidebar {
		width: 260px;
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		padding: 1.5rem 1rem;
		flex-shrink: 0;
	}

	.tab-nav {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.tab-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 12px 14px;
		border-radius: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
		transition: all 0.2s;
	}
	.tab-item:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}
	.tab-item.active {
		background: var(--accent-muted);
		color: var(--accent);
		font-weight: 600;
	}

	.builder-workspace {
		flex: 1;
		background: var(--bg);
		overflow-y: auto;
		padding: 2.5rem;
	}
</style>
