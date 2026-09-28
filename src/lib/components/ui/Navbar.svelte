<script lang="ts">
	import {
		Search,
		Menu,
		X,
		LayoutDashboard,
		Settings,
		LogOut,
		BookOpen,
		Award,
		Users,
		Download,
		Video,
		Command,
		Sun,
		Moon,
		Monitor
	} from 'lucide-svelte';
	import LaunchpadLogo from './LaunchpadLogo.svelte';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import { themeStore } from '$lib/stores/theme';
	import type { AuthUser } from '$lib/server/auth/auth.types';
	import { onMount } from 'svelte';

	let { user }: { user: AuthUser | null } = $props();

	let currentTheme = $derived($themeStore);
	let currentPath = $derived($page.url.pathname);
	let searchParams = $derived($page.url.searchParams);
	let isDashboard = $derived(currentPath.startsWith('/dashboard'));

	let menuOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let searchModalOpen = $state(false);
	let searchQuery = $state('');

	let profileDropdownRef = $state<HTMLElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);

	const links = [
		{ href: '/catalog', label: 'Explore', icon: BookOpen },
		{ href: '/live-classes', label: 'Live Classes', icon: Video, isLive: true },
		{ href: '/courses', label: 'Courses', icon: BookOpen },
		{ href: '/certifications', label: 'Certifications', icon: Award },
		{ href: '/mentoring', label: 'Mentoring', icon: Users },
		{ href: '/resources', label: 'Resources', icon: Download }
	];

	const initials = $derived(
		user?.name
			? user.name
					.split(' ')
					.filter(Boolean)
					.map((n) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: user?.email?.slice(0, 2).toUpperCase() ?? 'U'
	);

	function openSearch() {
		searchModalOpen = true;
		setTimeout(() => {
			searchInputRef?.focus();
		}, 50);
	}

	function closeSearch() {
		searchModalOpen = false;
		searchQuery = '';
	}

	function handleSearchSubmit(e?: Event) {
		if (e) e.preventDefault();
		const q = searchQuery.trim();
		if (q) {
			goto(`/catalog?q=${encodeURIComponent(q)}`);
		} else {
			goto('/catalog');
		}
		closeSearch();
	}

	async function handleSignOut() {
		profileDropdownOpen = false;
		menuOpen = false;
		await authClient.signOut();
		await invalidateAll();
		goto('/');
	}

	function toggleProfileDropdown(e: MouseEvent) {
		e.stopPropagation();
		profileDropdownOpen = !profileDropdownOpen;
	}

	onMount(() => {
		function onKeyDown(e: KeyboardEvent) {
			if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
				e.preventDefault();
				if (searchModalOpen) {
					closeSearch();
				} else {
					openSearch();
				}
			} else if (e.key === 'Escape') {
				if (searchModalOpen) closeSearch();
				if (profileDropdownOpen) profileDropdownOpen = false;
			}
		}

		function onDocClick(e: MouseEvent) {
			if (profileDropdownRef && !profileDropdownRef.contains(e.target as Node)) {
				profileDropdownOpen = false;
			}
		}

		window.addEventListener('keydown', onKeyDown);
		document.addEventListener('click', onDocClick);

		return () => {
			window.removeEventListener('keydown', onKeyDown);
			document.removeEventListener('click', onDocClick);
		};
	});
</script>

