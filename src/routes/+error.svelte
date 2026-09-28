<script lang="ts">
	import { page } from '$app/stores';
	import { ArrowLeft } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import LaunchpadLogo from '$lib/components/ui/LaunchpadLogo.svelte';

	let status = $derived($page.status || 404);
	let message = $derived(status === 404 ? "This path doesn't lead anywhere." : ($page.error?.message || "Something went wrong."));
</script>

<svelte:head>
	<title>{status} — Launchpad</title>
</svelte:head>

<div class="min-h-[calc(100vh-var(--nav-h))] bg-[var(--color-background)] flex flex-col items-center justify-center p-6 text-center">
	<div class="max-w-md w-full space-y-6">
		<div class="w-12 h-12 rounded-full bg-[var(--color-surface)] border border-[var(--color-border)] flex items-center justify-center mx-auto shadow-xs">
			<LaunchpadLogo class="w-6 h-6 text-[var(--color-text)]" />
		</div>

		<div class="space-y-2">
			<span class="meta-mono text-[11px] text-[var(--color-text-muted)] tracking-widest">{status} ERROR</span>
			<h1 class="text-[2rem] font-bold text-[var(--color-text)] tracking-tight">
				{status === 404 ? 'Page Not Found' : 'Unexpected Error'}
			</h1>
			<p class="text-[14px] text-[var(--color-text-secondary)] leading-relaxed">
				{message}
			</p>
		</div>

		<div class="pt-4 flex items-center justify-center gap-3">
			<Button variant="primary" size="md" href="/catalog">
				<span>Return to Explore</span>
			</Button>
			<Button variant="secondary" size="md" href="/">
				<span>Home</span>
			</Button>
		</div>
	</div>
</div>
