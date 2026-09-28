<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, BookOpen, ArrowLeft, Check, Shield } from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';

	let { data } = $props();

	const isFree = $derived(!data.cert.pricePaise || data.cert.pricePaise === 0);
	const formattedPrice = $derived(isFree ? 'Free' : `₹${(data.cert.pricePaise / 100).toLocaleString('en-IN')}`);
	const passingScore = $derived(data.cert.metadata?.passingScore || '75%');
	const durationMins = $derived(data.cert.metadata?.duration || 45);
	const questionCount = $derived(data.cert.metadata?.questions || 20);
	const isProctored = $derived(data.cert.metadata?.isProctored !== false);
	const tags = $derived((data.cert.metadata?.tags || ['Intermediate']) as string[]);
</script>

<svelte:head>
	<title>{data.cert.title} — {APP_NAME} Certifications</title>
	<meta name="description" content="{data.cert.description || 'Verified technical certification exam on Launchpad.'}" />
</svelte:head>

<div class="cert-detail-page bg-[var(--background)] min-h-screen">
	<!-- Back Bar -->
	<div class="border-b border-[var(--border)] bg-[var(--surface)]">
		<div class="container-custom py-3.5">
			<a href="/certifications" class="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
				<ArrowLeft size={14} />
				<span>All Certifications</span>
			</a>
		</div>
	</div>

	<!-- ── ARCHETYPE B: DETAIL HEADER & GRID ──────────────── -->
	<div class="container-custom py-10">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
			
			<!-- Left Column: Editorial Information Architecture -->
			<div class="lg:col-span-8">
				
				<!-- Meta Pre-title -->
				<div class="flex items-center gap-2 mb-3">
					<span class="meta-mono">ASSESSMENT & CREDENTIAL</span>
					<span class="text-[var(--text-muted)]">·</span>
					<span class="text-[12px] text-[var(--text-secondary)] font-medium">VERIFIED EXAM</span>
				</div>

				<!-- Exam Title -->
				<h1 class="text-[2rem] md:text-[2.25rem] font-bold text-[var(--text-primary)] tracking-tight leading-[1.2] mb-4">
					{data.cert.title}
				</h1>

				<!-- Tags & Badges -->
				<div class="flex flex-wrap items-center gap-2 mb-4">
					{#each tags as tag}
						<Badge variant="neutral">{tag}</Badge>
					{/each}
					{#if isProctored}
						<Badge variant="verified">PROCTORED</Badge>
					{/if}
				</div>

				<!-- Exam Description -->
				<p class="text-[15px] leading-relaxed text-[var(--text-secondary)] max-w-2xl mb-6">
					{data.cert.description || 'Demonstrate hands-on technical proficiency through rigorous, scenario-driven assessment standards recognized across the industry.'}
				</p>

				<!-- Specification Strip (Unified 3-box spec) -->
				<div class="grid grid-cols-3 gap-3 p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] mb-8">
					<div class="text-center">
						<span class="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Questions</span>
						<span class="block text-[18px] font-bold text-[var(--text-primary)] mt-0.5">{questionCount} Qs</span>
					</div>
					<div class="text-center border-x border-[var(--border)]">
						<span class="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Duration</span>
						<span class="block text-[18px] font-bold text-[var(--text-primary)] mt-0.5">{durationMins} min</span>
					</div>
					<div class="text-center">
						<span class="block text-[11px] font-medium text-[var(--text-muted)] uppercase tracking-wider">Pass Mark</span>
						<span class="block text-[18px] font-bold text-[var(--text-primary)] mt-0.5">{passingScore}</span>
					</div>
				</div>

				<!-- ── EXAM SYLLABUS & TOPICS ────────────────────── -->
				{#if data.cert.metadata?.syllabus && data.cert.metadata.syllabus.length > 0}
					<section class="mb-10">
						<h2 class="text-[18px] font-bold text-[var(--text-primary)] mb-4 tracking-tight">Exam Syllabus & Tested Domains</h2>
						<div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] divide-y divide-[var(--border)]">
							{#each data.cert.metadata.syllabus as topic}
								<div class="p-3.5 flex items-start gap-3">
									<Check size={16} class="text-[var(--lp-accent)] shrink-0 mt-0.5" strokeWidth={2.5} />
									<span class="text-[14px] text-[var(--text-primary)] font-medium">{topic}</span>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- ── EXAM RULES & CONDITIONS ───────────────────── -->
				{#if data.cert.metadata?.rules && data.cert.metadata.rules.length > 0}
					<section class="mb-10">
						<div class="flex items-center gap-2 mb-3">
							<AlertTriangle size={18} class="text-[var(--text-secondary)]" />
							<h2 class="text-[18px] font-bold text-[var(--text-primary)] tracking-tight">Exam Rules & Proctoring Standards</h2>
						</div>
						<div class="p-5 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] space-y-3">
							{#if isProctored}
								<p class="text-[13px] text-[var(--text-secondary)] leading-relaxed pb-3 border-b border-[var(--border)]">
									This is a strictly proctored assessment. Ensure a stable internet connection, single-monitor environment, and quiet setting prior to launching the exam environment.
								</p>
							{/if}
							<ul class="space-y-2.5">
								{#each data.cert.metadata.rules as rule}
									<li class="flex items-start gap-2.5 text-[13px] text-[var(--text-secondary)]">
										<span class="w-1.5 h-1.5 rounded-full bg-[var(--text-muted)] shrink-0 mt-1.5"></span>
										<span>{rule}</span>
									</li>
								{/each}
							</ul>
						</div>
					</section>
				{/if}

				<!-- ── VERIFICATION & INTEGRITY ──────────────────── -->
				<section class="p-5 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-md)]">
					<div class="flex items-start gap-3.5">
						<ShieldCheck size={20} class="text-[var(--lp-accent)] shrink-0 mt-0.5" />
						<div>
							<h3 class="text-[14px] font-bold text-[var(--text-primary)]">Launchpad Verifiable Credential</h3>
							<p class="text-[12px] text-[var(--text-secondary)] leading-relaxed mt-1">
								Upon scoring {passingScore} or higher, a unique cryptographic credential ID and digital certificate are issued instantly. This credential can be publicly verified and shared on professional profiles.
							</p>
						</div>
					</div>
				</section>
			</div>

			<!-- Right Column: Sticky Purchase Panel (Archetype B) -->
			<div class="lg:col-span-4">
				<div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6 sticky top-24 shadow-sm">
					
					<span class="meta-mono text-[10px] text-[var(--text-muted)] block mb-1">EXAM ENROLLMENT</span>
					
					<div class="flex items-baseline justify-between mb-4 pb-4 border-b border-[var(--border)]">
						<div class="text-[2rem] font-bold text-[var(--text-primary)] tracking-tight">
							{formattedPrice}
						</div>
						<span class="text-[12px] text-[var(--text-secondary)]">/ attempt</span>
					</div>

					<!-- Highlights List -->
					<div class="space-y-3 mb-6">
						<div class="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
							<Check size={14} class="text-[var(--lp-accent)] shrink-0" strokeWidth={2.5} />
							<span>Single exam attempt voucher</span>
						</div>
						<div class="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
							<Check size={14} class="text-[var(--lp-accent)] shrink-0" strokeWidth={2.5} />
							<span>Instant grading and automated scorecard</span>
						</div>
						<div class="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
							<Check size={14} class="text-[var(--lp-accent)] shrink-0" strokeWidth={2.5} />
							<span>Verifiable digital certificate on passing</span>
						</div>
						<div class="flex items-center gap-2.5 text-[13px] text-[var(--text-secondary)]">
							<Check size={14} class="text-[var(--lp-accent)] shrink-0" strokeWidth={2.5} />
							<span>Passing score requirement: {passingScore}</span>
						</div>
					</div>

					<!-- Primary CTA Button -->
					<div class="space-y-2.5">
						<Button href={`/checkout/${data.cert.id}`} variant="primary" size="lg" fullWidth>
							Buy Exam Voucher
						</Button>
					</div>

					<div class="mt-4 pt-4 border-t border-[var(--border)] flex items-center justify-center gap-2 text-[11px] text-[var(--text-muted)]">
						<Shield size={13} class="text-[var(--lp-accent)]" />
						<span>Encrypted Checkout · Instant Activation</span>
					</div>
				</div>
			</div>

		</div>
	</div>
</div>
