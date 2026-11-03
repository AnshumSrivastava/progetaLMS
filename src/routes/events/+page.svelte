<script lang="ts">
	import type { PageData } from './$types';
	import {
		Calendar,
		Clock,
		MapPin,
		Users,
		Coins,
		ArrowRight,
		CheckCircle2,
		Flame,
		Sparkles,
		Video,
		Search,
		X,
		Shield
	} from 'lucide-svelte';
	import CountdownTimer from '$lib/components/shared/CountdownTimer.svelte';

	let { data }: { data: PageData } = $props();

	let filterCategory = $state<string>('all');
	let searchQuery = $state('');

	const now = new Date();

	// Featured upcoming event
	const featuredEvent = $derived(
		data.events.find((e) => new Date(e.startAt) > now && e.isRegistrationOpen) || data.events[0] || null
	);

	const filterOptions = [
		{ value: 'all', label: 'All Sessions' },
		{ value: 'online', label: 'Online Streams' },
		{ value: 'offline', label: 'In-Person' },
		{ value: 'free', label: 'Free' },
		{ value: 'paid', label: 'Paid / Credits' }
	];

	const filteredEvents = $derived(
		(data.events || []).filter((e) => {
			if (filterCategory === 'online' && e.venueType !== 'online') return false;
			if (filterCategory === 'offline' && e.venueType === 'online') return false;
			if (filterCategory === 'free' && e.pricePaise > 0) return false;
			if (filterCategory === 'paid' && e.pricePaise === 0) return false;

			if (searchQuery.trim()) {
				const q = searchQuery.toLowerCase();
				return (
					e.title.toLowerCase().includes(q) ||
					(e.shortDescription || '').toLowerCase().includes(q)
				);
			}

			return true;
		})
	);
</script>

