<script lang="ts">
	import {
		Search,
		X,
		BookOpen,
		Video,
		Calendar,
		Users,
		Clock,
		ArrowRight,
		CheckCircle2,
		Award,
		Sparkles,
		Shield
	} from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.initialSearch || '');
	let selectedCategory = $state(data.initialCategory || 'All');
	let formatTab = $state<'all' | 'live' | 'self_paced'>('all');

	const predefinedCategories = ['All', 'Network Security', 'Cloud Security', 'Penetration Testing', 'Compliance'];

	const categories = $derived.by(() => {
		const cats = new Set(predefinedCategories);
		for (const c of [...(data.courses || []), ...(data.liveClasses || [])]) {
			const cat = (c.metadata as any)?.category;
			if (cat) cats.add(cat);
		}
		return Array.from(cats);
	});

	const allItems = $derived.by(() => {
		const live = (data.liveClasses || []).map((c: any) => ({
			...c,
			isLive: true,
			badge: 'LIVE COHORT',
			badgeColor: 'bg-zinc-950 text-white'
		}));
		const selfPaced = (data.courses || []).map((c: any) => ({
			...c,
			isLive: false,
			badge: 'PRACTICAL TRACK',
			badgeColor: 'bg-zinc-100 text-zinc-900 border border-zinc-200'
		}));
		return [...live, ...selfPaced];
	});

	const filteredItems = $derived.by(() => {
		let list = allItems;

		if (formatTab === 'live') {
			list = list.filter((i) => i.isLive);
		} else if (formatTab === 'self_paced') {
			list = list.filter((i) => !i.isLive);
		}

		if (selectedCategory && selectedCategory !== 'All') {
			list = list.filter((c: any) => (c.metadata as any)?.category === selectedCategory);
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((c: any) =>
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				((c.metadata as any)?.category || '').toLowerCase().includes(q)
			);
		}

		return list;
	});

	function clearFilters() {
		searchQuery = '';
		selectedCategory = 'All';
		formatTab = 'all';
	}
</script>

