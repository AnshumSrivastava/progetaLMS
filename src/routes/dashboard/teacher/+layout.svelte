<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, BookOpen, Users, Users2, Ticket, Settings, LogOut, ArrowLeft, Mail, Award } from 'lucide-svelte';
	import { authClient } from '$lib/auth.client';
	import { goto } from '$app/navigation';

	let { children } = $props();

	const navItems = [
		{ name: 'Overview', path: '/dashboard/teacher', icon: LayoutDashboard },
		{ name: 'Courses', path: '/dashboard/teacher/courses', icon: BookOpen },
		{ name: 'Classes', path: '/dashboard/teacher/classes', icon: Users2 },
		{ name: 'Students', path: '/dashboard/teacher/students', icon: Users },
		{ name: 'Certifications', path: '/dashboard/teacher/certifications', icon: Award },
		{ name: 'Communications', path: '/dashboard/teacher/communications', icon: Mail },
		{ name: 'Coupons', path: '/dashboard/teacher/coupons', icon: Ticket },
		{ name: 'Settings', path: '/dashboard/teacher/settings', icon: Settings },
	];

	async function signOut() {
		await authClient.signOut();
		goto('/');
	}
</script>

<div class="admin-layout">
	<!-- Sidebar -->
	<aside class="admin-sidebar">
		<div class="sidebar-header">
			<a href="/dashboard" class="back-link">
				<ArrowLeft size={16} /> Exit Admin
			</a>
			<h2>Teacher Portal</h2>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				{@const active = $page.url.pathname === item.path || ($page.url.pathname.startsWith(item.path + '/') && item.path !== '/dashboard/teacher')}
				<a href={item.path} class="nav-item" class:active>
					<item.icon size={18} />
					<span>{item.name}</span>
				</a>
			{/each}
		</nav>

		<div class="sidebar-footer">
			<button class="nav-item signout" onclick={signOut}>
				<LogOut size={18} />
				<span>Sign out</span>
			</button>
		</div>
	</aside>

	<!-- Main Content Area -->
	<main class="admin-content">
		{@render children()}
	</main>
</div>

<style>
	.admin-layout {
		display: flex;
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	/* Sidebar */
	.admin-sidebar {
		width: 250px;
		flex-shrink: 0;
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--nav-h);
		height: calc(100vh - var(--nav-h));
		z-index: 10;
	}

	.sidebar-header {
		padding: 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		color: var(--text-muted);
		text-decoration: none;
		margin-bottom: 12px;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--text-primary);
	}
	.sidebar-header h2 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.sidebar-nav {
		flex: 1;
		padding: 1.5rem 1rem;
		display: flex;
		flex-direction: column;
		gap: 4px;
		overflow-y: auto;
	}

	.nav-item {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
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

	.sidebar-footer {
		padding: 1rem;
		border-top: 1px solid var(--border);
	}
	.nav-item.signout {
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: inherit;
		text-align: left;
	}
	.nav-item.signout:hover {
		color: var(--error, #ef4444);
		background: var(--error-muted, rgba(239, 68, 68, 0.1));
	}

	/* Main Content */
	.admin-content {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}
</style>