<svelte:head>
	<title>Sessions & Masterclasses &bull; Launchpad</title>
	<meta
		name="description"
		content="Join intensive live cybersecurity masterclasses, workshops, and practical sessions led by active practitioners."
	/>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">

	<!-- ── 1. FULL-WIDTH CINEMATIC HERO SECTION ──────────────────────── -->
	<section class="relative w-full bg-zinc-950 text-white border-b border-zinc-800/80 overflow-hidden select-none">
		<!-- Background Visual Elements -->
		<div class="absolute inset-y-0 right-0 w-full lg:w-3/5 pointer-events-none z-0 overflow-hidden flex justify-end">
			<img
				src="/thumbnails/social-engineering-poster.jpg"
				alt="Live Masterclasses Hero Backdrop"
				class="h-full w-auto max-w-none object-cover object-right opacity-35 filter brightness-110 contrast-125"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent"></div>
			<div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50"></div>
		</div>

		<div class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 min-h-[500px] sm:min-h-[560px] flex flex-col justify-between">
			<!-- Top Eyebrow -->
			<div class="flex items-center gap-3 mb-6">
				<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold tracking-wider text-white uppercase">
					<span class="w-2.5 h-2.5 bg-red-600 inline-block rounded-xs"></span>
					<span>LIVE MASTERCLASSES & WORKSHOPS</span>
				</div>
				<span class="text-xs font-mono text-zinc-400 hidden sm:inline">
					&mdash; CYBERSECURITY SERIES
				</span>
			</div>

			<!-- Center Stage -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-4">
				<!-- Left 8 cols: Typography & CTA -->
				<div class="lg:col-span-8 max-w-3xl">
					<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] mb-4">
						Sessions & Masterclasses
					</h1>
					<p class="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mb-8">
						Intensive, single-day technical sessions taught by practicing security researchers. Deep-dive into offensive reconnaissance, defensive containment, OSINT investigative methods, and incident response with full Q&A access.
					</p>

					<!-- Spec Chips -->
					<div class="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-300 mb-8">
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Live Online Interactive Streams
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Progeta Resource Packs Included
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Live Q&A + Session Recordings
						</span>
					</div>

					<!-- CTAs -->
					<div class="flex flex-wrap items-center gap-5">
						{#if featuredEvent}
							<a
								href={`/events/${featuredEvent.slug || featuredEvent.id}`}
								class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-red-600 hover:bg-red-500 text-white transition shadow-xl shadow-red-600/30 active:scale-95"
							>
								<span>Register for Next Masterclass (From ₹{(featuredEvent.pricePaise / 100).toFixed(0)})</span>
								<ArrowRight size={16} />
							</a>
						{/if}
						<span class="text-xs sm:text-sm font-mono text-zinc-400">
							Next Session: This Saturday &bull; 8:00 PM IST
						</span>
					</div>
				</div>

				<!-- Right 4 cols: Upcoming Event Spotlight Countdown Card -->
				{#if featuredEvent && new Date(featuredEvent.startAt) > now}
					<div class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-center">
						<div class="flex items-center justify-between mb-4 pb-3 border-b border-white/10">
							<span class="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5">
								<span class="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>
								Upcoming Masterclass
							</span>
							<span class="text-sm font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md">
								From ₹{(featuredEvent.pricePaise / 100).toFixed(0)}
							</span>
						</div>

						<h3 class="text-base font-bold text-white mb-4 line-clamp-1">
							{featuredEvent.title}
						</h3>

						<CountdownTimer targetDate={featuredEvent.startAt} variant="banner" />

						<a
							href={`/events/${featuredEvent.slug || featuredEvent.id}`}
							class="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-95"
						>
							<span>{featuredEvent.isRegistered ? 'View Session Hub' : `Passes from ₹${(featuredEvent.pricePaise / 100).toFixed(0)}`}</span>
							<ArrowRight size={14} />
						</a>

						<div class="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2">
							<span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
							<span>Progeta Resource Pack & Playbooks Included</span>
						</div>
					</div>
				{/if}
			</div>
		</div>
	</section>

	<main class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">

		<!-- ── 2. FOUR EVENT METHODOLOGY PILLARS ──────────────────────── -->
		<section class="py-10 border-b border-zinc-200 mb-12">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">01 / Delivery</span>
					<h3 class="text-sm font-bold text-zinc-950">Live Interactive Stream</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Real-time guided instruction, live terminal sharing, and active exploit teardowns.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">02 / Tooling</span>
					<h3 class="text-sm font-bold text-zinc-950">Hands-on Tooling</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Demonstrations using real open-source and enterprise-grade security tooling.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">03 / Takeaways</span>
					<h3 class="text-sm font-bold text-zinc-950">Resource Bundles</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Official presentation slides, detection playbooks, and checklists included.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">04 / Interaction</span>
					<h3 class="text-sm font-bold text-zinc-950">Extended Live Q&A</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Ask questions directly to the lead instructor during live dedicated office hours.</p>
				</div>
			</div>
		</section>

		<!-- ── 3. SESSIONS CATALOGUE & FILTER BAR ─────────────────────── -->
		<section class="py-6">
			<!-- Header & Search -->
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
				<div>
					<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
						All Masterclasses & Sessions
					</h2>
					<p class="text-xs sm:text-sm text-zinc-500 mt-1">
						Showing {filteredEvents.length} scheduled sessions and technical events.
					</p>
				</div>

				<!-- Search Input -->
				<div class="w-full md:w-80 relative">
					<Search size={14} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search sessions or topics..."
						class="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-400 transition"
					/>
					{#if searchQuery}
						<button
							type="button"
							onclick={() => (searchQuery = '')}
							class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
							aria-label="Clear search"
						>
							<X size={13} />
						</button>
					{/if}
				</div>
			</div>

			<!-- Filter Pills -->
			<div class="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-100">
				{#each filterOptions as opt}
					<button
						type="button"
						onclick={() => (filterCategory = opt.value)}
						class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap"
						class:bg-zinc-950={filterCategory === opt.value}
						class:text-white={filterCategory === opt.value}
						class:bg-zinc-100={filterCategory !== opt.value}
						class:text-zinc-600={filterCategory !== opt.value}
						class:hover:text-zinc-950={filterCategory !== opt.value}
					>
						{opt.label}
					</button>
				{/each}
			</div>

			<!-- Events Grid -->
			{#if filteredEvents.length === 0}
				<div class="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200">
					<Calendar size={36} class="mx-auto text-zinc-400 mb-3" />
					<h3 class="text-base font-bold text-zinc-950">No sessions found</h3>
					<p class="text-xs text-zinc-500 mt-1 mb-5">Try adjusting your filters or search terms.</p>
					<button
						type="button"
						onclick={() => { filterCategory = 'all'; searchQuery = ''; }}
						class="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition"
					>
						Reset Filters
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each filteredEvents as evt (evt.id)}
						<article class="rounded-3xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between group">
							<div>
								<!-- 16:9 Thumbnail -->
								<a href={`/events/${evt.slug}`} class="block relative aspect-[16/9] overflow-hidden bg-zinc-100 border-b border-zinc-100">
									<img
										src={evt.coverImageUrl || '/thumbnails/social-engineering-poster.jpg'}
										alt={evt.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
										<span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs {evt.venueType === 'online' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-white'}">
											{evt.venueType === 'online' ? 'LIVE MASTERCLASS' : 'IN-PERSON'}
										</span>
										<span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-zinc-950 shadow-xs">
											{evt.pricePaise === 0 ? 'Free' : `₹${(evt.pricePaise / 100).toFixed(0)}`}
										</span>
									</div>
								</a>

								<!-- Body -->
								<div class="p-6 sm:p-7">
									<div class="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
										<span>Progeta Technologies</span>
										<span>&bull;</span>
										<span>Live Stream</span>
									</div>

									<h3 class="text-xl font-bold text-zinc-950 leading-snug group-hover:text-zinc-700 transition">
										<a href={`/events/${evt.slug}`}>
											{evt.title}
										</a>
									</h3>

									<p class="text-xs sm:text-sm text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
										{evt.shortDescription || 'Live interactive session on offensive and defensive cybersecurity.'}
									</p>

									<div class="space-y-2 mt-4 pt-4 border-t border-zinc-100 text-xs font-mono text-zinc-500">
										<div class="flex items-center gap-2">
											<Calendar size={13} class="text-zinc-400" />
											<span>{new Date(evt.startAt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
										</div>
										<div class="flex items-center gap-2">
											<Clock size={13} class="text-zinc-400" />
											<span>{new Date(evt.startAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} IST</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Footer Action -->
							<div class="px-6 sm:px-7 pb-6 sm:pb-7 pt-2 flex items-center justify-between border-t border-zinc-100 mt-auto">
								<span class="text-sm font-mono font-bold text-zinc-950">
									{evt.pricePaise === 0 ? 'Free' : `From ₹${(evt.pricePaise / 100).toFixed(0)}`}
								</span>
								<a
									href={`/events/${evt.slug || evt.id}`}
									class="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition active:scale-95 shadow-xs {evt.isRegistered ? 'bg-emerald-600 hover:bg-emerald-500 text-white' : 'bg-zinc-950 hover:bg-zinc-800 text-white'}"
								>
									<span>{evt.isRegistered ? 'Registered' : (evt.pricePaise === 0 ? 'Register Free' : `Passes from ₹${(evt.pricePaise / 100).toFixed(0)}`)}</span>
									<ArrowRight size={13} />
								</a>
							</div>
						</article>
					{/each}
				</div>
			{/if}
		</section>

	</main>
</div>
