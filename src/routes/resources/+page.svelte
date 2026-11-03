<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		Search,
		X,
		Download,
		FileText,
		CheckCircle2,
		Sparkles,
		Clock,
		ArrowRight,
		ShieldCheck,
		FolderGit2,
		BookOpen
	} from 'lucide-svelte';
	import ResourceCard from '$lib/components/ui/ResourceCard.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state('');
	let selectedSource = $state('All');

	const sources = [
		{ value: 'All', label: 'All Resources' },
		{ value: 'official', label: 'Progeta Official' },
		{ value: 'mentor', label: 'Mentor Shared' }
	];

	const filteredResources = $derived.by(() => {
		let list = data.resources || [];

		if (selectedSource === 'official') {
			list = list.filter((r) => r.source === 'platform');
		} else if (selectedSource === 'mentor') {
			list = list.filter((r) => r.source === 'mentor');
		}

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter(
				(r) =>
					r.title.toLowerCase().includes(q) ||
					(r.description || '').toLowerCase().includes(q) ||
					(r.ownerName || '').toLowerCase().includes(q) ||
					((r.metadata as any)?.category || '').toLowerCase().includes(q) ||
					((r.metadata as any)?.format || '').toLowerCase().includes(q)
			);
		}

		return list;
	});

	function clearFilters() {
		searchQuery = '';
		selectedSource = 'All';
	}
</script>

