<script lang="ts">
	import '../app.css';
	import Navbar from '$lib/components/ui/Navbar.svelte';
	import Footer from '$lib/components/ui/Footer.svelte';
	import MobileTabBar from '$lib/components/ui/MobileTabBar.svelte';
	import ToastProvider from '$lib/components/ui/ToastProvider.svelte';
	import GlobalLoadingScreen from '$lib/components/ui/GlobalLoadingScreen.svelte';
	import { page, navigating } from '$app/stores';
	import { themeStore } from '$lib/stores/theme';
	import { onMount } from 'svelte';

	let { children, data } = $props();

	onMount(() => {
		themeStore.init();
	});

	// Don't show layout elements on specific standalone routes (join classes, sign-in)
	let isAuthRoute = $derived($page.url.pathname.startsWith('/join') || $page.url.pathname.startsWith('/sign-in'));
	let isDashboardRoute = $derived($page.url.pathname.startsWith('/dashboard'));
	let isNavigating = $state(false);
	let navTimeout: any = null;

	$effect(() => {
		if ($navigating) {
			if (!navTimeout) {
				navTimeout = setTimeout(() => {
					isNavigating = true;
				}, 120);
			}
		} else {
			if (navTimeout) {
				clearTimeout(navTimeout);
				navTimeout = null;
			}
			isNavigating = false;
		}
		return () => {
			if (navTimeout) {
				clearTimeout(navTimeout);
				navTimeout = null;
			}
		};
	});
</script>

<ToastProvider />

{#if isNavigating}
	<GlobalLoadingScreen text="Loading" />
{/if}

<div class="app-layout" class:is-auth={isAuthRoute}>
	{#if !isAuthRoute}
		<Navbar user={data.user} />
	{/if}
	<main class="main-content" class:is-dashboard={isDashboardRoute}>
		{@render children()}
	</main>
	{#if !isAuthRoute && !isDashboardRoute}
		<Footer />
		<MobileTabBar />
	{/if}

	{#if data.isImpersonating}
		<form method="POST" action="/api/auth/stop-impersonating" class="fixed bottom-6 left-6 z-50">
			<button type="submit" class="bg-red-600 text-white px-6 py-3 rounded-full shadow-2xl font-bold flex items-center gap-2 hover:bg-red-700 transition-colors animate-pulse">
				<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline><line x1="21" y1="12" x2="9" y2="12"></line></svg>
				Exit Impersonation
			</button>
		</form>
	{/if}
</div>

<style>
	.app-layout {
		min-height: 100vh;
		width: 100%;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}
	.app-layout.is-auth .main-content {
		padding-top: 0;
	}
	.main-content {
		flex: 1;
		width: 100%;
		padding-top: var(--nav-h);
	}
	.main-content.is-dashboard {
		padding-top: 0;
	}
	@media (max-width: 900px) {
		.main-content.is-dashboard {
			padding-top: var(--nav-h);
		}
	}
	@media (max-width: 768px) {
		.main-content {
			padding-bottom: 64px; /* Space for mobile tab bar */
		}
	}
</style>
