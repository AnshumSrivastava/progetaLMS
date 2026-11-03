<script lang="ts">
	import { Calendar, ArrowRight, ShieldCheck } from 'lucide-svelte';

	let { mentor }: { mentor: any } = $props();

	const initials = $derived(
		mentor.name
			? mentor.name
					.split(' ')
					.filter(Boolean)
					.map((n: string) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: 'ME'
	);

	const specialties = $derived(mentor.specialties || ['Cloud Security', 'DevSecOps']);
	const targetUrl = $derived(`/mentoring/${mentor.handle || mentor.id}`);
</script>

<article class="rounded-3xl border border-zinc-200 bg-white p-6 sm:p-7 hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between group">
	<div>
		<!-- Avatar & Header Row -->
		<div class="flex items-center gap-3.5 mb-4">
			<div class="w-14 h-14 rounded-2xl bg-zinc-950 text-white font-bold text-base flex items-center justify-center shrink-0 overflow-hidden">
				{#if mentor.avatarUrl}
					<img src={mentor.avatarUrl} alt={mentor.name} class="w-full h-full object-cover" />
				{:else}
					<span>{initials}</span>
				{/if}
			</div>

			<div class="min-w-0">
				<div class="flex items-center gap-1.5">
					<h3 class="text-base font-bold text-zinc-950 truncate group-hover:text-zinc-700 transition">
						<a href={targetUrl}>
							{mentor.name}
						</a>
					</h3>
					<ShieldCheck size={14} class="text-emerald-500 shrink-0" />
				</div>
				<p class="text-xs text-zinc-500 truncate mt-0.5">{mentor.headline || 'Practitioner Mentor'}</p>
			</div>
		</div>

		<!-- Specialties Tags -->
		<div class="flex flex-wrap items-center gap-1.5 mb-4">
			{#each specialties.slice(0, 3) as tag}
				<span class="px-2.5 py-1 rounded-lg bg-zinc-100 text-zinc-700 text-[11px] font-mono font-medium">
					{tag}
				</span>
			{/each}
		</div>

		<!-- Bio snippet -->
		<p class="text-xs text-zinc-600 leading-relaxed line-clamp-3 mb-6">
			{mentor.bio || mentor.headline || 'Architecture reviews, career guidance, and hands-on technical mentoring with verified practitioners.'}
		</p>
	</div>

	<!-- Bottom Row -->
	<div class="pt-4 border-t border-zinc-100 flex items-center justify-between mt-auto">
		<div class="text-xs font-mono text-zinc-500">
			{#if mentor.lowestPricePaise > 0}
				<span class="font-bold text-zinc-950 font-sans">₹{(mentor.lowestPricePaise / 100).toFixed(0)}</span>
				<span class="text-[11px] text-zinc-400">/ session</span>
			{:else}
				<div class="flex items-center gap-1.5">
					<Calendar size={13} class="text-zinc-400" />
					<span>1-on-1 Sessions</span>
				</div>
			{/if}
		</div>

		<a
			href={targetUrl}
			class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-xs"
		>
			<span>Book 1-on-1</span>
			<ArrowRight size={13} />
		</a>
	</div>
</article>
