<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		Search,
		X,
		ArrowRight,
		Video,
		BookOpen,
		Award,
		Users,
		Download,
		Terminal,
		Flag,
		Box,
		Shield,
		Cloud,
		Lock,
		Calendar,
		Clock,
		CheckCircle2
	} from 'lucide-svelte';
	import LaunchpadLogo from '$lib/components/ui/LaunchpadLogo.svelte';
	import type { PageData } from './$types';

	let { data }: { data: PageData } = $props();

	let searchQuery = $state(data.search || '');
	let activeCategoryTag = $state('All');

	const isSearching = $derived(searchQuery.trim().length > 0 || activeCategoryTag !== 'All');

	const categoryTags = ['Cybersecurity', 'Cloud', 'AI', 'DevOps', 'Soft Skills', 'Career'];

	function setFilterTag(tag: string) {
		activeCategoryTag = activeCategoryTag === tag ? 'All' : tag;
	}

	function clearSearch() {
		searchQuery = '';
		activeCategoryTag = 'All';
	}

	// ── DYNAMIC DATABASE DERIVATIONS (NO MOCK DATA) ───────────
	const actualLiveClasses = $derived(data.liveClasses || []);

	const featuredCohort = $derived(
		data.liveClasses && data.liveClasses.length > 0
			? data.liveClasses[0]
			: null
	);

	const sideLiveBatches = $derived(
		data.liveClasses && data.liveClasses.length > 1
			? data.liveClasses.slice(1, 3)
			: []
	);

	const actualCourses = $derived(data.courses || []);
	const actualCerts = $derived(data.certifications || []);
	const actualMentors = $derived(data.mentors || []);
	const actualResources = $derived(data.resources || []);

	const labsNavigationCards = [
		{
			id: 'lab-guided-main',
			title: 'Guided Labs',
			description: 'Step-by-step interactive labs to practice hands-on defense and exploit skills.',
			meta: 'Guided Walkthroughs',
			href: '/labs?tab=guided',
			thumbnail: '/thumbnails/lab-guided.jpg',
			type: 'guided'
		},
		{
			id: 'lab-ctf-main',
			title: 'CTF Challenges',
			description: 'Solve vulnerable target machines, capture flags, and test practical skills.',
			meta: 'Capture The Flag',
			href: '/labs?tab=ctf',
			thumbnail: '/thumbnails/lab-ctf.jpg',
			type: 'ctf'
		},
		{
			id: 'lab-env-main',
			title: 'Practice Sandboxes',
			description: 'Browser-based isolated workstations with pre-configured toolkits.',
			meta: 'Kali • SOC • Cloud',
			href: '/labs?tab=environment',
			thumbnail: '/thumbnails/lab-practice.jpg',
			type: 'environment'
		}
	];

	// Client-side search filters
	const searchFilteredCourses = $derived(() => {
		const q = searchQuery.toLowerCase().trim();
		const cat = activeCategoryTag.toLowerCase();
		return actualCourses.filter((c: any) => {
			const matchesText = !q ||
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				((c.metadata as any)?.category || '').toLowerCase().includes(q);

			const matchesCategory = activeCategoryTag === 'All' ||
				((c.metadata as any)?.category || '').toLowerCase().includes(cat) ||
				((c.tags || []) as string[]).some((t: string) => t.toLowerCase().includes(cat));

			return matchesText && matchesCategory;
		});
	});

	const searchFilteredLiveClasses = $derived(() => {
		const q = searchQuery.toLowerCase().trim();
		const cat = activeCategoryTag.toLowerCase();
		return actualLiveClasses.filter((c: any) => {
			const matchesText = !q ||
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q);

			const matchesCategory = activeCategoryTag === 'All' ||
				((c.category || '') as string).toLowerCase().includes(cat) ||
				((c.tags || []) as string[]).some((t: string) => t.toLowerCase().includes(cat));

			return matchesText && matchesCategory;
		});
	});
</script>

<svelte:head>
	<title>Explore — {APP_NAME}</title>
	<meta name="description" content="Practical skills for a more intentional you. Live classes, self-paced courses, hands-on labs, certifications and mentors." />
</svelte:head>

