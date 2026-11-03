<script lang="ts">
	import type { PageData } from './$types';
	import { goto } from '$app/navigation';
	import {
		Calendar,
		Clock,
		MapPin,
		Users,
		Coins,
		ArrowRight,
		CheckCircle2,
		ShieldCheck,
		Download,
		AlertCircle,
		Sparkles,
		Flame,
		Share2,
		Video,
		Check,
		Shield,
		FileText,
		Wrench,
		Presentation,
		UserCheck,
		Award,
		Lock,
		Terminal,
		CheckCircle
	} from 'lucide-svelte';
	import EventProfileModal from '$lib/components/events/EventProfileModal.svelte';
	import EventBookingModal from '$lib/components/events/EventBookingModal.svelte';
	import CountdownTimer from '$lib/components/shared/CountdownTimer.svelte';

	let { data }: { data: PageData } = $props();

	let isProfileModalOpen = $state(false);
	let isBookingModalOpen = $state(false);
	let hasProfile = $state(data.hasEventProfile);
	let isRegistered = $state(data.isRegistered);

	const event = data.event;
	const whatsappUrl = event.whatsappGroupUrl || 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i';

	const isSocialEngineering = $derived(
		event.slug?.includes('social-engineering') ||
		event.title?.toLowerCase().includes('social engineering')
	);

	const posterUrl = '/thumbnails/social-engineering-poster.jpg';

	// ── TIERED TICKETS DEFINITION ────────────────────────────────
	const ticketTiers = [
		{
			id: 'attendee' as const,
			price: 99,
			name: 'Normal Attendee',
			tagline: 'Standard Masterclass Pass + Tool List',
			badge: null,
			accentColor: 'border-zinc-200',
			features: [
				'Live Interactive Masterclass Stream',
				'Real-Time Exploitation & Defense Demos',
				'Active Q&A with Lead Researcher',
				'Curated OSINT Investigation Tool List & Cheatsheet',
				'Official Discord & WhatsApp Group Access'
			]
		},
		{
			id: 'certified' as const,
			price: 299,
			name: 'Certified Pass',
			tagline: 'Everything Above + Certificate',
			badge: 'RECOMMENDED',
			accentColor: 'border-red-600 ring-2 ring-red-600/30',
			features: [
				'Everything in ₹99 Attendee Pass',
				'Curated OSINT Investigation Tool List',
				'Official Progeta Certificate of Completion',
				'Cryptographic Verification Hash for LinkedIn & CV',
				'Priority Live Q&A Question Placement'
			]
		},
		{
			id: 'all_access' as const,
			price: 499,
			name: 'All-Access VIP',
			tagline: 'Everything Above + Defense Playbook',
			badge: 'BEST VALUE',
			accentColor: 'border-zinc-950',
			features: [
				'Everything in ₹299 Certified Pass',
				'Official Progeta Certificate of Completion',
				'The 45-Page Enterprise Social Engineering Defense Playbook',
				'Hardening Implementation Matrix & Verification Checklists',
				'Executive Security Awareness Presentation Deck (Keynote/PPTX)'
			]
		}
	];

	let selectedTierId = $state<'attendee' | 'certified' | 'all_access'>('certified');

	const activeTier = $derived(
		ticketTiers.find((t) => t.id === selectedTierId) || ticketTiers[1]
	);

	function selectTier(tierId: 'attendee' | 'certified' | 'all_access') {
		selectedTierId = tierId;
	}

	function handleOpenRegister(tierId?: 'attendee' | 'certified' | 'all_access') {
		if (tierId) {
			selectedTierId = tierId;
		}
		isBookingModalOpen = true;
	}

	function handleProfileComplete(profile: any) {
		hasProfile = true;
		isProfileModalOpen = false;
		isBookingModalOpen = true;
	}

	function handleBookingSuccess(result: any) {
		isRegistered = true;
	}
</script>

