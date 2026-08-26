<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, BookOpen, Users, Users2, Ticket, Settings, LogOut, ArrowLeft, Mail, Award } from 'lucide-svelte';
	import { authClient } from '$lib/auth.client';
	import { goto } from '$app/navigation';

	let { children } = $props();

	const navItems = [
		{ name: 'Overview',       path: '/dashboard/teacher', icon: LayoutDashboard },
		{ name: 'Courses',        path: '/dashboard/teacher/courses', icon: BookOpen },
		{ name: 'Classes',        path: '/dashboard/teacher/classes', icon: Users2 },
		{ name: 'Students',       path: '/dashboard/teacher/students', icon: Users },
		{ name: 'Certifications', path: '/dashboard/teacher/certifications', icon: Award },
		{ name: 'Communications', path: '/dashboard/teacher/communications', icon: Mail },
		{ name: 'Coupons',        path: '/dashboard/teacher/coupons', icon: Ticket },
		{ name: 'Settings',       path: '/dashboard/teacher/settings', icon: Settings },
	];

	async function signOut() {
		await authClient.signOut();
		goto('/');
	}
</script>

<div class="teacher-layout">
	<!-- Sidebar -->
	<aside class="teacher-sidebar">
		<div class="sidebar-header">
			<a href="/dashboard" class="exit-link">
				<ArrowLeft size={13} />
				<span>Exit Portal</span>
			</a>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				{@const active = $page.url.pathname === item.path || ($page.url.pathname.startsWith(item.path + '/') && item.path !== '/dashboard/teacher')}
				<a href={item.path} class="nav-item" class:active>
					<item.icon size={15} />
					<span>{item.name}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<button class="nav-item signout" onclick={signOut}>
				<LogOut size={15} />
				<span>Sign out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="teacher-content">
		{@render children()}
	</main>
</div>

<style>
	.teacher-layout {
		display: flex;
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	.teacher-sidebar {
		width: 200px;
		flex-shrink: 0;
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--nav-h);
		height: calc(100vh - var(--nav-h));
	}

	.sidebar-header {
		padding: 12px 14px;
		border-bottom: 1px solid var(--border);
	}

	.exit-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-muted);
		text-decoration: none;
		transition: color var(--t-fast);
	}

	.exit-link:hover {
		color: var(--text-primary);
	}

	.sidebar-nav {
		flex: 1;
		padding: 10px 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 34px;
		padding: 0 10px;
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.8125rem;
		font-weight: 500;
		position: relative;
		transition: color var(--t-fast), background var(--t-fast);
	}

	.nav-item:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.nav-item.active {
		color: var(--text-primary);
		font-weight: 600;
		background: var(--bg);
	}

	.nav-item.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 6px;
		bottom: 6px;
		width: 2px;
		background: var(--text-primary);
		border-radius: 99px;
	}

	.sidebar-footer {
		padding: 8px;
		border-top: 1px solid var(--border);
	}

	.nav-item.signout {
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: inherit;
	}

	.nav-item.signout:hover {
		color: var(--text-primary);
	}

	.teacher-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 768px) {
		.teacher-sidebar { display: none; }
	}
</style>