<div class="explore-page-root">
	<div class="container-custom">
		<!-- ── HERO SECTION ─────────────────────────────────── -->
		<section class="hero-section">
			<div class="hero-grid">
				<!-- Left Hero Content -->
				<div class="hero-left">
					<!-- Eyebrow -->
					<div class="hero-eyebrow">
						<span>LEARN</span>
						<span class="sep">•</span>
						<span>PRACTICE</span>
						<span class="sep">•</span>
						<span>BUILD</span>
						<span class="sep">•</span>
						<span>GROW</span>
					</div>

					<!-- Main Title with Styled "Intentional" -->
					<h1 class="hero-title">
						Practical Skills<br />
						for a More <span class="intentional-word">Intentional</span> You
					</h1>

					<!-- Subtitle -->
					<p class="hero-subtitle">
						Live classes, self-paced courses, hands-on labs, certifications and mentors — all in one place. Real learning. Real projects. Real opportunities.
					</p>

					<!-- Search Bar -->
					<div class="hero-search-wrap">
						<Search size={18} class="hero-search-icon" />
						<input
							type="text"
							bind:value={searchQuery}
							placeholder="Search for courses, labs, certifications, mentors..."
							class="hero-search-input"
						/>
						{#if searchQuery}
							<button class="hero-search-clear" onclick={clearSearch} aria-label="Clear search">
								<X size={14} />
							</button>
						{/if}
						<button class="hero-search-submit" onclick={() => {}} aria-label="Submit search">
							<ArrowRight size={14} />
						</button>
					</div>

					<!-- Category Filter Tags -->
					<div class="hero-tags-row">
						{#each categoryTags as tag}
							<button
								class="hero-tag-pill"
								class:active={activeCategoryTag === tag}
								onclick={() => setFilterTag(tag)}
							>
								{tag}
							</button>
						{/each}
					</div>
				</div>

				<!-- Right Hero Monolith Visual (Seamlessly Frameless) -->
				<div class="hero-right">
					<div class="monolith-frameless">
						<img
							src="/thumbnails/hero-portal.jpg"
							alt="Skills open new doors"
							class="monolith-frameless-img"
						/>
						<div class="monolith-fade-edges" aria-hidden="true"></div>

						<!-- Chevron Logo Emblem Floating on Monolith -->
						<div class="monolith-emblem-wrap">
							<LaunchpadLogo class="monolith-emblem-svg" />
						</div>

						<!-- Quote Callout -->
						<div class="monolith-quote-box">
							<p class="monolith-quote-text">
								Skills open<br />
								new doors.
							</p>
						</div>
					</div>
				</div>
			</div>

			<!-- ── 5 CATEGORY FEATURE PILLS / CARDS ROW ────────── -->
			<div class="feature-strip">
				<a href="/live-classes" class="feature-pill-card">
					<div class="feature-icon-box">
						<Video size={17} class="text-white" />
					</div>
					<div class="feature-text">
						<h3 class="feature-title">Live Classes</h3>
						<p class="feature-desc">Interact, ask, and learn with industry practitioners.</p>
					</div>
				</a>

				<a href="/courses" class="feature-pill-card">
					<div class="feature-icon-box">
						<BookOpen size={17} class="text-white" />
					</div>
					<div class="feature-text">
						<h3 class="feature-title">Self-Paced Courses</h3>
						<p class="feature-desc">Learn at your own pace with hands-on projects.</p>
					</div>
				</a>

				<a href="/labs" class="feature-pill-card highlight-lab-card">
					<div class="feature-icon-box lab-icon-box">
						<Terminal size={17} class="text-amber-400" />
					</div>
					<div class="feature-text">
						<h3 class="feature-title flex items-center gap-1.5">
							<span>Labs &amp; CTF</span>
							<span class="badge-new-micro">NEW</span>
						</h3>
						<p class="feature-desc">Practice in real-environments and solve challenges.</p>
					</div>
				</a>

				<a href="/certifications" class="feature-pill-card">
					<div class="feature-icon-box">
						<Award size={17} class="text-white" />
					</div>
					<div class="feature-text">
						<h3 class="feature-title">Certifications</h3>
						<p class="feature-desc">Validate your skills with verifiable credentials.</p>
					</div>
				</a>

				<a href="/mentoring" class="feature-pill-card">
					<div class="feature-icon-box">
						<Users size={17} class="text-white" />
					</div>
					<div class="feature-text">
						<h3 class="feature-title">Mentorship</h3>
						<p class="feature-desc">Get guidance from experienced professionals.</p>
					</div>
				</a>
			</div>
		</section>

		<!-- ── CONDITIONAL SEARCH RESULTS MODE ──────────────── -->
		{#if isSearching}
			<section class="search-active-section">
				<div class="search-results-header">
					<h2 class="search-title">Search Results for "{searchQuery}"</h2>
					<button class="btn-clear-all" onclick={clearSearch}>Clear filter</button>
				</div>

				<!-- Live Classes Matches -->
				{#if searchFilteredLiveClasses().length > 0}
					<div class="mb-10">
						<h3 class="results-subheading text-emerald-400">Live Classes ({searchFilteredLiveClasses().length})</h3>
						<div class="grid-cards-3">
							{#each searchFilteredLiveClasses() as c}
								<a href={`/catalog/${c.slug || c.id}`} class="search-match-card">
									<h4 class="font-bold text-white text-base mb-1">{c.title}</h4>
									<p class="text-xs text-slate-400 line-clamp-2">{c.description}</p>
								</a>
							{/each}
						</div>
					</div>
				{/if}

				<!-- Courses Matches -->
				{#if searchFilteredCourses().length > 0}
					<div class="mb-10">
						<h3 class="results-subheading text-blue-400">Courses ({searchFilteredCourses().length})</h3>
						<div class="grid-cards-4">
							{#each searchFilteredCourses() as c}
								{@const cat = (c.metadata as any)?.category || (c.deliveryFormat === 'live_batch' ? 'LIVE BATCH' : 'SELF-PACED')}
								{@const dur = (c.metadata as any)?.duration || '8 Hours'}
								<a href={`/catalog/${c.slug || c.id}`} class="course-card group">
									<div class="course-thumb-wrap">
										<img src={c.thumbnail || '/thumbnails/course-pentest.jpg'} alt={c.title} class="course-img" />
										<span class="course-badge">{cat}</span>
									</div>
									<div class="course-body">
										<h4 class="course-title">{c.title}</h4>
										<p class="course-meta">{dur}</p>
									</div>
								</a>
							{/each}
						</div>
					</div>
				{/if}
			</section>
		{/if}

		<!-- ── MAIN CURATED SECTIONS (DATABASE DATA) ────────── -->
		<div class="sections-container" class:search-mode={isSearching}>
			<!-- ── 1. LIVE CLASSES & COHORTS ────────────────── -->
			{#if featuredCohort}
			<section class="catalog-section" id="live-classes">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-green"></span>
							<span>LIVE LEARNING</span>
						</div>
						<h2 class="section-main-heading">Live Classes &amp; Cohorts</h2>
						<p class="section-subtext">Instructor-led cohorts with real projects, doubt sessions, and peer support.</p>
					</div>

					<a href="/live-classes" class="section-action-link">
						<span>View all live classes</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="cohorts-layout">
					<!-- Featured Large Cohort Card (Left) -->
					{#if featuredCohort}
						{@const featCategory = (featuredCohort.metadata as any)?.category || 'CYBERSECURITY'}
						{@const featLevel = (featuredCohort.metadata as any)?.level || 'BEGINNER → INTERMEDIATE'}
						{@const featStart = (featuredCohort.metadata as any)?.startDate || 'Starts Nov 11, 2026'}
						{@const featSeats = (featuredCohort.metadata as any)?.seats || '25 Seats'}
						{@const featPrice = featuredCohort.pricePaise ? `₹${(featuredCohort.pricePaise / 100).toLocaleString('en-IN')}` : '₹15,999'}
						{@const featUrl = `/catalog/${featuredCohort.slug || featuredCohort.id}`}
						<div class="featured-cohort-card group">
						<div class="cohort-visual-side">
							<img
								src={featuredCohort.thumbnail || '/thumbnails/practical-cybersecurity.jpg'}
								alt={featuredCohort.title}
								class="cohort-img"
							/>
							<div class="cohort-img-gradient"></div>
						</div>

						<div class="cohort-info-side">
							<div class="cohort-badges-row">
								<span class="live-cohort-pill">
									<span class="mini-live-dot"></span>
									<span>LIVE COHORT</span>
								</span>
								<span class="category-pill">{featCategory}</span>
								<span class="level-pill-outline">{featLevel}</span>
							</div>

							<h3 class="featured-cohort-title">
								{featuredCohort.title}
							</h3>

							<p class="featured-cohort-desc">
								{featuredCohort.description || 'Build. Break. Defend. A project-led cybersecurity program with live practitioner sessions.'}
							</p>

							<div class="cohort-schedule-row">
								<div class="schedule-pill">
									<Calendar size={14} class="text-slate-400" />
									<span>{featStart}</span>
								</div>
								<div class="schedule-pill">
									<Users size={14} class="text-slate-400" />
									<span>{featSeats}</span>
								</div>
							</div>

							<div class="cohort-bottom-cta">
								<div class="tuition-box">
									<span class="tuition-label">Cohort Tuition</span>
									<span class="tuition-price">{featPrice}</span>
								</div>

								<a href={featUrl} class="btn-view-cohort">
									<span>View Details</span>
									<ArrowRight size={14} />
								</a>
							</div>
						</div>
					</div>
					{/if}

					<!-- Side Stacked Cohort Cards (Right) -->
					{#if sideLiveBatches.length > 0}
					<div class="side-cohorts-col">
						{#each sideLiveBatches as item}
							{@const itemSchedule = (item.metadata as any)?.schedule || item.schedule || 'Weekend Batches'}
							{@const itemSeats = (item.metadata as any)?.seats || item.seats || '18 seats'}
							{@const itemUrl = `/catalog/${item.slug || item.id}`}
							<a href={itemUrl} class="side-live-card group">
								<div class="side-card-thumb">
									<img src={item.thumbnail || '/thumbnails/course-cloud.jpg'} alt={item.title} class="side-thumb-img" />
								</div>
								<div class="side-card-info">
									<div class="side-badge-row">
										<span class="live-red-pill">LIVE</span>
									</div>
									<h4 class="side-card-title">{item.title}</h4>
									<div class="side-meta-row">
										<span class="flex items-center gap-1">
											<Calendar size={12} class="text-slate-400" />
											<span>{itemSchedule}</span>
										</span>
										<span class="sep">•</span>
										<span class="flex items-center gap-1">
											<Users size={12} class="text-slate-400" />
											<span>{itemSeats}</span>
										</span>
									</div>
								</div>
								<div class="side-card-arrow">
									<ArrowRight size={14} />
								</div>
							</a>
						{/each}
					</div>
					{/if}
				</div>
			</section>
			{/if}

			<!-- ── 2. SELF-PACED COURSES ────────────────────── -->
			{#if actualCourses.length > 0}
			<section class="catalog-section" id="courses">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-purple"></span>
							<span>LEARN ANYTIME</span>
						</div>
						<h2 class="section-main-heading">Self-Paced Courses</h2>
						<p class="section-subtext">Structured, project-based learning paths for hands-on skill development.</p>
					</div>

					<a href="/courses" class="section-action-link">
						<span>View all courses</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="grid-cards-4">
					{#each actualCourses.slice(0, 8) as course}
						{@const courseCat = (course.metadata as any)?.category || course.badge || 'SELF-PACED'}
						{@const courseDur = (course.metadata as any)?.duration ? `${(course.metadata as any).duration} • Self-Paced` : (course.meta || '8 chapters • 6 hours')}
						{@const courseThumb = course.thumbnail || '/thumbnails/course-pentest.jpg'}
						{@const courseUrl = `/catalog/${course.slug || course.id}`}
						<a href={courseUrl} class="course-card group">
							<div class="course-thumb-wrap">
								<img src={courseThumb} alt={course.title} class="course-img" />
								<span class="course-badge">{courseCat}</span>
							</div>

							<div class="course-body">
								<h3 class="course-title">{course.title}</h3>
								{#if course.description}
									<p class="course-desc">{course.description}</p>
								{/if}
								<div class="course-footer-row">
									<span class="course-meta">{courseDur}</span>
									<div class="circle-arrow-btn">
										<ArrowRight size={13} />
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>
			{/if}

			<!-- ── 3. LABS & CTF (NEW) ───────────────────────── -->
			<section class="catalog-section highlight-labs-section" id="labs">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-amber"></span>
							<span>PRACTICE &amp; COMPETE</span>
						</div>
						<h2 class="section-main-heading">Labs &amp; CTF</h2>
						<p class="section-subtext">Hands-on environments, real-world scenarios, and capture the flag challenges.</p>
					</div>

					<a href="/labs" class="section-action-link">
						<span>Explore all labs</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="grid-cards-3">
					{#each labsNavigationCards as lab}
						<a href={lab.href} class="lab-explore-card group">
							<img src={lab.thumbnail} alt={lab.title} class="lab-bg-img" loading="lazy" />
							<div class="lab-overlay"></div>

							<div class="lab-card-content">
								<div class="lab-icon-circle">
									{#if lab.type === 'ctf'}
										<Flag size={18} class="text-amber-400" />
									{:else if lab.type === 'environment'}
										<Box size={18} class="text-cyan-400" />
									{:else}
										<Terminal size={18} class="text-emerald-400" />
									{/if}
								</div>

								<div class="lab-card-middle">
									<h3 class="lab-card-title">{lab.title}</h3>
									<p class="lab-card-desc">{lab.description}</p>
								</div>

								<div class="lab-bottom-row">
									<span class="lab-meta-tag">{lab.meta}</span>
									<div class="circle-arrow-btn">
										<ArrowRight size={13} />
									</div>
								</div>
							</div>
						</a>
					{/each}
				</div>
			</section>

			<!-- ── 4. CERTIFICATIONS & ASSESSMENTS ──────────── -->
			{#if actualCerts.length > 0}
			<section class="catalog-section" id="certifications">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-green"></span>
							<span>PROVE YOUR SKILLS</span>
						</div>
						<h2 class="section-main-heading">Certifications &amp; Assessments</h2>
						<p class="section-subtext">Rigorous, hands-on exams with verifiable credentials.</p>
					</div>

					<a href="/certifications" class="section-action-link">
						<span>View all certifications</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="grid-cards-3">
					{#each actualCerts.slice(0, 6) as cert}
						{@const certLevel = (cert.metadata as any)?.level || cert.level || 'INTERMEDIATE'}
						{@const certQs = (cert.metadata as any)?.questions ? `${(cert.metadata as any).questions} Questions` : (cert.questions || '20+ Questions')}
						{@const certDur = (cert.metadata as any)?.duration || cert.duration || '60 min'}
						{@const certPass = (cert.metadata as any)?.passingScore || cert.passingScore || '75% Passing'}
						{@const certUrl = `/certifications/${cert.slug || cert.id}`}
						<div class="cert-card">
							<div class="cert-header">
								<div class="cert-icon-container">
									<Shield size={22} class="text-sky-400" />
								</div>

								<div class="flex-1">
									<h3 class="cert-title">{cert.title}</h3>
									<span class="cert-level-badge level-{certLevel.toLowerCase()}">
										{certLevel}
									</span>
								</div>
							</div>

							<p class="cert-desc">{cert.description || 'Rigorous examination yielding verifiable credential.'}</p>

							<div class="cert-stats-row">
								<span class="flex items-center gap-1.5">
									<BookOpen size={13} class="text-slate-400" />
									<span>{certQs}</span>
								</span>
								<span class="sep">•</span>
								<span class="flex items-center gap-1.5">
									<Clock size={13} class="text-slate-400" />
									<span>{certDur}</span>
								</span>
								<span class="sep">•</span>
								<span class="flex items-center gap-1.5">
									<CheckCircle2 size={13} class="text-emerald-400" />
									<span>{certPass}</span>
								</span>
							</div>

							<div class="cert-action-box">
								<a href={certUrl} class="btn-take-exam">
									<span>Take Exam</span>
									<ArrowRight size={13} />
								</a>
							</div>
						</div>
					{/each}
				</div>
			</section>
			{/if}

			<!-- ── 5. EXPERT PRACTITIONERS & MENTORS ───────── -->
			{#if actualMentors.length > 0}
			<section class="catalog-section" id="mentoring">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-blue"></span>
							<span>LEARN FROM THE BEST</span>
						</div>
						<h2 class="section-main-heading">Expert Practitioners &amp; Mentors</h2>
						<p class="section-subtext">Book 1-on-1 sessions, get your work reviewed, or just ask questions.</p>
					</div>

					<a href="/mentoring" class="section-action-link">
						<span>View all mentors</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="mentors-grid-wrap">
					<div class="grid-cards-3 flex-1">
						{#each actualMentors.slice(0, 3) as mentor}
							{@const mInitials = mentor.initials || (mentor.name ? mentor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase() : 'ME')}
							{@const mHeadline = mentor.headline || mentor.role || 'Cloud Security Architect'}
							{@const mTags = mentor.specialties || mentor.tags || ['AWS', 'Kubernetes', 'Security']}
							{@const mServices = mentor.bio || mentor.services || 'Architecture reviews • Career guidance'}
							{@const mUrl = `/mentoring/${mentor.handle || mentor.id}`}
							<div class="mentor-card">
								<div class="mentor-header">
									<div class="mentor-avatar-initials">
										{mInitials}
									</div>
									<div>
										<h3 class="mentor-name">{mentor.name}</h3>
										<p class="mentor-role">{mHeadline}</p>
									</div>
								</div>

								<div class="mentor-tags-row">
									{#each mTags.slice(0, 3) as tag}
										<span class="mentor-tag-pill">{tag}</span>
									{/each}
								</div>

								<p class="mentor-services">{mServices}</p>

								<div class="mentor-bottom-row">
									<div class="session-type-pill">
										<Calendar size={13} class="text-slate-400" />
										<span>1-on-1 Sessions</span>
									</div>

									<a href={mUrl} class="btn-book-session">
										<span>Book Session</span>
									</a>
								</div>
							</div>
						{/each}
					</div>

					<!-- Carousel Next Arrow Button on Right -->
					<div class="carousel-arrow-wrap hidden lg:flex">
						<a href="/mentoring" class="carousel-nav-btn" aria-label="View more mentors">
							<ArrowRight size={18} />
						</a>
					</div>
				</div>
			</section>
			{/if}

			<!-- ── 6. RESOURCES & GUIDES ────────────────────── -->
			{#if actualResources.length > 0}
			<section class="catalog-section mb-16" id="resources">
				<div class="section-top-bar">
					<div>
						<div class="section-kicker">
							<span class="pulsing-dot dot-purple"></span>
							<span>LEARN BEYOND COURSES</span>
						</div>
						<h2 class="section-main-heading">Resources &amp; Guides</h2>
						<p class="section-subtext">Cheatsheets, checklists, templates and practical guides.</p>
					</div>

					<a href="/resources" class="section-action-link">
						<span>View all resources</span>
						<ArrowRight size={14} />
					</a>
				</div>

				<div class="grid-cards-4">
					{#each actualResources.slice(0, 8) as res}
						{@const resFormat = (res.metadata as any)?.fileType || (res.metadata as any)?.format || res.type || 'PDF'}
						{@const resPages = (res.metadata as any)?.pages ? `${(res.metadata as any).pages} pages` : (res.pages || 'Reference Guide')}
						{@const resUrl = `/catalog/${res.slug || res.id}`}
						<a href={resUrl} class="resource-card group">
							<div class="res-icon-box">
								<BookOpen size={18} class="text-slate-300" />
							</div>

							<div class="res-content">
								<h3 class="res-title">{res.title}</h3>
								<div class="res-meta-row">
									<span class="res-meta-text">{resFormat.toUpperCase()} • {resPages}</span>
								</div>
							</div>

							<div class="res-download-btn">
								<Download size={14} />
							</div>
						</a>
					{/each}
				</div>
			</section>
			{/if}
		</div>
	</div>
</div>

<style>
	/* Root & Container */
	.explore-page-root {
		min-height: 100vh;
		background: #080b11;
		color: #f1f5f9;
		padding-bottom: 96px;
	}

	.container-custom {
		max-width: 1400px;
		margin: 0 auto;
		padding: 0 28px;
	}

	/* Hero Section */
	.hero-section {
		padding: 48px 0 36px 0;
	}

	.hero-grid {
		display: grid;
		grid-template-columns: 1fr;
		gap: 36px;
		align-items: center;
		margin-bottom: 40px;
	}

	@media (min-width: 992px) {
		.hero-grid {
			grid-template-columns: 1.25fr 0.95fr;
			gap: 48px;
		}
	}

	.hero-left {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.hero-eyebrow {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.72rem;
		font-weight: 700;
		color: #94a3b8;
		letter-spacing: 0.24em;
		text-transform: uppercase;
	}

	.sep {
		color: #475569;
	}

	.hero-title {
		font-size: 2.75rem;
		font-weight: 800;
		line-height: 1.15;
		color: #ffffff;
		letter-spacing: -0.03em;
	}

	@media (min-width: 768px) {
		.hero-title {
			font-size: 3.5rem;
		}
	}

	.intentional-word {
		font-family: Georgia, 'Times New Roman', serif;
		font-style: italic;
		font-weight: 400;
		color: #ffffff;
		padding: 2px 10px;
		border-radius: 8px;
		border: 1px solid rgba(255, 255, 255, 0.15);
		background: rgba(15, 23, 42, 0.5);
		box-shadow: inset 0 1px 2px rgba(255, 255, 255, 0.05);
	}

	.hero-subtitle {
		font-size: 1.05rem;
		color: #94a3b8;
		line-height: 1.6;
		max-width: 580px;
	}

	/* Hero Search Bar */
	.hero-search-wrap {
		position: relative;
		max-width: 580px;
		display: flex;
		align-items: center;
	}

	.hero-search-icon {
		position: absolute;
		left: 18px;
		color: #64748b;
		pointer-events: none;
	}

	.hero-search-input {
		width: 100%;
		padding: 14px 80px 14px 48px;
		border-radius: var(--radius-full);
		font-size: 0.88rem;
		background: var(--color-surface-subtle);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		outline: none;
		transition: border-color var(--t-fast), box-shadow var(--t-fast);
		box-shadow: var(--shadow-sm);
	}

	.hero-search-input:focus {
		border-color: var(--color-border-strong);
		box-shadow: 0 0 0 3px var(--lp-accent-subtle);
	}

	.hero-search-clear {
		position: absolute;
		right: 48px;
		color: var(--color-text-muted);
		padding: 4px;
	}

	.hero-search-clear:hover {
		color: var(--color-text);
	}

	.hero-search-submit {
		position: absolute;
		right: 8px;
		width: 34px;
		height: 34px;
		border-radius: var(--radius-full);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		transition: background var(--t-fast), transform var(--t-fast);
	}

	.hero-search-submit:hover {
		background: #334155;
		transform: scale(1.05);
	}

	/* Hero Tags Row */
	.hero-tags-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
		padding-top: 4px;
	}

	.hero-tag-pill {
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 500;
		color: #94a3b8;
		background: rgba(15, 23, 42, 0.6);
		border: 1px solid rgba(255, 255, 255, 0.08);
		transition: all 0.15s ease;
	}

	.hero-tag-pill:hover {
		color: #ffffff;
		border-color: rgba(255, 255, 255, 0.2);
		background: rgba(30, 41, 59, 0.7);
	}

	.hero-tag-pill.active {
		background: #ffffff;
		color: #0b0f17;
		font-weight: 600;
		border-color: #ffffff;
	}

	/* Right Monolith Visual (Frameless) */
	.hero-right {
		position: relative;
		width: 100%;
		height: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.monolith-frameless {
		position: relative;
		width: 100%;
		max-width: 500px;
		height: 440px;
		background: transparent;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
	}

	.monolith-frameless-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		object-position: center;
		opacity: 0.95;
		mask-image: 
			linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.8) 12%, black 25%, black 55%, rgba(0, 0, 0, 0.7) 78%, transparent 100%),
			linear-gradient(to bottom, transparent 0%, black 12%, black 88%, transparent 100%);
		mask-composite: intersect;
		-webkit-mask-image: linear-gradient(to right, transparent 0%, rgba(0, 0, 0, 0.8) 12%, black 25%, black 55%, rgba(0, 0, 0, 0.7) 78%, transparent 100%);
		filter: drop-shadow(0 0 35px rgba(56, 189, 248, 0.15));
	}

	.monolith-fade-edges {
		position: absolute;
		inset: 0;
		background: 
			linear-gradient(to right, #080b11 0%, rgba(8, 11, 17, 0.8) 8%, rgba(8, 11, 17, 0.25) 20%, transparent 32%, transparent 58%, rgba(8, 11, 17, 0.4) 72%, rgba(8, 11, 17, 0.88) 88%, #080b11 100%),
			linear-gradient(to bottom, #080b11 0%, transparent 12%, transparent 88%, #080b11 100%);
		pointer-events: none;
		z-index: 1;
	}

	.monolith-emblem-wrap {
		position: absolute;
		top: 36%;
		left: 48%;
		transform: translate(-50%, -50%);
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
		z-index: 2;
	}

	:global(.monolith-emblem-svg) {
		width: 44px;
		height: 44px;
		color: #ffffff;
		filter: drop-shadow(0 0 16px rgba(255, 255, 255, 0.6));
	}

	.monolith-quote-box {
		position: absolute;
		top: 32px;
		right: 16px;
		text-align: right;
		pointer-events: none;
		z-index: 2;
	}

	.monolith-quote-text {
		font-size: 0.95rem;
		font-weight: 300;
		color: #e2e8f0;
		line-height: 1.4;
		letter-spacing: 0.02em;
	}

	/* 5 Feature Category Strip */
	.feature-strip {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
		gap: 12px;
		padding: 12px;
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.06);
	}

	.feature-pill-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 12px 14px;
		border-radius: 12px;
		background: transparent;
		text-decoration: none;
		transition: background 0.15s ease, transform 0.15s ease;
	}

	.feature-pill-card:hover {
		background: rgba(255, 255, 255, 0.04);
		transform: translateY(-1px);
	}

	.feature-icon-box {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: #1e293b;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.lab-icon-box {
		background: rgba(245, 158, 11, 0.15);
		border: 1px solid rgba(245, 158, 11, 0.3);
	}

	.badge-new-micro {
		font-size: 0.62rem;
		font-weight: 800;
		background: #f59e0b;
		color: #0b0f17;
		padding: 1px 5px;
		border-radius: 3px;
	}

	.feature-text {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.feature-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: #ffffff;
	}

	.feature-desc {
		font-size: 0.74rem;
		color: #64748b;
		line-height: 1.35;
	}

	/* Sections Common Header */
	.sections-container {
		display: flex;
		flex-direction: column;
		gap: 64px;
		margin-top: 48px;
	}

	.catalog-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section-top-bar {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		gap: 20px;
		flex-wrap: wrap;
	}

	.section-kicker {
		display: inline-flex;
		align-items: center;
		gap: 7px;
		font-size: 0.7rem;
		font-weight: 800;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		margin-bottom: 6px;
	}

	.pulsing-dot {
		width: 6px;
		height: 6px;
		border-radius: 999px;
	}

	.dot-green {
		background: #10b981;
		box-shadow: 0 0 8px #10b981;
	}

	.dot-purple {
		background: #a855f7;
		box-shadow: 0 0 8px #a855f7;
	}

	.dot-amber {
		background: #f59e0b;
		box-shadow: 0 0 8px #f59e0b;
	}

	.dot-blue {
		background: #38bdf8;
		box-shadow: 0 0 8px #38bdf8;
	}

	.section-main-heading {
		font-size: 1.65rem;
		font-weight: 800;
		color: #ffffff;
		letter-spacing: -0.02em;
		line-height: 1.25;
	}

	.section-subtext {
		font-size: 0.85rem;
		color: #64748b;
		margin-top: 2px;
	}

	.section-action-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		color: #94a3b8;
		text-decoration: none;
		transition: color 0.15s ease, transform 0.15s ease;
	}

	.section-action-link:hover {
		color: #ffffff;
		transform: translateX(2px);
	}

	/* Section 1: Live Cohorts Layout */
	.cohorts-layout {
		display: grid;
		grid-template-columns: 1fr;
		gap: 20px;
	}

	@media (min-width: 992px) {
		.cohorts-layout {
			grid-template-columns: 1.7fr 1fr;
		}
	}

	.featured-cohort-card {
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		overflow: hidden;
		display: grid;
		grid-template-columns: 1fr;
		transition: border-color 0.2s ease, box-shadow 0.2s ease;
	}

	@media (min-width: 768px) {
		.featured-cohort-card {
			grid-template-columns: 1fr 1.35fr;
		}
	}

	.featured-cohort-card:hover {
		border-color: rgba(255, 255, 255, 0.18);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
	}

	.cohort-visual-side {
		position: relative;
		min-height: 220px;
		background: #020617;
	}

	.cohort-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.8;
	}

	.cohort-img-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(90deg, transparent 40%, #0d121c 100%);
	}

	.cohort-info-side {
		padding: 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 16px;
	}

	.cohort-badges-row {
		display: flex;
		align-items: center;
		gap: 8px;
		flex-wrap: wrap;
	}

	.live-cohort-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 8px;
		border-radius: 999px;
		font-size: 0.68rem;
		font-weight: 700;
		background: rgba(16, 185, 129, 0.15);
		border: 1px solid rgba(16, 185, 129, 0.3);
		color: #34d399;
	}

	.mini-live-dot {
		width: 5px;
		height: 5px;
		border-radius: 999px;
		background: #10b981;
	}

	.category-pill {
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 700;
		background: #1e293b;
		color: #94a3b8;
		text-transform: uppercase;
	}

	.level-pill-outline {
		padding: 2px 7px;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 600;
		border: 1px solid rgba(255, 255, 255, 0.1);
		color: #64748b;
	}

	.featured-cohort-title {
		font-size: 1.35rem;
		font-weight: 800;
		color: #ffffff;
		line-height: 1.3;
	}

	.featured-cohort-desc {
		font-size: 0.82rem;
		color: #94a3b8;
		line-height: 1.5;
	}

	.cohort-schedule-row {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-wrap: wrap;
	}

	.schedule-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.78rem;
		color: #94a3b8;
	}

	.cohort-bottom-cta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 16px;
		padding-top: 16px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.tuition-box {
		display: flex;
		flex-direction: column;
	}

	.tuition-label {
		font-size: 0.7rem;
		color: #64748b;
	}

	.tuition-price {
		font-size: 1.15rem;
		font-weight: 800;
		color: #34d399;
	}

	.btn-view-cohort {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 18px;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 700;
		background: #ffffff;
		color: #090d16;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-view-cohort:hover {
		background: #e2e8f0;
		transform: translateX(2px);
	}

	/* Side Stacked Cohorts */
	.side-cohorts-col {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.side-live-card {
		display: flex;
		align-items: center;
		gap: 16px;
		padding: 16px;
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.side-live-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		background: #111827;
	}

	.side-card-thumb {
		width: 90px;
		height: 70px;
		border-radius: 8px;
		overflow: hidden;
		flex-shrink: 0;
		background: #020617;
	}

	.side-thumb-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.side-card-info {
		display: flex;
		flex-direction: column;
		gap: 4px;
		flex: 1;
		min-width: 0;
	}

	.side-badge-row {
		display: flex;
	}

	.live-red-pill {
		padding: 1px 6px;
		border-radius: 4px;
		font-size: 0.62rem;
		font-weight: 800;
		background: rgba(239, 68, 68, 0.2);
		color: #f87171;
		border: 1px solid rgba(239, 68, 68, 0.3);
	}

	.side-card-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: #ffffff;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.side-meta-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.74rem;
		color: #64748b;
	}

	.side-card-arrow {
		width: 32px;
		height: 32px;
		border-radius: 999px;
		background: #1e293b;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #94a3b8;
		flex-shrink: 0;
		transition: all 0.15s ease;
	}

	.side-live-card:hover .side-card-arrow {
		background: #ffffff;
		color: #090d16;
		transform: translateX(3px);
	}

	/* Common Grids */
	.grid-cards-4 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
		gap: 20px;
	}

	.grid-cards-3 {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(340px, 1fr));
		gap: 20px;
	}

	/* Course Cards (Self-Paced) */
	.course-card {
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.course-card:hover {
		transform: translateY(-3px);
		border-color: rgba(255, 255, 255, 0.2);
		box-shadow: 0 16px 36px rgba(0, 0, 0, 0.6);
	}

	.course-thumb-wrap {
		position: relative;
		width: 100%;
		height: 155px;
		background: #020617;
		overflow: hidden;
	}

	.course-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.75;
		transition: transform 0.3s ease;
	}

	.course-card:hover .course-img {
		transform: scale(1.04);
	}

	.course-badge {
		position: absolute;
		top: 12px;
		left: 12px;
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 0.65rem;
		font-weight: 700;
		background: rgba(15, 23, 42, 0.85);
		color: #38bdf8;
		border: 1px solid rgba(56, 189, 248, 0.3);
		backdrop-filter: blur(6px);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.course-body {
		padding: 18px;
		display: flex;
		flex-direction: column;
		flex: 1;
		justify-content: space-between;
	}

	.course-title {
		font-size: 0.98rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.35;
		margin-bottom: 6px;
	}

	.course-desc {
		font-size: 0.78rem;
		color: #64748b;
		line-height: 1.45;
		margin-bottom: 12px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.course-footer-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
		padding-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.04);
	}

	.course-meta {
		font-size: 0.75rem;
		color: #94a3b8;
	}

	.circle-arrow-btn {
		width: 30px;
		height: 30px;
		border-radius: 999px;
		background: #1e293b;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #94a3b8;
		transition: all 0.15s ease;
	}

	.course-card:hover .circle-arrow-btn,
	.lab-explore-card:hover .circle-arrow-btn {
		background: #ffffff;
		color: #090d16;
		transform: translateX(2px);
	}

	/* Section 3: Labs & CTF Card */
	.lab-explore-card {
		position: relative;
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		overflow: hidden;
		min-height: 200px;
		display: flex;
		flex-direction: column;
		text-decoration: none;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.lab-explore-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-lg);
	}

	.lab-bg-img {
		position: absolute;
		inset: 0;
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.35;
		transition: transform 0.3s ease;
	}

	.lab-explore-card:hover .lab-bg-img {
		transform: scale(1.05);
	}

	.lab-overlay {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(13, 18, 28, 0.6) 0%, var(--color-surface) 100%);
	}

	.lab-card-content {
		position: relative;
		z-index: 2;
		padding: 22px;
		display: flex;
		flex-direction: column;
		height: 100%;
		justify-content: space-between;
		gap: 16px;
	}

	.lab-icon-circle {
		width: 38px;
		height: 38px;
		border-radius: var(--radius-full);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(8px);
	}

	.lab-card-title {
		font-size: 1.15rem;
		font-weight: 800;
		color: var(--color-text);
		margin-bottom: 6px;
	}

	.lab-card-desc {
		font-size: 0.82rem;
		color: var(--color-text-secondary);
		line-height: 1.45;
	}

	.lab-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 14px;
		border-top: 1px solid var(--color-border-subtle);
	}

	.lab-meta-tag {
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		font-weight: 500;
	}

	/* Section 4: Certifications Cards */
	.cert-card {
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 22px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 16px;
		transition: border-color 0.2s ease;
	}

	.cert-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.cert-header {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.cert-icon-container {
		width: 44px;
		height: 44px;
		border-radius: 10px;
		background: rgba(14, 165, 233, 0.15);
		border: 1px solid rgba(14, 165, 233, 0.3);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.cert-title {
		font-size: 0.98rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.35;
		margin-bottom: 6px;
	}

	.cert-level-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		background: #1e293b;
		color: #94a3b8;
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.cert-level-badge.level-intermediate { color: #38bdf8; }
	.cert-level-badge.level-advanced { color: #f59e0b; }
	.cert-level-badge.level-beginner { color: #34d399; }

	.cert-desc {
		font-size: 0.8rem;
		color: #64748b;
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.cert-stats-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
		color: #94a3b8;
		padding-bottom: 8px;
	}

	.btn-take-exam {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 9px 16px;
		border-radius: 999px;
		font-size: 0.82rem;
		font-weight: 700;
		background: #ffffff;
		color: #090d16;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-take-exam:hover {
		background: #e2e8f0;
	}

	/* Section 5: Mentors Cards */
	.mentors-grid-wrap {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.mentor-card {
		border-radius: 16px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		transition: border-color 0.2s ease;
	}

	.mentor-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
	}

	.mentor-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.mentor-avatar-initials {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #ffffff;
		font-weight: 700;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.mentor-name {
		font-size: 0.98rem;
		font-weight: 700;
		color: #ffffff;
	}

	.mentor-role {
		font-size: 0.78rem;
		color: #64748b;
	}

	.mentor-tags-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.mentor-tag-pill {
		padding: 3px 8px;
		border-radius: 4px;
		font-size: 0.68rem;
		font-weight: 500;
		background: rgba(30, 41, 59, 0.7);
		color: #94a3b8;
		border: 1px solid rgba(255, 255, 255, 0.05);
	}

	.mentor-services {
		font-size: 0.78rem;
		color: #94a3b8;
		line-height: 1.45;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.mentor-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid rgba(255, 255, 255, 0.06);
	}

	.session-type-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: #64748b;
	}

	.btn-book-session {
		display: inline-flex;
		align-items: center;
		padding: 7px 14px;
		border-radius: 999px;
		font-size: 0.78rem;
		font-weight: 700;
		background: #ffffff;
		color: #090d16;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-book-session:hover {
		background: #e2e8f0;
	}

	.carousel-nav-btn {
		width: 44px;
		height: 44px;
		border-radius: 999px;
		background: #1e293b;
		border: 1px solid rgba(255, 255, 255, 0.12);
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.carousel-nav-btn:hover {
		background: #ffffff;
		color: #090d16;
		transform: translateX(3px);
	}

	/* Section 6: Resources Cards */
	.resource-card {
		border-radius: 14px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		padding: 16px;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.resource-card:hover {
		border-color: rgba(255, 255, 255, 0.2);
		background: #111827;
	}

	.res-icon-box {
		width: 36px;
		height: 36px;
		border-radius: 8px;
		background: #1e293b;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.res-content {
		flex: 1;
		min-width: 0;
	}

	.res-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: #ffffff;
		line-height: 1.35;
		margin-bottom: 6px;
	}

	.res-meta-text {
		font-size: 0.72rem;
		color: #64748b;
	}

	.res-download-btn {
		color: #64748b;
		padding: 4px;
		transition: color 0.15s ease;
	}

	.resource-card:hover .res-download-btn {
		color: #ffffff;
	}

	/* Search Results Active Mode */
	.search-active-section {
		padding: 32px 0 24px 0;
		border-bottom: 1px solid rgba(255, 255, 255, 0.08);
	}

	.search-results-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.search-title {
		font-size: 1.4rem;
		font-weight: 800;
		color: #ffffff;
	}

	.btn-clear-all {
		padding: 6px 14px;
		border-radius: 999px;
		font-size: 0.75rem;
		background: rgba(255, 255, 255, 0.1);
		color: #ffffff;
		border: 1px solid rgba(255, 255, 255, 0.15);
	}

	.results-subheading {
		font-size: 1rem;
		font-weight: 700;
		margin-bottom: 12px;
	}

	.search-match-card {
		padding: 16px;
		border-radius: 12px;
		background: #0d121c;
		border: 1px solid rgba(255, 255, 255, 0.08);
		text-decoration: none;
	}

	.sections-container.search-mode {
		opacity: 0.45;
		filter: grayscale(30%);
	}
</style>
