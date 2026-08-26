<script lang="ts">
	import { Menu, X, ArrowUpRight } from 'lucide-svelte';
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
	<div class="container-custom flex items-center justify-between w-full">
		<!-- Brand -->
		<a
			href="/"
			style="color: var(--text-primary); font-weight: 600; font-size: 0.9375rem; letter-spacing: -0.01em;"
			class="flex items-center gap-2.5 transition-opacity duration-[120ms] hover:opacity-80"
		>
			<div style="width: 26px; height: 26px; border-radius: 6px; background: var(--text-primary); color: var(--bg); display: flex; align-items: center; justify-content: center; font-weight: 700; font-size: 0.8125rem;">
				P
			</div>
			<span>Launchpad</span>
		</a>

		<!-- Desktop links -->
		<div class="hidden md:flex items-center gap-1">
			{#each links as link}
				<a
					href={link.href}
					style="color: var(--text-secondary); font-size: 0.875rem; font-weight: 500; padding: 6px 12px; border-radius: 6px;"
					class="transition-colors duration-[120ms] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]"
				>
					{link.label}
				</a>
			{/each}
		</div>

		<!-- Actions -->
		<div class="hidden md:flex items-center gap-3">
			{#if user}
				<a
					href="/dashboard"
					style="display: flex; align-items: center; gap: 8px; padding: 4px 10px 4px 4px; border-radius: 6px; border: 1px solid var(--border); background: var(--bg-subtle); text-decoration: none;"
					class="transition-colors duration-[120ms] hover:border-[var(--border-strong)]"
				>
					{#if user.image}
						<img src={user.image} alt="Avatar" style="width: 24px; height: 24px; border-radius: 9999px;" />
					{:else}
						<div style="width: 24px; height: 24px; border-radius: 9999px; background: var(--bg-elevated); display: flex; align-items: center; justify-content: center; font-size: 0.65rem; font-weight: 600; color: var(--text-secondary);">
							{initials}
						</div>
					{/if}
					<span style="font-size: 0.8125rem; color: var(--text-primary); font-weight: 500;">Dashboard</span>
				</a>
				<button
					onclick={handleSignOut}
					style="padding: 6px 12px; border-radius: 6px; background: none; border: 1px solid var(--border); font-size: 0.8125rem; color: var(--text-secondary); cursor: pointer; font-family: inherit;"
					class="transition-colors duration-[120ms] hover:text-[var(--text-primary)] hover:border-[var(--border-strong)]"
				>
					Sign out
				</button>
			{:else}
				<a href="/" style="font-size: 0.875rem; font-weight: 500; color: var(--text-secondary); padding: 6px 12px;" class="hover:text-[var(--text-primary)]">
					Sign in
				</a>
				<a href="/" style="font-size: 0.875rem; font-weight: 500; background: var(--text-primary); color: var(--bg); padding: 6px 14px; border-radius: 6px;" class="hover:opacity-90">
					Get started
				</a>
			{/if}
		</div>

		<!-- Mobile toggle -->
		<button
			class="md:hidden p-2 rounded-md transition-colors duration-[120ms] hover:bg-[var(--bg-elevated)]"
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
		style="top: var(--nav-h); background: var(--bg-subtle); border-bottom: 1px solid var(--border);"
		class="fixed inset-x-0 z-40 flex flex-col md:hidden"
	>
		{#each links as link}
			<a
				href={link.href}
				onclick={() => (menuOpen = false)}
				style="padding: 14px 24px; color: var(--text-secondary); font-size: 0.9375rem; border-bottom: 1px solid var(--border);"
				class="transition-colors duration-[120ms] hover:text-[var(--text-primary)]"
			>
				{link.label}
			</a>
		{/each}
		<div style="padding: 16px 24px; display: flex; gap: 8px;">
			{#if user}
				<a href="/dashboard" onclick={() => (menuOpen = false)} style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Dashboard</a>
				<button onclick={handleSignOut} style="flex: 1; height: 40px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px; font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit;">Sign out</button>
			{:else}
				<a href="/" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--bg-elevated); border: 1px solid var(--border-strong); border-radius: 6px; font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">Sign in</a>
				<a href="/" style="flex: 1; display: flex; align-items: center; justify-content: center; height: 40px; background: var(--text-primary); color: var(--bg); border-radius: 6px; font-size: 0.875rem; font-weight: 500;">Get started</a>
			{/if}
		</div>
	</div>
{/if}

