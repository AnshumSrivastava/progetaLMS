<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		Search,
		X,
		Users,
		Calendar,
		Sparkles,
		Clock,
		ArrowRight,
		CheckCircle2,
		ShieldCheck,
		Video
	} from 'lucide-svelte';
	import MentorCard from '$lib/components/ui/MentorCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedSpecialty = $state('All');

	const allSpecialties = $derived.by(() => {
		const specs = new Set(['All']);
		for (const m of data.mentors || []) {
			for (const s of m.specialties || []) {
				if (s) specs.add(s);
			}
		}
		return Array.from(specs);
	});

	const filteredMentors = $derived.by(() => {
		let list = data.mentors || [];

		// Specialty filter
		if (selectedSpecialty && selectedSpecialty !== 'All') {
			list = list.filter((m: any) =>
				(m.specialties || []).some(
					(s: string) => s.toLowerCase() === selectedSpecialty.toLowerCase()
				)
			);
		}

		// Search filter
		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(m: any) =>
					(m.name || '').toLowerCase().includes(q) ||
					(m.bio && m.bio.toLowerCase().includes(q)) ||
					(m.headline && m.headline.toLowerCase().includes(q)) ||
					(m.specialties &&
						m.specialties.some((s: string) => s.toLowerCase().includes(q)))
			);
		}

		return list;
	});

	function clearFilters() {
		searchQuery = '';
		selectedSpecialty = 'All';
	}
</script>

