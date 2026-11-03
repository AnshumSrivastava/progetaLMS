<script lang="ts">
	import { Calendar, MapPin, Users, Coins, ArrowRight, CheckCircle2, Video } from 'lucide-svelte';

	interface EventItem {
		id: string;
		slug: string;
		title: string;
		shortDescription?: string | null;
		description?: string | null;
		thumbnailUrl?: string | null;
		category?: string | null;
		eventType: 'free' | 'paid';
		pricePaise: number;
		creditCost: number;
		venueType: 'online' | 'offline';
		venueAddress?: string | null;
		startAt: string | Date;
		endAt: string | Date;
		attendeeCount?: number;
		maxCapacity?: number | null;
		isRegistered?: boolean;
	}

	let {
		event,
		onRegister
	}: {
		event: EventItem;
		onRegister?: (evt: EventItem) => void;
	} = $props();

	function formatDate(d: string | Date) {
		const date = new Date(d);
		return date.toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}

	function formatTime(d: string | Date) {
		const date = new Date(d);
		return date.toLocaleTimeString('en-US', {
			hour: 'numeric',
			minute: '2-digit',
			hour12: true
		});
	}

	const isPaid = $derived(event.eventType === 'paid' && event.pricePaise > 0);
	const priceFormatted = $derived(
		isPaid ? `₹${(event.pricePaise / 100).toFixed(0)}` : 'Free'
	);

	// Fallback dynamic thumbnail gradients for events without images
	const fallbackGradients = [
		'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
		'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
		'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)',
		'linear-gradient(135deg, #14532d 0%, #064e3b 100%)'
	];

	const cardGradient = $derived(
		fallbackGradients[Math.abs(event.title.length) % fallbackGradients.length]
	);
</script>

<div class="event-card group">
	<!-- Thumbnail Area -->
	<a href={`/events/${event.slug}`} class="block relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-subtle)]">
		{#if event.thumbnailUrl}
			<img
				src={event.thumbnailUrl}
				alt={event.title}
				class="w-full h-full object-cover transition duration-300 group-hover:scale-105"
				loading="lazy"
			/>
		{:else}
			<div
				class="w-full h-full flex flex-col items-center justify-center p-6 text-center transition duration-300 group-hover:scale-105"
				style={`background: ${cardGradient};`}
			>
				{#if event.category}
					<span class="text-xs uppercase tracking-widest font-mono text-white/50 mb-1">
						{event.category}
					</span>
				{/if}
				<span class="text-base font-bold text-white/90 line-clamp-2 px-4">
					{event.title}
				</span>
			</div>
		{/if}

		<!-- Top Badges Overlay -->
		<div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm bg-black/80 text-white backdrop-blur-md border border-white/10">
				{#if event.venueType === 'online'}
					<Video size={12} class="text-emerald-400" />
					<span>Online</span>
				{:else}
					<MapPin size={12} class="text-amber-400" />
					<span>In-Person</span>
				{/if}
			</span>

			<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm"
				class:bg-emerald-500={!isPaid}
				class:text-white={!isPaid}
				class:bg-white={isPaid}
				class:text-black={isPaid}
			>
				{priceFormatted}
			</span>
		</div>
	</a>

	<!-- Body Details -->
	<div class="p-5 flex flex-col flex-1">
		<!-- Date & Time -->
		<div class="flex items-center gap-2 text-xs font-medium text-[var(--color-accent-red)] mb-2">
			<Calendar size={13} class="shrink-0" />
			<span>{formatDate(event.startAt)} &bull; {formatTime(event.startAt)}</span>
		</div>

		<!-- Title -->
		<a href={`/events/${event.slug}`} class="text-base font-bold text-[var(--text-primary)] hover:text-[var(--color-accent-red)] transition-colors line-clamp-2 leading-snug mb-2">
			{event.title}
		</a>

		<!-- Short description snippet -->
		{#if event.shortDescription}
			<p class="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
				{event.shortDescription}
			</p>
		{/if}

		<!-- Location / Venue Row -->
		<div class="flex items-center gap-1.5 text-xs text-[var(--text-muted)] mb-3 mt-auto">
			<MapPin size={13} class="shrink-0" />
			<span class="truncate">
				{event.venueType === 'online' ? 'Live Online Session' : (event.venueAddress || 'Venue details provided upon booking')}
			</span>
		</div>

		<!-- Social Proof & Action Footer -->
		<div class="pt-3 border-t border-[var(--border-subtle)] flex items-center justify-between gap-3">
			<div class="flex items-center gap-1.5 text-xs text-[var(--text-secondary)] font-medium">
				{#if typeof event.attendeeCount === 'number' && event.attendeeCount > 0}
					<Users size={13} class="text-[var(--text-muted)]" />
					<span>{event.attendeeCount} enrolled</span>
				{:else if event.maxCapacity}
					<span class="text-[11px] text-[var(--text-muted)] font-mono">{event.maxCapacity} seats max</span>
				{:else}
					<span class="text-[11px] text-[var(--text-muted)]">Open for booking</span>
				{/if}
			</div>

			{#if event.isRegistered}
				<a
					href={`/events/${event.slug}`}
					class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-500/30"
				>
					<CheckCircle2 size={13} />
					<span>Registered</span>
				</a>
			{:else}
				<div class="flex items-center gap-2">
					{#if event.creditCost > 0}
						<span class="text-[11px] font-semibold text-[var(--text-muted)] hidden sm:inline font-mono">
							{event.creditCost} cr
						</span>
					{/if}
					{#if onRegister}
						<button
							type="button"
							onclick={() => onRegister(event)}
							class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-sm"
						>
							<span>Book</span>
							<ArrowRight size={12} />
						</button>
					{:else}
						<a
							href={`/events/${event.slug}`}
							class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition shadow-sm"
						>
							<span>View</span>
							<ArrowRight size={12} />
						</a>
					{/if}
				</div>
			{/if}
		</div>
	</div>
</div>

<style>
	.event-card {
		background: var(--color-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.event-card:hover {
		border-color: var(--border-strong);
		transform: translateY(-2px);
		box-shadow: var(--card-shadow);
	}
</style>
