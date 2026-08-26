<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Calendar, Clock, Video, CheckCircle, ArrowRight, X, Sparkles, User, Tag, ShieldCheck, AlertCircle, Loader2 } from 'lucide-svelte';
	import type { PageData } from './$types';

	let { data } = $props<{ data: PageData }>();

	// Client search & filter state
	let searchQuery = $state('');
	let selectedSpecialty = $state('all');

	// Booking Drawer state
	let selectedMentor = $state<any | null>(null);
	let isDrawerOpen = $state(false);
	let bookingStep = $state<1 | 2 | 3 | 4>(1); // 1: Date, 2: Window/Duration/Slot, 3: Notes/Coupon/Pay, 4: Success

	// Step 1: Date selection
	let availableDates = $state<string[]>([]);
	let selectedDate = $state<string>('');
	let isLoadingDates = $state(false);

	// Step 2: Window, Duration, Slot
	let dayWindows = $state<any[]>([]);
	let durationPrices = $state<any[]>([]);
	let selectedWindowId = $state<string>('');
	let selectedDuration = $state<number>(30);
	let availableSlots = $state<{ timeStr: string; startsAtISO: string; endsAtISO: string }[]>([]);
	let selectedSlot = $state<{ timeStr: string; startsAtISO: string; endsAtISO: string } | null>(null);
	let isLoadingSlots = $state(false);

	// Step 3: Agenda, Coupon, Payment
	let sessionNotes = $state('');
	let couponCode = $state('');
	let appliedCoupon = $state<{ code: string; discountPaise: number } | null>(null);
	let couponError = $state('');
	let isSubmittingBooking = $state(false);
	let bookingErrorMessage = $state('');

	// Step 4: Success
	let confirmedBookingResult = $state<{ bookingId: string; meetingUrl?: string; isFree: boolean } | null>(null);

	// Computed mentors list with client filtering
	const filteredMentors = $derived(
		data.mentors.filter((m: any) => {
			const matchesSearch =
				searchQuery === '' ||
				m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.bio.toLowerCase().includes(searchQuery.toLowerCase()) ||
				m.specialties.some((s: string) => s.toLowerCase().includes(searchQuery.toLowerCase()));

			const matchesSpecialty =
				selectedSpecialty === 'all' ||
				m.specialties.some((s: string) => s.toLowerCase().includes(selectedSpecialty.toLowerCase()));

			return matchesSearch && matchesSpecialty;
		})
	);

	// Extract unique specialties across mentors
	const allSpecialties = $derived([
		'all',
		...Array.from(
			new Set(
				data.mentors.flatMap((m: any) => m.specialties).filter(Boolean)
			)
		)
	]);

	// Open booking drawer for a mentor
	async function openBooking(mentor: any) {
		selectedMentor = mentor;
		isDrawerOpen = true;
		bookingStep = 1;
		selectedDate = '';
		selectedWindowId = '';
		selectedSlot = null;
		sessionNotes = '';
		couponCode = '';
		appliedCoupon = null;
		couponError = '';
		bookingErrorMessage = '';
		confirmedBookingResult = null;

		// Fetch available dates for this mentor
		isLoadingDates = true;
		try {
			const res = await fetch(`/api/mentoring/instructors/${mentor.id}/calendar`);
			const json = await res.json();
			availableDates = json.availableDates || [];
			if (availableDates.length > 0) {
				selectDate(availableDates[0]);
			}
		} catch (err) {
			console.error('Failed to load mentor calendar:', err);
		} finally {
			isLoadingDates = false;
		}
	}

	function closeDrawer() {
		isDrawerOpen = false;
		selectedMentor = null;
	}

	// Step 1: Select date -> Fetch windows and duration pricing
	async function selectDate(dateStr: string) {
		selectedDate = dateStr;
		isLoadingSlots = true;
		bookingErrorMessage = '';
		selectedSlot = null;

		try {
			const res = await fetch(`/api/mentoring/instructors/${selectedMentor.id}/windows?date=${dateStr}`);
			const json = await res.json();
			dayWindows = json.windows || [];
			durationPrices = json.prices || [];

			if (dayWindows.length > 0) {
				selectedWindowId = dayWindows[0].id;
				// Default to first allowed duration in this window
				const allowed = dayWindows[0].allowedDurations || [30];
				selectedDuration = allowed.includes(selectedDuration) ? selectedDuration : allowed[0];
				await fetchFreeSlots(selectedWindowId, selectedDuration);
			} else {
				availableSlots = [];
			}
		} catch (err) {
			console.error('Failed to load day windows:', err);
		} finally {
			isLoadingSlots = false;
		}
	}

	// Fetch available start times
	async function fetchFreeSlots(windowId: string, duration: number) {
		if (!windowId) return;
		isLoadingSlots = true;
		bookingErrorMessage = '';
		try {
			const res = await fetch(`/api/mentoring/instructors/${selectedMentor.id}/free-slots?windowId=${windowId}&duration=${duration}`);
			const json = await res.json();
			if (res.ok) {
				availableSlots = json.availableSlots || [];
				selectedSlot = availableSlots.length > 0 ? availableSlots[0] : null;
			} else {
				availableSlots = [];
				bookingErrorMessage = json.error || 'No available slots for this duration.';
			}
		} catch (err) {
			console.error('Failed to fetch free slots:', err);
			availableSlots = [];
		} finally {
			isLoadingSlots = false;
		}
	}

	function onWindowChange(windowId: string) {
		selectedWindowId = windowId;
		const w = dayWindows.find(dw => dw.id === windowId);
		if (w && !w.allowedDurations.includes(selectedDuration)) {
			selectedDuration = w.allowedDurations[0];
		}
		fetchFreeSlots(windowId, selectedDuration);
	}

	function onDurationChange(duration: number) {
		selectedDuration = duration;
		fetchFreeSlots(selectedWindowId, duration);
	}

	// Get base price for current selected duration
	const currentBasePricePaise = $derived(() => {
		const found = durationPrices.find(p => p.durationMins === selectedDuration);
		return found ? found.pricePaise : 0;
	});

	// Get final price after coupon
	const currentFinalPricePaise = $derived(() => {
		const base = currentBasePricePaise();
		const discount = appliedCoupon ? appliedCoupon.discountPaise : 0;
		return Math.max(0, base - discount);
	});

	// Apply coupon
	function handleApplyCoupon() {
		couponError = '';
		if (!couponCode.trim()) return;
		const code = couponCode.trim().toUpperCase();

		// Local test or validation
		if (code === 'MENTOR50') {
			const discount = Math.round(currentBasePricePaise() * 0.5);
			appliedCoupon = { code, discountPaise: discount };
		} else if (code === 'FREEMENTOR') {
			appliedCoupon = { code, discountPaise: currentBasePricePaise() };
		} else {
			// Will be validated on the server at checkout
			appliedCoupon = { code, discountPaise: 0 };
		}
	}

	// Submit Booking
	async function handleBookSession() {
		if (!selectedSlot) {
			bookingErrorMessage = 'Please select an available time slot.';
			return;
		}

		if (!data.user) {
			window.location.href = `/sign-in?redirect=${encodeURIComponent(window.location.pathname)}`;
			return;
		}

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
				if (res.status === 409) {
					// Refresh slots
					fetchFreeSlots(selectedWindowId, selectedDuration);
				}
				return;
			}

			if (!json.isFree && json.checkoutUrl) {
				// Redirect to checkout
				window.location.href = json.checkoutUrl;
			} else {
				// Free session confirmed!
				confirmedBookingResult = {
					bookingId: json.bookingId,
					meetingUrl: dayWindows.find(w => w.id === selectedWindowId)?.meetingUrl,
					isFree: true
				};
				bookingStep = 4;
			}
		} catch (err: any) {
			bookingErrorMessage = err.message || 'An unexpected error occurred during booking.';
		} finally {
			isSubmittingBooking = false;
		}
	}

	function formatPaise(paise: number) {
		if (paise === 0) return 'Free';
		return `₹${(paise / 100).toLocaleString('en-IN')}`;
	}

	function formatDateLabel(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return new Intl.DateTimeFormat('en-IN', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		}).format(d);
	}
