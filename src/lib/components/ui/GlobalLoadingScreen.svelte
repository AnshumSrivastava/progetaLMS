<script lang="ts">
	import LaunchpadLogo from './LaunchpadLogo.svelte';

	let { text = 'Loading' }: { text?: string } = $props();
</script>

<div class="fixed inset-0 z-[9999] bg-[var(--color-background)] flex flex-col items-center justify-center p-4 transition-opacity duration-300">
	<div class="flex flex-col items-center gap-4">
		<div class="launchpad-pulse-mark">
			<LaunchpadLogo class="w-10 h-10 text-[var(--color-text)]" />
		</div>
		<span class="meta-mono text-[11px] text-[var(--color-text-muted)] tracking-widest uppercase">
			{text}
		</span>
	</div>
</div>

<style>
	.launchpad-pulse-mark {
		animation: mark-fade-pulse 1.8s ease-in-out infinite;
	}

	@keyframes mark-fade-pulse {
		0%, 100% {
			opacity: 0.35;
			transform: scale(0.97);
		}
		50% {
			opacity: 1;
			transform: scale(1.03);
		}
	}
</style>
