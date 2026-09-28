<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		ArrowLeft, ShieldCheck, Globe,
		Calendar, Clock, Star, CheckCircle, X, AlertCircle, Loader2,
		ArrowRight, ChevronDown, ChevronUp, User, Award, Check, Shield
	} from 'lucide-svelte';
	import Button from '$lib/components/ui/Button.svelte';
	import Badge from '$lib/components/ui/Badge.svelte';
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	const { instructor, testimonials, user } = data;

	// ── Booking drawer state ──────────────────────────────────────────────────
	let isDrawerOpen = $state(false);
	let bookingStep = $state<1 | 2 | 3 | 4>(1);

	// Step 1: Date
	let availableDates = $state<string[]>(instructor.availableDates || []);
	let selectedDate = $state<string>('');
	let isLoadingDates = $state(false);

	// Step 2: Window / Duration / Slot
	let dayWindows = $state<any[]>([]);
	let selectedWindowId = $state<string>('');
	let selectedDuration = $state<number>(30);
	let availableSlots = $state<{ timeStr: string; startsAtISO: string; endsAtISO: string }[]>([]);
	let selectedSlot = $state<{ timeStr: string; startsAtISO: string; endsAtISO: string } | null>(null);
	let isLoadingSlots = $state(false);

	// Step 3: Notes / Coupon / Pay
	let sessionNotes = $state('');
	let couponCode = $state('');
	let appliedCoupon = $state<{ code: string; discountPaise: number } | null>(null);
	let couponError = $state('');
	let isSubmittingBooking = $state(false);
	let bookingErrorMessage = $state('');

	// Step 4: Success
	let confirmedBookingResult = $state<{ bookingId: string; meetingUrl?: string; isFree: boolean } | null>(null);

	// ── Testimonials: show-more ───────────────────────────────────────────────
	let showAllTestimonials = $state(false);
	const visibleTestimonials = $derived(showAllTestimonials ? testimonials : testimonials.slice(0, 3));

	// ── Computed pricing ─────────────────────────────────────────────────────
	const durationPrices = $derived(instructor.prices || []);

	const currentBasePricePaise = $derived(() => {
		const found = durationPrices.find((p: any) => p.durationMins === selectedDuration);
		return found ? found.pricePaise : (instructor.lowestPricePaise || 80000);
	});

	const currentFinalPricePaise = $derived(() => {
		const base = currentBasePricePaise();
		const discount = appliedCoupon ? appliedCoupon.discountPaise : 0;
		return Math.max(0, base - discount);
	});

	// ── Interactive Sidebar Calendar State ─────────────────────────────────────
	let sidebarCalMonth = $state(new Date().getMonth());
	let sidebarCalYear = $state(new Date().getFullYear());
	const sidebarDaysInMonth = $derived(new Date(sidebarCalYear, sidebarCalMonth + 1, 0).getDate());
	const sidebarFirstDayOffset = $derived(new Date(sidebarCalYear, sidebarCalMonth, 1).getDay());

	// ── Booking drawer actions ───────────────────────────────────────────────
	async function openBookingDrawer(targetDate?: string) {
		if (!user) {
			window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}
		isDrawerOpen = true;
		bookingStep = 1;
		selectedDate = (typeof targetDate === 'string') ? targetDate : '';
		selectedWindowId = '';
		selectedSlot = null;
		sessionNotes = '';
		couponCode = '';
		appliedCoupon = null;
		couponError = '';
		bookingErrorMessage = '';
		confirmedBookingResult = null;

		isLoadingDates = true;
		try {
			const res = await fetch(`/api/mentoring/instructors/${instructor.id}/calendar`);
			const json = await res.json();
			availableDates = json.availableDates || [];
			const dateToPick = (typeof targetDate === 'string' && availableDates.includes(targetDate))
				? targetDate
				: (availableDates.length > 0 ? availableDates[0] : '');
			if (dateToPick) {
				await selectDate(dateToPick);
			}
		} catch {
			// handled
		} finally {
			isLoadingDates = false;
		}
	}

	function closeDrawer() {
		isDrawerOpen = false;
	}

	async function selectDate(dateStr: string) {
		selectedDate = dateStr;
		isLoadingSlots = true;
		bookingErrorMessage = '';
		selectedSlot = null;
		try {
			const res = await fetch(`/api/mentoring/instructors/${instructor.id}/windows?date=${dateStr}`);
			const json = await res.json();
			dayWindows = json.windows || [];
			if (dayWindows.length > 0) {
				selectedWindowId = dayWindows[0].id;
				const allowed = dayWindows[0].allowedDurations || [30];
				selectedDuration = allowed.includes(selectedDuration) ? selectedDuration : allowed[0];
				await fetchFreeSlots(selectedWindowId, selectedDuration);
			} else {
				availableSlots = [];
			}
		} catch {
			availableSlots = [];
		} finally {
			isLoadingSlots = false;
		}
	}

	async function fetchFreeSlots(windowId: string, duration: number) {
		if (!windowId) return;
		isLoadingSlots = true;
		bookingErrorMessage = '';
		try {
			const res = await fetch(`/api/mentoring/instructors/${instructor.id}/free-slots?windowId=${windowId}&duration=${duration}`);
			const json = await res.json();
			if (res.ok) {
				availableSlots = json.availableSlots || [];
				selectedSlot = availableSlots.length > 0 ? availableSlots[0] : null;
			} else {
				availableSlots = [];
				bookingErrorMessage = json.error || 'No available slots for this duration.';
			}
		} catch {
			availableSlots = [];
		} finally {
			isLoadingSlots = false;
		}
	}

	function onDurationChange(duration: number) {
		selectedDuration = duration;
		if (selectedWindowId) {
			fetchFreeSlots(selectedWindowId, duration);
		}
	}

	function handleApplyCoupon() {
		couponError = '';
		if (!couponCode.trim()) return;
		appliedCoupon = { code: couponCode.trim().toUpperCase(), discountPaise: 0 };
	}

	async function handleBookSession() {
		if (!selectedSlot) { bookingErrorMessage = 'Please select an available time slot.'; return; }
		if (!user) { window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`; return; }

		isSubmittingBooking = true;
		bookingErrorMessage = '';
		try {
			const res = await fetch('/api/mentoring/bookings', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					availabilityId: selectedWindowId,
					startsAt: selectedSlot.startsAtISO,
					durationMins: selectedDuration,
					notes: sessionNotes,
					couponCode: appliedCoupon ? appliedCoupon.code : undefined
				})
			});
			const json = await res.json();
			if (!res.ok) {
				bookingErrorMessage = json.error || 'Failed to complete reservation. Please try another slot.';
				if (res.status === 409) fetchFreeSlots(selectedWindowId, selectedDuration);
				return;
			}
			if (!json.isFree && json.checkoutUrl) {
				window.location.href = json.checkoutUrl;
			} else {
				confirmedBookingResult = {
					bookingId: json.bookingId,
					meetingUrl: dayWindows.find((w: any) => w.id === selectedWindowId)?.meetingUrl,
					isFree: true
				};
				bookingStep = 4;
			}
		} catch (err: any) {
			bookingErrorMessage = err.message || 'An unexpected error occurred.';
		} finally {
			isSubmittingBooking = false;
		}
	}

	// ── Formatting helpers ───────────────────────────────────────────────────
	function formatPaise(paise: number) {
		if (paise === 0) return 'Free';
		return `₹${(paise / 100).toLocaleString('en-IN')}`;
	}

	function formatDate(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return new Intl.DateTimeFormat('en-IN', { weekday: 'short', month: 'short', day: 'numeric' }).format(d);
	}

	const avgRating = $derived(
		testimonials.length > 0
			? (testimonials.reduce((sum: number, t: any) => sum + t.rating, 0) / testimonials.length).toFixed(1)
			: instructor.averageRating?.toFixed(1) || '5.0'
	);

	const socialLinks = $derived(instructor.socialLinks as Record<string, string | null> || {});
	const credentials = $derived((instructor.credentials as any[]) || []);
	const languages = $derived((instructor.languages as string[]) || []);
</script>

<svelte:head>
	<title>{instructor.name} — 1-on-1 Mentoring | {APP_NAME}</title>
	<meta name="description" content="{instructor.headline || instructor.bio || 'Book a 1-on-1 practitioner mentoring session on Launchpad.'}" />
	<link rel="canonical" href="/mentoring/{instructor.handle || instructor.id}" />
</svelte:head>

<div class="mentor-profile-page bg-[var(--background)] min-h-screen">
	<!-- Back navigation -->
	<div class="border-b border-[var(--border)] bg-[var(--surface)]">
		<div class="container-custom py-3.5">
			<a href="/mentoring" class="inline-flex items-center gap-1.5 text-[12px] font-medium text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors">
				<ArrowLeft size={14} />
				<span>All Practitioners & Mentors</span>
			</a>
		</div>
	</div>

	<!-- ── ARCHETYPE B: HERO BANNER ──────────────────────────────── -->
	<section class="bg-[var(--surface)] border-b border-[var(--border)] py-8">
		<div class="container-custom">
			<div class="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
				<div class="flex items-center gap-5">
					{#if instructor.avatarUrl}
						<img src={instructor.avatarUrl} alt={instructor.name} class="w-20 h-20 rounded-full object-cover border border-[var(--border)] shadow-sm" />
					{:else}
						<div class="w-20 h-20 rounded-full bg-[var(--color-primary)] text-white flex items-center justify-center font-bold text-2xl">
							{instructor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
						</div>
					{/if}

					<div class="space-y-1">
						<div class="flex items-center gap-2">
							<h1 class="text-[1.5rem] font-bold text-[var(--text-primary)] tracking-tight">{instructor.name}</h1>
							<VerifiedBadge text="Verified Mentor" />
						</div>
						<p class="text-[14px] text-[var(--text-secondary)] font-medium">{instructor.headline || 'Industry Practitioner & Technical Advisor'}</p>
						<div class="flex items-center gap-3 text-[12px] text-[var(--text-muted)] pt-1">
							{#if instructor.yearsExp}
								<span>{instructor.yearsExp}+ yrs experience</span>
								<span>·</span>
							{/if}
							{#if instructor.totalSessionsCompleted > 0}
								<span>{instructor.totalSessionsCompleted} sessions conducted</span>
								<span>·</span>
							{/if}
							{#if testimonials.length > 0}
								<span class="text-[var(--text-primary)] font-semibold">★ {avgRating} ({testimonials.length} reviews)</span>
							{/if}
						</div>
					</div>
				</div>

				<div class="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
					<div class="text-[13px] text-[var(--text-secondary)]">
						Starting from <strong class="text-[18px] font-bold text-[var(--text-primary)]">{formatPaise(instructor.lowestPricePaise)}</strong> / 30m
					</div>
					<Button onclick={() => openBookingDrawer()} variant="primary" size="md">
						Book a Session <ArrowRight size={14} />
					</Button>
				</div>
			</div>
		</div>
	</section>

	<!-- ── ARCHETYPE B: BODY CONTENT GRID ────────────────────────── -->
	<div class="container-custom py-10">
		<div class="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
			
			<!-- Left Column: Biography, Credentials, Testimonials -->
			<div class="lg:col-span-8 space-y-10">
				
				<!-- Section: About -->
				<section class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6">
					<h2 class="text-[16px] font-bold text-[var(--text-primary)] tracking-tight mb-4">About Practitioner</h2>
					<div class="text-[14px] leading-relaxed text-[var(--text-secondary)] space-y-3">
						{#if instructor.about}
							{#each instructor.about.split('\n\n') as paragraph}
								{#if paragraph.trim()}
									<p>{paragraph}</p>
								{/if}
							{/each}
						{:else}
							<p>{instructor.bio || 'Vetted practitioner offering dedicated 1-on-1 technical advisory, career guidance, and architectural reviews.'}</p>
						{/if}
					</div>

					{#if languages.length > 0}
						<div class="mt-6 pt-4 border-t border-[var(--border)] flex items-center gap-2 text-[12px]">
							<span class="text-[var(--text-muted)] font-medium">Session Languages:</span>
							<span class="text-[var(--text-primary)] font-medium">{languages.join(', ')}</span>
						</div>
					{/if}
				</section>

				<!-- Section: Credentials & Certifications -->
				{#if credentials.length > 0}
					<section class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6">
						<h2 class="text-[16px] font-bold text-[var(--text-primary)] tracking-tight mb-4">Verified Professional Credentials</h2>
						<div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
							{#each credentials as cred}
								<div class="p-3.5 border border-[var(--border)] rounded-[var(--radius-sm)] flex items-start gap-3 bg-[var(--surface-subtle)]">
									<Award size={18} class="text-[var(--lp-accent)] shrink-0 mt-0.5" />
									<div>
										<p class="text-[13px] font-semibold text-[var(--text-primary)]">{cred.title}</p>
										<p class="text-[12px] text-[var(--text-muted)]">{cred.issuer}{cred.year ? ` · ${cred.year}` : ''}</p>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Section: Verified Student Testimonials (Only if real data exists) -->
				{#if testimonials.length > 0}
					<section class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6">
						<div class="flex items-center justify-between mb-4">
							<h2 class="text-[16px] font-bold text-[var(--text-primary)] tracking-tight">Verified Learner Feedback</h2>
							<span class="text-[12px] text-[var(--text-muted)] font-medium">{testimonials.length} reviews</span>
						</div>
						<div class="space-y-4">
							{#each visibleTestimonials as t}
								<div class="p-4 border border-[var(--border)] rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] space-y-2">
									<p class="text-[13px] text-[var(--text-secondary)] italic leading-relaxed">"{t.body}"</p>
									<div class="flex items-center justify-between pt-1 text-[12px]">
										<span class="font-semibold text-[var(--text-primary)]">{t.reviewerName}</span>
										<span class="text-[var(--text-muted)]">{'★'.repeat(t.rating)}</span>
									</div>
								</div>
							{/each}
						</div>

						{#if testimonials.length > 3}
							<button
								class="mt-4 text-[13px] font-semibold text-[var(--text-primary)] hover:underline inline-flex items-center gap-1"
								onclick={() => (showAllTestimonials = !showAllTestimonials)}
							>
								{#if showAllTestimonials}
									Show less <ChevronUp size={14} />
								{:else}
									Show all {testimonials.length} reviews <ChevronDown size={14} />
								{/if}
							</button>
						{/if}
					</section>
				{/if}

			</div>

			<!-- Right Column: Session Packages & Calendar Widget -->
			<div class="lg:col-span-4 space-y-6 sticky top-24">
				
				<!-- Session Packages Card -->
				<div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 shadow-sm">
					<h3 class="text-[14px] font-bold text-[var(--text-primary)] tracking-tight mb-3">Session Packages</h3>
					<div class="divide-y divide-[var(--border)]">
						{#each durationPrices as p}
							<div class="py-2.5 flex items-center justify-between text-[13px]">
								<div class="flex items-center gap-2 text-[var(--text-secondary)] font-medium">
									<Clock size={14} class="text-[var(--text-muted)]" />
									<span>{p.durationMins} minutes</span>
								</div>
								<span class="font-bold text-[var(--text-primary)]">{formatPaise(p.pricePaise)}</span>
							</div>
						{/each}
					</div>
				</div>

				<!-- Availability Calendar Widget -->
				<div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-5 shadow-sm">
					<div class="flex items-center justify-between mb-4">
						<div class="flex items-center gap-2">
							<Calendar size={15} class="text-[var(--text-secondary)]" />
							<h3 class="text-[14px] font-bold text-[var(--text-primary)] tracking-tight">Availability</h3>
						</div>
						<div class="flex items-center gap-1.5">
							<button class="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]" onclick={() => { if (sidebarCalMonth === 0) { sidebarCalMonth = 11; sidebarCalYear--; } else { sidebarCalMonth--; } }}>
								<ChevronDown size={14} style="transform: rotate(90deg);" />
							</button>
							<span class="text-[12px] font-semibold text-[var(--text-primary)]">
								{new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(sidebarCalYear, sidebarCalMonth, 1))}
							</span>
							<button class="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]" onclick={() => { if (sidebarCalMonth === 11) { sidebarCalMonth = 0; sidebarCalYear++; } else { sidebarCalMonth++; } }}>
								<ChevronDown size={14} style="transform: rotate(-90deg);" />
							</button>
						</div>
					</div>

					<!-- Visual Month Grid -->
					<div class="grid grid-cols-7 gap-1 text-center mb-4">
						{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as dName}
							<span class="text-[10px] font-bold text-[var(--text-muted)] uppercase py-1">{dName}</span>
						{/each}
						{#each Array(sidebarFirstDayOffset) as _}
							<span></span>
						{/each}
						{#each Array.from({ length: sidebarDaysInMonth }, (_, i) => i + 1) as dNum}
							{@const cellDateStr = `${sidebarCalYear}-${(sidebarCalMonth + 1).toString().padStart(2, '0')}-${dNum.toString().padStart(2, '0')}`}
							{@const isAvail = availableDates.includes(cellDateStr)}
							<button
								class="h-8 rounded flex items-center justify-center text-[12px] font-medium transition-colors relative"
								class:bg-[var(--color-surface-subtle)]={isAvail}
								class:text-[var(--color-text)]={isAvail}
								class:font-bold={isAvail}
								class:hover:bg-[var(--color-surface-elevated)]={isAvail}
								class:text-[var(--text-muted)]={!isAvail}
								class:opacity-50={!isAvail}
								disabled={!isAvail}
								onclick={() => openBookingDrawer(cellDateStr)}
								title={isAvail ? `Book session on ${cellDateStr}` : 'No slots'}
							>
								{dNum}
								{#if isAvail}
									<span class="absolute bottom-1 w-1 h-1 rounded-full bg-[var(--color-text-secondary)]"></span>
								{/if}
							</button>
						{/each}
					</div>

					<div class="pt-3 border-t border-[var(--border)]">
						<Button onclick={() => openBookingDrawer()} variant="primary" size="md" fullWidth>
							Select Date & Book
						</Button>
					</div>
				</div>

			</div>

		</div>
	</div>
</div>

<!-- ── Booking Drawer (Archetype D: Modal/Drawer) ────────────────── -->
{#if isDrawerOpen && user}
	<div class="fixed inset-0 bg-black/40 z-50 transition-opacity" onclick={closeDrawer} role="presentation"></div>
	<aside class="fixed right-0 top-0 bottom-0 w-full max-w-md bg-[var(--surface)] border-l border-[var(--border)] z-50 flex flex-col shadow-2xl overflow-y-auto" role="dialog" aria-labelledby="drawer-title">
		
		<div class="p-5 border-b border-[var(--border)] flex items-center justify-between">
			<div>
				<span class="meta-mono text-[10px]">1-ON-1 BOOKING</span>
				<h2 id="drawer-title" class="text-[16px] font-bold text-[var(--text-primary)] mt-0.5">{instructor.name}</h2>
			</div>
			<button class="p-1 rounded hover:bg-[var(--surface-subtle)] text-[var(--text-secondary)]" onclick={closeDrawer} aria-label="Close">
				<X size={18} />
			</button>
		</div>

		<div class="p-6 flex-1 flex flex-col">
			{#if bookingErrorMessage}
				<div class="mb-5 p-3 rounded-[var(--radius-sm)] bg-red-50 border border-red-200 text-red-700 text-[12px] flex items-center gap-2">
					<AlertCircle size={15} class="shrink-0" />
					<span>{bookingErrorMessage}</span>
				</div>
			{/if}

			<!-- Step 1: Date, Duration, Slot -->
			{#if bookingStep === 1}
				<div class="space-y-6">
					
					<!-- Date selection -->
					<div>
						<span class="block text-[12px] font-bold text-[var(--text-primary)] mb-2">1. Select Date</span>
						{#if isLoadingDates}
							<div class="py-4 text-center text-[13px] text-[var(--text-muted)] flex items-center justify-center gap-2">
								<Loader2 size={16} class="animate-spin" /> Fetching available days...
							</div>
						{:else if availableDates.length === 0}
							<p class="text-[13px] text-[var(--text-muted)]">No upcoming open calendar windows.</p>
						{:else}
							<div class="grid grid-cols-3 gap-2">
								{#each availableDates.slice(0, 6) as d}
									<button
										class="p-2.5 text-center rounded-[var(--radius-sm)] border text-[12px] font-medium transition-colors"
										class:bg-[var(--color-primary)]={selectedDate === d}
										class:text-white={selectedDate === d}
										class:border-[var(--color-primary)]={selectedDate === d}
										class:border-[var(--border)]={selectedDate !== d}
										class:bg-[var(--surface)]={selectedDate !== d}
										onclick={() => selectDate(d)}
									>
										{formatDate(d)}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<!-- Duration selection -->
					<div>
						<span class="block text-[12px] font-bold text-[var(--text-primary)] mb-2">2. Duration</span>
						<div class="grid grid-cols-3 gap-2">
							{#each durationPrices as price}
								<button
									class="p-2.5 text-center rounded-[var(--radius-sm)] border text-[12px] font-medium transition-colors"
									class:bg-[var(--color-primary)]={selectedDuration === price.durationMins}
									class:text-white={selectedDuration === price.durationMins}
									class:border-[var(--color-primary)]={selectedDuration === price.durationMins}
									class:border-[var(--border)]={selectedDuration !== price.durationMins}
									class:bg-[var(--surface)]={selectedDuration !== price.durationMins}
									onclick={() => onDurationChange(price.durationMins)}
								>
									<span class="block font-bold">{price.durationMins}m</span>
									<span class="block text-[11px] opacity-80">{formatPaise(price.pricePaise)}</span>
								</button>
							{/each}
						</div>
					</div>

					<!-- Time Slots -->
					<div>
						<span class="block text-[12px] font-bold text-[var(--text-primary)] mb-2">3. Time Slot (IST)</span>
						{#if isLoadingSlots}
							<div class="py-4 text-center text-[13px] text-[var(--text-muted)] flex items-center justify-center gap-2">
								<Loader2 size={16} class="animate-spin" /> Loading free slots...
							</div>
						{:else if !selectedDate}
							<p class="text-[12px] text-[var(--text-muted)]">Select a date above to display available times.</p>
						{:else if availableSlots.length === 0}
							<p class="text-[12px] text-[var(--text-muted)]">No open slots on this date. Please try another day or duration.</p>
						{:else}
							<div class="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
								{#each availableSlots as slot}
									<button
										class="p-2 text-center rounded-[var(--radius-sm)] border text-[12px] font-medium transition-colors flex items-center justify-center gap-1.5"
										class:bg-[var(--color-primary)]={selectedSlot?.startsAtISO === slot.startsAtISO}
										class:text-white={selectedSlot?.startsAtISO === slot.startsAtISO}
										class:border-[var(--color-primary)]={selectedSlot?.startsAtISO === slot.startsAtISO}
										class:border-[var(--border)]={selectedSlot?.startsAtISO !== slot.startsAtISO}
										onclick={() => selectedSlot = slot}
									>
										<Clock size={12} />
										<span>{slot.timeStr}</span>
									</button>
								{/each}
							</div>
						{/if}
					</div>

					{#if selectedSlot}
						<div class="p-3 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] text-[12px] flex items-center justify-between">
							<div>
								<span class="font-bold text-[var(--text-primary)]">{selectedSlot.timeStr} IST</span>
								<span class="text-[var(--text-muted)]"> · {selectedDuration} mins</span>
							</div>
							<span class="font-bold text-[var(--text-primary)]">{formatPaise(currentFinalPricePaise())}</span>
						</div>
					{/if}

					<div class="pt-4 mt-auto">
						<Button
							variant="primary"
							size="lg"
							fullWidth
							disabled={!selectedSlot || isLoadingSlots}
							onclick={() => { if (selectedSlot) bookingStep = 2; }}
						>
							Continue to Review &rarr;
						</Button>
					</div>

				</div>

			<!-- Step 2: Review, Agenda & Pay -->
			{:else if bookingStep === 2}
				<div class="space-y-5">
					<div class="p-4 bg-[var(--surface-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] space-y-2 text-[13px]">
						<div class="flex justify-between text-[var(--text-secondary)]"><span>Mentor</span><span class="font-semibold text-[var(--text-primary)]">{instructor.name}</span></div>
						<div class="flex justify-between text-[var(--text-secondary)]"><span>Date</span><span class="font-semibold text-[var(--text-primary)]">{formatDate(selectedDate)}</span></div>
						<div class="flex justify-between text-[var(--text-secondary)]"><span>Time</span><span class="font-semibold text-[var(--text-primary)]">{selectedSlot?.timeStr} IST</span></div>
						<div class="flex justify-between text-[var(--text-secondary)]"><span>Duration</span><span class="font-semibold text-[var(--text-primary)]">{selectedDuration} mins</span></div>
						<div class="pt-2 border-t border-[var(--border)] flex justify-between font-bold text-[14px] text-[var(--text-primary)]">
							<span>Total Amount</span>
							<span>{formatPaise(currentFinalPricePaise())}</span>
						</div>
					</div>

					<div>
						<label class="block text-[12px] font-bold text-[var(--text-primary)] mb-1.5" for="notes">Session Agenda & Topics</label>
						<textarea
							id="notes"
							rows={3}
							bind:value={sessionNotes}
							placeholder="What goals or technical challenges would you like to focus on?"
							class="w-full text-[13px] p-2.5 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] focus:border-[var(--color-primary)] outline-none"
						></textarea>
					</div>

					<div class="flex gap-2">
						<input
							type="text"
							bind:value={couponCode}
							placeholder="Promo coupon code"
							class="flex-1 text-[13px] px-3 py-2 rounded-[var(--radius-sm)] border border-[var(--border)] outline-none"
						/>
						<Button variant="secondary" size="sm" onclick={handleApplyCoupon}>Apply</Button>
					</div>
					{#if appliedCoupon}
						<p class="text-[11px] text-[var(--lp-accent)] font-medium">Coupon "{appliedCoupon.code}" attached.</p>
					{/if}

					<div class="flex gap-3 pt-4">
						<Button variant="secondary" size="lg" onclick={() => bookingStep = 1} disabled={isSubmittingBooking}>
							Back
						</Button>
						<div class="flex-1">
							<Button variant="primary" size="lg" fullWidth onclick={handleBookSession} disabled={isSubmittingBooking}>
								{#if isSubmittingBooking}
									<Loader2 size={16} class="animate-spin" /> Confirming...
								{:else}
									Pay {formatPaise(currentFinalPricePaise())} & Book
								{/if}
							</Button>
						</div>
					</div>
				</div>

			<!-- Step 4: Success -->
			{:else if bookingStep === 4}
				<div class="py-10 text-center space-y-4">
					<CheckCircle size={44} class="text-[var(--lp-accent)] mx-auto" />
					<h3 class="text-[18px] font-bold text-[var(--text-primary)]">Session Confirmed</h3>
					<p class="text-[13px] text-[var(--text-secondary)] leading-relaxed max-w-xs mx-auto">
						Your reservation has been confirmed. Confirmation details and calendar invites have been dispatched to your email.
					</p>
					{#if confirmedBookingResult?.meetingUrl}
						<div class="pt-2">
							<Button href={confirmedBookingResult.meetingUrl} variant="primary" size="md">
								Open Video Room
							</Button>
						</div>
					{/if}
					<div class="pt-4">
						<Button variant="secondary" size="md" onclick={closeDrawer}>
							Close
						</Button>
					</div>
				</div>
			{/if}

		</div>
	</aside>
{/if}
