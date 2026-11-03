<script lang="ts">
  import {
    Search,
    X,
    ArrowRight,
    Calendar,
    Clock,
    Video,
    Users,
    Shield,
    Sparkles,
    CheckCircle2,
    BookOpen,
    Award,
    Download,
  } from "lucide-svelte";
  import CountdownTimer from "$lib/components/shared/CountdownTimer.svelte";
  import type { PageData } from "./$types";

  let { data }: { data: PageData } = $props();

  let searchQuery = $state(data.search || "");
  let selectedCategory = $state<
    "all" | "cohorts" | "workshops" | "mentorship" | "resources"
  >("all");
  let activeHeroIndex = $state(0);

  const heroSlides = [
    {
      id: "slide-masterclass",
      tabLabel: "Saturday Masterclass",
      categoryTag: "LIVE SESSION",
      series: "CYBERSECURITY SERIES",
      title: "Social Engineering",
      tagline: "The Art of Influencing People in the Digital World.",
      description:
        "How attackers manipulate human behavior, execute psychological reconnaissance, and exploit trust in modern digital systems — taught live by cybersecurity practitioner Anmol Madan.",
      image: "/thumbnails/social-engineering-poster.jpg",
      hasRedStroke: true,
      bullets: [
        "How attackers manipulate human behavior",
        "Real-world social engineering techniques & OSINT recon",
        "How to recognize, resist, and protect yourself",
      ],
      pillSpecs: [
        { icon: Calendar, label: "This", bold: "Saturday" },
        { icon: Clock, label: "8:00 PM (IST)" },
        { icon: Video, label: "Live Session + Q&A" },
      ],
      price: "₹99",
      ctaLabel: "Register for ₹99",
      price: "From ₹99",
      ctaLabel: "Passes from ₹99",
      ctaHref: "/events/social-engineering-masterclass",
      subNote: "Includes full access to Progeta Resource Bundle",
      subNote: "Tiered passes: Attendee (₹99), Certified (₹299), VIP (₹499)",
      countdownTarget: "2026-11-07T14:30:00.000Z",
      pointers: [
        {
          step: "01 / Manipulation",
          title: "Human Vulnerability Vectors",
          desc: "Understand cognitive biases, trust triggers, and social dynamics exploited by threat actors.",
        },
        {
          step: "02 / Technique",
          title: "Pre-Texting & OSINT Recon",
          desc: "Examine live case studies of spear phishing, voice impersonation, and digital footprinting.",
        },
        {
          step: "03 / Defense",
          title: "Resist, Verify & Contain",
          desc: "Actionable protocols to verify identity, spot psychological anomalies, and harden organizational firewalls.",
        },
        {
          step: "04 / Deliverables",
          title: "Progeta Defense Pack",
          desc: "Complete toolkit with OSINT playbooks, anti-phishing templates, checklists, and session recordings.",
        },
      ],
    },
    {
      id: "slide-cohort",
      tabLabel: "Flagship Cohort",
      categoryTag: "LIVE INTERACTIVE COHORT",
      series: "ACCREDITED PRACTITIONER COHORT",
      title: "Practical Cybersecurity",
      tagline: "Beginner to Intermediate",
      description:
        "Build. Break. Detect. Respond. An intensive multi-week cohort program working with real enterprise tools, live detection labs, and continuous defensive practice.",
      image: "/thumbnails/practical-cybersecurity.jpg",
      hasRedStroke: false,
      bullets: [
        "Real enterprise tools: Linux, Wireshark, Suricata & Wazuh SIEM",
        "Strictly capped at 25 seats for direct weekly practitioner mentorship",
        "Architect & defend an end-to-end security pipeline for MSET certification",
      ],
      pillSpecs: [
        { icon: Calendar, label: "Next Batch", bold: "Enrolling" },
        { icon: Clock, label: "25+ Hours (Live & Guided)" },
        { icon: Award, label: "MSET Academy Accredited" },
      ],
      price: "₹15,999",
      ctaLabel: "Explore Cohort & Curriculum",
      ctaHref: "/catalog/practical-cybersecurity",
      subNote: "Accredited certificate awarded by MSET Academy + Progeta",
      countdownTarget: null,
      pointers: [
        {
          step: "01 / Practice",
          title: "Hands-on Learning",
          desc: "Real enterprise tools, live networks, and continuous defensive scenarios.",
        },
        {
          step: "02 / Pathway",
          title: "Beginner to Intermediate",
          desc: "Structured progression from Linux & networking to SIEM detection.",
        },
        {
          step: "03 / Attention",
          title: "Small Cohorts (Max 25)",
          desc: "Strictly capped at 25 students per cohort for direct weekly practitioner mentorship.",
        },
        {
          step: "04 / Verification",
          title: "Capstone Project",
          desc: "Build and defend a real-world security architecture accredited by MSET Academy.",
        },
      ],
    },
  ];

  const activeHero = $derived(heroSlides[activeHeroIndex] || heroSlides[0]);

  // Auto-rotate hero every 20 seconds
  const AUTO_ROTATE_MS = 20000;
  let rotateTimer: ReturnType<typeof setInterval> | null = null;

  function nextSlide() {
    activeHeroIndex = (activeHeroIndex + 1) % heroSlides.length;
  }

  function prevSlide() {
    activeHeroIndex =
      (activeHeroIndex - 1 + heroSlides.length) % heroSlides.length;
  }

  function goToSlide(i: number) {
    activeHeroIndex = i;
    resetRotateTimer();
  }

  function resetRotateTimer() {
    if (rotateTimer) clearInterval(rotateTimer);
    rotateTimer = setInterval(() => {
      nextSlide();
    }, AUTO_ROTATE_MS);
  }

  $effect(() => {
    resetRotateTimer();
    return () => {
      if (rotateTimer) clearInterval(rotateTimer);
    };
  });

  const marketplaceItems = [
    {
      id: "item-cohort",
      category: "cohorts",
      badge: "LIVE COHORT",
      badgeColor: "bg-zinc-950 text-white",
      title: "Practical Cybersecurity: Beginner to Intermediate",
      subtitle:
        "Build. Break. Detect. Respond. Multi-week live cohort with real tools, Linux & network hardening, SIEM detection, and incident automation.",
      thumbnail: "/thumbnails/practical-cybersecurity.jpg",
      instructor: "Anmol Madan",
      partner: "MSET Academy",
      spec: "25+ Hours Live • 4 Modules • Capstone Defense",
      price: "₹15,999",
      actionLabel: "Explore Cohort",
      href: "/catalog/practical-cybersecurity",
    },
    {
      id: "item-workshop",
      category: "workshops",
      badge: "LIVE MASTERCLASS",
      badgeColor: "bg-red-600 text-white",
      title: "Social Engineering & Psychological Reconnaissance",
      subtitle:
        "Human vulnerability mitigation, OSINT footprinting, pre-texting tactics, and modern enterprise defense vectors.",
      thumbnail: "/thumbnails/social-engineering-poster.jpg",
      instructor: "Anmol Madan",
      partner: "Progeta Technologies",
      spec: "Sat, Nov 7 • 8:00 PM IST • Resource Pack Included",
      price: "₹99",
      actionLabel: "Register for ₹99",
      price: "From ₹99",
      actionLabel: "Passes from ₹99",
      href: "/events/social-engineering-masterclass",
    },
    {
      id: "item-mentorship",
      category: "mentorship",
      badge: "1-ON-1 GUIDANCE",
      badgeColor: "bg-zinc-100 text-zinc-900 border border-zinc-200",
      title: "Private Technical Mentorship & Architecture Reviews",
      subtitle:
        "One-on-one sessions for mock technical interviews, architecture reviews, and tactical career positioning with verified practitioners.",
      thumbnail: "/thumbnails/hero-portal.jpg",
      instructor: "Verified Practitioners",
      partner: "Launchpad Mentors",
      spec: "45-Min Sessions • Private Video & Code Review",
      price: "Direct Booking",
      actionLabel: "Find a Mentor",
      href: "/mentoring",
    },
    {
      id: "item-resources",
      category: "resources",
      badge: "TECHNICAL RESOURCE",
      badgeColor: "bg-zinc-100 text-zinc-900 border border-zinc-200",
      title: "Progeta Technical Playbooks & Defense Checklists",
      subtitle:
        "Official cybersecurity cheat sheets, detection rules, SOAR playbooks, and server hardening checklists branded by Launchpad & Progeta.",
      thumbnail: "/thumbnails/lab-guided.jpg",
      instructor: "Progeta Engineering",
      partner: "Progeta Technologies",
      spec: "Curated Playbooks, Rules & Checklists",
      price: "Free with Programs",
      actionLabel: "Browse Library",
      href: "/resources",
    },
  ];

  const categories = [
    { id: "all" as const, label: "All Programs" },
    { id: "cohorts" as const, label: "Live Classes" },
    { id: "workshops" as const, label: "Workshops & Events" },
    { id: "mentorship" as const, label: "Mentorship" },
    { id: "resources" as const, label: "Resources" },
  ];

  const filteredItems = $derived(
    marketplaceItems.filter((item) => {
      if (selectedCategory !== "all" && item.category !== selectedCategory)
        return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        return (
          item.title.toLowerCase().includes(q) ||
          item.subtitle.toLowerCase().includes(q)
        );
      }
      return true;
    }),
  );

  const steps = [
    {
      step: "01",
      title: "Live Practitioner Sessions",
      desc: "Join weekly interactive classes taught directly by cybersecurity engineers actively defending enterprise systems.",
    },
    {
      step: "02",
      title: "Hands-on Virtual Labs",
      desc: "Practice on real Linux servers, network traffic captures, and SIEM monitoring stacks in isolated lab environments.",
    },
    {
      step: "03",
      title: "Direct Code & Logic Reviews",
      desc: "Get your detection rules, regex parsers, and incident scripts reviewed directly during live weekly office hours.",
    },
    {
      step: "04",
      title: "Capstone Defense & Certification",
      desc: "Architect and defend an end-to-end security monitoring pipeline to earn verified practical defense certification.",
    },
  ];