<svelte:head>
	<title>{event.title} &bull; Launchpad Masterclasses</title>
	<meta name="description" content={event.shortDescription || event.title} />
	<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">

	<!-- ── TOP BREADCRUMB STRIP ──────────────────────────────────── -->
	<div class="border-b border-zinc-200/80 bg-zinc-50/70 py-3.5">
		<div class="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 flex items-center justify-between">
			<nav class="flex items-center gap-2 text-xs font-mono text-zinc-400">
				<a href="/catalog" class="hover:text-zinc-950 transition">Explore</a>
				<span>&rsaquo;</span>
				<a href="/events" class="hover:text-zinc-950 transition">Sessions & Events</a>
				<span>&rsaquo;</span>
				<span class="text-zinc-800 font-sans font-medium truncate max-w-xs sm:max-w-md">{event.title}</span>
			</nav>
			<span class="text-[11px] font-mono text-zinc-400 hidden sm:inline uppercase tracking-wider">
				Progeta Live Event Series
			</span>
		</div>
	</div>

	<!-- ── MAIN STAGE CONTAINER ───────────────────────────────────── -->
	<main class="max-w-[1500px] mx-auto px-4 sm:px-8 lg:px-12 pt-8 sm:pt-12">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
			
			<!-- ── LEFT 8 COLS: COMPREHENSIVE EVENT SHOWCASE ────────────── -->
			<div class="lg:col-span-8 space-y-10 min-w-0">
				
				<!-- 1. POSTER-CONSISTENT HERO SHOWCASE CARD -->
				<section class="rounded-3xl border border-zinc-200 bg-white overflow-hidden shadow-sm">
					
					<!-- Two-Column Poster Hero Layout -->
					<div class="grid grid-cols-1 md:grid-cols-12 bg-white">
						
						<!-- Left Side: Authentic High-Resolution Poster Graphics -->
						<div class="md:col-span-5 bg-zinc-950 relative flex items-center justify-center p-4 sm:p-6 overflow-hidden group">
							<div class="relative w-full max-w-[340px] aspect-[4/5] rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-zinc-900">
								<img
									src={isSocialEngineering ? posterUrl : (event.coverImageUrl || posterUrl)}
									alt={event.title}
									class="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-105"
								/>
								<div class="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none"></div>
								<div class="absolute bottom-3 left-3 right-3 flex items-center justify-between text-[10px] font-mono font-bold text-white/90">
									<span class="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md border border-white/15 uppercase">
										Official Poster
									</span>
									<span class="px-2.5 py-1 rounded-md bg-red-600/90 text-white uppercase tracking-wider">
										Live Interactive
									</span>
								</div>
							</div>
						</div>

						<!-- Right Side: Exact Typographic Style Matching Poster -->
						<div class="md:col-span-7 p-6 sm:p-8 lg:p-10 flex flex-col justify-between">
							
							<div>
								<!-- Header Tagline: Red Square + Tracked Monospace -->
								<div class="flex items-center gap-2.5 mb-5 pb-3 border-b border-zinc-100">
									<span class="w-3 h-3 bg-red-600 inline-block shrink-0 rounded-xs"></span>
									<span class="text-[11px] font-mono font-black text-zinc-950 uppercase tracking-widest">
										LIVE SESSION
									</span>
									<span class="text-zinc-300 font-mono text-xs">—</span>
									<span class="text-[11px] font-mono font-bold text-zinc-500 uppercase tracking-widest">
										CYBERSECURITY SERIES
									</span>
								</div>

								<!-- Headline with signature red brush underline -->
								<div class="mb-3">
									<h1 class="text-4xl sm:text-5xl lg:text-6xl font-black text-zinc-950 tracking-tight leading-[1.04]">
										Social<br />
										<span class="relative inline-block">
											Engineering
											<!-- Signature red brush underline curve -->
											<svg
												class="absolute -bottom-2 sm:-bottom-2.5 left-0 w-full h-3 sm:h-3.5 text-red-600 overflow-visible pointer-events-none"
												viewBox="0 0 100 12"
												preserveAspectRatio="none"
											>
												<path d="M 0 6 Q 50 12, 100 4 Q 50 8, 0 6" fill="currentColor" />
											</svg>
										</span>
									</h1>
								</div>

								<!-- Subheading from poster -->
								<p class="text-base sm:text-lg font-bold text-zinc-800 leading-snug mt-4 mb-6">
									The Art of Influencing People in the Digital World.
								</p>

								<!-- Three Takeaways with Clean Icons (Matching Poster) -->
								<div class="space-y-3 pt-2 pb-6 border-t border-zinc-100">
									<div class="flex items-center gap-3 text-xs sm:text-sm text-zinc-800 font-medium">
										<div class="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
											<Users size={15} />
										</div>
										<span>How attackers manipulate human behavior</span>
									</div>

									<div class="flex items-center gap-3 text-xs sm:text-sm text-zinc-800 font-medium">
										<div class="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
											<Terminal size={15} />
										</div>
										<span>Real-world social engineering techniques & OSINT recon</span>
									</div>

									<div class="flex items-center gap-3 text-xs sm:text-sm text-zinc-800 font-medium">
										<div class="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-900 flex items-center justify-center shrink-0">
											<ShieldCheck size={15} class="text-emerald-600" />
										</div>
										<span>How to recognize, resist, and protect yourself</span>
									</div>
								</div>
							</div>

							<!-- Bottom Dark Pill Bar (Exact match with poster footer) -->
							<div class="mt-4 p-3.5 sm:p-4 rounded-2xl bg-zinc-950 text-white flex flex-wrap items-center justify-between gap-3 text-xs font-mono shadow-md">
								<div class="flex items-center gap-2">
									<Calendar size={14} class="text-red-500" />
									<span>This <strong class="text-white font-bold">Saturday</strong></span>
								</div>
								<span class="text-zinc-600 hidden sm:inline">|</span>
								<div class="flex items-center gap-2">
									<Clock size={14} class="text-red-500" />
									<span>8:00 PM (IST)</span>
								</div>
								<span class="text-zinc-600 hidden sm:inline">|</span>
								<div class="flex items-center gap-2">
									<Video size={14} class="text-red-500" />
									<span>Live Stream + Q&A</span>
								</div>
							</div>

						</div>
					</div>

				</section>

				<!-- 2. SELECT YOUR TICKET TIER (3 TIER CARDS) -->
				<section class="space-y-5">
					<div class="pb-2 border-b border-zinc-200 flex flex-col sm:flex-row sm:items-end justify-between gap-2">
						<div>
							<span class="text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 block mb-1">
								Programme Admission
							</span>
							<h2 class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight">
								Choose Your Ticket Tier
							</h2>
						</div>
						<p class="text-xs font-mono text-zinc-500">
							Select the pass that fits your learning goals.
						</p>
					</div>

					<div class="grid grid-cols-1 md:grid-cols-3 gap-5">
						{#each ticketTiers as tier}
							<div
								class="rounded-3xl border bg-white p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 relative {selectedTierId === tier.id ? `${tier.accentColor} shadow-xl scale-[1.02]` : 'border-zinc-200 hover:border-zinc-300 shadow-sm'}"
							>
								<!-- Top Badge -->
								{#if tier.badge}
									<div class="absolute -top-3 left-1/2 -translate-x-1/2">
										<span class="px-3 py-1 rounded-full text-[10px] font-mono font-black tracking-wider uppercase text-white shadow-md {tier.id === 'certified' ? 'bg-red-600' : 'bg-zinc-950'}">
											{tier.badge}
										</span>
									</div>
								{/if}

								<div>
									<!-- Tier Header -->
									<div class="mb-4">
										<span class="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-bold block mb-1">
											{tier.name}
										</span>
										<div class="flex items-baseline gap-1.5">
											<span class="text-4xl font-black text-zinc-950 font-mono">₹{tier.price}</span>
											<span class="text-xs font-mono text-zinc-400">/ pass</span>
										</div>
										<p class="text-xs text-zinc-600 mt-1 font-medium">{tier.tagline}</p>
									</div>

									<!-- Features List -->
									<div class="pt-4 border-t border-zinc-100 space-y-2.5 text-xs text-zinc-700">
										{#each tier.features as f, i}
											<div class="flex items-start gap-2.5">
												<CheckCircle size={14} class="shrink-0 mt-0.5 {tier.id === 'certified' && i === 2 ? 'text-red-600 font-bold' : tier.id === 'all_access' && i >= 2 ? 'text-zinc-950 font-bold' : 'text-emerald-600'}" />
												<span class="{tier.id === 'certified' && i === 2 ? 'font-bold text-zinc-950' : tier.id === 'all_access' && i >= 2 ? 'font-bold text-zinc-950' : ''}">
													{f}
												</span>
											</div>
										{/each}
									</div>
								</div>

								<!-- Action CTA -->
								<div class="mt-6 pt-4 border-t border-zinc-100">
									<button
										type="button"
										onclick={() => handleOpenRegister(tier.id)}
										class="w-full py-3 rounded-xl text-xs font-bold transition shadow-sm active:scale-95 flex items-center justify-center gap-1.5 {selectedTierId === tier.id ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30' : 'bg-zinc-950 hover:bg-zinc-800 text-white'}"
									>
										<span>{selectedTierId === tier.id ? 'Selected' : 'Select'} &bull; ₹{tier.price}</span>
										<ArrowRight size={13} />
									</button>
								</div>
							</div>
						{/each}
					</div>
				</section>

				<!-- 3. EXECUTIVE BRIEF & INDUSTRY CONTEXT -->
				<section class="rounded-3xl p-6 sm:p-8 bg-zinc-50 border border-zinc-200/80">
					<div class="flex items-center gap-2 text-[11px] font-mono font-bold uppercase tracking-wider text-red-600 mb-2">
						<span class="w-2 h-2 rounded-full bg-red-600"></span>
						<span>Executive Threat Brief</span>
					</div>
					<h2 class="text-xl sm:text-2xl font-black text-zinc-950 tracking-tight mb-3">
						Why Technical Firewalls Fail When the Human Element is Compromised
					</h2>
					<p class="text-sm sm:text-base text-zinc-600 leading-relaxed">
						According to the Verizon Data Breach Investigations Report (DBIR), over <strong class="text-zinc-900">82% of all enterprise cyber breaches</strong> involve the human element—through phishing, stolen credentials, pretexting, or simple employee error. Even multi-million dollar security architectures collapse when an attacker bypasses the perimeter by simply asking for access.
					</p>
					<p class="text-sm sm:text-base text-zinc-600 leading-relaxed mt-3">
						In this live session led by cybersecurity practitioner <strong class="text-zinc-900">Anmol Madan</strong>, you will observe how adversaries exploit cognitive trust, construct targeted intelligence, and execute real-world manipulation—paired with the exact tactical countermeasures required to defend modern teams.
					</p>
				</section>

				<!-- 4. DELIVERABLES BREAKDOWN (WHAT COMES WITH EACH TIER) -->
				<section class="space-y-4">
					<div class="pb-2 border-b border-zinc-200">
						<span class="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-400 block mb-1">
							Deliverables Matrix
						</span>
						<h2 class="text-2xl font-black text-zinc-950 tracking-tight">
							Included Deliverables & Artifacts
						</h2>
						<p class="text-xs sm:text-sm text-zinc-500 mt-1">
							Artifacts unlock automatically for registered attendees immediately following the live session.
						</p>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
						
						<!-- Item 1: Tool List -->
						<div class="rounded-2xl border border-zinc-200 bg-white p-5 flex flex-col justify-between shadow-xs">
							<div>
								<div class="w-9 h-9 rounded-xl bg-zinc-100 text-zinc-900 flex items-center justify-center mb-3">
									<Wrench size={18} />
								</div>
								<span class="text-[10px] font-mono font-bold tracking-wider text-zinc-400 uppercase block mb-1">
									All Tiers (₹99+)
								</span>
								<h4 class="text-sm font-bold text-zinc-950 mb-1">OSINT & Investigation Tool List</h4>
								<p class="text-xs text-zinc-500 leading-relaxed">
									Curated investigation tools, terminal scripts, and investigative reconnaissance workflows.
								</p>
							</div>
							<div class="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-emerald-600 font-semibold">
								<CheckCircle2 size={13} />
								<span>Included with all passes</span>
							</div>
						</div>

						<!-- Item 2: Certificate -->
						<div class="rounded-2xl border border-red-500/40 bg-white p-5 flex flex-col justify-between shadow-xs">
							<div>
								<div class="w-9 h-9 rounded-xl bg-red-50 text-red-600 flex items-center justify-center mb-3">
									<Award size={18} />
								</div>
								<span class="text-[10px] font-mono font-bold tracking-wider text-red-600 uppercase block mb-1">
									Certified Tier (₹299+)
								</span>
								<h4 class="text-sm font-bold text-zinc-950 mb-1">Verifiable Completion Certificate</h4>
								<p class="text-xs text-zinc-500 leading-relaxed">
									Cryptographically verifiable digital credential and badge for LinkedIn and resume portfolios.
								</p>
							</div>
							<div class="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-red-600 font-semibold">
								<CheckCircle2 size={13} />
								<span>Included with ₹299 & ₹499 passes</span>
							</div>
						</div>

						<!-- Item 3: Defense Playbook -->
						<div class="rounded-2xl border border-zinc-950 bg-white p-5 flex flex-col justify-between shadow-xs">
							<div>
								<div class="w-9 h-9 rounded-xl bg-zinc-950 text-white flex items-center justify-center mb-3">
									<FileText size={18} />
								</div>
								<span class="text-[10px] font-mono font-bold tracking-wider text-zinc-950 uppercase block mb-1">
									All-Access VIP (₹499)
								</span>
								<h4 class="text-sm font-bold text-zinc-950 mb-1">Enterprise Defense Playbook</h4>
								<p class="text-xs text-zinc-500 leading-relaxed">
									Official 45-page enterprise defensive playbook, response templates, and awareness slide deck.
								</p>
							</div>
							<div class="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-1.5 text-[11px] font-mono text-zinc-950 font-semibold">
								<CheckCircle2 size={13} />
								<span>Included with ₹499 pass</span>
							</div>
						</div>

					</div>
				</section>

				<!-- 5. LEAD MASTERCLASS INSTRUCTOR (ANMOL MADAN) -->
				<section class="rounded-3xl p-6 sm:p-8 bg-zinc-950 text-white border border-zinc-800 flex flex-col sm:flex-row items-start sm:items-center gap-6">
					<div class="w-20 h-20 rounded-2xl bg-white text-zinc-950 font-black text-2xl flex items-center justify-center shrink-0 shadow-lg">
						AM
					</div>
					<div class="flex-1">
						<div class="flex items-center gap-2 mb-1">
							<span class="text-[10px] font-mono font-bold uppercase tracking-wider text-red-400">
								Lead Masterclass Instructor
							</span>
							<span class="text-zinc-600">&bull;</span>
							<span class="text-[11px] font-mono text-zinc-400">Progeta Technologies</span>
						</div>
						<h3 class="text-2xl font-black text-white">Anmol Madan</h3>
						<p class="text-xs sm:text-sm text-zinc-300 mt-2 leading-relaxed">
							Active cybersecurity researcher and offensive security practitioner specializing in social engineering attack vectors, OSINT reconnaissance, and workforce defense hardening. Leads live scenario-based demonstrations and extended technical Q&A.
						</p>
						<div class="flex flex-wrap items-center gap-2 mt-4 text-xs font-mono text-zinc-300">
							<span class="px-3 py-1 rounded-lg bg-white/10 border border-white/10">Live Attack Demos</span>
							<span>&bull;</span>
							<span class="px-3 py-1 rounded-lg bg-white/10 border border-white/10">Interactive Q&A Session</span>
							<span>&bull;</span>
							<span class="px-3 py-1 rounded-lg bg-white/10 border border-white/10">Post-Session Resource Vault</span>
						</div>
					</div>
				</section>

			</div>

			<!-- ── RIGHT 4 COLS: BULLETPROOF FIXED / STICKY BOOKING CONSOLE ── -->
			<div class="lg:col-span-4 lg:sticky lg:top-24 self-start space-y-4">
				<div class="rounded-3xl p-6 sm:p-8 bg-zinc-950 text-white border border-zinc-800 shadow-2xl space-y-6">
					
					<!-- Tier Quick Selector Inside Sticky Widget -->
					<div>
						<span class="text-[10px] font-mono uppercase tracking-widest text-zinc-400 font-bold block mb-2.5">
							Select Ticket Tier
						</span>
						<div class="grid grid-cols-3 gap-1.5 p-1 bg-black/60 rounded-xl border border-white/10 text-xs font-mono">
							{#each ticketTiers as tier}
								<button
									type="button"
									onclick={() => selectTier(tier.id)}
									class="py-2 text-center rounded-lg font-bold transition-all {selectedTierId === tier.id ? 'bg-red-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'}"
								>
									₹{tier.price}
								</button>
							{/each}
						</div>
					</div>

					<!-- Admission Fee Display -->
					<div>
						<div class="flex items-center justify-between mb-1">
							<span class="text-[11px] font-mono uppercase tracking-widest text-zinc-400 font-bold block">
								Admission Fee
							</span>
							<span class="text-[10px] font-mono font-bold text-white bg-white/10 border border-white/15 px-2.5 py-0.5 rounded-md uppercase">
								{activeTier.name}
							</span>
						</div>

						<div class="flex items-baseline gap-2">
							<span class="text-4xl font-black text-white font-mono">
								₹{activeTier.price}
							</span>
							<span class="text-xs font-mono text-zinc-400">/ pass</span>
						</div>
						<p class="text-xs text-zinc-400 mt-1">{activeTier.tagline}</p>
					</div>

					<!-- Countdown Timer inside Widget -->
					<div class="p-4 rounded-2xl bg-black/60 border border-white/10 text-center">
						<span class="text-[10px] font-mono uppercase tracking-widest text-red-400 font-bold block mb-2 flex items-center justify-center gap-1.5">
							<span class="w-1.5 h-1.5 rounded-full bg-red-500 animate-ping"></span>
							Registration Closes In
						</span>
						<CountdownTimer targetDate={event.startAt} variant="card" />
					</div>

					<!-- Key Specs Breakdown -->
					<div class="space-y-3 text-xs font-mono text-zinc-300 border-t border-b border-white/10 py-5">
						<div class="flex items-center justify-between">
							<span class="text-zinc-400">Format</span>
							<strong class="text-white uppercase">{event.venueType === 'online' ? 'Live Stream + Q&A' : 'In-Person'}</strong>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-zinc-400">Date</span>
							<strong class="text-white">This Saturday (Nov 7)</strong>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-zinc-400">Time</span>
							<strong class="text-white">8:00 PM (IST)</strong>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-zinc-400">Certificate</span>
							<strong class="{selectedTierId !== 'attendee' ? 'text-emerald-400' : 'text-zinc-500'}">
								{selectedTierId !== 'attendee' ? 'Included' : 'Not in ₹99 pass'}
							</strong>
						</div>
						<div class="flex items-center justify-between">
							<span class="text-zinc-400">Defense Playbook</span>
							<strong class="{selectedTierId === 'all_access' ? 'text-emerald-400' : 'text-zinc-500'}">
								{selectedTierId === 'all_access' ? 'Included' : 'In ₹499 VIP pass'}
							</strong>
						</div>
					</div>

					<!-- Action Buttons -->
					{#if isRegistered}
						<div class="space-y-3">
							<div class="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center">
								<div class="text-xs font-bold text-emerald-400 flex items-center justify-center gap-1.5 font-mono">
									<CheckCircle2 size={16} /> Spot Confirmed
								</div>
								<p class="text-[11px] text-zinc-300 mt-1">You are officially registered for this session.</p>
							</div>

							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-xs font-bold text-white transition flex items-center justify-center gap-2 text-center shadow-lg active:scale-95"
							>
								<span>Join WhatsApp Group</span>
								<ArrowRight size={14} />
							</a>

							{#if event.isResourcesReleased}
								<a
									href={`/events/${event.slug}/resources`}
									class="w-full py-3 px-4 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white transition flex items-center justify-center gap-2 text-center border border-white/10"
								>
									<span>Open Session Files</span>
								</a>
							{/if}
						</div>

					{:else if !event.isRegistrationOpen}
						<button
							disabled
							class="w-full py-3.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-500 cursor-not-allowed text-center"
						>
							Registration Closed
						</button>

					{:else}
						<button
							type="button"
							onclick={() => handleOpenRegister(selectedTierId)}
							class="w-full py-4 px-6 rounded-xl bg-red-600 hover:bg-red-500 text-xs font-bold text-white uppercase tracking-wider transition flex items-center justify-center gap-2 shadow-xl shadow-red-600/30 active:scale-95"
						>
							<span>Reserve {activeTier.name} for ₹{activeTier.price}</span>
							<ArrowRight size={15} />
						</button>
					{/if}

					<!-- Verified Trust Strip -->
					<div class="pt-2 text-[11px] font-mono text-zinc-400 text-center space-y-1">
						<div class="flex items-center justify-center gap-1.5">
							<ShieldCheck size={13} class="text-emerald-400" />
							<span>Verified by Progeta Technologies</span>
						</div>
						<p class="text-[10px] text-zinc-500">Encrypted checkout via Cashfree &bull; Instant confirmation</p>
					</div>

				</div>
			</div>

		</div>
	</main>
</div>

<!-- Event Booking Modal -->
{#if isBookingModalOpen}
	<EventBookingModal
		event={event}
		userCredits={data.userCredits}
		currentUser={data.user}
		selectedTierId={selectedTierId}
		isOpen={isBookingModalOpen}
		onClose={() => (isBookingModalOpen = false)}
		onSuccess={handleBookingSuccess}
	/>
{/if}
