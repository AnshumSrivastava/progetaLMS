<script lang="ts">
	import { ArrowRight, Clock, BookOpen, Layers } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const category = $derived(
		course.metadata?.category ||
			(course.deliveryFormat === 'live_batch' ? 'LIVE BATCH' : 'SELF-PACED')
	);
	const level = $derived(course.metadata?.level || 'Intermediate');
	const duration = $derived(
		course.metadata?.duration || course.metadata?.hours || '8 Hours'
	);
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(
		free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`
	);
	const targetUrl = $derived(`/catalog/${course.slug || course.id}`);
	const thumbnail = $derived(course.thumbnail || null);

	const fallbackGradients = [
		'linear-gradient(135deg, #18181b 0%, #27272a 100%)',
		'linear-gradient(135deg, #09090b 0%, #1c1917 100%)',
		'linear-gradient(135deg, #1e1b4b 0%, #0f172a 100%)'
	];

	const cardGradient = $derived(
		fallbackGradients[Math.abs(course.title.length) % fallbackGradients.length]
	);
</script>

<div class="course-card group">
	<!-- Thumbnail Header -->
	<a href={targetUrl} class="block relative aspect-[16/10] overflow-hidden bg-[var(--color-surface-subtle)]">
		{#if thumbnail}
			<img
				src={thumbnail}
				alt={course.title}
				class="w-full h-full object-cover transition duration-300 group-hover:scale-105"
				loading="lazy"
			/>
		{:else}
			<div
				class="w-full h-full flex flex-col items-center justify-center p-6 text-center transition duration-300 group-hover:scale-105"
				style={`background: ${cardGradient};`}
			>
				<span class="text-xs uppercase tracking-widest font-mono text-white/50 mb-1">
					{category}
				</span>
				<span class="text-base font-bold text-white/90 line-clamp-2 px-4">
					{course.title}
				</span>
			</div>
		{/if}

		<!-- Top Badges Overlay -->
		<div class="absolute top-3 left-3 right-3 flex items-center justify-between gap-2 pointer-events-none">
			<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide uppercase shadow-sm bg-black/80 text-white backdrop-blur-md border border-white/10">
				<span>{category}</span>
			</span>

			<span class="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold tracking-wide shadow-sm"
				class:bg-emerald-500={free}
				class:text-white={free}
				class:bg-white={!free}
				class:text-black={!free}
			>
				{priceFormatted}
			</span>
		</div>
	</a>

	<!-- Content Body -->
	<div class="p-5 flex flex-col flex-1">
		<div class="flex items-center gap-2 text-xs font-mono font-medium text-[var(--text-muted)] mb-2">
			<span>{level}</span>
			<span>&bull;</span>
			<span class="flex items-center gap-1">
				<Clock size={12} />
				<span>{duration}</span>
			</span>
		</div>

		<!-- Title -->
		<h3 class="text-base font-bold text-[var(--text-primary)] hover:text-rose-600 transition-colors line-clamp-2 leading-snug mb-2">
			<a href={targetUrl} class="hover:underline">
				{course.title}
			</a>
		</h3>

		{#if course.description}
			<p class="text-xs text-[var(--text-secondary)] line-clamp-2 mb-4 leading-relaxed">
				{course.description}
			</p>
		{/if}

		<!-- Card Footer -->
		<div class="pt-3 border-t border-[var(--border-subtle)] mt-auto flex items-center justify-between gap-3">
			<div class="text-xs font-mono font-bold text-[var(--text-primary)]">
				{priceFormatted}
			</div>

			<a
				href={targetUrl}
				class="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-bold bg-[var(--color-primary)] text-white hover:bg-[var(--color-primary-hover)] transition active:scale-95 shadow-sm"
			>
				<span>View Course</span>
				<ArrowRight size={12} />
			</a>
		</div>
	</div>
</div>

<style>
	.course-card {
		background: var(--color-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		height: 100%;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.course-card:hover {
		border-color: var(--border-strong);
		transform: translateY(-2px);
		box-shadow: var(--card-shadow);
	}
</style>