<nav class="nav-root" class:is-dashboard={isDashboard}>
	<div class="nav-container" class:centered-nav={!isDashboard}>
		<!-- Brand / Logo (Left) -->
		<div class="nav-left">
			{#if !isDashboard}
				<a href="/" class="brand-link" aria-label="Launchpad Home">
					<LaunchpadLogo class="brand-logo-svg" />
					<span class="brand-title">Launchpad</span>
				</a>
			{/if}
		</div>

		<!-- Desktop links (Centered when not in dashboard) -->
		<div class="nav-center">
			<div class="hidden md:flex items-center gap-1">
				{#each links as link}
					{@const isActive =
						link.href === '/courses'
							? currentPath === '/courses'
							: link.href === '/catalog'
							? currentPath === '/catalog'
							: link.href === '/live-classes'
							? currentPath === '/live-classes'
							: currentPath.startsWith(link.href)}
					<a
						href={link.href}
						class="nav-link"
						class:active={isActive}
						class:live-nav-link={link.isLive}
						aria-current={isActive ? 'page' : undefined}
					>
						{#if link.isLive}
							<span class="live-nav-dot"></span>
						{/if}
						{link.label}
					</a>
				{/each}
			</div>
		</div>

		<!-- Middle / Right: Search & Profile Actions -->
		<div class="nav-right">
			<!-- Universal Search Trigger Bar -->
			<button
				type="button"
				class="search-trigger"
				onclick={openSearch}
				aria-label="Search catalog (Cmd+K)"
			>
				<Search size={15} class="search-icon-muted" />
				<span class="search-trigger-placeholder">Search courses, certs...</span>
				<kbd class="search-kbd">
					<span class="text-[10px]">⌘</span>K
				</kbd>
			</button>

			<!-- Auth / Profile Section -->
			{#if user}
				<!-- Profile Avatar Dropdown Trigger -->
				<div class="relative" bind:this={profileDropdownRef}>
					<button
						type="button"
						class="avatar-trigger"
						onclick={toggleProfileDropdown}
						aria-expanded={profileDropdownOpen}
						aria-haspopup="true"
						aria-label="User profile menu"
					>
						{#if user.image}
							<img src={user.image} alt={user.name || 'User'} class="avatar-img" />
						{:else}
							<div class="avatar-initials">
								{initials}
							</div>
						{/if}
					</button>

					<!-- Dropdown Menu -->
					{#if profileDropdownOpen}
						<div class="profile-menu">
							<!-- User Summary Header -->
							<div class="profile-header">
								<p class="profile-name">{user.name || 'Account'}</p>
								<p class="profile-email">{user.email}</p>
							</div>

							<div class="profile-divider"></div>

							<!-- Menu Links -->
							<a
								href="/dashboard"
								class="profile-item"
								onclick={() => (profileDropdownOpen = false)}
							>
								<LayoutDashboard size={15} />
								<span>Dashboard</span>
							</a>

							<a
								href="/dashboard/settings"
								class="profile-item"
								onclick={() => (profileDropdownOpen = false)}
							>
								<Settings size={15} />
								<span>Settings</span>
							</a>

							<!-- Theme Controls (Section 12, 13, 14) -->
							<div class="px-3 py-2">
								<span class="block text-[11px] font-mono text-[var(--color-text-muted)] uppercase mb-1.5">Theme</span>
								<div class="grid grid-cols-3 gap-1 bg-[var(--color-surface-subtle)] p-1 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
									<button
										type="button"
										class="flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors"
										class:bg-[var(--color-surface)]={currentTheme === 'light'}
										class:text-[var(--color-text)]={currentTheme === 'light'}
										class:shadow-xs={currentTheme === 'light'}
										class:text-[var(--color-text-secondary)]={currentTheme !== 'light'}
										onclick={() => themeStore.setTheme('light')}
										title="Light Theme"
									>
										<Sun size={12} />
										<span>Light</span>
									</button>
									<button
										type="button"
										class="flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors"
										class:bg-[var(--color-surface)]={currentTheme === 'dark'}
										class:text-[var(--color-text)]={currentTheme === 'dark'}
										class:shadow-xs={currentTheme === 'dark'}
										class:text-[var(--color-text-secondary)]={currentTheme !== 'dark'}
										onclick={() => themeStore.setTheme('dark')}
										title="Dark Theme"
									>
										<Moon size={12} />
										<span>Dark</span>
									</button>
									<button
										type="button"
										class="flex items-center justify-center gap-1 py-1 rounded text-[11px] font-medium transition-colors"
										class:bg-[var(--color-surface)]={currentTheme === 'system'}
										class:text-[var(--color-text)]={currentTheme === 'system'}
										class:shadow-xs={currentTheme === 'system'}
										class:text-[var(--color-text-secondary)]={currentTheme !== 'system'}
										onclick={() => themeStore.setTheme('system')}
										title="System Theme"
									>
										<Monitor size={12} />
										<span>Auto</span>
									</button>
								</div>
							</div>

							<div class="profile-divider"></div>

							<!-- Sign Out -->
							<button type="button" class="profile-item profile-item-danger" onclick={handleSignOut}>
								<LogOut size={15} />
								<span>Sign out</span>
							</button>
						</div>
					{/if}
				</div>
			{:else}
				<div class="hidden sm:flex items-center gap-2">
					<a href="/sign-in" class="btn-ghost"> Sign in </a>
					<a href="/catalog" class="btn-solid"> Explore </a>
				</div>
			{/if}

			<!-- Mobile menu toggle button -->
			<button
				class="md:hidden mobile-toggle"
				onclick={() => (menuOpen = !menuOpen)}
				aria-label="Toggle mobile menu"
			>
				{#if menuOpen}
					<X size={19} />
				{:else}
					<Menu size={19} />
				{/if}
			</button>
		</div>
	</div>
</nav>

<!-- Mobile Navigation Drawer -->
{#if menuOpen}
	<div class="mobile-drawer">
		<div class="flex flex-col p-3 gap-1">
			{#each links as link}
				{@const IconComponent = link.icon}
				{@const isActive =
				link.href === '/courses'
						? currentPath === '/courses'
						: link.href === '/catalog'
							? currentPath === '/catalog'
						: link.href === '/live-classes'
							? currentPath === '/live-classes'
						: currentPath.startsWith(link.href)}
				<a
					href={link.href}
					onclick={() => (menuOpen = false)}
					class="mobile-nav-link"
					class:active={isActive}
					aria-current={isActive ? 'page' : undefined}
				>
					<IconComponent size={17} />
					<span>{link.label}</span>
				</a>
			{/each}

			{#if user}
				<div class="my-1 border-t border-[var(--color-border-subtle)]"></div>
				<a
					href="/dashboard"
					onclick={() => (menuOpen = false)}
					class="mobile-nav-link"
					class:active={currentPath.startsWith('/dashboard')}
				>
					<LayoutDashboard size={17} />
					<span>Dashboard</span>
				</a>
				<a
					href="/dashboard/settings"
					onclick={() => (menuOpen = false)}
					class="mobile-nav-link"
				>
					<Settings size={17} />
					<span>Settings</span>
				</a>
			{/if}
		</div>

		<!-- Mobile Theme Switcher -->
		<div class="px-4 py-2 border-t border-[var(--color-border-subtle)] flex items-center justify-between">
			<span class="text-[12px] font-mono text-[var(--color-text-muted)] uppercase">Theme</span>
			<div class="flex items-center gap-1 bg-[var(--color-surface-subtle)] p-0.5 rounded-[var(--radius-sm)] border border-[var(--color-border)]">
				<button
					type="button"
					class="p-1.5 rounded text-[11px] transition-colors"
					class:bg-[var(--color-surface)]={currentTheme === 'light'}
					class:text-[var(--color-text)]={currentTheme === 'light'}
					class:shadow-xs={currentTheme === 'light'}
					class:text-[var(--color-text-secondary)]={currentTheme !== 'light'}
					onclick={() => themeStore.setTheme('light')}
					title="Light Theme"
				>
					<Sun size={14} />
				</button>
				<button
					type="button"
					class="p-1.5 rounded text-[11px] transition-colors"
					class:bg-[var(--color-surface)]={currentTheme === 'dark'}
					class:text-[var(--color-text)]={currentTheme === 'dark'}
					class:shadow-xs={currentTheme === 'dark'}
					class:text-[var(--color-text-secondary)]={currentTheme !== 'dark'}
					onclick={() => themeStore.setTheme('dark')}
					title="Dark Theme"
				>
					<Moon size={14} />
				</button>
				<button
					type="button"
					class="p-1.5 rounded text-[11px] transition-colors"
					class:bg-[var(--color-surface)]={currentTheme === 'system'}
					class:text-[var(--color-text)]={currentTheme === 'system'}
					class:shadow-xs={currentTheme === 'system'}
					class:text-[var(--color-text-secondary)]={currentTheme !== 'system'}
					onclick={() => themeStore.setTheme('system')}
					title="System Theme"
				>
					<Monitor size={14} />
				</button>
			</div>
		</div>

		{#if !user}
			<div class="mobile-auth-actions">
				<a href="/sign-in" onclick={() => (menuOpen = false)} class="btn-ghost flex-1 text-center">
					Sign in
				</a>
				<a href="/catalog" onclick={() => (menuOpen = false)} class="btn-solid flex-1 text-center">
					Explore
				</a>
			</div>
		{:else}
			<div class="px-4 py-2 border-t border-[var(--color-border-subtle)]">
				<button type="button" class="profile-item profile-item-danger w-full justify-center" onclick={handleSignOut}>
					<LogOut size={15} />
					<span>Sign out</span>
				</button>
			</div>
		{/if}
	</div>
{/if}

<!-- Universal Search Modal / Command Palette -->
{#if searchModalOpen}
	<div
		class="search-backdrop"
		role="button"
		tabindex="0"
		onclick={(e) => {
			if (e.target === e.currentTarget) closeSearch();
		}}
		onkeydown={(e) => {
			if (e.key === 'Escape') closeSearch();
		}}
	>
		<div class="search-dialog" role="dialog" aria-modal="true" aria-label="Universal Search">
			<form onsubmit={handleSearchSubmit} class="search-form-wrap">
				<Search size={18} class="text-[var(--text-muted)] shrink-0 ml-4" />
				<input
					bind:this={searchInputRef}
					bind:value={searchQuery}
					type="text"
					placeholder="Search courses, skills, resources, exams..."
					class="search-input"
				/>
				{#if searchQuery}
					<button
						type="button"
						onclick={() => (searchQuery = '')}
						class="search-clear-btn"
						aria-label="Clear input"
					>
						<X size={15} />
					</button>
				{/if}
				<button type="submit" class="search-submit-btn">
					Search
				</button>
			</form>

			<div class="search-dialog-footer">
				<div class="flex items-center gap-2">
					<span class="text-[11px] text-[var(--text-muted)]">Quick jumps:</span>
					<a
						href="/courses"
						onclick={closeSearch}
						class="search-chip"
					>
						Courses
					</a>
					<a
						href="/certifications"
						onclick={closeSearch}
						class="search-chip"
					>
						Certifications
					</a>
					<a
						href="/mentoring"
						onclick={closeSearch}
						class="search-chip"
					>
						Mentoring
					</a>
				</div>
				<span class="text-[11px] text-[var(--text-muted)] hidden sm:inline">
					ESC to exit
				</span>
			</div>
		</div>
	</div>
{/if}

<style>
	.nav-root {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		height: var(--nav-h);
		background: color-mix(in srgb, var(--bg) 92%, transparent);
		border-bottom: 1px solid var(--border);
		z-index: 50;
		display: flex;
		align-items: center;
		transition: background-color 0.2s ease, border-color 0.2s ease, left 0.2s cubic-bezier(0.2, 0, 0, 1);
	}

	.nav-root.is-dashboard {
		left: var(--dash-sidebar-w, 240px);
	}

	@supports (backdrop-filter: blur(12px)) {
		.nav-root {
			background: color-mix(in srgb, var(--bg) 88%, transparent);
			backdrop-filter: blur(12px);
			-webkit-backdrop-filter: blur(12px);
		}
	}

	.nav-container {
		width: 100%;
		max-width: 1440px;
		margin-inline: auto;
		padding-inline: 28px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}

	.nav-container.centered-nav {
		display: flex;
		align-items: center;
		justify-content: space-between;
		position: relative;
	}

	.nav-left {
		display: flex;
		align-items: center;
		justify-content: flex-start;
		min-width: 0;
		z-index: 2;
	}

	.nav-center {
		position: absolute;
		left: 50%;
		top: 50%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1;
		pointer-events: auto;
	}

	.nav-right {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 10px;
		z-index: 2;
	}

	.nav-root.is-dashboard .nav-container {
		max-width: 100%;
		padding-inline: 24px;
		display: flex;
		justify-content: space-between;
	}

	.nav-root.is-dashboard .nav-left {
		display: none;
	}

	.nav-root.is-dashboard .nav-center {
		justify-content: flex-start;
	}

	@media (max-width: 900px) {
		.nav-root.is-dashboard {
			left: 0;
		}
	}

	/* Brand */
	.brand-link {
		display: flex;
		align-items: center;
		gap: 9px;
		color: var(--text-primary);
		text-decoration: none;
		transition: opacity 0.15s ease;
	}

	.brand-link:hover {
		opacity: 0.85;
	}

	:global(.brand-logo-svg) {
		width: 26px;
		height: 26px;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	.brand-title {
		font-weight: 700;
		font-size: 1.22rem;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	/* Desktop Links */
	.nav-link {
		color: var(--text-secondary);
		font-size: 0.95rem;
		font-weight: 500;
		padding: 8px 14px;
		border-radius: var(--radius-md);
		transition: all 0.15s ease;
	}

	.nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.nav-link.active {
		color: var(--color-primary);
		font-weight: 600;
		background: color-mix(in srgb, var(--color-primary) 10%, var(--bg));
		box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--color-primary) 18%, transparent);
	}

	.nav-link.live-nav-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}

	.nav-link.live-nav-link.active {
		color: #059669;
		background: rgba(16, 185, 129, 0.1);
		box-shadow: inset 0 0 0 1px rgba(16, 185, 129, 0.25);
	}

	:global([data-theme="dark"]) .nav-link.live-nav-link.active {
		color: #34d399;
	}

	.live-nav-dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 9999px;
		box-shadow: 0 0 6px #10b981;
		animation: nav-pulse 1.5s infinite;
	}

	@keyframes nav-pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.35; transform: scale(0.75); }
	}

	/* Universal Search Trigger */
	.search-trigger {
		display: flex;
		align-items: center;
		gap: 9px;
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 6px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.9rem;
		cursor: pointer;
		transition: all 0.15s ease;
		outline: none;
	}

	.search-trigger:hover {
		background: var(--bg-elevated);
		border-color: var(--border-strong);
		color: var(--text-primary);
	}

	.search-trigger-placeholder {
		display: none;
	}

	@media (min-width: 1100px) {
		.search-trigger {
			padding: 5px 12px;
		}
		.search-trigger-placeholder {
			display: inline;
		}
		.search-kbd {
			display: flex;
		}
	}

	:global(.search-icon-muted) {
		color: var(--text-muted);
	}

	.search-kbd {
		display: none;
		align-items: center;
		gap: 2px;
		padding: 1px 5px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		font-size: 0.6875rem;
		font-family: inherit;
		color: var(--text-muted);
		line-height: 1.2;
	}

	@media (min-width: 768px) {
		.search-kbd {
			display: inline-flex;
		}
	}

	/* Avatar Dropdown Trigger */
	.avatar-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 2px;
		background: none;
		border: 2px solid transparent;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		outline: none;
	}

	.avatar-trigger:hover,
	.avatar-trigger:focus-visible {
		border-color: var(--text-muted);
	}

	.avatar-img {
		width: 30px;
		height: 30px;
		border-radius: 9999px;
		object-fit: cover;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.08);
	}

	.avatar-initials {
		width: 30px;
		height: 30px;
		border-radius: 9999px;
		background: #F0F0F0;
		color: #222;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.72rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	/* Profile Dropdown Menu */
	.profile-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 210px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.08);
		padding: 6px;
		display: flex;
		flex-direction: column;
		z-index: 60;
		animation: popIn 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes popIn {
		from {
			opacity: 0;
			transform: scale(0.96) translateY(-4px);
		}
		to {
			opacity: 1;
			transform: scale(1) translateY(0);
		}
	}

	.profile-header {
		padding: 8px 10px;
	}

	.profile-name {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.profile-email {
		font-size: 0.76rem;
		color: var(--text-muted);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.profile-divider {
		height: 1px;
		background: var(--border-subtle);
		margin: 4px 0;
	}

	.profile-item {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 8px 12px;
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.profile-item:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.profile-item-danger {
		color: #444;
	}

	.profile-item-danger:hover {
		color: #111;
		background: #F0F0F0;
	}

	:global([data-theme='dark']) .profile-item-danger:hover {
		background: rgba(255, 255, 255, 0.08);
	}

	/* Buttons */
	.btn-ghost {
		font-size: 0.92rem;
		font-weight: 500;
		color: var(--text-secondary);
		padding: 7px 14px;
		border-radius: var(--radius-md);
		transition: all 0.12s ease;
		text-decoration: none;
	}

	.btn-ghost:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.btn-solid {
		font-size: 0.92rem;
		font-weight: 500;
		background: var(--text-primary);
		color: var(--bg);
		padding: 7px 16px;
		border-radius: var(--radius-md);
		text-decoration: none;
		transition: opacity 0.12s ease;
	}

	.btn-solid:hover {
		opacity: 0.9;
	}

	/* Mobile Toggle */
	.mobile-toggle {
		padding: 6px;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.mobile-toggle:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	/* Mobile Drawer */
	.mobile-drawer {
		position: fixed;
		top: var(--nav-h);
		left: 0;
		right: 0;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
		z-index: 45;
		box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.05);
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 11px 14px;
		border-radius: var(--radius-md);
		color: var(--text-secondary);
		font-size: 1rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.12s ease;
	}

	.mobile-nav-link:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.mobile-nav-link.active {
		color: var(--color-primary);
		background: var(--color-primary-subtle);
		font-weight: 600;
	}

	.mobile-auth-actions {
		display: flex;
		gap: 10px;
		padding: 12px 16px 16px;
		border-top: 1px solid var(--border-subtle);
	}

	/* Universal Search Backdrop & Dialog */
	.search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.45);
		backdrop-filter: blur(4px);
		-webkit-backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 80px 16px 20px;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from {
			opacity: 0;
		}
		to {
			opacity: 1;
		}
	}

	.search-dialog {
		width: 100%;
		max-width: 580px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 12px;
		box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
		overflow: hidden;
		animation: modalSlide 0.15s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes modalSlide {
		from {
			opacity: 0;
			transform: translateY(-10px) scale(0.98);
		}
		to {
			opacity: 1;
			transform: translateY(0) scale(1);
		}
	}

	.search-form-wrap {
		display: flex;
		align-items: center;
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}

	.search-input {
		flex: 1;
		height: 52px;
		padding: 0 14px;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.95rem;
		color: var(--text-primary);
		font-family: inherit;
	}

	.search-clear-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		padding: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-clear-btn:hover {
		color: var(--text-primary);
	}

	.search-submit-btn {
		margin-right: 10px;
		padding: 6px 14px;
		font-size: 0.8125rem;
		font-weight: 500;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: opacity 0.12s ease;
	}

	.search-submit-btn:hover {
		opacity: 0.9;
	}

	.search-dialog-footer {
		padding: 10px 16px;
		background: var(--bg-subtle);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.search-chip {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-secondary);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		padding: 2px 7px;
		border-radius: var(--radius-sm);
		text-decoration: none;
		transition: all 0.12s ease;
	}

	.search-chip:hover {
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
</style>