<svelte:head>
	<title>Resources & Artifacts &bull; Launchpad</title>
	<meta
		name="description"
		content="Cheatsheets, architecture blueprints, detection rules, and downloadable practitioner files."
	/>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">

	<!-- ── 1. FULL-WIDTH CINEMATIC HERO SECTION ──────────────────────── -->
	<section class="relative w-full bg-zinc-950 text-white border-b border-zinc-800/80 overflow-hidden select-none">
		<!-- Background Visual Elements -->
		<div class="absolute inset-0 pointer-events-none z-0">
			<img
				src="/thumbnails/lab-guided.jpg"
				alt="Resources Hero Backdrop"
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
					<span>TECHNICAL ARTIFACTS & PLAYBOOKS</span>
				</div>
				<span class="text-xs font-mono text-zinc-400 hidden sm:inline">
					&mdash; CURATED CYBERSECURITY VAULT
				</span>
			</div>

			<!-- Center Stage -->
			<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-4">
				<!-- Left 8 cols: Title, Specs & Action -->
				<div class="lg:col-span-8 max-w-3xl">
					<h1 class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04] mb-4">
						Technical Resources & Defense Checklists
					</h1>
					<p class="text-base sm:text-lg text-zinc-300 leading-relaxed max-w-2xl mb-8">
						Downloadable security playbooks, detection rules, architecture cheat sheets, and hardening guides curated by active practitioners and engineering teams.
					</p>

					<!-- Spec Pills -->
					<div class="flex flex-wrap items-center gap-2.5 text-xs sm:text-sm font-mono text-zinc-300 mb-8">
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Downloadable Blueprints & PDFs
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Sigma & YARA Detection Rules
						</span>
						<span class="px-3.5 py-2 rounded-xl bg-white/10 backdrop-blur-md border border-white/10">
							Free with Enrolled Programs
						</span>
					</div>

					<!-- CTAs -->
					<div class="flex flex-wrap items-center gap-5">
						<a
							href="#browse-resources"
							class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold bg-white text-zinc-950 hover:bg-zinc-100 transition shadow-xl active:scale-95"
						>
							<span>Browse Resource Vault</span>
							<ArrowRight size={16} />
						</a>
						<span class="text-xs sm:text-sm font-mono text-zinc-400">
							Instant Downloads &bull; Unlocked with Programs
						</span>
					</div>
				</div>

				<!-- Right 4 cols: Feature Spotlight Card -->
				<div class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-left">
					<div class="flex items-center justify-between mb-5 pb-3 border-b border-white/10">
						<span class="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
							Progeta Engineering Vault
						</span>
						<span class="text-xs font-mono font-bold text-white bg-white/10 px-2.5 py-1 rounded-md">
							PDF & Rules
						</span>
					</div>
					<h3 class="text-lg font-bold text-white mb-2">
						Enterprise Defense Bundles
					</h3>
					<div class="space-y-3 text-xs font-mono text-zinc-300 mb-6">
						<div class="flex items-center gap-2.5">
							<FileText size={15} class="text-emerald-400 shrink-0" />
							<span>Comprehensive step-by-step guides</span>
						</div>
						<div class="flex items-center gap-2.5">
							<FolderGit2 size={15} class="text-emerald-400 shrink-0" />
							<span>Tested SIEM rules & SOAR playbooks</span>
						</div>
						<div class="flex items-center gap-2.5">
							<ShieldCheck size={15} class="text-emerald-400 shrink-0" />
							<span>Verified by Launchpad practitioners</span>
						</div>
					</div>
					<a
						href="#browse-resources"
						class="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-mono text-xs font-bold transition shadow-lg active:scale-95"
					>
						<span>Explore Vault Assets</span>
						<ArrowRight size={14} />
					</a>
				</div>
			</div>
		</div>
	</section>

	<main class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">

		<!-- ── 2. FOUR RESOURCE METHODOLOGY PILLARS ───────────────────── -->
		<section class="py-10 border-b border-zinc-200 mb-12">
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">01 / Documentation</span>
					<h3 class="text-sm font-bold text-zinc-950">Field Guides</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">In-depth reference manuals covering terminal tooling, log analysis, and system architecture.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">02 / Detection</span>
					<h3 class="text-sm font-bold text-zinc-950">Detection Rules</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Ready-to-deploy Sigma, YARA, and regex rules tested against common adversary tactics.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">03 / Auditing</span>
					<h3 class="text-sm font-bold text-zinc-950">Hardening Checklists</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Actionable baseline checklists for Linux, Docker, AWS, and enterprise networks.</p>
				</div>
				<div class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition space-y-1.5">
					<span class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block">04 / Accessibility</span>
					<h3 class="text-sm font-bold text-zinc-950">Instant Access</h3>
					<p class="text-xs text-zinc-500 leading-relaxed">Direct PDF downloads and copy-paste detection logic unlocked with any program enrollment.</p>
				</div>
			</div>
		</section>

		<!-- ── 3. RESOURCES CATALOGUE & FILTER BAR ────────────────────── -->
		<section class="py-6" id="browse-resources">
			<!-- Header & Search -->
			<div class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8">
				<div>
					<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
						Resource Library & Artifacts
					</h2>
					<p class="text-xs sm:text-sm text-zinc-500 mt-1">
						Showing {filteredResources.length} technical playbooks, guides, and defense frameworks.
					</p>
				</div>

				<!-- Search Input -->
				<div class="w-full md:w-80 relative">
					<Search size={14} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search resources by keyword..."
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
				{#each sources as src}
					<button
						type="button"
						onclick={() => (selectedSource = src.value)}
						class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap"
						class:bg-zinc-950={selectedSource === src.value}
						class:text-white={selectedSource === src.value}
						class:bg-zinc-100={selectedSource !== src.value}
						class:text-zinc-600={selectedSource !== src.value}
						class:hover:text-zinc-950={selectedSource !== src.value}
					>
						{src.label}
					</button>
				{/each}
			</div>

			<!-- Resources Grid -->
			{#if filteredResources.length === 0}
				<div class="text-center py-20 bg-zinc-50 rounded-3xl border border-zinc-200">
					<BookOpen size={36} class="mx-auto text-zinc-400 mb-3" />
					<h3 class="text-base font-bold text-zinc-950">No resources found</h3>
					<p class="text-xs text-zinc-500 mt-1 mb-5">Try adjusting your search query or filter options.</p>
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
					{#each filteredResources as resource (resource.id)}
						<ResourceCard {resource} />
					{/each}
				</div>
			{/if}
		</section>

	</main>
</div>
