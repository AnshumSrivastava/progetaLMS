<script lang="ts">
	import {
		Search,
		Menu,
		X,
		LayoutDashboard,
		Settings,
		LogOut,
		BookOpen,
		Compass,
		Users,
		Download,
		Calendar,
		Wallet
	} from 'lucide-svelte';
	import LaunchpadLogo from './LaunchpadLogo.svelte';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';
	import { page } from '$app/stores';
	import type { AuthUser } from '$lib/server/auth/auth.types';
	import { onMount } from 'svelte';

	let { user, userCredits = 0 }: { user: AuthUser | null; userCredits?: number } = $props();

	let currentPath = $derived($page.url.pathname);
	let isDashboard = $derived(currentPath.startsWith('/dashboard'));

	let menuOpen = $state(false);
	let profileDropdownOpen = $state(false);
	let searchModalOpen = $state(false);
	let searchQuery = $state('');

	let profileDropdownRef = $state<HTMLElement | null>(null);
	let searchInputRef = $state<HTMLInputElement | null>(null);

	const links = [
		{ href: '/catalog', label: 'Explore', icon: Compass },
		{ href: '/courses', label: 'Live Classes', icon: BookOpen },
		{ href: '/events', label: 'Sessions & Events', icon: Calendar },
		// Temporarily hidden: Certifications & Assessments
		// { href: '/labs', label: 'Labs & CTF', icon: Terminal },
		// { href: '/certifications', label: 'Certifications', icon: Award },
		{ href: '/mentoring', label: 'Mentorship', icon: Users },
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
	<div class="nav-container">
		<!-- Left Group: Brand + Desktop Links -->
		<div class="nav-left-group">
			{#if !isDashboard}
				<a href="/" class="brand-link" aria-label="Launchpad Home">
					<LaunchpadLogo class="brand-logo-svg" />
					<span class="brand-title">Launchpad</span>
				</a>
			{/if}

			<nav class="desktop-nav" aria-label="Primary Navigation">
				{#each links as link}
					{@const isActive =
						link.href === '/courses'
							? currentPath === '/courses' || currentPath.startsWith('/live-classes')
							: link.href === '/catalog'
							? currentPath === '/catalog'
							: currentPath.startsWith(link.href)}
					<a
						href={link.href}
						class="nav-link"
						class:active={isActive}
						aria-current={isActive ? 'page' : undefined}
					>
						{link.label}
					</a>
				{/each}
			</nav>
		</div>

		<!-- Right Group: Credit Wallet + Spotlight Search Trigger + Profile / Auth + Mobile Toggle -->
		<div class="nav-right-group">
			<!-- Credit Wallet Pill (logged-in users only) -->
			{#if user}
				<a href="/credits" class="wallet-pill" title="Credits balance & top-up">
					<Wallet size={13} class="wallet-icon" />
					<span class="wallet-count">{userCredits} Credits</span>
					<span class="wallet-plus">+</span>
				</a>
			{/if}

			<!-- Universal Spotlight Search Trigger -->
			<button
				type="button"
				class="search-spotlight-btn"
				onclick={openSearch}
				aria-label="Search catalog (Cmd+K)"
			>
				<Search size={14} class="search-spotlight-icon" />
				<span class="search-spotlight-label">Search</span>
				<kbd class="spotlight-kbd">⌘K</kbd>
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

							<a
								href="/credits"
								class="profile-item"
								onclick={() => (profileDropdownOpen = false)}
							>
								<Wallet size={15} />
								<div class="flex items-center justify-between flex-1">
									<span>Credits</span>
									<span class="profile-credits-badge">
										{userCredits} cr
									</span>
								</div>
							</a>

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
				<div class="auth-btn-group">
					<a href="/sign-in" class="btn-signin">Sign in</a>
					<a href="/catalog" class="btn-join">Explore</a>
				</div>
			{/if}

			<!-- Mobile menu toggle button -->
			<button
				class="mobile-toggle"
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
	<!-- svelte-ignore a11y_click_events_have_key_events -->
	<div
		class="mobile-drawer-backdrop"
		onclick={() => (menuOpen = false)}
		role="presentation"
	></div>
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
				<div class="my-1 border-t border-[#f4f4f5]"></div>
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
				<a
					href="/credits"
					onclick={() => (menuOpen = false)}
					class="mobile-nav-link"
					class:active={currentPath.startsWith('/credits')}
				>
					<Wallet size={17} />
					<div class="flex items-center justify-between flex-1">
						<span>Credits</span>
						<span class="profile-credits-badge">
							{userCredits} cr
						</span>
					</div>
				</a>
			{/if}
		</div>

		{#if !user}
			<div class="mobile-auth-actions">
				<a href="/sign-in" onclick={() => (menuOpen = false)} class="btn-signin flex-1 text-center border border-[#e4e4e7]">
					Sign in
				</a>
				<a href="/catalog" onclick={() => (menuOpen = false)} class="btn-join flex-1 text-center">
					Explore
				</a>
			</div>
		{:else}
			<div class="px-4 py-2 border-t border-[#f4f4f5]">
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
				<Search size={18} class="text-[#71717a] shrink-0 ml-4" />
				<input
					bind:this={searchInputRef}
					bind:value={searchQuery}
					type="text"
					placeholder="Search live classes, sessions, events, resources..."
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
					<span class="text-[11px] text-[#71717a]">Quick jumps:</span>
					<a
						href="/courses"
						onclick={closeSearch}
						class="search-chip"
					>
						Live Classes
					</a>
					<a
						href="/events"
						onclick={closeSearch}
						class="search-chip"
					>
						Sessions
					</a>
					<a
						href="/mentoring"
						onclick={closeSearch}
						class="search-chip"
					>
						Mentoring
					</a>
					<a
						href="/resources"
						onclick={closeSearch}
						class="search-chip"
					>
						Resources
					</a>
				</div>
				<span class="text-[11px] text-[#71717a] hidden sm:inline">
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
		background: rgba(255, 255, 255, 0.88);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
		z-index: 50;
		display: flex;
		align-items: center;
		transition: background-color 0.2s ease, border-color 0.2s ease, left 0.2s cubic-bezier(0.2, 0, 0, 1);
	}

	@supports (backdrop-filter: blur(16px)) {
		.nav-root {
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
		}
	}

	.nav-root.is-dashboard {
		left: var(--dash-sidebar-w, 240px);
		border-bottom: 1px solid rgba(0, 0, 0, 0.08);
	}

	@media (max-width: 1024px) {
		.nav-root.is-dashboard {
			left: 0;
		}
	}

	.nav-container {
		width: 100%;
		max-width: 1600px;
		margin-inline: auto;
		padding-inline: clamp(16px, 2.5vw, 48px);
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 24px;
	}

	/* Left Group: Brand + Links */
	.nav-left-group {
		display: flex;
		align-items: center;
		gap: 32px;
		min-width: 0;
	}

	.brand-link {
		display: flex;
		align-items: center;
		gap: 10px;
		color: #09090b;
		text-decoration: none;
		transition: opacity 0.15s ease;
		flex-shrink: 0;
	}

	.brand-link:hover {
		opacity: 0.82;
	}

	:global(.brand-logo-svg) {
		width: 25px;
		height: 25px;
		color: #09090b;
		flex-shrink: 0;
	}

	.brand-title {
		font-weight: 700;
		font-size: 1.18rem;
		letter-spacing: -0.025em;
		color: #09090b;
	}

	/* Desktop Links */
	.desktop-nav {
		display: none;
	}

	@media (min-width: 880px) {
		.desktop-nav {
			display: flex;
			align-items: center;
			gap: 4px;
		}
	}

	.nav-link {
		color: #52525b;
		font-size: 0.875rem;
		font-weight: 500;
		padding: 6px 12px;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.15s ease;
		white-space: nowrap;
	}

	.nav-link:hover {
		color: #09090b;
		background: rgba(0, 0, 0, 0.04);
	}

	.nav-link.active {
		color: #09090b;
		font-weight: 600;
		background: rgba(0, 0, 0, 0.06);
	}

	/* Right Group: Wallet + Spotlight Search + Auth / Profile */
	.nav-right-group {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-left: auto;
		flex-shrink: 0;
	}

	/* Credit Wallet Pill */
	.wallet-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 5px 11px;
		background: #fffbeb;
		border: 1px solid #fde68a;
		border-radius: 9999px;
		text-decoration: none;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.wallet-pill:hover {
		background: #fef3c7;
		border-color: #fcd34d;
		transform: translateY(-0.5px);
	}

	:global(.wallet-icon) {
		color: #d97706;
	}

	.wallet-count {
		font-size: 0.76rem;
		font-weight: 600;
		color: #92400e;
		letter-spacing: -0.01em;
	}

	.wallet-plus {
		font-size: 0.72rem;
		font-weight: 700;
		color: #b45309;
		margin-left: 1px;
	}

	/* Compact Spotlight Trigger Button */
	.search-spotlight-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 8px;
		cursor: pointer;
		color: #71717a;
		transition: all 0.15s ease;
		outline: none;
	}

	.search-spotlight-btn:hover {
		background: #f4f4f5;
		border-color: #d4d4d8;
		color: #18181b;
	}

	.search-spotlight-btn:focus-visible {
		border-color: #09090b;
		box-shadow: 0 0 0 2px rgba(9, 9, 11, 0.08);
	}

	:global(.search-spotlight-icon) {
		color: #71717a;
		flex-shrink: 0;
	}

	.search-spotlight-label {
		font-size: 0.8125rem;
		font-weight: 500;
		color: #71717a;
	}

	.spotlight-kbd {
		display: inline-flex;
		align-items: center;
		padding: 1px 5px;
		background: #f4f4f5;
		border: 1px solid #e4e4e7;
		border-radius: 4px;
		font-size: 0.675rem;
		font-family: inherit;
		font-weight: 500;
		color: #71717a;
		line-height: 1.2;
		box-shadow: 0 1px 1px rgba(0, 0, 0, 0.04);
	}

	/* Profile Avatar Dropdown Trigger */
	.avatar-trigger {
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 1px;
		background: none;
		border: 2px solid transparent;
		border-radius: 9999px;
		cursor: pointer;
		transition: all 0.15s ease;
		outline: none;
	}

	.avatar-trigger:hover,
	.avatar-trigger:focus-visible {
		border-color: #d4d4d8;
	}

	.avatar-img {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		object-fit: cover;
		border: 1px solid #e4e4e7;
	}

	.avatar-initials {
		width: 32px;
		height: 32px;
		border-radius: 9999px;
		background: #f4f4f5;
		color: #09090b;
		border: 1px solid #e4e4e7;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	/* Profile Dropdown Menu */
	.profile-menu {
		position: absolute;
		top: calc(100% + 8px);
		right: 0;
		width: 220px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		box-shadow: 0 12px 32px -4px rgba(0, 0, 0, 0.08), 0 4px 12px -2px rgba(0, 0, 0, 0.04);
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
		font-size: 0.85rem;
		font-weight: 600;
		color: #09090b;
		margin-bottom: 2px;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.profile-email {
		font-size: 0.75rem;
		color: #71717a;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.profile-divider {
		height: 1px;
		background: #f4f4f5;
		margin: 4px 0;
	}

	.profile-item {
		display: flex;
		align-items: center;
		gap: 9px;
		padding: 7px 10px;
		border-radius: 6px;
		font-size: 0.825rem;
		font-weight: 500;
		color: #52525b;
		text-decoration: none;
		background: none;
		border: none;
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.profile-item:hover {
		color: #09090b;
		background: #f4f4f5;
	}

	.profile-credits-badge {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 9999px;
		background: #fffbeb;
		color: #b45309;
		border: 1px solid #fde68a;
	}

	.profile-item-danger {
		color: #dc2626;
	}

	.profile-item-danger:hover {
		color: #b91c1c;
		background: #fef2f2;
	}

	/* Auth Buttons (Logged Out) */
	.auth-btn-group {
		display: none;
	}

	@media (min-width: 640px) {
		.auth-btn-group {
			display: flex;
			align-items: center;
			gap: 8px;
		}
	}

	.btn-signin {
		font-size: 0.84rem;
		font-weight: 500;
		color: #52525b;
		padding: 6px 12px;
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-signin:hover {
		color: #09090b;
		background: rgba(0, 0, 0, 0.04);
	}

	.btn-join {
		font-size: 0.84rem;
		font-weight: 600;
		background: #09090b;
		color: #ffffff;
		padding: 6px 14px;
		border-radius: 8px;
		text-decoration: none;
		transition: opacity 0.15s ease;
		box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
	}

	.btn-join:hover {
		opacity: 0.88;
	}

	/* Mobile Toggle */
	.mobile-toggle {
		display: none;
		padding: 6px;
		border-radius: 8px;
		color: #09090b;
		background: none;
		border: none;
		cursor: pointer;
		transition: all 0.12s ease;
	}

	@media (max-width: 879px) {
		.mobile-toggle {
			display: flex;
			align-items: center;
			justify-content: center;
		}
	}

	.mobile-toggle:hover {
		background: #f4f4f5;
	}

	/* Mobile Drawer */
	.mobile-drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 45;
		backdrop-filter: blur(2px);
		-webkit-backdrop-filter: blur(2px);
	}

	.mobile-drawer {
		position: fixed;
		top: var(--nav-h);
		left: 0;
		right: 0;
		background: #ffffff;
		border-bottom: 1px solid #e4e4e7;
		z-index: 49;
		box-shadow: 0 16px 32px -8px rgba(0, 0, 0, 0.1);
		max-height: calc(100vh - var(--nav-h) - 60px);
		overflow-y: auto;
		animation: drawerSlideDown 0.2s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes drawerSlideDown {
		from { transform: translateY(-8px); opacity: 0; }
		to   { transform: translateY(0); opacity: 1; }
	}

	.mobile-nav-link {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 10px 14px;
		border-radius: 8px;
		color: #52525b;
		font-size: 0.925rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.12s ease;
	}

	.mobile-nav-link:hover {
		color: #09090b;
		background: #f4f4f5;
	}

	.mobile-nav-link.active {
		color: #09090b;
		background: #f4f4f5;
		font-weight: 600;
	}

	.mobile-auth-actions {
		display: flex;
		gap: 10px;
		padding: 12px 16px 16px;
		border-top: 1px solid #f4f4f5;
	}

	/* Universal Search Modal / Command Palette */
	.search-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.35);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 100;
		display: flex;
		align-items: flex-start;
		justify-content: center;
		padding: 80px 16px 20px;
		animation: fadeIn 0.15s ease-out;
	}

	@keyframes fadeIn {
		from { opacity: 0; }
		to { opacity: 1; }
	}

	.search-dialog {
		width: 100%;
		max-width: 580px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		box-shadow: 0 20px 48px -12px rgba(0, 0, 0, 0.15), 0 4px 16px -2px rgba(0, 0, 0, 0.05);
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
		border-bottom: 1px solid #e4e4e7;
		background: #ffffff;
	}

	.search-input {
		flex: 1;
		height: 52px;
		padding: 0 14px;
		background: transparent;
		border: none;
		outline: none;
		font-size: 0.95rem;
		color: #09090b;
		font-family: inherit;
	}

	.search-clear-btn {
		background: none;
		border: none;
		color: #a1a1aa;
		padding: 8px;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.search-clear-btn:hover {
		color: #09090b;
	}

	.search-submit-btn {
		margin-right: 12px;
		padding: 6px 14px;
		font-size: 0.8125rem;
		font-weight: 600;
		background: #09090b;
		color: #ffffff;
		border: none;
		border-radius: 6px;
		cursor: pointer;
		transition: opacity 0.12s ease;
	}

	.search-submit-btn:hover {
		opacity: 0.88;
	}

	.search-dialog-footer {
		padding: 10px 16px;
		background: #fafafa;
		border-top: 1px solid #f4f4f5;
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.search-chip {
		font-size: 0.72rem;
		font-weight: 500;
		color: #52525b;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		padding: 3px 8px;
		border-radius: 6px;
		text-decoration: none;
		transition: all 0.12s ease;
	}

	.search-chip:hover {
		color: #09090b;
		border-color: #d4d4d8;
		background: #f4f4f5;
	}
</style>