<svelte:head>
	<title>1-on-1 Mentorship &bull; Launchpad</title>
	<meta
		name="description"
		content="Book private technical coaching, architecture reviews, and mock interview guidance with vetted practitioners."
	/>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">

	<!-- ── 1. FULL-WIDTH CINEMATIC HERO SECTION ──────────────────────── -->
	<section class="relative w-full bg-zinc-950 text-white border-b border-zinc-800/80 overflow-hidden select-none">
		<!-- Background Visual Elements -->
		<div class="absolute inset-0 pointer-events-none z-0">
			<img
				src="/thumbnails/hero-portal.jpg"
				alt="Mentorship Hero Backdrop"
				class="w-full h-full object-cover object-center opacity-30 filter brightness-90"
			/>
			<div class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/50"></div>
			<div class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40"></div>
		</div>

		<div class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 min-h-[500px] sm:min-h-[560px] flex flex-col justify-between">
			<!-- Top Eyebrow -->
			<div class="flex items-center gap-3 mb-6">
				<div class="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-black/60 backdrop-blur-md border border-white/15 text-[11px] font-mono font-bold tracking-wider text-white uppercase">
					<span class="w-2 h-2 rounded-full bg-emerald-400"></span>
					<span>1-ON-1 PRACTITIONER MENTORSHIP</span>
				</div>
				<span class="text-xs font-mono text-zinc-400 hidden sm:inline">
					&mdash; DEDICATED TECHNICAL GUIDANCE
				</span>
			</div>

			<!-- Center Stage -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-4">
				<!-- Left 8 cols: Title, Specs & Action -->
				<div class="lg:col-span-8 max-w-3xl">
					<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] mb-4">
						Private Technical Mentorship
					</h1>
					<p class="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mb-8">
						Dedicated one-on-one sessions with active cybersecurity engineers. Book personalized mock technical interviews, system design teardowns, resume audits, and tactical career positioning.
					</p>

					<!-- Spec Pills -->
					<div class="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-300 mb-8">
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							45-Minute Private Sessions
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Architecture & Code Reviews
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Mock Technical Interviews
						</span>
					</div>

					<!-- CTAs -->
					<div class="flex flex-wrap items-center gap-5">
						<a
							href="#browse-mentors"
							class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-100 transition shadow-xl active:scale-95"
						>
							<span>Browse Verified Mentors</span>
							<ArrowRight size={16} />
						</a>
						<span class="text-xs sm:text-sm font-mono text-zinc-400">
							Direct Calendar Booking &bull; Instant Confirmation
						</span>
					</div>
				</div>

				<!-- Right 4 cols: Spotlight Feature Card -->
				<div class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-left">
					<div class="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
						<span class="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
							Direct 1-on-1 Access
						</span>
						<span class="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-md">
							45 Mins
						</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">
						Tailored Engineering Guidance
					</h3>
					<div class="space-y-3 text-xs font-mono text-zinc-300 mb-6">
						<div class="flex items-center gap-2.5">
							<Video size={15} class="text-emerald-400 shrink-0" />
							<span>Private 1-on-1 video call</span>
						</div>
						<div class="flex items-center gap-2.5">
							<Sparkles size={15} class="text-emerald-400 shrink-0" />
							<span>Live architecture & code review</span>
						</div>
						<div class="flex items-center gap-2.5">
							<CheckCircle2 size={15} class="text-emerald-400 shrink-0" />
							<span>Actionable takeaways & roadmap</span>
						</div>
					</div>
					<a
						href="#browse-mentors"
						class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-mono text-xs font-bold transition shadow-lg active:scale-95"
					>
						<span>Select a Mentor</span>
						<ArrowRight size={14} />
					</a>
				</div>
			</div>
		</div>
	</section>

	<main class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">

		<!-- ── 2. FOUR MENTORSHIP PILLARS ─────────────────────────────── -->
		<section class="py-10 border-b border-zinc-200 mb-12">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">01 / Practitioner</span>
					<h3 class="text-sm font-bold text-zinc-950">Vetted Practitioners</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Verified engineers actively working in defense, security architecture, and red teaming.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">02 / Dedication</span>
					<h3 class="text-sm font-bold text-zinc-950">1-on-1 Dedicated Time</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Private live sessions focused 100% on your specific codebase, questions, or goals.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">03 / Auditing</span>
					<h3 class="text-sm font-bold text-zinc-950">Architecture Reviews</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Hands-on code audits, threat modeling, and defensive architecture teardowns.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">04 / Scheduling</span>
					<h3 class="text-sm font-bold text-zinc-950">Flexible Scheduling</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Seamless calendar integration with instant confirmed slots across global timezones.</p>
				</div>
			</div>
		</section>

		<!-- ── 3. MENTORS CATALOGUE & FILTER BAR ──────────────────────── -->
		<section class="py-6" id="browse-mentors">
			<!-- Header & Search -->
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
				<div>
					<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
						Verified Mentors & Specialists
					</h2>
					<p class="text-xs sm:text-sm text-zinc-500 mt-1">
						Showing {filteredMentors.length} verified practitioners available for 1-on-1 bookings.
					</p>
				</div>

				<!-- Search Input -->
				<div class="w-full md:w-80 relative">
					<Search size={14} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search mentors by name or topic..."
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

			<!-- Filter Category Pills -->
			<div class="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-100">
				{#each allSpecialties as specialty}
					<button
						type="button"
						onclick={() => (selectedSpecialty = specialty)}
						class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap"
						class:bg-zinc-950={selectedSpecialty === specialty}
						class:text-white={selectedSpecialty === specialty}
						class:bg-zinc-100={selectedSpecialty !== specialty}
						class:text-zinc-600={selectedSpecialty !== specialty}
						class:hover:text-zinc-950={selectedSpecialty !== specialty}
					>
						{specialty === 'All' ? 'All Specialties' : specialty}
					</button>
				{/each}
			</div>

			<!-- Mentors Grid -->
			{#if filteredMentors.length === 0}
				<div class="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200">
					<Users size={36} class="mx-auto text-zinc-400 mb-3" />
					<h3 class="text-base font-bold text-zinc-950">No mentors found</h3>
					<p class="text-xs text-zinc-500 mt-1 mb-5">Try adjusting your specialty filter or search keywords.</p>
					<button
						type="button"
						onclick={clearFilters}
						class="px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition"
					>
						Clear Filters
					</button>
				</div>
			{:else}
				<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
					{#each filteredMentors as mentor (mentor.id || mentor.handle || mentor.name)}
						<MentorCard {mentor} />
					{/each}
				</div>
			{/if}
		</section>

	</main>
</div>
