<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import {
		ArrowLeft, ShieldCheck, Globe, Link as LinkIcon,
		Calendar, Clock, Star, CheckCircle, X, AlertCircle, Loader2,
		ArrowRight, ChevronDown, ChevronUp, User, Award, MessageSquare
	} from 'lucide-svelte';
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
		return found ? found.pricePaise : 0;
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
		selectedDate = targetDate || '';
		selectedWindowId = '';
		selectedSlot = null;
		sessionNotes = '';
		couponCode = '';
		appliedCoupon = null;
		couponError = '';
		bookingErrorMessage = '';
		confirmedBookingResult = null;

		// Pre-fetch available dates
		isLoadingDates = true;
		try {
			const res = await fetch(`/api/mentoring/instructors/${instructor.id}/calendar`);
			const json = await res.json();
			availableDates = json.availableDates || [];
			const dateToPick = targetDate && availableDates.includes(targetDate)
				? targetDate
				: (availableDates.length > 0 ? availableDates[0] : '');
			if (dateToPick) {
				await selectDate(dateToPick);
			}
		} catch {
			// silently handled — user sees empty calendar
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

	function onWindowChange(windowId: string) {
		selectedWindowId = windowId;
		const w = dayWindows.find((dw: any) => dw.id === windowId);
		if (w && !w.allowedDurations.includes(selectedDuration)) {
			selectedDuration = w.allowedDurations[0];
		}
		fetchFreeSlots(windowId, selectedDuration);
	}

	function onDurationChange(duration: number) {
		selectedDuration = duration;
		fetchFreeSlots(selectedWindowId, duration);
	}

	function handleApplyCoupon() {
		couponError = '';
		if (!couponCode.trim()) return;
		// Server validates the final code at checkout; client shows optimistic state
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

	function formatDateShort(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).format(d);
	}

	// Render star ratings as plain text representation
	function starsStr(rating: number) {
		return '★'.repeat(rating) + '☆'.repeat(5 - rating);
	}

	const avgRating = $derived(
		testimonials.length > 0
			? (testimonials.reduce((sum: number, t: any) => sum + t.rating, 0) / testimonials.length).toFixed(1)
			: instructor.averageRating?.toFixed(1) || '0.0'
	);

	const socialLinks = $derived(instructor.socialLinks as Record<string, string | null> || {});
	const credentials = $derived((instructor.credentials as any[]) || []);
	const languages = $derived((instructor.languages as string[]) || []);
</script>

<svelte:head>
	<title>{instructor.name} — 1-on-1 Mentoring | {APP_NAME}</title>
	<meta name="description" content="{instructor.headline || instructor.bio} | Book a session from {formatPaise(instructor.lowestPricePaise)} / 30 min." />
	<meta property="og:title" content="{instructor.name} — Mentor | {APP_NAME}" />
	<meta property="og:description" content="{instructor.headline || instructor.bio}" />
	{#if instructor.avatarUrl}
		<meta property="og:image" content={instructor.avatarUrl} />
	{/if}
	<link rel="canonical" href="/mentoring/{instructor.handle || instructor.id}" />
</svelte:head>

<div class="profile-page">

	<!-- Back navigation -->
	<div class="back-bar">
		<div class="container">
			<a href="/mentoring" class="back-link">
				<ArrowLeft size={14} />
				<span>All Mentors</span>
			</a>
		</div>
	</div>

	<!-- ── Section A: Hero ─────────────────────────────────────────── -->
	<section class="profile-hero">
		<div class="container hero-inner">
			<div class="hero-avatar-col">
				{#if instructor.avatarUrl}
					<img src={instructor.avatarUrl} alt={instructor.name} class="hero-avatar" />
				{:else}
					<div class="hero-avatar-placeholder">
						{instructor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
					</div>
				{/if}
				{#if instructor.isFeatured}
					<span class="featured-badge">Featured</span>
				{/if}
			</div>

			<div class="hero-meta">
				<div class="hero-name-row">
					<h1 class="hero-name">{instructor.name}</h1>
					<ShieldCheck size={18} class="verified-icon" />
				</div>

				{#if instructor.headline}
					<p class="hero-headline">{instructor.headline}</p>
				{/if}

				<div class="hero-stats">
					{#if testimonials.length > 0}
						<span class="stat-item">
							<span class="stars-display">{starsStr(Math.round(Number(avgRating)))}</span>
							<span class="stat-label">{avgRating} ({testimonials.length} reviews)</span>
						</span>
					{/if}
					{#if instructor.totalSessionsCompleted > 0}
						<span class="stat-sep">·</span>
						<span class="stat-item">
							<span class="stat-label">{instructor.totalSessionsCompleted} sessions</span>
						</span>
					{/if}
					{#if instructor.yearsExp}
						<span class="stat-sep">·</span>
						<span class="stat-item">
							<span class="stat-label">{instructor.yearsExp}+ years experience</span>
						</span>
					{/if}
				</div>

				<!-- Social links -->
				<div class="social-links">
					{#if socialLinks.linkedin}
						<a href={socialLinks.linkedin} target="_blank" rel="noopener noreferrer" class="social-btn" title="LinkedIn">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.88 8.56a1.68 1.68 0 0 0 1.68-1.68c0-.93-.75-1.69-1.68-1.69a1.69 1.69 0 0 0-1.69 1.69c0 .93.76 1.68 1.69 1.68m1.39 9.94v-8.37H5.5v8.37h2.77z"/></svg>
						</a>
					{/if}
					{#if socialLinks.github}
						<a href={socialLinks.github} target="_blank" rel="noopener noreferrer" class="social-btn" title="GitHub">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2A10 10 0 0 0 2 12c0 4.42 2.87 8.17 6.84 9.5.5.08.66-.23.66-.5v-1.69c-2.77.6-3.36-1.34-3.36-1.34-.46-1.16-1.11-1.47-1.11-1.47-.91-.62.07-.6.07-.6 1 .07 1.53 1.03 1.53 1.03.87 1.52 2.34 1.07 2.91.83.1-.65.35-1.09.63-1.34-2.22-.25-4.55-1.11-4.55-4.92 0-1.11.38-2 1.03-2.71-.1-.25-.45-1.29.1-2.64 0 0 .84-.27 2.75 1.02.79-.22 1.65-.33 2.5-.33.85 0 1.71.11 2.5.33 1.91-1.29 2.75-1.02 2.75-1.02.55 1.35.2 2.39.1 2.64.65.71 1.03 1.6 1.03 2.71 0 3.82-2.34 4.66-4.57 4.91.36.31.69.92.69 1.85V21c0 .27.16.59.67.5C19.14 20.16 22 16.42 22 12A10 10 0 0 0 12 2z"/></svg>
						</a>
					{/if}
					{#if socialLinks.twitter}
						<a href={socialLinks.twitter} target="_blank" rel="noopener noreferrer" class="social-btn" title="Twitter / X">
							<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/></svg>
						</a>
					{/if}
					{#if socialLinks.website}
						<a href={socialLinks.website} target="_blank" rel="noopener noreferrer" class="social-btn" title="Website">
							<Globe size={15} />
						</a>
					{/if}
				</div>

				<div class="hero-actions">
					<div class="hero-price-tag">
						<span class="from-price">{formatPaise(instructor.lowestPricePaise)}</span>
						<span class="from-label">/ 30 min starting</span>
					</div>
					{#if user}
						<button class="book-cta" onclick={openBookingDrawer}>
							Book a Session <ArrowRight size={15} />
						</button>
					{:else}
						<a href={`/sign-in?redirect=${encodeURIComponent('/mentoring/' + (instructor.handle || instructor.id))}`} class="book-cta">
							Sign in to Book <ArrowRight size={15} />
						</a>
					{/if}
				</div>
			</div>
		</div>
	</section>

	<div class="profile-body">
		<div class="container profile-grid">

			<!-- ── Left column: main content ───────────────────────────── -->
			<div class="main-col">

				<!-- Section B: Video Intro -->
				{#if instructor.videoIntroUrl}
					<section class="profile-section">
						<h2 class="section-heading">Introduction</h2>
						<div class="video-embed-wrap">
							<iframe
								src={instructor.videoIntroUrl}
								title="Mentor introduction video"
								frameborder="0"
								allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
								allowfullscreen
								class="video-embed"
							></iframe>
						</div>
					</section>
				{/if}

				<!-- Section C: About -->
				{#if instructor.about}
					<section class="profile-section">
						<h2 class="section-heading">About</h2>
						<div class="about-body">
							{#each instructor.about.split('\n\n') as paragraph}
								{#if paragraph.trim()}
									<p class="about-para">{@html paragraph.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>').replace(/\*(.*?)\*/g, '<em>$1</em>')}</p>
								{/if}
							{/each}
						</div>
						{#if languages.length > 0}
							<div class="about-meta-row">
								<span class="about-meta-label">Languages:</span>
								<span class="about-meta-value">{languages.join(', ')}</span>
							</div>
						{/if}
					</section>
				{:else if instructor.bio}
					<section class="profile-section">
						<h2 class="section-heading">About</h2>
						<p class="about-para">{instructor.bio}</p>
					</section>
				{/if}

				<!-- Section D: Credentials -->
				{#if credentials.length > 0}
					<section class="profile-section">
						<h2 class="section-heading">Credentials</h2>
						<div class="credentials-grid">
							{#each credentials as cred}
								<div class="cred-card">
									<Award size={18} class="cred-icon" />
									<div class="cred-info">
										<p class="cred-title">{cred.title}</p>
										<p class="cred-sub">{cred.issuer}{cred.year ? ` · ${cred.year}` : ''}</p>
									</div>
								</div>
							{/each}
						</div>
					</section>
				{/if}

				<!-- Section G: Testimonials -->
				{#if testimonials.length > 0}
					<section class="profile-section">
						<h2 class="section-heading">
							What students say
							<span class="section-count">({testimonials.length})</span>
						</h2>

						<div class="testimonials-list">
							{#each visibleTestimonials as t}
								<blockquote class="testimonial-card">
									<p class="testimonial-body">"{t.body}"</p>
									<footer class="testimonial-footer">
										<span class="testimonial-stars">{starsStr(t.rating)}</span>
										<span class="testimonial-author">
											{t.reviewerName}
											{#if t.reviewerRole}
												<span class="testimonial-role">· {t.reviewerRole}</span>
											{/if}
										</span>
									</footer>
								</blockquote>
							{/each}
						</div>

						{#if testimonials.length > 3}
							<button
								class="show-more-btn"
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

			<!-- ── Right sidebar: packages + calendar ──────────────────── -->
			<aside class="sidebar-col">

				<!-- Section E: Session Packages -->
				<div class="sidebar-card">
					<h3 class="sidebar-heading">Session Packages</h3>
				<!-- Section F: Availability Calendar -->
				<div class="sidebar-card">
					<div class="sidebar-cal-header">
						<h3 class="sidebar-heading">
							<Calendar size={15} />
							Availability Calendar
						</h3>
						<div class="sidebar-cal-nav">
							<button class="cal-nav-btn" onclick={() => { if (sidebarCalMonth === 0) { sidebarCalMonth = 11; sidebarCalYear--; } else { sidebarCalMonth--; } }}>
								<ChevronDown size={14} style="transform: rotate(90deg);" />
							</button>
							<span class="sidebar-cal-month-label">
								{new Intl.DateTimeFormat('en-US', { month: 'short', year: 'numeric' }).format(new Date(sidebarCalYear, sidebarCalMonth, 1))}
							</span>
							<button class="cal-nav-btn" onclick={() => { if (sidebarCalMonth === 11) { sidebarCalMonth = 0; sidebarCalYear++; } else { sidebarCalMonth++; } }}>
								<ChevronDown size={14} style="transform: rotate(-90deg);" />
							</button>
						</div>
					</div>

					<!-- Visual Month Grid -->
					<div class="mini-cal-grid">
						{#each ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'] as dName}
							<span class="mini-cal-dname">{dName}</span>
						{/each}
						{#each Array(sidebarFirstDayOffset) as _}
							<span class="mini-cal-cell empty"></span>
						{/each}
						{#each Array.from({ length: sidebarDaysInMonth }, (_, i) => i + 1) as dNum}
							{@const cellDateStr = `${sidebarCalYear}-${(sidebarCalMonth + 1).toString().padStart(2, '0')}-${dNum.toString().padStart(2, '0')}`}
							{@const isAvail = availableDates.includes(cellDateStr)}
							<button
								class="mini-cal-cell"
								class:avail={isAvail}
								class:selected={selectedDate === cellDateStr}
								disabled={!isAvail}
								onclick={() => openBookingDrawer(cellDateStr)}
								title={isAvail ? `Book session on ${cellDateStr}` : 'No slots'}
							>
								<span class="cell-num">{dNum}</span>
								{#if isAvail}
									<span class="avail-dot"></span>
								{/if}
							</button>
						{/each}
					</div>

					{#if !user}
						<p class="cal-guest-hint">
							<a href={`/sign-in?redirect=${encodeURIComponent('/mentoring/' + (instructor.handle || instructor.id))}`}>Sign in</a>
							to select time slots and book.
						</p>
					{:else if availableDates.length > 0}
						<p class="cal-active-hint">
							<span class="avail-dot inline"></span> Green dots indicate bookable days.
						</p>
					{:else}
						<p class="sidebar-empty">No upcoming availability. Check back soon.</p>
					{/if}
				</div>

				<!-- Final CTA block -->
				<div class="sidebar-cta-card">
					<p class="sidebar-cta-text">Ready to level up?</p>
					{#if user}
						<button class="book-cta full-width" onclick={() => openBookingDrawer()}>
							Book a Session <ArrowRight size={14} />
						</button>
					{:else}
						<a
							href={`/sign-in?redirect=${encodeURIComponent('/mentoring/' + (instructor.handle || instructor.id))}`}
							class="book-cta full-width"
						>
							Sign in to Book <ArrowRight size={14} />
						</a>
					{/if}
				</div>

			</aside>
		</div>
	</div>
</div>

<!-- ── Booking Drawer (only renders if user is logged in and drawer is open) ── -->
{#if isDrawerOpen && user}
	<div class="drawer-backdrop" onclick={closeDrawer} role="presentation"></div>
	<aside class="booking-drawer" role="dialog" aria-labelledby="drawer-title">
		<header class="drawer-header">
			<div>
				<p class="drawer-tag">Book 1-on-1 Session</p>
				<h2 id="drawer-title" class="drawer-title">{instructor.name}</h2>
			</div>
			<button class="close-btn" onclick={closeDrawer} aria-label="Close">
				<X size={18} />
			</button>
		</header>

		{#if bookingStep < 4}
			<div class="steps-progress">
				<div class="step-item" class:active={bookingStep >= 1} class:current={bookingStep === 1}>
					<span class="step-num">1</span><span class="step-label">Date & Time</span>
				</div>
				<div class="step-sep"></div>
				<div class="step-item" class:active={bookingStep >= 2} class:current={bookingStep === 2}>
					<span class="step-num">2</span><span class="step-label">Review & Pay</span>
				</div>
				<div class="step-sep"></div>
				<div class="step-item" class:active={bookingStep >= 3} class:current={bookingStep === 3}>
					<span class="step-num">3</span><span class="step-label">Confirmation</span>
				</div>
			</div>
		{/if}

		<div class="drawer-body">
			{#if bookingErrorMessage}
				<div class="error-banner"><AlertCircle size={15} />{bookingErrorMessage}</div>
			{/if}

			<!-- Step 1: Unified Date, Duration & Time Slot Picker -->
			{#if bookingStep === 1}
				<!-- Date Selection Strip -->
				<div class="drawer-section">
					<div class="section-label-row">
						<span class="step-label-h">1. Choose Date</span>
						{#if selectedDate}
							<span class="step-selected-tag">{formatDate(selectedDate)}</span>
						{/if}
					</div>

					{#if isLoadingDates}
						<div class="loading-row"><Loader2 size={16} class="spin" /> Loading available dates...</div>
					{:else if availableDates.length === 0}
						<div class="empty-state-sm">No upcoming dates available for this mentor.</div>
					{:else}
						<div class="date-scroll-strip">
							{#each availableDates as date}
								<button
									class="date-strip-card"
									class:selected={selectedDate === date}
									onclick={() => selectDate(date)}
								>
									<span class="date-card-wday">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { weekday: 'short' })}</span>
									<span class="date-card-day">{new Date(date + 'T00:00:00').getDate()}</span>
									<span class="date-card-month">{new Date(date + 'T00:00:00').toLocaleDateString('en-IN', { month: 'short' })}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Duration Tiers -->
				<div class="drawer-section">
					<div class="section-label-row">
						<span class="step-label-h">2. Session Duration</span>
						<span class="step-selected-tag">{selectedDuration} min · {formatPaise(currentBasePricePaise())}</span>
					</div>

					<div class="duration-pills-row">
						{#each durationPrices as price}
							<button
								class="duration-pill-btn"
								class:selected={selectedDuration === price.durationMins}
								onclick={() => onDurationChange(price.durationMins)}
							>
								<span class="dur-pill-mins">{price.durationMins} min</span>
								<span class="dur-pill-price">{formatPaise(price.pricePaise)}</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Time Slots Selection -->
				<div class="drawer-section">
					<div class="section-label-row">
						<span class="step-label-h">3. Available Start Time (IST)</span>
						{#if selectedSlot}
							<span class="step-selected-tag active-slot">✓ {selectedSlot.timeStr} IST</span>
						{/if}
					</div>

					{#if isLoadingSlots}
						<div class="loading-row"><Loader2 size={16} class="spin" /> Calculating conflict-free slots...</div>
					{:else if !selectedDate}
						<p class="field-hint">Please select a date above to view time slots.</p>
					{:else if availableSlots.length === 0}
						<div class="empty-state-sm">
							No available slots for {selectedDuration} minutes on this date.
							{#if dayWindows.length > 0}
								Try a shorter duration or pick another date.
							{/if}
						</div>
					{:else}
						<div class="slots-grid-enhanced">
							{#each availableSlots as slot}
								<button
									class="slot-btn-enhanced"
									class:selected={selectedSlot?.startsAtISO === slot.startsAtISO}
									onclick={() => selectedSlot = slot}
								>
									<Clock size={12} />
									<span>{slot.timeStr}</span>
								</button>
							{/each}
						</div>
					{/if}
				</div>

				<!-- Selected Summary Badge -->
				{#if selectedSlot}
					<div class="slot-chosen-summary">
						<CheckCircle size={15} class="text-emerald" />
						<div>
							<strong>{formatDate(selectedDate)} at {selectedSlot.timeStr} IST</strong>
							<span class="sub">({selectedDuration} min session · {formatPaise(currentFinalPricePaise())})</span>
						</div>
					</div>
				{/if}

				<div class="drawer-nav">
					<button class="btn-ghost" onclick={closeDrawer}>Cancel</button>
					<button
						class="btn-primary"
						disabled={!selectedSlot || isLoadingSlots}
						onclick={() => { if (selectedSlot) bookingStep = 2; }}
					>
						Proceed to Confirm <ArrowRight size={14} />
					</button>
				</div>

			<!-- Step 2: Confirm, Agenda, Coupon & Payment -->
			{:else if bookingStep === 2}
				<div class="summary-card">
					<p class="sum-row"><span class="sum-label">Mentor</span><span class="sum-val">{instructor.name}</span></p>
					<p class="sum-row"><span class="sum-label">Date</span><span class="sum-val">{formatDate(selectedDate)}</span></p>
					<p class="sum-row"><span class="sum-label">Time</span><span class="sum-val">{selectedSlot?.timeStr} IST</span></p>
					<p class="sum-row"><span class="sum-label">Duration</span><span class="sum-val">{selectedDuration} minutes</span></p>
					<hr class="sum-divider" />
					<p class="sum-row total">
						<span class="sum-label">Total Due</span>
						<span class="sum-val">{formatPaise(currentFinalPricePaise())}</span>
					</p>
				</div>

				<div class="field-group">
					<label class="field-label" for="session-notes">Session Agenda & Questions</label>
					<textarea
						id="session-notes"
						class="field-textarea"
						placeholder="What would you like to cover in this session?"
						bind:value={sessionNotes}
						rows={3}
					></textarea>
				</div>

				<div class="coupon-row">
					<input
						type="text"
						class="coupon-input"
						placeholder="Promo code"
						bind:value={couponCode}
					/>
					<button class="coupon-apply-btn" onclick={handleApplyCoupon}>Apply</button>
				</div>
				{#if appliedCoupon}
					<p class="coupon-applied">Code "{appliedCoupon.code}" applied.</p>
				{/if}
				{#if couponError}
					<p class="coupon-error">{couponError}</p>
				{/if}

				<div class="drawer-nav">
					<button class="btn-ghost" onclick={() => bookingStep = 2} disabled={isSubmittingBooking}>Back</button>
					<button
						class="btn-primary"
						onclick={handleBookSession}
						disabled={isSubmittingBooking}
					>
						{#if isSubmittingBooking}
							<Loader2 size={15} class="spin" /> Processing...
						{:else}
							Pay {formatPaise(currentFinalPricePaise())} & Book
						{/if}
					</button>
				</div>

			<!-- Step 4: Success -->
			{:else if bookingStep === 4}
				<div class="success-state">
					<CheckCircle size={36} class="success-icon" />
					<h3 class="success-title">Session Confirmed</h3>
					<p class="success-sub">You will receive a confirmation email. A meeting link will be sent 5 minutes before the session starts.</p>
					{#if confirmedBookingResult?.meetingUrl}
						<a href={confirmedBookingResult.meetingUrl} target="_blank" rel="noopener noreferrer" class="join-btn">
							Join Meeting Link
						</a>
					{/if}
					<button class="btn-ghost" onclick={closeDrawer}>Close</button>
				</div>
			{/if}
		</div>
	</aside>
{/if}

<style>
	/* ── Layout ─────────────────────────────────────────────────────── */
	.profile-page {
		min-height: 100vh;
		background: #fafafa;
		font-family: 'Inter', 'Outfit', system-ui, sans-serif;
	}

	.container {
		max-width: 1180px;
		margin: 0 auto;
		padding: 0 2.5rem;
	}

	/* Back bar */
	.back-bar {
		border-bottom: 1px solid #e8e8e8;
		background: #fff;
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		padding: 0.75rem 0;
		font-size: 0.8rem;
		font-weight: 500;
		color: #555;
		text-decoration: none;
		letter-spacing: 0.02em;
		transition: color 0.15s;
	}

	.back-link:hover { color: #111; }

	/* ── Hero ────────────────────────────────────────────────────────── */
	.profile-hero {
		background: #fff;
		border-bottom: 1px solid #eaeaea;
		padding: 2.5rem 0 2rem;
	}

	.hero-inner {
		display: flex;
		gap: 2rem;
		align-items: flex-start;
	}

	.hero-avatar-col {
		flex-shrink: 0;
		position: relative;
	}

	.hero-avatar,
	.hero-avatar-placeholder {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		object-fit: cover;
	}

	.hero-avatar-placeholder {
		background: #111;
		color: #fff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 1.6rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.featured-badge {
		position: absolute;
		bottom: -6px;
		left: 50%;
		transform: translateX(-50%);
		background: #111;
		color: #fff;
		font-size: 0.6rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		padding: 0.15rem 0.5rem;
		border-radius: 2px;
		text-transform: uppercase;
	}

	.hero-meta {
		flex: 1;
		min-width: 0;
	}

	.hero-name-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		margin-bottom: 0.4rem;
	}

	.hero-name {
		font-size: 1.6rem;
		font-weight: 700;
		color: #111;
		letter-spacing: -0.03em;
		margin: 0;
	}

	:global(.verified-icon) { color: #1a73e8; }

	.hero-headline {
		font-size: 0.9rem;
		color: #444;
		margin: 0 0 0.75rem;
		line-height: 1.5;
	}

	.hero-stats {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		flex-wrap: wrap;
		margin-bottom: 0.75rem;
	}

	.stat-item { display: flex; align-items: center; gap: 0.3rem; }
	.stars-display { color: #f59e0b; font-size: 0.85rem; letter-spacing: -0.05em; }
	.stat-label { font-size: 0.8rem; color: #555; }
	.stat-sep { color: #ccc; font-size: 0.8rem; }

	.social-links {
		display: flex;
		gap: 0.5rem;
		margin-bottom: 1.25rem;
	}

	.social-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		border: 1px solid #ddd;
		border-radius: 6px;
		color: #555;
		background: #fff;
		text-decoration: none;
		transition: border-color 0.15s, color 0.15s;
	}

	.social-btn:hover { border-color: #111; color: #111; }

	.hero-actions {
		display: flex;
		align-items: center;
		gap: 1.25rem;
		flex-wrap: wrap;
	}

	.hero-price-tag { display: flex; align-items: baseline; gap: 0.3rem; }
	.from-price { font-size: 1.3rem; font-weight: 700; color: #111; }
	.from-label { font-size: 0.75rem; color: #888; }

	.book-cta {
		display: inline-flex;
		align-items: center;
		gap: 0.4rem;
		background: #111;
		color: #fff;
		border: none;
		border-radius: 8px;
		padding: 0.65rem 1.4rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
		transition: background 0.15s;
		letter-spacing: 0.01em;
	}

	.book-cta:hover { background: #333; }
	.book-cta.full-width { width: 100%; justify-content: center; }

	/* ── Profile body grid ───────────────────────────────────────────── */
	.profile-body { padding: 2.5rem 0 4rem; }

	.profile-grid {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 2rem;
		align-items: start;
	}

	/* ── Sections ─────────────────────────────────────────────────────── */
	.profile-section {
		background: #fff;
		border: 1px solid #eaeaea;
		border-radius: 10px;
		padding: 1.75rem 1.75rem 1.5rem;
		margin-bottom: 1.25rem;
	}

	.section-heading {
		font-size: 1rem;
		font-weight: 700;
		color: #111;
		letter-spacing: -0.02em;
		margin: 0 0 1.2rem;
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.section-count { font-size: 0.8rem; font-weight: 400; color: #888; }

	/* About */
	.about-body { margin-bottom: 1rem; }
	.about-para {
		font-size: 0.88rem;
		color: #444;
		line-height: 1.75;
		margin: 0 0 0.85rem;
	}

	.about-meta-row {
		display: flex;
		gap: 0.5rem;
		font-size: 0.8rem;
		margin-top: 0.5rem;
	}
	.about-meta-label { font-weight: 600; color: #111; }
	.about-meta-value { color: #555; }

	/* Video embed */
	.video-embed-wrap {
		position: relative;
		padding-bottom: 56.25%;
		height: 0;
		overflow: hidden;
		border-radius: 8px;
		background: #000;
	}
	.video-embed {
		position: absolute;
		top: 0; left: 0;
		width: 100%; height: 100%;
		border: 0;
	}

	/* Credentials */
	.credentials-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
		gap: 0.75rem;
	}

	.cred-card {
		display: flex;
		align-items: flex-start;
		gap: 0.75rem;
		border: 1px solid #eaeaea;
		border-radius: 8px;
		padding: 0.85rem 1rem;
	}

	:global(.cred-icon) { color: #111; margin-top: 2px; flex-shrink: 0; }

	.cred-title { font-size: 0.82rem; font-weight: 600; color: #111; margin: 0 0 0.15rem; }
	.cred-sub { font-size: 0.75rem; color: #888; margin: 0; }

	/* Testimonials */
	.testimonials-list { display: flex; flex-direction: column; gap: 1rem; }

	.testimonial-card {
		border-left: 3px solid #111;
		padding: 1rem 1.25rem;
		background: #f8f8f8;
		border-radius: 0 8px 8px 0;
		margin: 0;
	}

	.testimonial-body {
		font-size: 0.88rem;
		color: #333;
		line-height: 1.65;
		font-style: italic;
		margin: 0 0 0.75rem;
	}

	.testimonial-footer {
		display: flex;
		align-items: center;
		gap: 0.75rem;
		flex-wrap: wrap;
	}

	.testimonial-stars { color: #f59e0b; font-size: 0.8rem; letter-spacing: -0.05em; }

	.testimonial-author {
		font-size: 0.78rem;
		font-weight: 600;
		color: #111;
	}

	.testimonial-role { font-weight: 400; color: #777; }

	.show-more-btn {
		display: inline-flex;
		align-items: center;
		gap: 0.3rem;
		margin-top: 1rem;
		background: none;
		border: 1px solid #ddd;
		border-radius: 6px;
		padding: 0.45rem 0.9rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: #444;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.show-more-btn:hover { border-color: #111; color: #111; }

	/* ── Sidebar ─────────────────────────────────────────────────────── */
	.sidebar-col {
		position: sticky;
		top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.sidebar-card {
		background: #fff;
		border: 1px solid #eaeaea;
		border-radius: 10px;
		padding: 1.25rem 1.25rem 1rem;
	}

	.sidebar-heading {
		font-size: 0.85rem;
		font-weight: 700;
		color: #111;
		letter-spacing: -0.01em;
		margin: 0 0 1rem;
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.sidebar-empty { font-size: 0.8rem; color: #999; margin: 0; }

	.packages-list { display: flex; flex-direction: column; gap: 0.6rem; }

	.package-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 0.5rem 0;
		border-bottom: 1px solid #f0f0f0;
	}
	.package-row:last-child { border-bottom: none; }

	.pkg-duration {
		display: flex;
		align-items: center;
		gap: 0.35rem;
		font-size: 0.82rem;
		color: #444;
	}

	.pkg-price { font-size: 0.9rem; font-weight: 700; color: #111; }

	/* ── Enhanced Sidebar Calendar ──────────────────────────────────── */
	.sidebar-cal-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 0.75rem;
	}

	.sidebar-cal-nav {
		display: flex;
		align-items: center;
		gap: 0.4rem;
	}

	.sidebar-cal-month-label {
		font-size: 0.78rem;
		font-weight: 700;
		color: #111;
	}

	.cal-nav-btn {
		background: #f5f5f5;
		border: 1px solid #e0e0e0;
		border-radius: 4px;
		width: 22px;
		height: 22px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #555;
	}
	.cal-nav-btn:hover { border-color: #111; color: #111; }

	.mini-cal-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		gap: 4px;
		margin-bottom: 0.75rem;
	}

	.mini-cal-dname {
		font-size: 0.65rem;
		font-weight: 700;
		color: #999;
		text-align: center;
		padding: 2px 0;
	}

	.mini-cal-cell {
		aspect-ratio: 1;
		border-radius: 6px;
		border: 1px solid transparent;
		background: transparent;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: 0.75rem;
		font-weight: 500;
		color: #bbb;
		position: relative;
		cursor: default;
		padding: 0;
	}

	.mini-cal-cell.empty { visibility: hidden; }

	.mini-cal-cell.avail {
		color: #111;
		font-weight: 700;
		background: #f9f9f9;
		border-color: #e5e5e5;
		cursor: pointer;
		transition: all 0.12s;
	}
	.mini-cal-cell.avail:hover {
		background: #111;
		color: #fff;
		border-color: #111;
	}
	.mini-cal-cell.avail.selected {
		background: #111;
		color: #fff;
		border-color: #111;
	}

	.avail-dot {
		width: 4px;
		height: 4px;
		border-radius: 50%;
		background: #10b981;
		position: absolute;
		bottom: 3px;
	}
	.avail-dot.inline {
		display: inline-block;
		position: static;
		vertical-align: middle;
		margin-right: 4px;
	}

	.cal-active-hint {
		font-size: 0.72rem;
		color: #047857;
		margin: 0.4rem 0 0;
		display: flex;
		align-items: center;
	}

	/* ── Enhanced Booking Drawer Sections ──────────────────────────── */
	.drawer-section {
		display: flex;
		flex-direction: column;
		gap: 0.5rem;
	}

	.section-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.step-selected-tag {
		font-size: 0.72rem;
		font-weight: 600;
		color: #555;
	}
	.step-selected-tag.active-slot {
		color: #047857;
		font-weight: 700;
	}

	/* Date Scroll Strip */
	.date-scroll-strip {
		display: flex;
		gap: 0.45rem;
		overflow-x: auto;
		padding-bottom: 4px;
		scrollbar-width: thin;
	}

	.date-strip-card {
		flex-shrink: 0;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		background: #f8f8f8;
		border: 1.5px solid #e5e5e5;
		border-radius: 8px;
		padding: 0.5rem 0.65rem;
		cursor: pointer;
		min-width: 58px;
		transition: all 0.12s;
	}
	.date-strip-card:hover { border-color: #111; }
	.date-strip-card.selected {
		background: #111;
		border-color: #111;
		color: #fff;
	}
	.date-card-wday {
		font-size: 0.62rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		color: #888;
	}
	.date-strip-card.selected .date-card-wday { color: #aaa; }
	.date-card-day {
		font-size: 1rem;
		font-weight: 700;
		color: #111;
	}
	.date-strip-card.selected .date-card-day { color: #fff; }
	.date-card-month {
		font-size: 0.65rem;
		color: #777;
	}
	.date-strip-card.selected .date-card-month { color: #ccc; }

	/* Duration Pills */
	.duration-pills-row {
		display: flex;
		gap: 0.5rem;
	}

	.duration-pill-btn {
		flex: 1;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		background: #f8f8f8;
		border: 1.5px solid #e5e5e5;
		border-radius: 8px;
		padding: 0.6rem 0.5rem;
		cursor: pointer;
		transition: all 0.12s;
	}
	.duration-pill-btn:hover { border-color: #111; }
	.duration-pill-btn.selected {
		background: #111;
		border-color: #111;
		color: #fff;
	}
	.dur-pill-mins { font-size: 0.82rem; font-weight: 700; color: #111; }
	.dur-pill-price { font-size: 0.72rem; color: #666; }
	.duration-pill-btn.selected .dur-pill-mins,
	.duration-pill-btn.selected .dur-pill-price { color: #fff; }

	/* Slots Grid Enhanced */
	.slots-grid-enhanced {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(84px, 1fr));
		gap: 0.45rem;
		max-height: 180px;
		overflow-y: auto;
		padding: 2px;
	}

	.slot-btn-enhanced {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 0.3rem;
		background: #f8f8f8;
		border: 1.5px solid #e2e2e2;
		border-radius: 6px;
		padding: 0.5rem 0.4rem;
		font-size: 0.8rem;
		font-weight: 600;
		color: #222;
		cursor: pointer;
		transition: all 0.12s;
	}
	.slot-btn-enhanced:hover {
		border-color: #111;
		background: #fff;
	}
	.slot-btn-enhanced.selected {
		background: #111;
		color: #fff;
		border-color: #111;
	}

	.slot-chosen-summary {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #ecfdf5;
		border: 1px solid #a7f3d0;
		border-radius: 7px;
		padding: 0.65rem 0.85rem;
		font-size: 0.8rem;
		color: #065f46;
	}
	:global(.text-emerald) { color: #10b981; flex-shrink: 0; }
	.slot-chosen-summary .sub { color: #047857; margin-left: 4px; font-weight: 400; }

	.field-hint { font-size: 0.78rem; color: #888; margin: 0; }

	/* Summary */
	.summary-card {
		background: #f8f8f8;
		border: 1px solid #eaeaea;
		border-radius: 8px;
		padding: 1rem 1.1rem;
	}

	.sidebar-cta-card {
		background: #111;
		border-radius: 10px;
		padding: 1.25rem;
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.sidebar-cta-text {
		font-size: 0.85rem;
		font-weight: 600;
		color: #fff;
		margin: 0;
	}

	.sidebar-cta-card .book-cta {
		background: #fff;
		color: #111;
	}

	.sidebar-cta-card .book-cta:hover { background: #f0f0f0; }

	/* ── Booking Drawer ──────────────────────────────────────────────── */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.4);
		z-index: 900;
	}

	.booking-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 440px;
		background: #fff;
		z-index: 901;
		display: flex;
		flex-direction: column;
		box-shadow: -4px 0 32px rgba(0, 0, 0, 0.12);
		overflow: hidden;
	}

	.drawer-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 1.5rem 1.5rem 1rem;
		border-bottom: 1px solid #eee;
	}

	.drawer-tag {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: #888;
		margin: 0 0 0.2rem;
	}

	.drawer-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: #111;
		margin: 0;
	}

	.close-btn {
		background: none;
		border: 1px solid #e0e0e0;
		border-radius: 6px;
		width: 32px;
		height: 32px;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		color: #666;
	}

	.close-btn:hover { border-color: #111; color: #111; }

	.steps-progress {
		display: flex;
		align-items: center;
		padding: 0.85rem 1.5rem;
		border-bottom: 1px solid #eee;
		gap: 0.4rem;
	}

	.step-item { display: flex; align-items: center; gap: 0.4rem; }
	.step-num {
		width: 20px;
		height: 20px;
		border-radius: 50%;
		border: 1.5px solid #ccc;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.7rem;
		font-weight: 700;
		color: #999;
	}
	.step-item.active .step-num { border-color: #111; color: #111; }
	.step-item.current .step-num { background: #111; color: #fff; border-color: #111; }
	.step-label { font-size: 0.73rem; color: #888; }
	.step-item.active .step-label { color: #111; font-weight: 500; }
	.step-sep { flex: 1; height: 1px; background: #e0e0e0; }

	.drawer-body { flex: 1; overflow-y: auto; padding: 1.5rem; display: flex; flex-direction: column; gap: 1rem; }

	.error-banner {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		background: #fef2f2;
		border: 1px solid #fecaca;
		border-radius: 7px;
		padding: 0.75rem 1rem;
		font-size: 0.82rem;
		color: #b91c1c;
	}

	.step-label-h {
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: #888;
		margin: 0;
	}

	.loading-row {
		display: flex;
		align-items: center;
		gap: 0.5rem;
		font-size: 0.85rem;
		color: #888;
		padding: 1rem 0;
	}

	.empty-state-sm {
		font-size: 0.82rem;
		color: #999;
		padding: 0.75rem 0;
	}

	.date-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 0.5rem;
	}

	.date-chip {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.15rem;
		background: #f5f5f5;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.6rem 0.3rem;
		cursor: pointer;
		transition: all 0.12s;
	}
	.date-chip:hover { border-color: #111; }
	.date-chip.selected { background: #111; border-color: #111; }
	.day-abbr { font-size: 0.6rem; font-weight: 700; letter-spacing: 0.08em; color: #888; }
	.date-chip.selected .day-abbr { color: #aaa; }
	.date-num { font-size: 0.78rem; font-weight: 600; color: #111; }
	.date-chip.selected .date-num { color: #fff; }

	.window-chips, .duration-chips, .slot-grid {
		display: flex;
		flex-wrap: wrap;
		gap: 0.4rem;
	}

	.window-chip {
		background: #f5f5f5;
		border: 1.5px solid #e0e0e0;
		border-radius: 6px;
		padding: 0.35rem 0.75rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: #444;
		cursor: pointer;
		transition: all 0.12s;
	}
	.window-chip:hover, .window-chip.selected { background: #111; color: #fff; border-color: #111; }

	.duration-chip {
		background: #f5f5f5;
		border: 1.5px solid #e0e0e0;
		border-radius: 8px;
		padding: 0.5rem 1rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 0.1rem;
		cursor: pointer;
		transition: all 0.12s;
		min-width: 80px;
	}
	.duration-chip:hover, .duration-chip.selected { background: #111; border-color: #111; }
	.dur-mins { font-size: 0.78rem; font-weight: 700; color: #111; }
	.dur-price { font-size: 0.7rem; color: #777; }
	.duration-chip.selected .dur-mins, .duration-chip.selected .dur-price { color: #fff; }

	.slot-chip {
		background: #f5f5f5;
		border: 1.5px solid #e0e0e0;
		border-radius: 6px;
		padding: 0.35rem 0.7rem;
		font-size: 0.8rem;
		font-weight: 500;
		color: #333;
		cursor: pointer;
		transition: all 0.12s;
	}
	.slot-chip:hover, .slot-chip.selected { background: #111; color: #fff; border-color: #111; }

	/* Summary */
	.summary-card {
		background: #f8f8f8;
		border: 1px solid #eaeaea;
		border-radius: 8px;
		padding: 1rem 1.1rem;
	}
	.sum-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.82rem;
		color: #444;
		margin: 0 0 0.5rem;
	}
	.sum-row.total { font-size: 0.9rem; }
	.sum-label { color: #888; }
	.sum-val { font-weight: 600; color: #111; }
	.sum-divider { border: none; border-top: 1px solid #e0e0e0; margin: 0.5rem 0; }

	.field-group { display: flex; flex-direction: column; gap: 0.35rem; }
	.field-label { font-size: 0.75rem; font-weight: 600; color: #555; letter-spacing: 0.02em; }
	.field-textarea {
		border: 1px solid #ddd;
		border-radius: 7px;
		padding: 0.6rem 0.75rem;
		font-size: 0.83rem;
		color: #111;
		resize: vertical;
		font-family: inherit;
		outline: none;
		transition: border-color 0.15s;
	}
	.field-textarea:focus { border-color: #111; }

	.coupon-row { display: flex; gap: 0.4rem; }
	.coupon-input {
		flex: 1;
		border: 1px solid #ddd;
		border-radius: 7px;
		padding: 0.5rem 0.75rem;
		font-size: 0.82rem;
		outline: none;
		transition: border-color 0.15s;
	}
	.coupon-input:focus { border-color: #111; }
	.coupon-apply-btn {
		background: #111;
		color: #fff;
		border: none;
		border-radius: 7px;
		padding: 0 0.9rem;
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
	}
	.coupon-applied { font-size: 0.75rem; color: #16a34a; margin: 0; }
	.coupon-error { font-size: 0.75rem; color: #dc2626; margin: 0; }

	.drawer-nav {
		display: flex;
		justify-content: space-between;
		gap: 0.75rem;
		margin-top: auto;
		padding-top: 0.5rem;
	}

	.btn-ghost {
		background: none;
		border: 1px solid #ddd;
		border-radius: 7px;
		padding: 0.6rem 1rem;
		font-size: 0.82rem;
		font-weight: 500;
		color: #555;
		cursor: pointer;
		transition: border-color 0.15s, color 0.15s;
	}
	.btn-ghost:hover { border-color: #111; color: #111; }
	.btn-ghost:disabled { opacity: 0.4; cursor: not-allowed; }

	.btn-primary {
		flex: 1;
		background: #111;
		color: #fff;
		border: none;
		border-radius: 7px;
		padding: 0.65rem 1rem;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 0.4rem;
		transition: background 0.15s;
	}
	.btn-primary:hover { background: #333; }
	.btn-primary:disabled { background: #ccc; cursor: not-allowed; }

	/* Success */
	.success-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 0.75rem;
		padding: 2rem 0;
	}
	:global(.success-icon) { color: #16a34a; }
	.success-title { font-size: 1.1rem; font-weight: 700; color: #111; margin: 0; }
	.success-sub { font-size: 0.83rem; color: #666; line-height: 1.6; margin: 0; max-width: 280px; }
	.join-btn {
		background: #111;
		color: #fff;
		text-decoration: none;
		padding: 0.65rem 1.5rem;
		border-radius: 7px;
		font-size: 0.85rem;
		font-weight: 600;
	}

	:global(.spin) { animation: spin 1s linear infinite; }
	@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

	/* ── Responsive ──────────────────────────────────────────────────── */
	@media (max-width: 768px) {
		.container { padding: 0 1.25rem; }
		.hero-inner { flex-direction: column; }
		.hero-avatar, .hero-avatar-placeholder { width: 72px; height: 72px; }
		.profile-grid { grid-template-columns: 1fr; }
		.sidebar-col { position: static; }
		.booking-drawer { width: 100%; }
		.date-grid { grid-template-columns: repeat(3, 1fr); }
	}
</style>
