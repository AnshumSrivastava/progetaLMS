<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { 
		ArrowRight, Play, Calendar, Clock, Users, FileText, Shield, 
		ShieldCheck, ChevronDown, Check, Terminal, Layers, 
		TrendingUp, Sparkles, X, MessageSquare, ExternalLink,
		BookOpen, Lock, AlertCircle, Award
	} from 'lucide-svelte';
	import { goto } from '$app/navigation';

	let { data } = $props();

	const isLiveCohortCourse = $derived(
		(data.asset as any).deliveryFormat === 'live_batch' ||
		((data.asset as any).isLiveBatchesEnabled && !(data.asset as any).isSelfPacedEnabled)
	);
	const selectedModality = $derived(isLiveCohortCourse ? 'live_batch' : 'self_paced');

	// Comprehensive course metadata
	const metadata = $derived(data.asset.metadata || {});
	const tagline = $derived(metadata.tagline || 'Build. Break. Detect. Respond.');
	const courseApproach = $derived(metadata.courseApproach || '');
	const coreIdea = $derived(metadata.coreIdea || '');
	const learningJourney = $derived(metadata.learningJourney || []);
	const capstoneProject = $derived(metadata.capstoneProject || null);
	const finalOutcome = $derived(metadata.finalOutcome || null);
	const structuredModules = $derived(metadata.modules || []);

	// Active Cohorts Gating (1 active at a time)
	const initialCohortId = data.cohorts && data.cohorts.length > 0 
		? (data.cohorts.find(c => !c.isSoldOut)?.id || data.cohorts[0].id) 
		: '';
	let selectedCohortId = $state(initialCohortId);

	const activeBatch = $derived(data.cohorts?.find(c => c.id === selectedCohortId) || data.cohorts?.[0] || null);

	function enroll() {
		if (data.alreadyOwned) {
			if (selectedModality === 'live_batch') {
				goto('/dashboard');
			} else {
				goto(`/learn/${data.asset.id}`);
			}
		} else {
			if (selectedModality === 'live_batch' && selectedCohortId) {
				goto(`/checkout/${selectedCohortId}`);
			} else {
				goto(`/checkout/${data.asset.id}`);
			}
		}
	}

	const category = $derived(data.asset.metadata?.category || 'CYBERSECURITY');
	const instructor = $derived(data.instructorName || 'Anmol Madan');
	const free = $derived(!data.asset.pricePaise || data.asset.pricePaise === 0);
	const basePriceFormatted = $derived(free ? 'Free' : `₹${(data.asset.pricePaise / 100).toLocaleString('en-IN')}`);
	
	const activePriceFormatted = $derived.by(() => {
		if (selectedModality === 'self_paced') return basePriceFormatted;
		if (selectedModality === 'live_batch' && selectedCohortId) {
			const batch = data.cohorts?.find(c => c.id === selectedCohortId);
			if (batch && batch.pricePaise !== null && batch.pricePaise !== undefined) {
				return batch.pricePaise === 0 ? 'Free' : `₹${(batch.pricePaise / 100).toLocaleString('en-IN')}`;
			}
		}
		return basePriceFormatted;
	});

	// Accordion state for Curriculum items
	let expandedModule = $state<number | null>(null);

	function toggleModule(index: number) {
		expandedModule = expandedModule === index ? null : index;
	}

	// Preview modal state
	let isPreviewOpen = $state(false);

	// Curriculum data mapped to the 5 modules shown in the mockup
	const curriculumModules = [
		{
			num: '01',
			title: 'Foundations & Finding the Attack',
			desc: 'System fundamentals, Linux, networking basics and information gathering.',
			week: 'Week 1–2',
			hours: '6 Hours',
			concepts: [
				'Attacker vs. defender mental model and threat landscape',
				'Operating system fundamentals (Linux focus: processes, file hierarchy, permissions)',
				'Networking fundamentals (TCP/UDP, ports, OSI model, packet flow)',
				'Reconnaissance basics: passive vs. active scanning with Nmap'
			],
			labs: [
				'Set up defensive monitoring on Linux VM',
				'Network reconnaissance & open-port discovery on target machine',
				'Service fingerprinting and vulnerability surface mapping'
			],
			deliverables: 'Deliverable 1: Target reconnaissance dossier and system exposure report.'
		},
		{
			num: '02',
			title: 'Web Security, Attacks & Evidence',
			desc: 'Web application security, common vulnerabilities and how to find, exploit and analyze them.',
			week: 'Week 3–4',
			hours: '6 Hours',
			concepts: [
				'HTTP/HTTPS request-response cycles, headers, cookies, sessions',
				'Common web vulnerabilities: SQLi, XSS, Command Injection, Auth bypass',
				'Burp Suite interceptor workflows and payload injection analysis',
				'Traces left behind: web server access and error logs'
			],
			labs: [
				'Exploiting and fixing SQL injection in a vulnerable web app',
				'Analyzing server logs after web exploitation to isolate payloads',
				'Correlating attack timestamps with authentication failures'
			],
			deliverables: 'Deliverable 2: Web attack forensic investigation report and remediation recommendations.'
		},
		{
			num: '03',
			title: 'Logs, Parsing & Detection',
			desc: 'Work with logs, build parsers using regex and detect suspicious behaviour.',
			week: 'Week 5–6',
			hours: '6 Hours',
			concepts: [
				'Log sources: auth.log, syslog, web server logs, firewall drops',
				'Structure vs. noise: extracting actionable security signals',
				'Regex crafting for threat indicator parsing (IPs, user-agents, malicious strings)',
				'Threshold detection logic: brute-force patterns, anomalous request rates'
			],
			labs: [
				'Build automated Python/Bash regex parser to ingest real access logs',
				'Identify brute-force and credential stuffing attacks programmatically',
				'Output normalized alerts in structured JSON format'
			],
			deliverables: 'Deliverable 3: Production-ready log parser script and detection ruleset.'
		},
		{
			num: '04',
			title: 'Response, Automation & Defence',
			desc: 'Incident response, automation with Bash/Python and system hardening.',
			week: 'Week 7–8',
			hours: '7 Hours',
			concepts: [
				'Incident response lifecycle (NIST framework: Preparation → Containment → Eradication → Recovery)',
				'Automated containment: triggering iptables blocks, revoking tokens, process termination',
				'Alert dispatch: Slack webhook, Telegram bot, local audit trail',
				'Defensive hardening: SSH hardening, disabling root login, key-only auth, basic firewall setup'
			],
			labs: [
				'Write automated response script to block attacker IP on threshold breach',
				'Configure real-time alerting via webhook with attack context',
				'Apply defensive hardening checklist to secure the host'
			],
			deliverables: 'Deliverable 4: End-to-end automated containment script and host hardening guide.'
		},
		{
			num: '05',
			title: 'Capstone Project',
			desc: 'Build a Security Monitoring & Automated Response System.',
			week: 'Week 9–10',
			hours: 'Guided Lab',
			concepts: [
				'Architecture: Complete pipeline from log generator to containment action',
				'Pipeline: [Simulated Attack / Target] → [Log Generator] → [Parser Engine] → [Detection Rules] → [Alert Dispatcher] → [Automated Defender]',
				'Simulated Scenario: Attacker scans host, performs web attack, brute-forces SSH, triggers alerts & defense'
			],
			labs: [
				'End-to-end pipeline implementation and stress-testing',
				'Live validation under simulated multi-vector cyber attack',
				'Capstone defense session with Lead Instructor'
			],
			deliverables: 'Capstone Deliverable: Working Defensive System codebase, architecture schematic, threat analysis report, and presentation video.'
		}
	];
