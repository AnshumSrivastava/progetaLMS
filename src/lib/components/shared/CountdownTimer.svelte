<script lang="ts">
	import { onDestroy, onMount } from 'svelte';

	let {
		targetDate,
		variant = 'banner' // 'banner' | 'card' | 'inline' | 'editorial'
	}: {
		targetDate: Date | string | number;
		variant?: 'banner' | 'card' | 'inline' | 'editorial';
	} = $props();

	let days = $state(0);
	let hours = $state(0);
	let minutes = $state(0);
	let seconds = $state(0);
	let isPast = $state(false);

	let timer: any = null;

	function calculateTime() {
		const target = new Date(targetDate).getTime();
		const now = Date.now();
		const diff = target - now;

		if (diff <= 0) {
			isPast = true;
			days = 0;
			hours = 0;
			minutes = 0;
			seconds = 0;
			if (timer) clearInterval(timer);
			return;
		}

		isPast = false;
		days = Math.floor(diff / (1000 * 60 * 60 * 24));
		hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
		minutes = Math.floor((diff / 1000 / 60) % 60);
		seconds = Math.floor((diff / 1000) % 60);
	}

	onMount(() => {
		calculateTime();
		timer = setInterval(calculateTime, 1000);
	});

	onDestroy(() => {
		if (timer) clearInterval(timer);
	});
</script>

{#if isPast}
	<span class="inline-flex items-center text-xs font-semibold uppercase tracking-wider text-[var(--semantic-danger)]">
		Live Now / Ended
	</span>
{:else if variant === 'editorial'}
	<!-- Clean Editorial Light Style -->
	<div class="grid grid-cols-4 gap-2 text-center">
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-white border border-[#e4e4e7] shadow-xs min-w-[50px] sm:min-w-[58px]">
			<span class="text-lg sm:text-xl font-bold text-[#09090b] leading-none font-mono tracking-tight">{days}</span>
			<span class="text-[9px] sm:text-[10px] font-semibold text-[#71717a] uppercase mt-1">Days</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-white border border-[#e4e4e7] shadow-xs min-w-[50px] sm:min-w-[58px]">
			<span class="text-lg sm:text-xl font-bold text-[#09090b] leading-none font-mono tracking-tight">{hours.toString().padStart(2, '0')}</span>
			<span class="text-[9px] sm:text-[10px] font-semibold text-[#71717a] uppercase mt-1">Hours</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-white border border-[#e4e4e7] shadow-xs min-w-[50px] sm:min-w-[58px]">
			<span class="text-lg sm:text-xl font-bold text-[#09090b] leading-none font-mono tracking-tight">{minutes.toString().padStart(2, '0')}</span>
			<span class="text-[9px] sm:text-[10px] font-semibold text-[#71717a] uppercase mt-1">Mins</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-xl bg-white border border-[#e4e4e7] shadow-xs min-w-[50px] sm:min-w-[58px]">
			<span class="text-lg sm:text-xl font-bold text-[#09090b] leading-none font-mono tracking-tight">{seconds.toString().padStart(2, '0')}</span>
			<span class="text-[9px] sm:text-[10px] font-semibold text-[#71717a] uppercase mt-1">Secs</span>
		</div>
	</div>
{:else if variant === 'banner'}
	<!-- Red / High-Contrast Banner Style (Reference Image Style) -->
	<div class="grid grid-cols-4 gap-2 sm:gap-3 text-center">
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg bg-white/10 backdrop-blur-xs min-w-[54px] sm:min-w-[64px] border border-white/15">
			<span class="text-xl sm:text-2xl font-black text-white leading-none font-mono tracking-tight">{days}</span>
			<span class="text-[10px] sm:text-[11px] font-medium text-white/80 uppercase mt-1">Days</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg bg-white/10 backdrop-blur-xs min-w-[54px] sm:min-w-[64px] border border-white/15">
			<span class="text-xl sm:text-2xl font-black text-white leading-none font-mono tracking-tight">{hours.toString().padStart(2, '0')}</span>
			<span class="text-[10px] sm:text-[11px] font-medium text-white/80 uppercase mt-1">Hours</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg bg-white/10 backdrop-blur-xs min-w-[54px] sm:min-w-[64px] border border-white/15">
			<span class="text-xl sm:text-2xl font-black text-white leading-none font-mono tracking-tight">{minutes.toString().padStart(2, '0')}</span>
			<span class="text-[10px] sm:text-[11px] font-medium text-white/80 uppercase mt-1">Mins</span>
		</div>
		<div class="flex flex-col items-center justify-center p-2 sm:p-2.5 rounded-lg bg-white/10 backdrop-blur-xs min-w-[54px] sm:min-w-[64px] border border-white/15">
			<span class="text-xl sm:text-2xl font-black text-white leading-none font-mono tracking-tight">{seconds.toString().padStart(2, '0')}</span>
			<span class="text-[10px] sm:text-[11px] font-medium text-white/80 uppercase mt-1">Secs</span>
		</div>
	</div>
{:else if variant === 'card'}
	<!-- Subdued Card Style -->
	<div class="flex items-center gap-1.5 font-mono text-xs font-semibold px-2.5 py-1 rounded-md bg-[var(--color-surface-elevated)] border border-[var(--border)] text-[var(--text-primary)]">
		<span>{days}d</span>
		<span class="text-[var(--text-muted)]">:</span>
		<span>{hours.toString().padStart(2, '0')}h</span>
		<span class="text-[var(--text-muted)]">:</span>
		<span>{minutes.toString().padStart(2, '0')}m</span>
		<span class="text-[var(--text-muted)]">:</span>
		<span>{seconds.toString().padStart(2, '0')}s</span>
	</div>
{:else}
	<!-- Inline Text Style -->
	<span class="font-mono text-xs font-semibold text-[var(--color-accent-red)]">
		{days}d {hours}h {minutes}m {seconds}s
	</span>
{/if}