</script>

<svelte:head>
	<title>Mentoring & 1-on-1 Sessions — {APP_NAME}</title>
	<meta name="description" content="Book 1-on-1 mentoring sessions with vetted cybersecurity practitioners, architects, and instructors." />
</svelte:head>

<div class="mentoring-page">
	<!-- Page Header -->
	<header class="page-header">
		<div class="container">
			<div class="header-content">
				<p class="section-tag">Practitioner Mentorship</p>
				<h1 class="page-title">1-on-1 Expert Guidance</h1>
				<p class="page-subtitle">
					Book dedicated sessions with industry practitioners for architecture reviews, penetration testing guidance, and career roadmaps.
				</p>
			</div>

			<!-- Search & Filter Toolbar -->
			<div class="toolbar">
				<div class="search-box">
					<input
						type="text"
						placeholder="Search by mentor name, topic, or skills..."
						bind:value={searchQuery}
						class="search-input"
					/>
				</div>

				<div class="specialty-chips">
					{#each allSpecialties as spec}
						<button
							class="chip-btn"
							class:active={selectedSpecialty === spec}
							onclick={() => selectedSpecialty = spec}
						>
							{spec === 'all' ? 'All Specialties' : spec}
						</button>
					{/each}
				</div>
			</div>
		</div>
	</header>

	<!-- Mentors Marketplace Grid -->
	<main class="container main-content">
		{#if filteredMentors.length === 0}
			<div class="empty-state">
				<User size={32} class="empty-icon" />
				<h3>No Mentors Found</h3>
				<p>Try adjusting your search query or selecting a different specialty filter.</p>
			</div>
		{:else}
			<div class="mentors-grid">
					{#each filteredMentors as mentor}
					<article class="mentor-card">
						<div class="card-header">
							<div class="avatar-wrap">
								{#if mentor.avatarUrl}
									<img src={mentor.avatarUrl} alt={mentor.name} class="avatar-img" />
								{:else}
									<div class="avatar-placeholder">
										{mentor.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2)}
									</div>
								{/if}
								<span class="status-dot online" title="Verified Practitioner"></span>
							</div>

							<div class="mentor-info">
								<div class="name-row">
									<h3 class="mentor-name">{mentor.name}</h3>
									<span class="verified-badge" title="Verified Expert">
										<ShieldCheck size={14} />
									</span>
								</div>
								<p class="mentor-bio">{mentor.headline || mentor.bio}</p>
							</div>
						</div>

						<!-- Specialties -->
						<div class="specialties-row">
							{#each mentor.specialties as tag}
								<span class="tag-chip">{tag}</span>
							{/each}
						</div>

						<!-- Card Footer: Rate & Action -->
						<div class="card-footer">
							<div class="meta-col">
								<div class="rate-label">
									<span class="rate-value">{formatPaise(mentor.lowestPricePaise)}</span>
									<span class="rate-sub">/ 30 min</span>
								</div>
								{#if mentor.nextAvailableDate}
									<p class="avail-label">
										<Calendar size={12} /> Next: {formatDateLabel(mentor.nextAvailableDate)}
									</p>
								{:else}
									<p class="avail-label muted">Check schedule</p>
								{/if}
							</div>

							<a
								href={mentor.profileUrl || `/mentoring/${mentor.handle || mentor.id}`}
								class="book-btn"
							>
								<span>View Profile</span>
								<ArrowRight size={14} />
							</a>
						</div>
					</article>
				{/each}

			</div>
		{/if}
	</main>
</div>

<!-- Slide-in Interactive Booking Drawer -->
{#if isDrawerOpen && selectedMentor}
	<div class="drawer-backdrop" onclick={closeDrawer} role="presentation"></div>
	<aside class="booking-drawer" role="dialog" aria-labelledby="drawer-title">
		<header class="drawer-header">
			<div>
				<p class="drawer-tag">Book Session</p>
				<h2 id="drawer-title" class="drawer-title">{selectedMentor.name}</h2>
			</div>
			<button class="close-btn" onclick={closeDrawer} aria-label="Close booking modal">
				<X size={18} />
			</button>
		</header>

		<!-- Progress Indicator -->
		{#if bookingStep < 4}
			<div class="steps-progress">
				<div class="step-item" class:active={bookingStep >= 1} class:current={bookingStep === 1}>
					<span class="step-num">1</span>
					<span class="step-label">Select Date</span>
				</div>
				<div class="step-sep"></div>
				<div class="step-item" class:active={bookingStep >= 2} class:current={bookingStep === 2}>
					<span class="step-num">2</span>
					<span class="step-label">Pick Time</span>
				</div>
				<div class="step-sep"></div>
				<div class="step-item" class:active={bookingStep >= 3} class:current={bookingStep === 3}>
					<span class="step-num">3</span>
					<span class="step-label">Confirm</span>
				</div>
			</div>
		{/if}

		<div class="drawer-body">
			<!-- Error Banner -->
			{#if bookingErrorMessage}
				<div class="error-banner">
					<AlertCircle size={16} />
					<span>{bookingErrorMessage}</span>
				</div>
			{/if}

			<!-- STEP 1: SELECT DATE -->
			{#if bookingStep === 1}
				<section class="booking-section">
					<label class="section-label">Available Dates</label>
					{#if isLoadingDates}
						<div class="loading-state">
							<Loader2 size={24} class="spin" />
							<p>Checking mentor availability calendar...</p>
						</div>
					{:else if availableDates.length === 0}
						<div class="empty-state-mini">
							<Calendar size={24} />
							<p>No upcoming availability windows found for this mentor.</p>
						</div>
					{:else}
						<div class="dates-list">
							{#each availableDates as dateStr}
								<button
									class="date-card-btn"
									class:selected={selectedDate === dateStr}
									onclick={() => selectDate(dateStr)}
								>
									<span class="date-weekday">
										{new Intl.DateTimeFormat('en-IN', { weekday: 'short' }).format(new Date(dateStr + 'T00:00:00'))}
									</span>
									<span class="date-day">
										{new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(dateStr + 'T00:00:00'))}
									</span>
								</button>
							{/each}
						</div>
					{/if}

					<div class="step-actions">
						<button
							class="primary-btn"
							disabled={!selectedDate || dayWindows.length === 0}
							onclick={() => bookingStep = 2}
						>
							Continue to Time Slots <ArrowRight size={14} />
						</button>
					</div>
				</section>
			{/if}

			<!-- STEP 2: PICK WINDOW & DURATION & TIME SLOT -->
			{#if bookingStep === 2}
				<section class="booking-section">
					<!-- Time Window Selection if multiple -->
					{#if dayWindows.length > 1}
						<div class="form-group">
							<label class="field-label">Available Time Windows on {formatDateLabel(selectedDate)}</label>
							<div class="window-options">
								{#each dayWindows as w}
									<button
										class="window-btn"
										class:selected={selectedWindowId === w.id}
										onclick={() => onWindowChange(w.id)}
									>
										<Clock size={14} />
										<span>{w.windowStart} – {w.windowEnd}</span>
									</button>
								{/each}
							</div>
						</div>
					{/if}

					<!-- Duration Tier Selection -->
					<div class="form-group">
						<label class="field-label">Session Duration</label>
						<div class="duration-grid">
							{#each [30, 45, 60] as dur}
								{@const matchingPrice = durationPrices.find(p => p.durationMins === dur)}
								{@const currentWin = dayWindows.find(w => w.id === selectedWindowId)}
								{@const isAllowed = currentWin?.allowedDurations?.includes(dur)}
								{#if isAllowed}
									<button
										class="duration-btn"
										class:selected={selectedDuration === dur}
										onclick={() => onDurationChange(dur)}
									>
										<div class="dur-mins">{dur} mins</div>
										<div class="dur-price">
											{matchingPrice ? formatPaise(matchingPrice.pricePaise) : 'Free'}
										</div>
									</button>
								{/if}
							{/each}
						</div>
					</div>

					<!-- Available Slots Grid -->
					<div class="form-group">
						<label class="field-label">Select Start Time (IST)</label>
						{#if isLoadingSlots}
							<div class="loading-state">
								<Loader2 size={20} class="spin" />
								<p>Computing non-overlapping slots...</p>
							</div>
						{:else if availableSlots.length === 0}
							<div class="empty-state-mini">
								<Clock size={20} />
								<p>All slots for this duration are currently booked. Please try another window or duration.</p>
							</div>
						{:else}
							<div class="slots-grid">
								{#each availableSlots as slot}
									<button
										class="slot-chip"
										class:selected={selectedSlot?.timeStr === slot.timeStr}
										onclick={() => selectedSlot = slot}
									>
										{slot.timeStr}
									</button>
								{/each}
							</div>
						{/if}
					</div>

					<div class="step-actions dual">
						<button class="ghost-btn" onclick={() => bookingStep = 1}>Back</button>
						<button
							class="primary-btn"
							disabled={!selectedSlot}
							onclick={() => bookingStep = 3}
						>
							Proceed to Confirm <ArrowRight size={14} />
						</button>
					</div>
				</section>
			{/if}

			<!-- STEP 3: NOTES, COUPON & CONFIRM -->
			{#if bookingStep === 3}
				<section class="booking-section">
					<!-- Summary Card -->
					<div class="summary-card">
						<div class="summary-row">
							<span class="s-label">Mentor</span>
							<span class="s-val">{selectedMentor.name}</span>
						</div>
						<div class="summary-row">
							<span class="s-label">Date & Time</span>
							<span class="s-val">{formatDateLabel(selectedDate)} at {selectedSlot?.timeStr} IST</span>
						</div>
						<div class="summary-row">
							<span class="s-label">Duration</span>
							<span class="s-val">{selectedDuration} Minutes</span>
						</div>
						<div class="summary-row total">
							<span class="s-label">Total Fee</span>
							<div class="price-calc">
								{#if appliedCoupon && appliedCoupon.discountPaise > 0}
									<span class="strike">{formatPaise(currentBasePricePaise())}</span>
								{/if}
								<span class="s-val highlight">{formatPaise(currentFinalPricePaise())}</span>
							</div>
						</div>
					</div>

					<!-- Notes Input -->
					<div class="form-group">
						<label class="field-label" for="notes">Session Agenda & Questions</label>
						<textarea
							id="notes"
							rows="3"
							bind:value={sessionNotes}
							placeholder="What specific topics or problems would you like to cover in this session?"
							class="notes-input"
						></textarea>
					</div>

					<!-- Coupon Input -->
					<div class="form-group">
						<label class="field-label" for="coupon">Mentor Promo Code</label>
						<div class="coupon-box">
							<input
								id="coupon"
								type="text"
								placeholder="e.g. MENTOR50"
								bind:value={couponCode}
								class="coupon-input"
							/>
							<button class="coupon-btn" onclick={handleApplyCoupon}>Apply</button>
						</div>
						{#if appliedCoupon}
							<p class="coupon-success">
								<CheckCircle size={13} /> Code {appliedCoupon.code} applied!
							</p>
						{/if}
					</div>

					<div class="step-actions dual">
						<button class="ghost-btn" onclick={() => bookingStep = 2}>Back</button>
						<button
							class="primary-btn"
							disabled={isSubmittingBooking}
							onclick={handleBookSession}
						>
							{#if isSubmittingBooking}
								<Loader2 size={16} class="spin" /> Confirming...
							{:else if currentFinalPricePaise() === 0}
								Confirm Free Session
							{:else}
								Pay {formatPaise(currentFinalPricePaise())} & Book
							{/if}
						</button>
					</div>
				</section>
			{/if}

			<!-- STEP 4: SUCCESS CONFIRMATION -->
			{#if bookingStep === 4 && confirmedBookingResult}
				<section class="success-section">
					<div class="success-icon">
						<CheckCircle size={44} />
					</div>
					<h3 class="success-title">Session Confirmed!</h3>
					<p class="success-desc">
						Your 1-on-1 session with <strong>{selectedMentor.name}</strong> on <strong>{formatDateLabel(selectedDate)} at {selectedSlot?.timeStr}</strong> is locked in.
					</p>

					<div class="meeting-box">
						<p class="m-label">Video Call Link</p>
						<p class="m-sub">The "Join Session" button will activate on your dashboard 5 minutes prior to the scheduled time.</p>
						{#if confirmedBookingResult.meetingUrl}
							<div class="meeting-url-wrap">
								<Video size={16} />
								<span class="m-url">{confirmedBookingResult.meetingUrl}</span>
							</div>
						{/if}
					</div>

					<div class="success-actions">
						<a href="/dashboard" class="primary-btn full">Go to My Dashboard</a>
						<button class="ghost-btn full" onclick={closeDrawer}>Close</button>
					</div>
				</section>
			{/if}
		</div>
	</aside>
{/if}

<style>
	.container {
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
		padding: 0 2rem;
	}

	.mentoring-page {
		min-height: 80vh;
		background: var(--bg);
		color: var(--text-primary);
		padding-bottom: 80px;
	}

	.page-header {
		padding: 56px 0 36px;
		border-bottom: 1px solid var(--border);
		background: var(--bg);
	}

	.section-tag {
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin-bottom: 8px;
	}

	.page-title {
		font-size: clamp(1.75rem, 3.5vw, 2.5rem);
		font-weight: 700;
		letter-spacing: -0.03em;
		margin-bottom: 10px;
	}

	.page-subtitle {
		font-size: 0.9375rem;
		color: var(--text-secondary);
		max-width: 580px;
		line-height: 1.6;
		margin-bottom: 28px;
	}

	.toolbar {
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.search-input {
		width: 100%;
		max-width: 480px;
		padding: 10px 14px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.875rem;
		font-family: inherit;
		outline: none;
		transition: border-color var(--t-fast);
	}

	.search-input:focus {
		border-color: var(--border-focus);
	}

	.specialty-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
	}

	.chip-btn {
		padding: 6px 12px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 9999px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--t-fast);
	}

	.chip-btn:hover {
		border-color: var(--text-muted);
		color: var(--text-primary);
	}

	.chip-btn.active {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
	}

	.main-content {
		padding-top: 40px;
	}

	.mentors-grid {
		display: grid;
		grid-template-columns: repeat(auto-fill, minmax(340px, 1fr));
		gap: 20px;
	}

	.mentor-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 20px;
		transition: border-color var(--t-fast), transform var(--t-fast);
	}

	.mentor-card:hover {
		border-color: var(--border-focus);
	}

	.card-header {
		display: flex;
		gap: 16px;
		align-items: flex-start;
	}

	.avatar-wrap {
		position: relative;
		flex-shrink: 0;
	}

	.avatar-img,
	.avatar-placeholder {
		width: 48px;
		height: 48px;
		border-radius: 9999px;
		border: 1px solid var(--border);
		object-fit: cover;
	}

	.avatar-placeholder {
		background: var(--bg-elevated);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 0.875rem;
		color: var(--text-primary);
	}

	.status-dot {
		position: absolute;
		bottom: 0;
		right: 0;
		width: 10px;
		height: 10px;
		border-radius: 9999px;
		background: #16a34a;
		border: 2px solid var(--bg-surface);
	}

	.name-row {
		display: flex;
		align-items: center;
		gap: 6px;
		margin-bottom: 4px;
	}

	.mentor-name {
		font-size: 1rem;
		font-weight: 600;
		letter-spacing: -0.01em;
	}

	.verified-badge {
		color: #2563eb;
		display: flex;
		align-items: center;
	}

	.mentor-bio {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.specialties-row {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.tag-chip {
		font-size: 0.6875rem;
		padding: 4px 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 4px;
		color: var(--text-secondary);
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 16px;
		border-top: 1px solid var(--border);
	}

	.rate-label {
		display: flex;
		align-items: baseline;
		gap: 4px;
	}

	.rate-value {
		font-size: 1rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.rate-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.avail-label {
		font-size: 0.75rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 2px;
	}

	.avail-label.muted {
		color: var(--text-muted);
	}

	.book-btn {
		padding: 8px 16px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		font-family: inherit;
		cursor: pointer;
		display: flex;
		align-items: center;
		gap: 6px;
		transition: opacity var(--t-fast);
	}

	.book-btn:hover {
		opacity: 0.88;
	}

	/* Drawer Styles */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 900;
		backdrop-filter: blur(2px);
	}

	.booking-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		max-width: 460px;
		background: var(--bg-surface);
		border-left: 1px solid var(--border);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
		animation: slideIn 0.2s ease-out;
	}

	@keyframes slideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}

	.drawer-header {
		padding: 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.drawer-tag {
		font-size: 0.6875rem;
		text-transform: uppercase;
		letter-spacing: 0.1em;
		color: var(--text-muted);
		font-weight: 600;
		margin-bottom: 4px;
	}

	.drawer-title {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
	}

	.close-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}

	.close-btn:hover {
		color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.steps-progress {
		padding: 12px 24px;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.step-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.step-item.active {
		color: var(--text-secondary);
	}

	.step-item.current {
		color: var(--text-primary);
		font-weight: 600;
	}

	.step-num {
		width: 18px;
		height: 18px;
		border-radius: 9999px;
		background: var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
	}

	.step-item.current .step-num {
		background: var(--text-primary);
		color: var(--bg);
	}

	.step-sep {
		flex: 1;
		height: 1px;
		background: var(--border);
		margin: 0 8px;
	}

	.drawer-body {
		padding: 24px;
		overflow-y: auto;
		flex: 1;
	}

	.error-banner {
		padding: 10px 14px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 6px;
		color: #ef4444;
		font-size: 0.8125rem;
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 20px;
	}

	.booking-section {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.section-label,
	.field-label {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		display: block;
		margin-bottom: 8px;
	}

	.dates-list {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.date-card-btn {
		padding: 12px 8px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		display: flex;
		flex-direction: column;
		align-items: center;
		cursor: pointer;
		transition: all var(--t-fast);
	}

	.date-card-btn:hover {
		border-color: var(--text-muted);
	}

	.date-card-btn.selected {
		border-color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.date-weekday {
		font-size: 0.6875rem;
		text-transform: uppercase;
		color: var(--text-muted);
		font-weight: 600;
	}

	.date-day {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-top: 2px;
	}

	.window-options {
		display: flex;
		gap: 8px;
	}

	.window-btn {
		flex: 1;
		padding: 8px 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		cursor: pointer;
	}

	.window-btn.selected {
		border-color: var(--text-primary);
		background: var(--bg-elevated);
		color: var(--text-primary);
		font-weight: 600;
	}

	.duration-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
	}

	.duration-btn {
		padding: 10px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		text-align: center;
		cursor: pointer;
	}

	.duration-btn.selected {
		border-color: var(--text-primary);
		background: var(--bg-elevated);
	}

	.dur-mins {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.dur-price {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.slots-grid {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 8px;
		max-height: 200px;
		overflow-y: auto;
	}

	.slot-chip {
		padding: 8px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.8125rem;
		color: var(--text-secondary);
		cursor: pointer;
		font-family: inherit;
	}

	.slot-chip:hover {
		border-color: var(--text-muted);
	}

	.slot-chip.selected {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
		font-weight: 600;
	}

	.summary-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 16px;
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.summary-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		font-size: 0.8125rem;
	}

	.summary-row.total {
		padding-top: 10px;
		border-top: 1px solid var(--border);
		margin-top: 4px;
	}

	.s-label {
		color: var(--text-muted);
	}

	.s-val {
		font-weight: 600;
		color: var(--text-primary);
	}

	.s-val.highlight {
		font-size: 1rem;
		color: var(--text-primary);
	}

	.strike {
		text-decoration: line-through;
		color: var(--text-muted);
		margin-right: 6px;
		font-size: 0.8125rem;
	}

	.notes-input {
		width: 100%;
		padding: 10px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-family: inherit;
		resize: vertical;
		outline: none;
	}

	.notes-input:focus {
		border-color: var(--border-focus);
	}

	.coupon-box {
		display: flex;
		gap: 8px;
	}

	.coupon-input {
		flex: 1;
		padding: 8px 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.8125rem;
		text-transform: uppercase;
		outline: none;
	}

	.coupon-btn {
		padding: 8px 14px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
	}

	.coupon-success {
		font-size: 0.75rem;
		color: #16a34a;
		display: flex;
		align-items: center;
		gap: 4px;
		margin-top: 6px;
	}

	.step-actions {
		margin-top: 12px;
	}

	.step-actions.dual {
		display: flex;
		gap: 10px;
	}

	.primary-btn {
		flex: 1;
		padding: 12px 18px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: 6px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		text-decoration: none;
	}

	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.primary-btn.full {
		width: 100%;
	}

	.ghost-btn {
		padding: 12px 18px;
		background: transparent;
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.875rem;
		color: var(--text-secondary);
		cursor: pointer;
	}

	.ghost-btn.full {
		width: 100%;
		margin-top: 8px;
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: 32px 0;
		gap: 10px;
		color: var(--text-muted);
		font-size: 0.8125rem;
	}

	.spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		100% { transform: rotate(360deg); }
	}

	.empty-state-mini {
		padding: 24px;
		background: var(--bg);
		border: 1px dashed var(--border);
		border-radius: 6px;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.8125rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	/* Success Section */
	.success-section {
		text-align: center;
		padding: 20px 0;
	}

	.success-icon {
		color: #16a34a;
		margin-bottom: 12px;
	}

	.success-title {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 8px;
	}

	.success-desc {
		font-size: 0.875rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 24px;
	}

	.meeting-box {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 16px;
		text-align: left;
		margin-bottom: 24px;
	}

	.m-label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 4px;
	}

	.m-sub {
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-bottom: 12px;
	}

	.meeting-url-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.8125rem;
		color: #2563eb;
		word-break: break-all;
	}

	@media (max-width: 768px) {
		.container {
			padding: 0 1.25rem;
		}
		.mentors-grid {
			grid-template-columns: 1fr;
		}
		.page-header {
			padding: 36px 0 24px;
		}
	}
</style>
