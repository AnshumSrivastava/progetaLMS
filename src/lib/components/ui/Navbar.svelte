<script lang="ts">
	import { Menu, X } from 'lucide-svelte';
	import Button from './Button.svelte';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';
	import type { AuthUser } from '$lib/server/auth/auth.types';

	let { user }: { user: AuthUser | null } = $props();

	let menuOpen = $state(false);

	const links = [
		{ href: '/catalog',        label: 'Catalog' },
		{ href: '/certifications', label: 'Certifications' },
		{ href: '/mentoring',      label: 'Mentoring' },
	];

	const initials = $derived(
		user?.name
			? user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()
			: user?.email?.slice(0, 2).toUpperCase() ?? ''
	);

	async function handleSignOut() {
		await authClient.signOut();
		await invalidateAll();
		goto('/');
	}
</script>

<nav
	style="height: var(--nav-h); background: var(--glass-bg); backdrop-filter: blur(12px); -webkit-backdrop-filter: blur(12px); border-bottom: 1px solid var(--border);"
	class="fixed top-0 inset-x-0 z-50 flex items-center"
>
	<div class="container flex items-center justify-between">
		<!-- Brand -->
		<a
			href="/"
			style="color: var(--text-primary); font-weight: 600; font-size: 0.9375rem; letter-spacing: -0.01em;"
			class="flex items-center gap-2 transition-opacity duration-[120ms] hover:opacity-70"
		>
			<svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
				<rect width="18" height="18" rx="4" fill="currentColor" fill-opacity="0.9"/>
				<path d="M5 13L9 5l4 8" stroke="var(--bg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
			</svg>
			Launchpad
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-1">
			{#each links as link}
				<a
					href={link.href}
					style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 450; padding: 6px 12px; border-radius: 6px;"
					class="transition-colors duration-[120ms] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.04)]"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Actions -->
		<div class="hidden md:flex items-center gap-2">
			{#if user}
				<a
					href={user.role === 'admin' || user.role === 'owner' ? '/dashboard/settings' : '/dashboard'}
					style="display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; border-radius: 6px; transition: background 120ms ease; text-decoration: none;"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-elevated)'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'transparent'}
				>
					{#if user.image}
						<img src={user.image} alt="Avatar" style="width: 28px; height: 28px; border-radius: 9999px; border: 1px solid var(--border);" />
					{:else}
						<div style="width: 28px; height: 28px; border-radius: 9999px; background: var(--bg-elevated); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center; font-size: 0.6875rem; font-weight: 600; color: var(--text-secondary);">
							{initials}
						</div>
					{/if}
					<span style="font-size: 0.8125rem; color: var(--text-primary); font-weight: 450;">Dashboard</span>
				</a>
				<button
					onclick={handleSignOut}
					style="padding: 6px 12px; border-radius: 6px; background: none; border: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer; font-family: inherit; transition: all 120ms ease;"
					onmouseenter={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border-strong)'; el.style.color = 'var(--text-primary)'; }}
					onmouseleave={(e) => { const el = e.currentTarget as HTMLElement; el.style.borderColor = 'var(--border)'; el.style.color = 'var(--text-secondary)'; }}
				>
					Sign out
				</button>
			{:else}
				<Button variant="ghost" size="sm">
					<a href="/sign-in" style="color: inherit;">Sign in</a>
				</Button>
				<Button variant="primary" size="sm">
					<a href="/sign-in" style="color: inherit;">Get started</a>
				</Button>
			{/if}
		</div>

		<!-- Mobile toggle -->
		<button
			class="md:hidden p-2 rounded-md transition-colors duration-[120ms] hover:bg-[rgba(255,255,255,0.05)]"
			style="color: var(--text-secondary);"
			onclick={() => (menuOpen = !menuOpen)}
			aria-label="Toggle menu"
		>
			{#if menuOpen}
				<X size={18} />
			{:else}
				<Menu size={18} />
			{/if}
		</button>
	</div>
</nav>

<!-- Mobile drawer -->
{#if menuOpen}
	<div
		style="top: var(--nav-h); background: var(--bg); border-bottom: 1px solid var(--border);"
		class="fixed inset-x-0 z-40 flex flex-col md:hidden"
	>
		{#each links as link}
			<a
				href={link.href}
				onclick={() => (menuOpen = false)}
				style="padding: 14px 24px; color: var(--text-secondary); font-size: 0.9375rem; border-bottom: 1px solid var(--border);"
				class="transition-colors duration-[120ms] hover:text-[var(--text-primary)] hover:bg-[rgba(255,255,255,0.03)]"
			>
				{link.label}
			</a>
		{/each}
		<div style="padding: 16px 24px; display: flex; gap: 8px;">
			{#if user}
				<a href="/dashboard" onclick={() => (menuOpen = false)} style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Dashboard</a>
				<button onclick={handleSignOut} style="flex: 1; height: 40px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit;">Sign out</button>
			{:else}
				<a href="/sign-in" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Sign in</a>
				<a href="/sign-in" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--text-primary); color: var(--bg); border-radius: 6px; font-size: 0.875rem; font-weight: 500;">Get started</a>
			{/if}
		</div>
	</div>
{/if}
