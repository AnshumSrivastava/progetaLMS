<script lang="ts">
	import { page } from '$app/stores';
	import { 
		LayoutDashboard, 
		Users, 
		Layers, 
		Calendar, 
		ShieldAlert, 
		Settings, 
		Activity, 
		Lock, 
		ArrowLeft,
		LogOut,
		ExternalLink
	} from 'lucide-svelte';
	import { authClient } from '$lib/auth.client';
	import { goto } from '$app/navigation';
	import type { LayoutData } from './$types';

	let { data, children }: { data: LayoutData; children: any } = $props();

	const navItems = $derived([
		{ name: 'Cockpit',      path: '/dashboard/admin',          icon: LayoutDashboard, exact: true },
		{ name: 'Users & Roles', path: '/dashboard/admin/users',    icon: Users },
		{ name: 'Cohorts',       path: '/dashboard/admin/cohorts',  icon: Layers },
		{ name: 'Live Events',   path: '/dashboard/admin/events',   icon: Calendar },
		{ name: 'Security Audit',path: '/dashboard/admin/audit',    icon: ShieldAlert },
		{ name: 'Platform Settings', path: '/dashboard/admin/settings', icon: Settings },
		{ name: 'Developer Tools', path: '/dashboard/admin/tester', icon: Activity },
		...(data.isOwner ? [{ name: 'Owner Vault', path: '/dashboard/admin/vault', icon: Lock, badge: 'Owner' }] : [])
	]);

	async function signOut() {
		await authClient.signOut();
		goto('/');
	}
</script>

<div class="admin-shell">
	<!-- ── COMMAND SIDEBAR (220px) ────────────────────────── -->
	<aside class="admin-sidebar">
		<div class="sidebar-top">
			<div class="portal-badge-wrap">
				<span class="portal-badge" class:owner-badge={data.isOwner}>
					{data.isOwner ? 'Owner Console' : 'Admin Console'}
				</span>
			</div>
			<a href="/dashboard" class="exit-link">
				<ArrowLeft size={12} />
				<span>Exit to Dashboard</span>
			</a>
		</div>

		<nav class="sidebar-nav">
			{#each navItems as item}
				{@const active = item.exact 
					? $page.url.pathname === item.path 
					: $page.url.pathname === item.path || $page.url.pathname.startsWith(item.path + '/')}
				<a href={item.path} class="nav-item" class:active>
					<item.icon size={15} />
					<span class="nav-label">{item.name}</span>
					{#if item.badge}
						<span class="vault-tag">{item.badge}</span>
					{/if}
				</a>
			{/each}
		</nav>

		<div class="sidebar-foot">
			<div class="user-chip">
				<div class="user-avatar">
					{data.user.name ? data.user.name.slice(0, 2).toUpperCase() : 'AD'}
				</div>
				<div class="user-meta">
					<span class="user-name">{data.user.name || 'Administrator'}</span>
					<span class="user-role">{data.user.role}</span>
				</div>
			</div>
			<button class="nav-item signout-btn" onclick={signOut}>
				<LogOut size={14} />
				<span>Sign out</span>
			</button>
		</div>
	</aside>

	<!-- ── MAIN CONTENT CANVAS ────────────────────────────── -->
	<div class="admin-canvas">
		{@render children()}
	</div>
</div>

<style>
	.admin-shell {
		display: flex;
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	/* ── Sidebar ─────────────────────────────────────────────── */
	.admin-sidebar {
		width: 220px;
		flex-shrink: 0;
		background: var(--bg-subtle);
		border-right: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		position: sticky;
		top: var(--nav-h);
		height: calc(100vh - var(--nav-h));
	}

	.sidebar-top {
		padding: 14px 14px 12px;
		border-bottom: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.portal-badge-wrap {
		display: flex;
		align-items: center;
	}

	.portal-badge {
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		padding: 3px 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		color: var(--text-secondary);
	}

	.portal-badge.owner-badge {
		background: rgba(139, 92, 246, 0.08);
		border-color: rgba(139, 92, 246, 0.25);
		color: #8b5cf6;
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

	.nav-label {
		flex: 1;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.vault-tag {
		font-size: 0.5625rem;
		font-weight: 700;
		padding: 1px 5px;
		border-radius: 3px;
		background: rgba(139, 92, 246, 0.12);
		color: #8b5cf6;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.sidebar-foot {
		padding: 10px 8px;
		border-top: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.user-chip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 6px 8px;
		border-radius: var(--radius-sm);
		background: var(--bg);
		border: 1px solid var(--border-subtle);
	}

	.user-avatar {
		width: 24px;
		height: 24px;
		border-radius: 50%;
		background: var(--text-primary);
		color: var(--bg);
		font-size: 0.625rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.user-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.user-name {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-role {
		font-size: 0.625rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.signout-btn {
		width: 100%;
		background: transparent;
		border: none;
		cursor: pointer;
		font-family: inherit;
		height: 30px;
	}

	.signout-btn:hover {
		color: var(--text-primary);
	}

	/* ── Canvas ──────────────────────────────────────────────── */
	.admin-canvas {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
	}

	@media (max-width: 860px) {
		.admin-sidebar { display: none; }
	}
</style>