</script>

<svelte:head>
  <title>Explore Programs & Masterclasses &bull; Launchpad</title>
  <meta
    name="description"
    content="Accredited practitioner-led live cohorts, intensive single-day masterclasses, and hands-on defense engineering."
  />
</svelte:head>

<div class="min-h-screen bg-white text-zinc-950 pb-28">
  <!-- ── 1. FULL-WIDTH CINEMATIC HERO SHOWCASE (Auto-cycles every 20s) ── -->
  <section
    class="relative w-full bg-zinc-950 text-white border-b border-zinc-800/80 overflow-hidden select-none"
  >
    <!-- Background Visual Elements -->
    {#if activeHero.id === "slide-masterclass"}
      <!-- Marionette Puppet-Master Silhouette Graphic from the Live Event Poster -->
      <div
        class="absolute inset-y-0 right-0 w-full lg:w-3/5 pointer-events-none z-0 overflow-hidden flex justify-end"
      >
        <img
          src="/thumbnails/social-engineering-poster.jpg"
          alt="Social Engineering Marionette Silhouette"
          class="h-full w-auto max-w-none object-cover object-right opacity-40 filter brightness-110 contrast-125 transition-all duration-700"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/85 to-transparent"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/50"
        ></div>
      </div>
    {:else}
      <!-- Flagship Cohort Visual Backdrop -->
      <div class="absolute inset-0 pointer-events-none z-0">
        <img
          src={activeHero.image}
          alt={activeHero.title}
          class="w-full h-full object-cover object-center opacity-30 filter brightness-90 transition-all duration-700"
        />
        <div
          class="absolute inset-0 bg-gradient-to-r from-zinc-950 via-zinc-950/90 to-zinc-950/50"
        ></div>
        <div
          class="absolute inset-0 bg-gradient-to-t from-zinc-950 via-transparent to-zinc-950/40"
        ></div>
      </div>
    {/if}

    <div
      class="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12 py-12 sm:py-16 lg:py-20 min-h-[560px] sm:min-h-[620px] lg:min-h-[660px] flex flex-col justify-between"
    >
      <!-- Center Stage: Content + Companion Card (2 columns) -->
      <div
        class="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14 items-center my-auto py-8"
      >
        <!-- Left 8 cols: Typography, Signature Stroke, Bullets & CTA -->
        <div class="lg:col-span-8 max-w-3xl">
          <!-- Title with Red Brush Underline Motif from Poster -->
          <div class="inline-block relative mb-3">
            <h1
              class="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.04]"
            >
              {activeHero.title}
            </h1>
            {#if activeHero.hasRedStroke}
              <svg
                class="w-56 sm:w-80 h-3 text-red-500 mt-1"
                viewBox="0 0 240 12"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.5 8.5C52 3 150 -1.5 237.5 7.5"
                  stroke="currentColor"
                  stroke-width="4.5"
                  stroke-linecap="round"
                />
              </svg>
            {/if}
          </div>

          <!-- Tagline -->
          <p
            class="text-xl sm:text-2xl font-bold text-zinc-100 tracking-tight mt-1 mb-3"
          >
            {activeHero.tagline}
          </p>

          <!-- Description -->
          <p
            class="text-sm sm:text-base text-zinc-300 leading-relaxed max-w-2xl mb-6"
          >
            {activeHero.description}
          </p>

          <!-- Bullet Points with Custom Iconography from the Poster -->
          <div class="space-y-2.5 mb-7">
            {#each activeHero.bullets as bulletText}
              <div
                class="flex items-center gap-3 text-xs sm:text-sm text-zinc-200"
              >
                {#if activeHero.id === "slide-masterclass"}
                  <span class="w-2 h-2 rounded-full bg-red-500 shrink-0"></span>
                {:else}
                  <CheckCircle2 size={16} class="text-emerald-400 shrink-0" />
                {/if}
                <span>{bulletText}</span>
              </div>
            {/each}
          </div>

          <!-- Capsule Pill Bar from Poster [ This Saturday | 8:00 PM (IST) | Live Session ] -->
          <div
            class="inline-flex flex-wrap items-center bg-black/70 backdrop-blur-md border border-white/15 rounded-2xl p-1.5 sm:p-2 gap-2 sm:gap-3 text-xs font-mono text-zinc-300 mb-8"
          >
            {#each activeHero.pillSpecs as spec, idx}
              {#if idx > 0}
                <div class="h-4 w-px bg-white/15 hidden sm:block"></div>
              {/if}
              <div class="flex items-center gap-2 px-3 py-1">
                <spec.icon
                  size={14}
                  class={activeHero.id === "slide-masterclass"
                    ? "text-red-400"
                    : "text-emerald-400"}
                />
                <span>
                  {#if spec.bold}
                    {spec.label} <strong class="text-white">{spec.bold}</strong>
                  {:else}
                    {spec.label}
                  {/if}
                </span>
              </div>
            {/each}
          </div>

          <!-- Action Buttons -->
          <div class="flex flex-wrap items-center gap-5">
            <a
              href={activeHero.ctaHref}
              class="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-bold transition shadow-xl active:scale-95 {activeHero.id ===
              'slide-masterclass'
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-600/30'
                : 'bg-white hover:bg-zinc-100 text-zinc-950'}"
            >
              <span>{activeHero.ctaLabel}</span>
              <ArrowRight size={16} />
            </a>
            <span class="text-xs sm:text-sm font-mono text-zinc-400">
              {activeHero.subNote}
            </span>
          </div>
        </div>

        <!-- Right 4 cols: Companion Card -->
        {#if activeHero.countdownTarget}
          <!-- Live Event Countdown Card -->
          <div
            class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-center"
          >
            <div
              class="flex items-center justify-between mb-4 pb-3 border-b border-white/10"
            >
              <span
                class="text-[11px] font-mono uppercase tracking-widest text-red-400 font-bold flex items-center gap-1.5"
              >
                <span class="w-2 h-2 rounded-full bg-red-500 animate-ping"
                ></span>
                Live Event Countdown
              </span>
              <span
                class="text-sm font-mono font-bold text-white bg-white/10 px-2.5 py-0.5 rounded-md"
              >
                ₹99
              </span>
            </div>

            <CountdownTimer
              targetDate={activeHero.countdownTarget}
              variant="banner"
            />

            <a
              href={activeHero.ctaHref}
              class="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-mono text-xs font-bold uppercase tracking-wider transition shadow-lg shadow-red-600/30 active:scale-95"
            >
              <span>Reserve Seat for ₹99</span>
              <ArrowRight size={14} />
            </a>

            <div
              class="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span>Progeta Resource Pack & Playbooks Included</span>
            </div>
          </div>
        {:else}
          <!-- Flagship Cohort Spec Card -->
          <div
            class="lg:col-span-4 bg-black/65 backdrop-blur-md border border-white/15 p-6 sm:p-8 rounded-2xl text-left"
          >
            <div
              class="flex items-center justify-between mb-5 pb-3 border-b border-white/10"
            >
              <span
                class="text-[10px] font-mono uppercase tracking-widest text-emerald-400 font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20"
              >
                Live Interactive Batch
              </span>
              <span class="text-base font-mono font-bold text-white">
                {activeHero.price}
              </span>
            </div>
            <div class="space-y-3.5 text-xs sm:text-sm font-mono text-zinc-300">
              <div class="flex items-center gap-2.5">
                <Users size={16} class="text-emerald-400 shrink-0" />
                <span>Strictly capped at 25 seats</span>
              </div>
              <div class="flex items-center gap-2.5">
                <Clock size={16} class="text-emerald-400 shrink-0" />
                <span>25+ Hours live interactive instruction</span>
              </div>
              <div class="flex items-center gap-2.5">
                <Award size={16} class="text-emerald-400 shrink-0" />
                <span>MSET Academy accredited credential</span>
              </div>
            </div>
            <a
              href={activeHero.ctaHref}
              class="mt-6 w-full inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white text-zinc-950 hover:bg-zinc-100 font-mono text-xs font-bold transition shadow-lg active:scale-95"
            >
              <span>View Complete Syllabus</span>
              <ArrowRight size={14} />
            </a>
            <div
              class="mt-4 pt-3 border-t border-white/10 text-[11px] font-mono text-zinc-400 flex items-center justify-center gap-2"
            >
              <span class="w-1.5 h-1.5 rounded-full bg-sky-400"></span>
              <span>Official Knowledge Partner &bull; MSET Academy</span>
            </div>
          </div>
        {/if}
      </div>

      <!-- Bottom Row: Slide Indicators, Auto-rotate Status & Prev/Next Arrows -->
      <div
        class="flex items-center justify-between pt-6 border-t border-white/10 text-xs font-mono text-zinc-400"
      >
        <!-- Slide Indicators with Active Width Transition -->
        <div class="flex items-center gap-2.5">
          {#each heroSlides as _, i}
            <button
              type="button"
              onclick={() => goToSlide(i)}
              class="transition-all duration-300 rounded-full h-1.5 {activeHeroIndex ===
              i
                ? 'w-10 bg-white'
                : 'w-2.5 bg-white/30 hover:bg-white/60'}"
              aria-label={`Go to slide ${i + 1}`}
            ></button>
          {/each}
        </div>

        <!-- Navigation Arrows -->
        <div class="flex items-center gap-2">
          <button
            type="button"
            onclick={() => {
              prevSlide();
              resetRotateTimer();
            }}
            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Previous slide"
          >
            &larr;
          </button>
          <button
            type="button"
            onclick={() => {
              nextSlide();
              resetRotateTimer();
            }}
            class="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition active:scale-95"
            aria-label="Next slide"
          >
            &rarr;
          </button>
        </div>
      </div>
    </div>
  </section>

  <main class="max-w-[1600px] mx-auto px-4 sm:px-8 lg:px-12">
    <!-- ── 2. DYNAMIC PROGRAM FOCUS AREAS (Synchronized with active hero slide) ── -->
    <section class="py-10 border-b border-zinc-200 mb-12">
      <div
        class="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-6"
      >
        <div class="flex items-center gap-2.5">
          <span
            class="w-2.5 h-2.5 rounded-full {activeHeroIndex === 0
              ? 'bg-red-500'
              : 'bg-emerald-500'}"
          ></span>
          <span
            class="text-xs font-mono font-bold tracking-wider uppercase text-zinc-700"
          >
            {activeHero.tabLabel} &bull; Core Focus Areas
          </span>
        </div>
        <span class="text-xs font-mono text-zinc-400">
          Offering 0{activeHeroIndex + 1} of 0{heroSlides.length}
        </span>
      </div>

      <div
        class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8"
      >
        {#each activeHero.pointers as ptr}
          <div
            class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 hover:border-zinc-300 transition flex flex-col justify-between"
          >
            <div>
              <span
                class="text-[11px] font-mono font-bold text-zinc-400 tracking-wider uppercase block mb-2"
              >
                {ptr.step}
              </span>
              <h3 class="text-sm font-bold text-zinc-950 mb-1.5">
                {ptr.title}
              </h3>
              <p class="text-xs text-zinc-600 leading-relaxed">
                {ptr.desc}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </section>

    <!-- ── 3. UNIFIED PROGRAM CATALOGUE & FILTER BAR ────────────────── -->
    <section class="py-6">
      <!-- Header & Filter Row -->
      <div
        class="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8"
      >
        <div>
          <h2
            class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight"
          >
            All Programs & Offerings
          </h2>
          <p class="text-xs sm:text-sm text-zinc-500 mt-1">
            Browse live cohorts, workshops, 1-on-1 mentorship, and technical
            resources.
          </p>
        </div>

        <!-- Search Input -->
        <div class="w-full md:w-80 relative">
          <Search
            size={14}
            class="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400 pointer-events-none"
          />
          <input
            bind:value={searchQuery}
            type="text"
            placeholder="Search by topic or keyword..."
            class="w-full pl-9 pr-8 py-2.5 bg-zinc-50 border border-zinc-200 rounded-xl text-xs text-zinc-900 placeholder-zinc-400 focus:bg-white focus:outline-none focus:border-zinc-400 transition"
          />
          {#if searchQuery}
            <button
              type="button"
              onclick={() => (searchQuery = "")}
              class="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-600 p-0.5"
              aria-label="Clear search"
            >
              <X size={13} />
            </button>
          {/if}
        </div>
      </div>

      <!-- Filter Category Pills -->
      <div
        class="flex items-center gap-2 mb-8 overflow-x-auto pb-1 no-scrollbar border-b border-zinc-100"
      >
        {#each categories as cat}
          <button
            type="button"
            onclick={() => (selectedCategory = cat.id)}
            class="px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition whitespace-nowrap"
            class:bg-zinc-950={selectedCategory === cat.id}
            class:text-white={selectedCategory === cat.id}
            class:bg-zinc-100={selectedCategory !== cat.id}
            class:text-zinc-600={selectedCategory !== cat.id}
            class:hover:text-zinc-950={selectedCategory !== cat.id}
          >
            {cat.label}
          </button>
        {/each}
      </div>

      <!-- Consistent Card Grid (4 Cards) -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
        {#each filteredItems as item (item.id)}
          <article
            class="rounded-3xl border border-zinc-200 bg-white overflow-hidden hover:border-zinc-300 hover:shadow-md transition flex flex-col justify-between group"
          >
            <div>
              <!-- 16:9 Cover Thumbnail -->
              <a
                href={item.href}
                class="block relative aspect-[16/9] overflow-hidden bg-zinc-100 border-b border-zinc-100"
              >
                <img
                  src={item.thumbnail}
                  alt={item.title}
                  class="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div
                  class="absolute top-4 left-4 right-4 flex items-center justify-between pointer-events-none"
                >
                  <span
                    class="px-3 py-1 rounded-full text-[10px] font-mono font-bold tracking-wider uppercase shadow-xs {item.badgeColor}"
                  >
                    {item.badge}
                  </span>
                  <span
                    class="px-3 py-1 rounded-full text-xs font-mono font-bold bg-white text-zinc-950 shadow-xs"
                  >
                    {item.price}
                  </span>
                </div>
              </a>

              <!-- Card Body -->
              <div class="p-6 sm:p-8">
                <div
                  class="flex items-center gap-2 text-xs font-mono text-zinc-400 mb-2"
                >
                  <span>{item.partner}</span>
                  <span>&bull;</span>
                  <span>{item.instructor}</span>
                </div>

                <h3
                  class="text-xl sm:text-2xl font-bold text-zinc-950 leading-snug group-hover:text-zinc-700 transition"
                >
                  <a href={item.href}>
                    {item.title}
                  </a>
                </h3>

                <p
                  class="text-xs sm:text-sm text-zinc-600 mt-2 leading-relaxed"
                >
                  {item.subtitle}
                </p>

                <div
                  class="flex items-center gap-2 mt-4 text-xs font-mono text-zinc-500"
                >
                  <Clock size={13} class="text-zinc-400" />
                  <span>{item.spec}</span>
                </div>
              </div>
            </div>

            <!-- Card Footer Action -->
            <div
              class="px-6 sm:px-8 pb-6 sm:pb-8 pt-2 flex items-center justify-between border-t border-zinc-100 mt-auto"
            >
              <span class="text-sm font-mono font-bold text-zinc-950">
                {item.price}
              </span>
              <a
                href={item.href}
                class="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-zinc-950 text-white text-xs font-bold hover:bg-zinc-800 transition active:scale-95 shadow-xs"
              >
                <span>{item.actionLabel}</span>
                <ArrowRight size={13} />
              </a>
            </div>
          </article>
        {/each}
      </div>
    </section>

    <!-- ── 4. HOW LEARNING WORKS (Clean 4-Step Methodology Bar) ─────── -->
    <section class="pt-16 pb-12 border-t border-zinc-200 mt-12">
      <div class="mb-10 text-center max-w-2xl mx-auto">
        <span
          class="text-xs font-mono font-semibold text-zinc-400 uppercase tracking-widest block mb-1"
        >
          Learning Methodology
        </span>
        <h2
          class="text-2xl sm:text-3xl font-black text-zinc-950 tracking-tight"
        >
          How Learning Works on Launchpad
        </h2>
        <p class="text-xs sm:text-sm text-zinc-500 mt-1.5">
          A continuous, structured cycle designed to bridge academic theory and
          real enterprise security operations.
        </p>
      </div>

      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {#each steps as st}
          <div
            class="p-6 rounded-2xl bg-zinc-50 border border-zinc-200/80 flex flex-col justify-between"
          >
            <div>
              <span
                class="text-base font-black font-mono text-zinc-900 block mb-2.5"
              >
                {st.step}
              </span>
              <h3 class="text-sm font-bold text-zinc-950">
                {st.title}
              </h3>
              <p class="text-xs text-zinc-500 mt-1 leading-relaxed">
                {st.desc}
              </p>
            </div>
          </div>
        {/each}
      </div>
    </section>
  </main>
</div>