</script>

<svelte:head>
	<title>{data.asset.title} — Launchpad</title>
	<meta name="description" content="A practical, project-led cybersecurity program where students learn through real tools, hands-on labs and continuous practice." />
</svelte:head>

<div class="launchpad-course-monochrome">
	<!-- ── TOP SUB-BAR / BREADCRUMB ───────────────────────────── -->
	<div class="top-meta-bar">
		<div class="site-container flex items-center justify-between">
			<div class="breadcrumb-nav">
				<a href="/catalog" class="crumb-link">/ CATALOG</a>
				<span class="crumb-sep">/</span>
				<span class="crumb-category">{category.toUpperCase()}</span>
				<span class="crumb-sep">/</span>
				<span class="crumb-current">PRACTICAL CYBERSECURITY</span>
			</div>

			<div class="accreditation-pill">
				<Sparkles size={13} class="pill-sparkle" />
				<span>ACCREDITED COURSE SPECIFICATION</span>
			</div>
		</div>
	</div>

	<!-- ── MAIN CONTENT CONTAINER ─────────────────────────────── -->
	<div class="site-container main-wrapper">
		<!-- ── HERO SECTION: 2-COLUMN (LEFT HERO + RIGHT COHORT CARD) ── -->
		<section class="hero-layout">
			<!-- LEFT COLUMN -->
			<div class="hero-left">
				<!-- Institution Badge -->
				<div class="partner-badge-wrap">
					<span class="partner-badge">NSET ACADEMY &times; PROGETA TECHNOLOGIES</span>
				</div>

				<!-- Course Main Titles -->
				<h1 class="main-title">
					Practical Cybersecurity
				</h1>
				<h2 class="sub-title">
					Beginner to Intermediate
				</h2>

				<!-- Tagline & Description -->
				<div class="tagline-block">
					<p class="tagline-bold">Build. Break. Detect. Respond.</p>
					<p class="tagline-body">
						A practical, project-led cybersecurity program where students learn through real tools, hands-on labs and continuous practice — building a strong foundation and a definitive understanding of how systems work and how to secure them.
					</p>
				</div>

				<!-- Hero Action Buttons -->
				<div class="hero-ctas">
					<button class="btn-enroll-primary" onclick={enroll}>
						<span>{data.alreadyOwned ? 'Access Course' : 'Enroll Now'}</span>
						<ArrowRight size={17} />
					</button>

					<button class="btn-preview-secondary" onclick={() => isPreviewOpen = true}>
						<div class="play-circle-icon">
							<Play size={11} fill="currentColor" />
						</div>
						<span>Preview Course</span>
					</button>
				</div>
			</div>

			<!-- RIGHT COLUMN: STICKY COHORT CONSOLE -->
			<div class="hero-right">
				<div class="cohort-pricing-card">
					<!-- Pill Badges -->
					<div class="cohort-tags-row">
						<span class="cohort-tag">LIVE</span>
						<span class="cohort-tag">HANDS-ON</span>
						<span class="cohort-tag">PROJECT BASED</span>
					</div>

					<!-- Pricing Display -->
					<div class="pricing-display">
						<div class="price-value">{activePriceFormatted}</div>
						<div class="price-subtext">
							Includes all live sessions, materials, labs, community access and certification.
						</div>
					</div>

					<!-- Key Parameters Specification -->
					<div class="cohort-specs-list">
						<div class="cohort-spec-item">
							<div class="spec-icon-wrap">
								<Calendar size={16} />
							</div>
							<div class="spec-text-wrap flex items-center justify-between flex-1">
								<span class="spec-label">
									{activeBatch?.name || 'October 2025 (Batch 1)'}
								</span>
								<span class="spec-badge-live">LIVE</span>
							</div>
						</div>

						<div class="cohort-spec-item">
							<div class="spec-icon-wrap">
								<Clock size={16} />
							</div>
							<div class="spec-text-wrap">
								<span class="spec-label">25+ Hours (Live &amp; Guided)</span>
							</div>
						</div>

						<div class="cohort-spec-item">
							<div class="spec-icon-wrap">
								<Users size={16} />
							</div>
							<div class="spec-text-wrap flex items-center justify-between flex-1">
								<span class="spec-label">Upto 25 Students</span>
								{#if activeBatch}
									<span class="spec-seats-counter">{activeBatch.enrolledCount} / {activeBatch.maxStudents} enrolled</span>
								{/if}
							</div>
						</div>

						<div class="cohort-spec-item">
							<div class="spec-icon-wrap">
								<FileText size={16} />
							</div>
							<div class="spec-text-wrap">
								<span class="spec-label">4 Modules + 1 Project</span>
							</div>
						</div>

						<div class="cohort-spec-item">
							<div class="spec-icon-wrap">
								<Shield size={16} />
							</div>
							<div class="spec-text-wrap">
								<span class="spec-label">Certificate by NSET Academy &times; Progeta</span>
							</div>
						</div>
					</div>

					<!-- WhatsApp Batch Community Note -->
					{#if activeBatch?.communityUrl}
						<div class="whatsapp-note">
							<MessageSquare size={13} class="wa-icon" />
							<span>Includes dedicated Batch WhatsApp Study Group</span>
						</div>
					{/if}

					<!-- Primary Reservation CTA -->
					<button class="btn-reserve-seat" onclick={enroll}>
						<span>{data.alreadyOwned ? 'Go to Dashboard' : 'Reserve Your Seat'}</span>
						<ArrowRight size={17} />
					</button>

					<!-- Sequential Cohort Gating Note -->
					{#if data.cohorts && data.cohorts.length > 1}
						<div class="batch-selector-box">
							<div class="batch-selector-title">Available Batches (Sequential Gating):</div>
							<div class="batch-pills">
								{#each data.cohorts as batch, idx}
									<button 
										class="batch-pill-btn {selectedCohortId === batch.id ? 'active' : ''} {batch.isSoldOut ? 'sold-out' : ''}"
										disabled={batch.isSoldOut}
										onclick={() => selectedCohortId = batch.id}
									>
										<span>{batch.name}</span>
										{#if batch.isSoldOut}
											<span class="batch-sold-tag">FULL</span>
										{:else if idx === 0}
											<span class="batch-active-tag">OPEN</span>
										{/if}
									</button>
								{/each}
							</div>
						</div>
					{/if}
				</div>
			</div>
		</section>

		<!-- ── 4-FEATURE HIGHLIGHTS STRIP ─────────────────────────── -->
		<section class="highlights-section">
			<div class="highlights-grid">
				<!-- Highlight 1 -->
				<div class="highlight-card">
					<div class="highlight-icon-box">
						<Terminal size={19} />
					</div>
					<div class="highlight-content">
						<h3 class="highlight-title">Hands-on Learning</h3>
						<p class="highlight-sub">Real tools. Real systems. Real scenarios.</p>
					</div>
				</div>

				<!-- Highlight 2 -->
				<div class="highlight-card">
					<div class="highlight-icon-box">
						<TrendingUp size={19} />
					</div>
					<div class="highlight-content">
						<h3 class="highlight-title">Beginner to Intermediate</h3>
						<p class="highlight-sub">From core Linux to detection and response</p>
					</div>
				</div>

				<!-- Highlight 3 -->
				<div class="highlight-card">
					<div class="highlight-icon-box">
						<Users size={19} />
					</div>
					<div class="highlight-content">
						<h3 class="highlight-title">Small Cohort</h3>
						<p class="highlight-sub">Focused cohort for better mentoring</p>
					</div>
				</div>

				<!-- Highlight 4 -->
				<div class="highlight-card">
					<div class="highlight-icon-box">
						<ShieldCheck size={19} />
					</div>
					<div class="highlight-content">
						<h3 class="highlight-title">Capstone Project</h3>
						<p class="highlight-sub">Build a real-world security system</p>
					</div>
				</div>
			</div>
		</section>

		<!-- ── WHAT YOU'LL LEARN ──────────────────────────────────── -->
		<section class="learn-section">
			<div class="section-header-row">
				<h2 class="section-heading">What You’ll Learn</h2>
				<a href="#curriculum" class="section-header-link">
					<span>Course Outcomes</span>
					<ArrowRight size={14} />
				</a>
			</div>

			<div class="learn-cards-grid">
				<!-- Card 01 -->
				<div class="learn-card">
					<div class="learn-num-badge">01</div>
					<h3 class="learn-card-title">Understand Systems</h3>
					<p class="learn-card-desc">
						How systems work, how they break and how to defend them.
					</p>
				</div>

				<!-- Card 02 -->
				<div class="learn-card">
					<div class="learn-num-badge">02</div>
					<h3 class="learn-card-title">Use Real Tools</h3>
					<p class="learn-card-desc">
						Linux, networking, web security and industry tools in practical labs.
					</p>
				</div>

				<!-- Card 03 -->
				<div class="learn-card">
					<div class="learn-num-badge">03</div>
					<h3 class="learn-card-title">Detect &amp; Respond</h3>
					<p class="learn-card-desc">
						Find, analyze and respond to real security issues.
					</p>
				</div>

				<!-- Card 04 -->
				<div class="learn-card">
					<div class="learn-num-badge">04</div>
					<h3 class="learn-card-title">Build a Project</h3>
					<p class="learn-card-desc">
						Complete a capstone project to showcase your skills.
					</p>
				</div>
			</div>
		</section>

		<!-- ── COURSE CURRICULUM (ACCORDION) ──────────────────────── -->
		<section id="curriculum" class="curriculum-section">
			<div class="section-header-row">
				<h2 class="section-heading">Course Curriculum</h2>
				<button class="section-header-link cursor-pointer" onclick={() => expandedModule = expandedModule === null ? 0 : null}>
					<span>{expandedModule !== null ? 'Collapse All' : 'Detailed Syllabus'}</span>
					<ArrowRight size={14} />
				</button>
			</div>

			<div class="curriculum-accordion-list">
				{#each curriculumModules as mod, index}
					<div class="accordion-item {expandedModule === index ? 'is-open' : ''}">
						<!-- Row Header (Clickable) -->
						<button 
							class="accordion-trigger"
							onclick={() => toggleModule(index)}
							aria-expanded={expandedModule === index}
						>
							<div class="acc-left">
								<div class="acc-num-box">{mod.num}</div>
								<div class="acc-title-group">
									<h3 class="acc-mod-title">{mod.title}</h3>
									<p class="acc-mod-desc">{mod.desc}</p>
								</div>
							</div>

							<div class="acc-right">
								<span class="acc-week-tag">{mod.week}</span>
								<div class="acc-chevron {expandedModule === index ? 'rotated' : ''}">
									<ChevronDown size={17} />
								</div>
							</div>
						</button>

						<!-- Expanded Details Content -->
						{#if expandedModule === index}
							<div class="accordion-drawer">
								<div class="drawer-inner">
									<!-- Key Concepts -->
									<div class="drawer-column">
										<div class="drawer-col-title">Core Concepts Covered</div>
										<ul class="drawer-bullets">
											{#each mod.concepts as concept}
												<li>
													<Check size={14} class="bullet-check" />
													<span>{concept}</span>
												</li>
											{/each}
										</ul>
									</div>

									<!-- Practical Labs & Deliverable -->
									<div class="drawer-column">
										<div class="drawer-col-title">Hands-On Practice &amp; Labs</div>
										<ul class="drawer-bullets">
											{#each mod.labs as lab}
												<li>
													<Terminal size={14} class="bullet-term" />
													<span>{lab}</span>
												</li>
											{/each}
										</ul>

										<div class="milestone-box">
											<div class="milestone-tag">MODULE MILESTONE</div>
											<div class="milestone-text">{mod.deliverables}</div>
										</div>
									</div>
								</div>
							</div>
						{/if}
					</div>
				{/each}
			</div>
		</section>

		<!-- ── LEAD INSTRUCTOR SECTION ────────────────────────────── -->
		<section class="instructor-section">
			<div class="instructor-card">
				<div class="inst-avatar-box">
					<div class="inst-monogram">AM</div>
				</div>
				<div class="inst-info">
					<div class="inst-role-tag">LEAD COHORT INSTRUCTOR</div>
					<h3 class="inst-name">{instructor}</h3>
					<p class="inst-bio">
						Security researcher and practitioner with expertise in system defense, vulnerability detection, and automated threat containment. Guides students directly through weekly live architecture labs, code reviews, and tactical security scenarios.
					</p>
					<div class="inst-perks">
						<span class="inst-perk">Weekly Live Office Hours</span>
						<span class="inst-perk-sep">&middot;</span>
						<span class="inst-perk">Direct Architecture Code Reviews</span>
						<span class="inst-perk-sep">&middot;</span>
						<span class="inst-perk">Interactive Capstone Defense</span>
					</div>
				</div>
			</div>
		</section>

		<!-- ── ISSUING AUTHORITIES / PARTNERS BAR ─────────────────── -->
		<section class="partners-section">
			<div class="partners-grid">
				<!-- NSET Academy -->
				<div class="partner-card">
					<div class="partner-logo-box">
						<img src="/nset-logo.svg" alt="NSET Academy" class="partner-svg" />
					</div>
					<div class="partner-text-block">
						<div class="partner-sub-label">Offered by</div>
						<h3 class="partner-main-name">NSET Academy</h3>
						<p class="partner-sub-desc">
							Academic delivery, content curation and certification.
						</p>
					</div>
				</div>

				<!-- Progeta Technologies -->
				<div class="partner-card">
					<div class="partner-logo-box">
						<img src="/progeta-icon.svg" alt="Progeta Technologies" class="partner-svg" />
					</div>
					<div class="partner-text-block">
						<div class="partner-sub-label">In collaboration with</div>
						<h3 class="partner-main-name">Progeta Technologies</h3>
						<p class="partner-sub-desc">
							Industry perspective, real-world applications.
						</p>
					</div>
				</div>

				<!-- Ideal For -->
				<div class="partner-card">
					<div class="partner-logo-box">
						<Users size={22} class="partner-icon-elem" />
					</div>
					<div class="partner-text-block">
						<div class="partner-sub-label">Ideal for</div>
						<h3 class="partner-main-name">Students &amp; Professionals</h3>
						<p class="partner-sub-desc">
							Students, early professionals and anyone curious about cybersecurity.
						</p>
					</div>
				</div>
			</div>
		</section>
	</div>

	<!-- ── COURSE PREVIEW MODAL ───────────────────────────────── -->
	{#if isPreviewOpen}
		<div class="modal-backdrop" onclick={() => isPreviewOpen = false} role="dialog" aria-modal="true">
			<div class="modal-window" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<div class="modal-title-group">
						<span class="modal-category">COURSE PREVIEW</span>
						<h3 class="modal-course-title">Practical Cybersecurity · Syllabus &amp; Overview</h3>
					</div>
					<button class="modal-close-btn" onclick={() => isPreviewOpen = false}>
						<X size={18} />
					</button>
				</div>

				<div class="modal-body">
					<!-- Terminal Video Teaser Box -->
					<div class="modal-terminal-box">
						<div class="term-bar">
							<span class="term-dot"></span>
							<span class="term-dot"></span>
							<span class="term-dot"></span>
							<span class="term-title">practical-cybersecurity // briefing.sh</span>
						</div>
						<div class="term-content">
							<p class="term-line-green">$ ./launch-preview.sh --track=cybersecurity</p>
							<p class="term-line-dim">[INIT] Connecting to live defensive lab environment...</p>
							<p class="term-line-dim">[INFO] 25 Total Hours Live &middot; 4 Modular Milestones &middot; 1 Capstone Defense</p>
							<p class="term-line-white">&gt; "Build. Break. Detect. Respond."</p>
							<p class="term-line-dim">[STATUS] Cohort 1 starting October 2025. Seat cap: 25 students.</p>
						</div>
					</div>

					<div class="modal-details-grid">
						<div class="modal-detail-item">
							<h4 class="modal-detail-head">Format</h4>
							<p class="modal-detail-text">Weekend live workshops + weekday guided lab assignments with instructor feedback.</p>
						</div>
						<div class="modal-detail-item">
							<h4 class="modal-detail-head">Certification</h4>
							<p class="modal-detail-text">Dual accreditation signed and issued by NSET Academy and Progeta Technologies upon capstone completion.</p>
						</div>
						<div class="modal-detail-item">
							<h4 class="modal-detail-head">Prerequisites</h4>
							<p class="modal-detail-text">Basic computer literacy. No prior cybersecurity or advanced coding background required; begins from fundamentals.</p>
						</div>
						<div class="modal-detail-item">
							<h4 class="modal-detail-head">Study Group</h4>
							<p class="modal-detail-text">Direct access to the private Batch WhatsApp community with peers and instructor Anmol Madan.</p>
						</div>
					</div>
				</div>

				<div class="modal-footer">
					<button class="btn-modal-close" onclick={() => isPreviewOpen = false}>
						Close Preview
					</button>
					<button class="btn-modal-enroll" onclick={() => { isPreviewOpen = false; enroll(); }}>
						<span>{data.alreadyOwned ? 'Go to Course' : 'Reserve Seat Now (₹16,999)'}</span>
						<ArrowRight size={15} />
					</button>
				</div>
			</div>
		</div>
	{/if}
</div>

<style>
	/* =========================================================================
	   PURE MONOCHROME MINIMALIST DESIGN SYSTEM
	   Shades of black and white only: #000, #111, #18181b, #71717a, #e4e4e7, #fff
	   ========================================================================= */

	.launchpad-course-monochrome {
		min-height: 100vh;
		background-color: #ffffff;
		color: #111111;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
		-webkit-font-smoothing: antialiased;
		-moz-osx-font-smoothing: grayscale;
		padding-bottom: 80px;
	}

	.site-container {
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 24px;
	}

	/* ── Top Sub-bar / Breadcrumb ─────────────────────────────────────────── */
	.top-meta-bar {
		border-bottom: 1px solid #e4e4e7;
		padding: 14px 0;
		background: #ffffff;
	}

	.breadcrumb-nav {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		color: #71717a;
	}

	.crumb-link {
		color: #71717a;
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.crumb-link:hover {
		color: #111111;
	}

	.crumb-sep {
		color: #d4d4d8;
	}

	.crumb-category {
		color: #71717a;
	}

	.crumb-current {
		color: #111111;
		font-weight: 700;
	}

	.accreditation-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 12px;
		border: 1px solid #e4e4e7;
		border-radius: 9999px;
		font-size: 10.5px;
		font-weight: 600;
		letter-spacing: 0.06em;
		color: #18181b;
		background: #ffffff;
	}

	.pill-sparkle {
		color: #18181b;
	}

	/* ── Main Layout ──────────────────────────────────────────────────────── */
	.main-wrapper {
		padding-top: 48px;
	}

	.hero-layout {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 56px;
		align-items: start;
		padding-bottom: 48px;
	}

	/* ── Hero Left ────────────────────────────────────────────────────────── */
	.partner-badge-wrap {
		margin-bottom: 24px;
	}

	.partner-badge {
		display: inline-block;
		padding: 6px 14px;
		border: 1px solid #18181b;
		border-radius: 4px;
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #111111;
		background: #ffffff;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
	}

	.main-title {
		font-size: 52px;
		line-height: 1.06;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: #111111;
		margin: 0;
	}

	.sub-title {
		font-size: 38px;
		line-height: 1.15;
		font-weight: 400;
		letter-spacing: -0.02em;
		color: #3f3f46;
		margin: 8px 0 0 0;
	}

	.tagline-block {
		margin-top: 28px;
		max-width: 620px;
	}

	.tagline-bold {
		font-size: 18px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: #111111;
		margin: 0 0 10px 0;
	}

	.tagline-body {
		font-size: 15.5px;
		line-height: 1.65;
		color: #52525b;
		margin: 0;
	}

	.hero-ctas {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-top: 36px;
	}

	.btn-enroll-primary {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background-color: #111111;
		color: #ffffff;
		font-size: 15px;
		font-weight: 600;
		padding: 13px 28px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.1s ease;
	}

	.btn-enroll-primary:hover {
		background-color: #27272a;
		transform: translateY(-1px);
	}

	.btn-preview-secondary {
		display: inline-flex;
		align-items: center;
		gap: 10px;
		background-color: #ffffff;
		color: #111111;
		font-size: 15px;
		font-weight: 600;
		padding: 12px 24px;
		border-radius: 8px;
		border: 1px solid #e4e4e7;
		cursor: pointer;
		transition: background-color 0.15s ease, border-color 0.15s ease;
	}

	.btn-preview-secondary:hover {
		background-color: #f4f4f5;
		border-color: #d4d4d8;
	}

	.play-circle-icon {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 22px;
		height: 22px;
		border-radius: 50%;
		border: 1.5px solid #111111;
		padding-left: 2px;
	}

	/* ── Hero Right: Sticky Cohort Card ───────────────────────────────────── */
	.cohort-pricing-card {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 14px;
		padding: 28px;
		box-shadow: 0 4px 20px -2px rgba(0, 0, 0, 0.04);
		position: sticky;
		top: 24px;
	}

	.cohort-tags-row {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 20px;
	}

	.cohort-tag {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: #18181b;
		padding: 3px 8px;
		border: 1px solid #e4e4e7;
		border-radius: 4px;
		background: #fafafa;
	}

	.pricing-display {
		margin-bottom: 24px;
	}

	.price-value {
		font-size: 40px;
		font-weight: 800;
		letter-spacing: -0.03em;
		color: #111111;
		line-height: 1;
	}

	.price-subtext {
		font-size: 12.5px;
		line-height: 1.45;
		color: #71717a;
		margin-top: 8px;
	}

	.cohort-specs-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
		border-top: 1px solid #f4f4f5;
		padding-top: 20px;
		margin-bottom: 22px;
	}

	.cohort-spec-item {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.spec-icon-wrap {
		color: #18181b;
		display: flex;
		align-items: center;
		justify-content: center;
		width: 20px;
	}

	.spec-text-wrap {
		font-size: 13.5px;
		color: #18181b;
		font-weight: 500;
	}

	.spec-badge-live {
		font-size: 9.5px;
		font-weight: 800;
		letter-spacing: 0.06em;
		padding: 2px 7px;
		background: #111111;
		color: #ffffff;
		border-radius: 4px;
	}

	.spec-seats-counter {
		font-size: 11.5px;
		color: #71717a;
		font-family: ui-monospace, monospace;
	}

	.whatsapp-note {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 12px;
		color: #52525b;
		background: #fafafa;
		padding: 8px 12px;
		border-radius: 6px;
		border: 1px solid #f4f4f5;
		margin-bottom: 20px;
	}

	.wa-icon {
		color: #18181b;
		flex-shrink: 0;
	}

	.btn-reserve-seat {
		width: 100%;
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		background-color: #111111;
		color: #ffffff;
		font-size: 15px;
		font-weight: 600;
		padding: 14px;
		border-radius: 8px;
		border: none;
		cursor: pointer;
		transition: background-color 0.15s ease, transform 0.1s ease;
	}

	.btn-reserve-seat:hover {
		background-color: #27272a;
		transform: translateY(-1px);
	}

	.batch-selector-box {
		margin-top: 18px;
		padding-top: 16px;
		border-top: 1px solid #f4f4f5;
	}

	.batch-selector-title {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #71717a;
		text-transform: uppercase;
		margin-bottom: 8px;
	}

	.batch-pills {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.batch-pill-btn {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 12px;
		border: 1px solid #e4e4e7;
		border-radius: 6px;
		background: #ffffff;
		font-size: 12.5px;
		font-weight: 500;
		color: #18181b;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.batch-pill-btn:hover:not(:disabled) {
		background: #f4f4f5;
	}

	.batch-pill-btn.active {
		border-color: #111111;
		background: #fafafa;
		font-weight: 700;
	}

	.batch-pill-btn.sold-out {
		opacity: 0.55;
		cursor: not-allowed;
		background: #f4f4f5;
	}

	.batch-sold-tag {
		font-size: 10px;
		font-weight: 700;
		color: #71717a;
		background: #e4e4e7;
		padding: 1px 6px;
		border-radius: 3px;
	}

	.batch-active-tag {
		font-size: 10px;
		font-weight: 800;
		color: #ffffff;
		background: #111111;
		padding: 1px 6px;
		border-radius: 3px;
	}

	/* ── 4-Feature Highlights Strip ───────────────────────────────────────── */
	.highlights-section {
		margin: 20px 0 64px 0;
	}

	.highlights-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
		background: #fafafa;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		padding: 24px;
	}

	.highlight-card {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.highlight-icon-box {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		border: 1px solid #e4e4e7;
		background: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #111111;
		flex-shrink: 0;
	}

	.highlight-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.highlight-title {
		font-size: 14.5px;
		font-weight: 700;
		color: #111111;
		margin: 0;
	}

	.highlight-sub {
		font-size: 12.5px;
		line-height: 1.45;
		color: #71717a;
		margin: 0;
	}

	/* ── Section Header Row ───────────────────────────────────────────────── */
	.section-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 24px;
	}

	.section-heading {
		font-size: 28px;
		font-weight: 800;
		letter-spacing: -0.025em;
		color: #111111;
		margin: 0;
	}

	.section-header-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 13.5px;
		font-weight: 600;
		color: #111111;
		text-decoration: none;
		background: none;
		border: none;
		padding: 0;
		transition: opacity 0.15s ease;
	}

	.section-header-link:hover {
		opacity: 0.65;
	}

	/* ── What You'll Learn ────────────────────────────────────────────────── */
	.learn-section {
		margin-bottom: 64px;
	}

	.learn-cards-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 16px;
	}

	.learn-card {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		transition: border-color 0.15s ease, transform 0.15s ease;
	}

	.learn-card:hover {
		border-color: #a1a1aa;
		transform: translateY(-2px);
	}

	.learn-num-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 32px;
		height: 32px;
		border: 1px solid #e4e4e7;
		border-radius: 6px;
		background: #f4f4f5;
		font-size: 12.5px;
		font-weight: 700;
		font-family: ui-monospace, monospace;
		color: #111111;
		margin-bottom: 18px;
	}

	.learn-card-title {
		font-size: 16px;
		font-weight: 700;
		letter-spacing: -0.01em;
		color: #111111;
		margin: 0 0 8px 0;
	}

	.learn-card-desc {
		font-size: 13.5px;
		line-height: 1.5;
		color: #71717a;
		margin: 0;
	}

	/* ── Course Curriculum (Accordion) ────────────────────────────────────── */
	.curriculum-section {
		margin-bottom: 64px;
	}

	.curriculum-accordion-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.accordion-item {
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		background: #ffffff;
		overflow: hidden;
		transition: border-color 0.15s ease;
	}

	.accordion-item.is-open {
		border-color: #111111;
	}

	.accordion-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 20px 24px;
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		transition: background-color 0.15s ease;
	}

	.accordion-trigger:hover {
		background-color: #fafafa;
	}

	.acc-left {
		display: flex;
		align-items: center;
		gap: 18px;
		flex: 1;
	}

	.acc-num-box {
		width: 34px;
		height: 34px;
		border: 1px solid #e4e4e7;
		border-radius: 6px;
		background: #f4f4f5;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 13px;
		font-weight: 700;
		font-family: ui-monospace, monospace;
		color: #111111;
		flex-shrink: 0;
	}

	.acc-title-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.acc-mod-title {
		font-size: 15.5px;
		font-weight: 700;
		color: #111111;
		margin: 0;
	}

	.acc-mod-desc {
		font-size: 13.5px;
		color: #71717a;
		margin: 0;
	}

	.acc-right {
		display: flex;
		align-items: center;
		gap: 16px;
		flex-shrink: 0;
		margin-left: 20px;
	}

	.acc-week-tag {
		font-size: 12px;
		font-weight: 600;
		color: #52525b;
		padding: 4px 10px;
		border: 1px solid #e4e4e7;
		border-radius: 4px;
		background: #fafafa;
	}

	.acc-chevron {
		color: #71717a;
		transition: transform 0.2s ease;
		display: flex;
		align-items: center;
	}

	.acc-chevron.rotated {
		transform: rotate(180deg);
		color: #111111;
	}

	.accordion-drawer {
		border-top: 1px solid #f4f4f5;
		background: #fafafa;
		padding: 24px;
	}

	.drawer-inner {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 32px;
	}

	.drawer-col-title {
		font-size: 12px;
		font-weight: 700;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #111111;
		margin-bottom: 12px;
	}

	.drawer-bullets {
		list-style: none;
		padding: 0;
		margin: 0;
		display: flex;
		flex-direction: column;
		gap: 9px;
	}

	.drawer-bullets li {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		font-size: 13.5px;
		line-height: 1.45;
		color: #3f3f46;
	}

	.bullet-check {
		color: #18181b;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.bullet-term {
		color: #71717a;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.milestone-box {
		margin-top: 18px;
		padding: 12px 14px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 8px;
	}

	.milestone-tag {
		font-size: 10px;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #71717a;
		text-transform: uppercase;
		margin-bottom: 4px;
	}

	.milestone-text {
		font-size: 13px;
		font-weight: 600;
		color: #111111;
	}

	/* ── Lead Instructor ─────────────────────────────────────────────────── */
	.instructor-section {
		margin-bottom: 64px;
	}

	.instructor-card {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		padding: 28px;
		display: flex;
		align-items: center;
		gap: 28px;
	}

	.inst-avatar-box {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		border: 2px solid #111111;
		background: #f4f4f5;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
	}

	.inst-monogram {
		font-size: 24px;
		font-weight: 800;
		letter-spacing: -0.02em;
		color: #111111;
	}

	.inst-info {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.inst-role-tag {
		font-size: 10.5px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: #71717a;
	}

	.inst-name {
		font-size: 20px;
		font-weight: 800;
		letter-spacing: -0.01em;
		color: #111111;
		margin: 0;
	}

	.inst-bio {
		font-size: 14px;
		line-height: 1.55;
		color: #52525b;
		margin: 0;
		max-width: 820px;
	}

	.inst-perks {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 6px;
		font-size: 12.5px;
		font-weight: 600;
		color: #18181b;
	}

	.inst-perk-sep {
		color: #d4d4d8;
	}

	/* ── Issuing Authorities / Partners Bar ───────────────────────────────── */
	.partners-section {
		margin-top: 48px;
		border-top: 1px solid #e4e4e7;
		padding-top: 48px;
	}

	.partners-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 24px;
	}

	.partner-card {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 12px;
		padding: 24px;
		display: flex;
		align-items: flex-start;
		gap: 16px;
	}

	.partner-logo-box {
		width: 44px;
		height: 44px;
		border: 1px solid #e4e4e7;
		border-radius: 8px;
		background: #fafafa;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		padding: 6px;
	}

	.partner-svg {
		width: 100%;
		height: 100%;
		object-fit: contain;
		color: #111111;
	}

	.partner-icon-elem {
		color: #111111;
	}

	.partner-text-block {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.partner-sub-label {
		font-size: 11px;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: #71717a;
	}

	.partner-main-name {
		font-size: 16px;
		font-weight: 800;
		color: #111111;
		margin: 0;
	}

	.partner-sub-desc {
		font-size: 13px;
		line-height: 1.45;
		color: #71717a;
		margin: 0;
	}

	/* ── Modal Dialog ─────────────────────────────────────────────────────── */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.65);
		backdrop-filter: blur(4px);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 9999;
		padding: 20px;
	}

	.modal-window {
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 14px;
		max-width: 640px;
		width: 100%;
		overflow: hidden;
		box-shadow: 0 20px 40px rgba(0, 0, 0, 0.2);
	}

	.modal-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid #f4f4f5;
	}

	.modal-category {
		font-size: 11px;
		font-weight: 700;
		letter-spacing: 0.06em;
		color: #71717a;
	}

	.modal-course-title {
		font-size: 17px;
		font-weight: 800;
		color: #111111;
		margin: 4px 0 0 0;
	}

	.modal-close-btn {
		background: none;
		border: none;
		color: #71717a;
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}

	.modal-close-btn:hover {
		color: #111111;
		background: #f4f4f5;
	}

	.modal-body {
		padding: 24px;
	}

	.modal-terminal-box {
		background: #111111;
		border-radius: 8px;
		padding: 16px;
		font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
		font-size: 12.5px;
		line-height: 1.6;
		margin-bottom: 24px;
	}

	.term-bar {
		display: flex;
		align-items: center;
		gap: 6px;
		padding-bottom: 10px;
		border-bottom: 1px solid #27272a;
		margin-bottom: 12px;
	}

	.term-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: #3f3f46;
	}

	.term-title {
		font-size: 11px;
		color: #a1a1aa;
		margin-left: 8px;
	}

	.term-line-green {
		color: #ffffff;
		font-weight: 700;
		margin: 0;
	}

	.term-line-dim {
		color: #a1a1aa;
		margin: 0;
	}

	.term-line-white {
		color: #ffffff;
		font-weight: 600;
		margin: 4px 0;
	}

	.modal-details-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 16px;
	}

	.modal-detail-head {
		font-size: 12px;
		font-weight: 700;
		color: #111111;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		margin: 0 0 4px 0;
	}

	.modal-detail-text {
		font-size: 13px;
		line-height: 1.45;
		color: #52525b;
		margin: 0;
	}

	.modal-footer {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 12px;
		padding: 18px 24px;
		border-top: 1px solid #f4f4f5;
		background: #fafafa;
	}

	.btn-modal-close {
		padding: 10px 18px;
		background: #ffffff;
		border: 1px solid #e4e4e7;
		border-radius: 6px;
		font-size: 13.5px;
		font-weight: 600;
		color: #111111;
		cursor: pointer;
	}

	.btn-modal-close:hover {
		background: #f4f4f5;
	}

	.btn-modal-enroll {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: #111111;
		color: #ffffff;
		border: none;
		border-radius: 6px;
		font-size: 13.5px;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-modal-enroll:hover {
		background: #27272a;
	}

	/* ── Responsive Queries ───────────────────────────────────────────────── */
	@media (max-width: 1024px) {
		.hero-layout {
			grid-template-columns: 1fr;
			gap: 40px;
		}

		.highlights-grid {
			grid-template-columns: repeat(2, 1fr);
			gap: 20px;
		}

		.learn-cards-grid {
			grid-template-columns: repeat(2, 1fr);
		}

		.partners-grid {
			grid-template-columns: 1fr;
		}

		.main-title {
			font-size: 40px;
		}

		.sub-title {
			font-size: 28px;
		}
	}

	@media (max-width: 640px) {
		.highlights-grid {
			grid-template-columns: 1fr;
		}

		.learn-cards-grid {
			grid-template-columns: 1fr;
		}

		.drawer-inner {
			grid-template-columns: 1fr;
		}

		.instructor-card {
			flex-direction: column;
			align-items: flex-start;
		}

		.hero-ctas {
			flex-direction: column;
			align-items: stretch;
		}

		.btn-enroll-primary,
		.btn-preview-secondary {
			justify-content: center;
		}

		.modal-details-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