<svelte:head>
	<title>Live Classes & Cohorts &bull; Launchpad</title>
	<meta
		name="description"
		content="Practitioner-led live cybersecurity cohorts, hands-on Linux and SIEM detection labs, and small group mentorship."
	/>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">

	<!-- ── 1. FULL-WIDTH CINEMATIC HERO SECTION ──────────────────────── -->
	<section class="relative w-full bg-zinc-950 text-white border-b border-zinc-800/80 overflow-hidden select-none">
		<!-- Background Visual Elements -->
		<div class="absolute inset-0 pointer-events-none z-0">
			<img
				src="/thumbnails/practical-cybersecurity.jpg"
				alt="Live Classes Hero Backdrop"
				class="w-full h-full object-cover object-center opacity-30 filter brightness-90"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/50"></div>
			<div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40"></div>
		</div>

		<div class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 min-h-[500px] sm:min-h-[560px] flex flex-col justify-between">
			<!-- Top Eyebrow -->
			<div class="flex items-center gap-3 mb-6">
				<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold tracking-wider text-white uppercase">
					<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
					<span>LIVE CLASSES & COHORTS</span>
				</div>
				<span class="text-xs font-mono text-zinc-400 hidden sm:inline">
					&mdash; PRACTITIONER-LED DEFENSE ENGINEERING
				</span>
			</div>

			<!-- Center Content Grid -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-4">
				<!-- Left 8 cols: Title, Specs & Action -->
				<div class="lg:col-span-8 max-w-3xl">
					<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] mb-4">
						Live Classes & Cohorts
					</h1>
					<p class="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mb-8">
						Interactive, project-led engineering programs taught directly by active cybersecurity practitioners. Capped at 25 students for direct weekly code reviews, hands-on lab defense, and tactical career positioning.
					</p>

					<!-- Spec Pills -->
					<div class="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-300 mb-8">
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							25+ Live Interactive Hours
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Max 25 Students per Cohort
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Hands-on Linux & SIEM Labs
						</span>
					</div>

					<!-- CTAs -->
					<div class="flex flex-wrap items-center gap-5">
						<a
							href="/catalog/practical-cybersecurity"
							class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-100 transition shadow-xl active:scale-95"
						>
							<span>Explore Flagship Cohort</span>
							<ArrowRight size={16} />
						</a>
						<span class="text-xs sm:text-sm font-mono text-zinc-400">
							Enrolling Now &bull; MSET Academy Accredited
						</span>
					</div>
				</div>

				<!-- Right 4 cols: Featured Cohort Spotlight Card -->
				<div class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-left">
					<div class="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
						<span class="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
							Next Batch Enrolling
						</span>
						<span class="text-base font-mono font-bold text-white">
							₹15,999
						</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">
						Practical Cybersecurity: Beginner to Intermediate
					</h3>
					<div class="space-y-3 text-xs font-mono text-zinc-300 mb-6">
						<div class="flex items-center gap-2.5">
							<Users size={15} class="text-emerald-400 shrink-0" />
							<span>Strictly capped at 25 seats</span>
						</div>
						<div class="flex items-center gap-2.5">
							<Clock size={15} class="text-emerald-400 shrink-0" />
							<span>25+ Hours live interactive instruction</span>
						</div>
						<div class="flex items-center gap-2.5">
							<Award size={15} class="text-emerald-400 shrink-0" />
							<span>MSET Academy accredited credential</span>
						</div>
					</div>
					<a
						href="/catalog/practical-cybersecurity"
						class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-mono text-xs font-bold transition shadow-lg active:scale-95"
					>
						<span>View Curriculum & Batches</span>
						<ArrowRight size={14} />
					</a>
				</div>
			</div>
		</div>
	</section>

	<main class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">

		<!-- ── 2. FOUR PLATFORM PILLARS ───────────────────────────────── -->
		<section class="py-10 border-b border-zinc-200 mb-12">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">01 / Practice</span>
					<h3 class="text-sm font-bold text-zinc-950">Hands-on Learning</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Work with real enterprise tools, live networks, and continuous defensive scenarios.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">02 / Pathway</span>
					<h3 class="text-sm font-bold text-zinc-950">Beginner to Advanced</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Structured progression from Linux & networking to SIEM detection and SOAR automation.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">03 / Attention</span>
					<h3 class="text-sm font-bold text-zinc-950">Small Cohorts (Max 25)</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Strictly capped at 25 students per batch for direct weekly practitioner mentorship.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">04 / Verification</span>
					<h3 class="text-sm font-bold text-zinc-950">Capstone Project</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Architect and defend a real-world security pipeline accredited upon capstone defense.</p>
				</div>
			</div>
		</section>

		<!-- ── 3. CATALOGUE & FILTER BAR ──────────────────────────────── -->
		<section class="py-6">
			<!-- Header & Search -->
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
				<div>
					<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
						All Classes & Pathways
					</h2>
					<p class="text-xs sm:text-sm text-zinc-500 mt-1">
						Showing {filteredItems.length} technical offerings across live cohorts and practical tracks.
					</p>
				</div>

				<!-- Search Input -->
				<div class="w-full md:w-80 relative">
					<Search size={14} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search classes or topics..."
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

			<!-- Format Selector & Category Pills -->
			<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-4 border-b border-zinc-100">
				<!-- Format Tabs -->
				<div class="flex items-center gap-1.5 bg-zinc-100 p-1 rounded-xl">
					<button
						type="button"
						onclick={() => (formatTab = 'all')}
						class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
						class:bg-white={formatTab === 'all'}
						class:text-zinc-950={formatTab === 'all'}
						class:shadow-xs={formatTab === 'all'}
						class:text-zinc-500={formatTab !== 'all'}
					>
						All Formats
					</button>
					<button
						type="button"
						onclick={() => (formatTab = 'live')}
						class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5"
						class:bg-white={formatTab === 'live'}
						class:text-zinc-950={formatTab === 'live'}
						class:shadow-xs={formatTab === 'live'}
						class:text-zinc-500={formatTab !== 'live'}
					>
						<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
						<span>Live Cohorts</span>
					</button>
					<button
						type="button"
						onclick={() => (formatTab = 'self_paced')}
						class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition"
						class:bg-white={formatTab === 'self_paced'}
						class:text-zinc-950={formatTab === 'self_paced'}
						class:shadow-xs={formatTab === 'self_paced'}
						class:text-zinc-500={formatTab !== 'self_paced'}
					>
						Practical Tracks
					</button>
				</div>

				<!-- Category Pills -->
				<div class="flex items-center gap-2 overflow-x-auto no-scrollbar">
					{#each categories as cat}
						<button
							type="button"
							onclick={() => (selectedCategory = cat)}
							class="px-3.5 py-1.5 rounded-lg text-xs font-semibold transition whitespace-nowrap"
							class:bg-zinc-950={selectedCategory === cat}
							class:text-white={selectedCategory === cat}
							class:bg-zinc-100={selectedCategory !== cat}
							class:text-zinc-600={selectedCategory !== cat}
							class:hover:text-zinc-950={selectedCategory !== cat}
						>
							{cat}
						</button>
					{/each}
				</div>
			</div>

			<!-- Course Cards Grid -->
			{#if filteredItems.length === 0}
				<div class="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200">
					<BookOpen size={36} class="mx-auto text-zinc-400 mb-3" />
					<h3 class="text-base font-bold text-zinc-900">No classes match your criteria</h3>
					<p class="text-xs text-zinc-500 mt-1 mb-5">Try adjusting your search query or category filters.</p>
					<button
						type="button"
						onclick={clearFilters}
						class="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition"
					>
						Clear Filters
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
					{#each filteredItems as item (item.id)}
						<article class="rounded-3xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between group">
							<div>
								<!-- 16:9 Thumbnail -->
								<a href={`/catalog/${item.slug || item.id}`} class="block relative aspect-[16/9] overflow-hidden bg-zinc-100 border-b border-zinc-100">
									<img
										src={item.thumbnail || '/thumbnails/practical-cybersecurity.jpg'}
										alt={item.title}
										class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
									/>
									<div class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none">
										<span class="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs {item.badgeColor}">
											{item.badge}
										</span>
										<span class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-zinc-950 shadow-xs">
											{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(0)}`}
										</span>
									</div>
								</a>

								<!-- Body -->
								<div class="p-6">
									<div class="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2">
										<span>{(item.metadata as any)?.category || 'Cybersecurity'}</span>
										<span>&bull;</span>
										<span>{item.isLive ? 'Live Interactive' : 'Practical Track'}</span>
									</div>

									<h3 class="text-lg font-bold text-zinc-950 leading-snug group-hover:text-zinc-700 transition">
										<a href={`/catalog/${item.slug || item.id}`}>
											{item.title}
										</a>
									</h3>

									<p class="text-xs text-zinc-600 mt-2 line-clamp-2 leading-relaxed">
										{item.description || 'Hands-on practical engineering modules designed for enterprise security.'}
									</p>

									<div class="flex items-center gap-3 mt-4 text-xs font-mono text-zinc-500">
										{#if item.isLive}
											<div class="flex items-center gap-1.5 text-emerald-600 font-semibold">
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
												<span>Live Classes</span>
											</div>
										{/if}
										<div class="flex items-center gap-1">
											<Clock size={13} class="text-zinc-400" />
											<span>{(item.metadata as any)?.duration || 'Guided Track'}</span>
										</div>
									</div>
								</div>
							</div>

							<!-- Footer Action -->
							<div class="px-6 pb-6 pt-3 flex items-center justify-between border-t border-zinc-100 mt-auto">
								<span class="text-sm font-mono font-bold text-zinc-950">
									{item.pricePaise === 0 ? 'Free' : `₹${(item.pricePaise / 100).toFixed(0)}`}
								</span>
								<a
									href={`/catalog/${item.slug || item.id}`}
									class="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-xs"
								>
									<span>{item.isLive ? 'Explore Cohort' : 'View Track'}</span>
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
