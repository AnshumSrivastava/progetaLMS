<script lang="ts">
	import { onMount } from 'svelte';
	import { 
		BookOpen, 
		FileBadge2, 
		Calendar, 
		Download, 
		Users2, 
		Settings, 
		ArrowRight, 
		ExternalLink,
		LayoutDashboard,
		BookOpenCheck,
		SlidersHorizontal,
		Users,
		ShieldAlert,
		Lock,
		CheckCircle2,
		AlertTriangle,
		KeyRound,
		Mail,
		Plus,
		UserCircle,
		Shield,
		Search,
		TrendingUp,
		GraduationCap,
		Video,
		Clock,
		Tag,
		CalendarDays,
		Check,
		RotateCcw,
		DollarSign,
		X,
		ChevronLeft,
		ChevronRight,
		AlertCircle,
		Loader2,
		Award,
		Power,
		Trash2
	} from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// Default tab selection based on primary role
	let activeTab = $state(
		data.isOwner ? 'admin_cockpit' :
		data.isAdmin ? 'admin_cockpit' :
		data.isTeacher ? 'teacher_overview' :
		data.learner.ownedCourses.length > 0 ? 'my_courses' :
		data.learner.ownedCerts.length > 0 ? 'my_certs' :
		'my_courses'
	);

	// User search in admin tab
	let userSearch = $state('');
	let filteredUsers = $derived(
		(data.admin.allUsers || []).filter(u => 
			!userSearch.trim() || 
			u.name?.toLowerCase().includes(userSearch.toLowerCase()) || 
			u.email.toLowerCase().includes(userSearch.toLowerCase()) || 
			u.role.toLowerCase().includes(userSearch.toLowerCase())
		)
	);

	// Template editor state
	let selectedTemplate = $state(data.admin.templates[0] || { id: 'welcome', subject: '', body: '' });

	// Owner vault state
	let selectedAdminId = $state(data.admin.eligibleAdmins[0]?.id || '');
	let confirmOwnerEmail = $state('');
	let selectedAdmin = $derived(data.admin.eligibleAdmins.find(a => a.id === selectedAdminId));

	// ── MENTORING CLIENT STATE & DYNAMIC 5-MIN TIMER ───────────
	let currentTime = $state(Date.now());
	onMount(() => {
		const timer = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
		return () => clearInterval(timer);
	});

	// Join status calculation for 1-on-1 sessions
	function getJoinStatus(startsAtISO: string, endsAtISO: string) {
		const startsAt = new Date(startsAtISO).getTime();
		const endsAt = new Date(endsAtISO).getTime();
		const joinWindowOpen = startsAt - 5 * 60 * 1000;

		if (currentTime >= endsAt) {
			return { status: 'completed', label: 'Session Completed', canJoin: false };
		}
		if (currentTime >= joinWindowOpen && currentTime < endsAt) {
			return { status: 'live', label: 'Join Video Meeting', canJoin: true };
		}
		const diffMs = startsAt - currentTime;
		const diffMins = Math.floor(diffMs / 60000);
		const hours = Math.floor(diffMins / 60);
		const mins = diffMins % 60;
		const timeLabel = hours > 0 ? `${hours}h ${mins}m` : `${Math.max(1, mins)} mins`;
		return {
			status: 'upcoming',
			label: `Join opens 5m prior (in ${timeLabel})`,
			canJoin: false
		};
	}

	// ── TEACHER CERTIFICATIONS STATE ───────────────────────────
	let teacherCerts = $derived(data.teacher.certifications || []);
	let showCreateCertModal = $state(false);
	let showEditCertPriceModal = $state(false);
	let selectedCertForEdit = $state<any>(null);
	let editCertPriceInput = $state('0');

	// ── TEACHER MENTORING STUDIO STATE ─────────────────────────
	let teacherMentoringSubTab = $state<'calendar' | 'pricing' | 'coupons' | 'bookings'>('calendar');
	let teacherWindows = $state(data.teacher.mentoringWindows || []);
	let teacherBookings = $state(data.teacher.mentoringBookings || []);
	let teacherCoupons = $state<any[]>([]);

	// Mentoring Opt-In Toggle State
	let isMentoringEnabled = $state(data.profile?.mentoringEnabled ?? false);
	let isTogglingMentoring = $state(false);
	let mentoringToggleMsg = $state('');

	async function handleToggleMentoring(enabled: boolean) {
		isTogglingMentoring = true;
		mentoringToggleMsg = '';
		try {
			const res = await fetch('/api/mentoring/my/status', {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ enabled })
			});
			const json = await res.json();
			if (res.ok) {
				isMentoringEnabled = json.mentoringEnabled;
				mentoringToggleMsg = isMentoringEnabled
					? 'Mentoring is now LIVE on the marketplace!'
					: 'Mentoring paused. Your profile is now unlisted.';
				setTimeout(() => { mentoringToggleMsg = ''; }, 4000);
			} else {
				mentoringToggleMsg = json.error || 'Failed to update status';
			}
		} catch (err) {
			mentoringToggleMsg = 'Error updating mentoring status';
		} finally {
			isTogglingMentoring = false;
		}
	}

	// Calendar View State
	let currentCalMonth = $state(new Date().getMonth());
	let currentCalYear = $state(new Date().getFullYear());
	let daysInMonth = $derived(new Date(currentCalYear, currentCalMonth + 1, 0).getDate());
	let firstDayOffset = $derived(new Date(currentCalYear, currentCalMonth, 1).getDay());
	let isDayDrawerOpen = $state(false);
	let selectedDayDateStr = $state('');
	let selectedDayWindows = $derived(teacherWindows.filter((w: any) => w.date === selectedDayDateStr && w.status === 'active'));

	// Add Window Form State
	let newWinStart = $state('10:00');
	let newWinEnd = $state('14:00');
	let newWinDurations = $state<number[]>([30, 45, 60]);
	let newWinMeetingUrl = $state('https://meet.google.com/pro-session');
	let isSavingWindow = $state(false);
	let windowError = $state('');

	// Pricing State
	let price30 = $state(
		data.teacher.mentoringPrices?.find((p: any) => p.durationMins === 30)
			? (data.teacher.mentoringPrices.find((p: any) => p.durationMins === 30).pricePaise / 100).toString()
			: '800'
	);
	let price45 = $state(
		data.teacher.mentoringPrices?.find((p: any) => p.durationMins === 45)
			? (data.teacher.mentoringPrices.find((p: any) => p.durationMins === 45).pricePaise / 100).toString()
			: '1200'
	);
	let price60 = $state(
		data.teacher.mentoringPrices?.find((p: any) => p.durationMins === 60)
			? (data.teacher.mentoringPrices.find((p: any) => p.durationMins === 60).pricePaise / 100).toString()
			: '1500'
	);
	let isSavingPricing = $state(false);
	let pricingSavedMsg = $state('');

	// Coupon Creation State
	let newCouponCode = $state('');
	let newCouponType = $state<'percent' | 'flat'>('percent');
	let newCouponValue = $state('50');
	let newCouponMaxUses = $state('20');
	let isSavingCoupon = $state(false);
	let couponCreatedMsg = $state('');

	// Fetch coupons on tab switch
	async function loadTeacherCoupons() {
		try {
			const res = await fetch('/api/mentoring/my/coupons');
			const json = await res.json();
			teacherCoupons = json.coupons || [];
		} catch (err) {
			console.error('Failed to load coupons:', err);
		}
	}

	function openDayDrawer(dateStr: string) {
		selectedDayDateStr = dateStr;
		isDayDrawerOpen = true;
		windowError = '';
	}

	async function handleAddAvailabilityWindow() {
		if (!selectedDayDateStr) return;
		isSavingWindow = true;
		windowError = '';

		try {
			const res = await fetch('/api/mentoring/my/availability', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					date: selectedDayDateStr,
					windowStart: newWinStart,
					windowEnd: newWinEnd,
					allowedDurations: newWinDurations,
					meetingUrl: newWinMeetingUrl
				})
			});

			const json = await res.json();
			if (!res.ok) {
				windowError = json.error || 'Failed to save window';
				return;
			}

			// Refresh windows
			const calRes = await fetch('/api/mentoring/my/calendar');
			const calJson = await calRes.json();
			teacherWindows = calJson.windows || [];
			isDayDrawerOpen = false;
		} catch (err: any) {
			windowError = err.message || 'Error saving availability window';
		} finally {
			isSavingWindow = false;
		}
	}

	async function handleCancelWindow(windowId: string) {
		if (!confirm('Are you sure you want to cancel this availability window? Booked students will be notified.')) return;
		try {
			const res = await fetch(`/api/mentoring/my/availability/${windowId}`, { method: 'DELETE' });
			if (res.ok) {
				const calRes = await fetch('/api/mentoring/my/calendar');
				const calJson = await calRes.json();
				teacherWindows = calJson.windows || [];
			}
		} catch (err) {
			console.error('Error cancelling window:', err);
		}
	}

	async function handleSavePricing() {
		isSavingPricing = true;
		pricingSavedMsg = '';
		try {
			const prices = [
				{ durationMins: 30, pricePaise: Math.round(parseFloat(price30 || '0') * 100) },
				{ durationMins: 45, pricePaise: Math.round(parseFloat(price45 || '0') * 100) },
				{ durationMins: 60, pricePaise: Math.round(parseFloat(price60 || '0') * 100) }
			];

			const res = await fetch('/api/mentoring/my/prices', {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ prices })
			});

			const json = await res.json();
			if (res.ok) {
				pricingSavedMsg = 'Duration pricing updated successfully!';
				setTimeout(() => pricingSavedMsg = '', 4000);
			} else {
				alert(json.error || 'Failed to save pricing');
			}
		} catch (err) {
			console.error('Error saving pricing:', err);
		} finally {
			isSavingPricing = false;
		}
	}

	async function handleCreateCoupon() {
		if (!newCouponCode.trim()) return;
		isSavingCoupon = true;
		couponCreatedMsg = '';
		try {
			const res = await fetch('/api/mentoring/my/coupons', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					code: newCouponCode.trim().toUpperCase(),
					type: newCouponType,
					value: Number(newCouponValue),
					maxUses: newCouponMaxUses ? Number(newCouponMaxUses) : null
				})
			});

			const json = await res.json();
			if (res.ok) {
				newCouponCode = '';
				couponCreatedMsg = 'Coupon created successfully!';
				loadTeacherCoupons();
				setTimeout(() => couponCreatedMsg = '', 4000);
			} else {
				alert(json.error || 'Failed to create coupon');
			}
		} catch (err) {
			console.error('Error creating coupon:', err);
		} finally {
			isSavingCoupon = false;
		}
	}

	async function handleMarkBookingCompleted(bookingId: string) {
		try {
			const res = await fetch(`/api/mentoring/my/bookings/${bookingId}/complete`, { method: 'POST' });
			if (res.ok) {
				const bRes = await fetch('/api/mentoring/my/bookings');
				const bJson = await bRes.json();
				teacherBookings = bJson.bookings || [];
			}
		} catch (err) {
			console.error('Error completing booking:', err);
		}
	}

	// ── ADMIN MENTORING OVERSIGHT STATE ─────────────────────────
	let adminInstructorsList = $state(data.admin.mentoringInstructors || []);
	let adminMentoringStats = $state(data.admin.mentoringStats || {
		totalSessionsBooked: 0,
		totalSessionsCompleted: 0,
		totalRevenuePaise: 0,
		activeInstructors: 0,
		suspendedInstructors: 0
	});

	let selectedInstructorDetail = $state<any | null>(null);
	let isInstructorDetailDrawerOpen = $state(false);
	let isPriceBoundsModalOpen = $state(false);
	let boundsInstructorId = $state('');
	let bound30Min = $state('500');
	let bound30Max = $state('2000');
	let bound60Min = $state('1000');
	let bound60Max = $state('4000');

	async function openInstructorDetail(instId: string) {
		try {
			const res = await fetch(`/api/admin/mentoring/instructors/${instId}`);
			const json = await res.json();
			selectedInstructorDetail = json;
			isInstructorDetailDrawerOpen = true;
		} catch (err) {
			console.error('Failed to load instructor details:', err);
		}
	}

	async function handleAdminToggleSuspend(instructorId: string, currentSuspended: boolean) {
		const reason = prompt(
			currentSuspended
				? 'Reason for lifting suspension:'
				: 'Mandatory reason for suspending this instructor from mentoring:'
		);
		if (reason === null) return;

		try {
			const res = await fetch(`/api/admin/mentoring/instructors/${instructorId}/suspend`, {
				method: 'PATCH',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ suspended: !currentSuspended, reason })
			});

			if (res.ok) {
				const instRes = await fetch('/api/admin/mentoring/instructors');
				const instJson = await instRes.json();
				adminInstructorsList = instJson.instructors || [];
			}
		} catch (err) {
			console.error('Error toggling suspension:', err);
		}
	}

	async function handleAdminCancelWindow(windowId: string) {
		const reason = prompt('Mandatory reason for cancelling this window (will be sent to students):');
		if (!reason) return;

		try {
			const res = await fetch(`/api/admin/mentoring/availability/${windowId}`, {
				method: 'DELETE',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ reason })
			});

			if (res.ok && selectedInstructorDetail) {
				openInstructorDetail(selectedInstructorDetail.instructor.id);
			}
		} catch (err) {
			console.error('Error cancelling window:', err);
		}
	}

	function openPriceBoundsModal(inst: any) {
		boundsInstructorId = inst.id;
		const b = inst.priceBounds || {};
		bound30Min = b[30]?.minPaise ? (b[30].minPaise / 100).toString() : '500';
		bound30Max = b[30]?.maxPaise ? (b[30].maxPaise / 100).toString() : '2500';
		bound60Min = b[60]?.minPaise ? (b[60].minPaise / 100).toString() : '1000';
		bound60Max = b[60]?.maxPaise ? (b[60].maxPaise / 100).toString() : '5000';
		isPriceBoundsModalOpen = true;
	}

	async function handleSavePriceBounds() {
		try {
			const bounds = {
				30: { minPaise: Number(bound30Min) * 100, maxPaise: Number(bound30Max) * 100 },
				60: { minPaise: Number(bound60Min) * 100, maxPaise: Number(bound60Max) * 100 }
			};

			const res = await fetch(`/api/admin/mentoring/instructors/${boundsInstructorId}/price-bounds`, {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ bounds })
			});

			if (res.ok) {
				isPriceBoundsModalOpen = false;
				const instRes = await fetch('/api/admin/mentoring/instructors');
				const instJson = await instRes.json();
				adminInstructorsList = instJson.instructors || [];
			}
		} catch (err) {
			console.error('Error saving price bounds:', err);
		}
	}
</script>

<svelte:head>
	<title>Dashboard — {APP_NAME}</title>
</svelte:head>

<div class="dash-shell">
	<!-- ── UNIFIED SIDEBAR (220px) ────────────────────────── -->
	<aside class="dash-sidebar">
		<div class="user-badge-header">
			<div class="user-avatar-sm">
				{data.user.name ? data.user.name.slice(0, 2).toUpperCase() : 'U'}
			</div>
			<div class="user-header-meta">
				<span class="user-header-name">{data.user.name || 'User'}</span>
				<span class="user-header-role" class:owner={data.isOwner} class:admin={data.isAdmin && !data.isOwner} class:teacher={data.isTeacher && !data.isAdmin}>
					{data.user.role || 'student'}
				</span>
			</div>
		</div>

		<nav class="sidebar-nav-scroll">
			<!-- ── Learning Section ────────────────────────────── -->
			<div class="nav-group">
				<span class="group-title">My Learning</span>
				<button class="nav-btn" class:active={activeTab === 'my_courses'} onclick={() => activeTab = 'my_courses'}>
					<BookOpen size={14} /> <span>Courses</span>
					{#if data.learner.ownedCourses.length > 0}
						<span class="count-pill">{data.learner.ownedCourses.length}</span>
					{/if}
				</button>
				<button class="nav-btn" class:active={activeTab === 'my_resources'} onclick={() => activeTab = 'my_resources'}>
					<Download size={14} /> <span>Resources</span>
					{#if data.learner.ownedResources.length > 0}
						<span class="count-pill">{data.learner.ownedResources.length}</span>
					{/if}
				</button>
				<button class="nav-btn" class:active={activeTab === 'my_events'} onclick={() => activeTab = 'my_events'}>
					<Calendar size={14} /> <span>Live Events</span>
				</button>
				<button class="nav-btn" class:active={activeTab === 'my_classes'} onclick={() => activeTab = 'my_classes'}>
					<Users2 size={14} /> <span>Cohort Classes</span>
				</button>
				<button class="nav-btn" class:active={activeTab === 'my_certs'} onclick={() => activeTab = 'my_certs'}>
					<FileBadge2 size={14} /> <span>Certifications</span>
				</button>
				<button class="nav-btn" class:active={activeTab === 'my_mentoring'} onclick={() => activeTab = 'my_mentoring'}>
					<Video size={14} /> <span>1-on-1 Sessions</span>
					{#if (data.learner.mentoringBookings || []).length > 0}
						<span class="count-pill">{data.learner.mentoringBookings.length}</span>
					{/if}
				</button>
			</div>

			<!-- ── Teaching Section (If Teacher, Admin, Owner) ──── -->
			{#if data.isTeacher}
				<div class="nav-group">
					<span class="group-title">Instructor</span>
					<button class="nav-btn" class:active={activeTab === 'teacher_overview'} onclick={() => activeTab = 'teacher_overview'}>
						<LayoutDashboard size={14} /> <span>Overview</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_courses'} onclick={() => activeTab = 'teacher_courses'}>
						<BookOpenCheck size={14} /> <span>Manage Courses</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_certifications'} onclick={() => activeTab = 'teacher_certifications'}>
						<Award size={14} /> <span>Certifications & Exams</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_mentoring'} onclick={() => { activeTab = 'teacher_mentoring'; loadTeacherCoupons(); }}>
						<CalendarDays size={14} /> <span>Mentoring Studio</span>
					</button>
				</div>
			{/if}

			<!-- ── Administration Section (If Admin or Owner) ───── -->
			{#if data.isAdmin}
				<div class="nav-group">
					<span class="group-title">Administration</span>
					<button class="nav-btn" class:active={activeTab === 'admin_cockpit'} onclick={() => activeTab = 'admin_cockpit'}>
						<SlidersHorizontal size={14} /> <span>Platform Cockpit</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_mentoring'} onclick={() => activeTab = 'admin_mentoring'}>
						<GraduationCap size={14} /> <span>Mentoring Oversight</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_users'} onclick={() => activeTab = 'admin_users'}>
						<Users size={14} /> <span>User Management</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_audit'} onclick={() => activeTab = 'admin_audit'}>
						<ShieldAlert size={14} /> <span>Security Logs</span>
					</button>
				</div>
			{/if}

			<!-- ── Owner Vault Section (Strictly Owner) ────────── -->
			{#if data.isOwner}
				<div class="nav-group">
					<span class="group-title">Root Authority</span>
					<button class="nav-btn vault-btn" class:active={activeTab === 'owner_vault'} onclick={() => activeTab = 'owner_vault'}>
						<Lock size={14} /> <span>Owner Vault</span>
						<span class="vault-tag">Root</span>
					</button>
				</div>
			{/if}

			<!-- ── User Settings ───────────────────────────────── -->
			<div class="nav-group" style="margin-top: auto; padding-top: 12px; border-top: 1px solid var(--border-subtle);">
				<button class="nav-btn" class:active={activeTab === 'settings'} onclick={() => activeTab = 'settings'}>
					<Settings size={14} /> <span>Account Settings</span>
				</button>
			</div>
		</nav>
	</aside>

	<!-- ── MAIN CONTENT AREA ──────────────────────────────── -->
	<main class="dash-canvas">
		{#if form?.success}
			<div class="alert-banner success">
				<CheckCircle2 size={15} />
				<span>{form.message || 'Action executed successfully.'}</span>
			</div>
		{/if}
		{#if form?.error}
			<div class="alert-banner error">
				<AlertTriangle size={15} />
				<span>{form.error}</span>
			</div>
		{/if}

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 1: MY COURSES                                    -->
		<!-- ════════════════════════════════════════════════════ -->
		{#if activeTab === 'my_courses'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>My Enrolled Courses</h1>
						<p class="pane-sub">Active courses and self-paced curricula.</p>
					</div>
					<a href="/catalog" class="btn-subtle">Browse Catalog</a>
				</header>

				<div class="row-list">
					{#each data.learner.ownedCourses as course}
						<div class="list-row">
							<div class="row-icon"><BookOpen size={16} /></div>
							<div class="row-main">
								<h3>{course.title}</h3>
								<div class="progress-wrap">
									<div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
									<span class="progress-text">In Progress</span>
								</div>
							</div>
							<button class="btn-action" onclick={() => goto(`/learn/${course.id}`)}>
								<span>Resume</span>
								<ArrowRight size={13} />
							</button>
						</div>
					{:else}
						<div class="empty-state">
							<BookOpen size={28} />
							<p>You have not enrolled in any courses yet.</p>
							<a href="/catalog" class="btn-primary">Explore Courses</a>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 2: MY RESOURCES                                  -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_resources'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>My Downloadable Assets</h1>
						<p class="pane-sub">PDF guides, cheatsheets, and digital tools.</p>
					</div>
					<a href="/catalog" class="btn-subtle">Browse Catalog</a>
				</header>

				<div class="row-list">
					{#each data.learner.ownedResources as item}
						<div class="list-row">
							<div class="row-icon"><Download size={16} /></div>
							<div class="row-main">
								<h3>{item.title}</h3>
								<span class="row-sub-text">{item.type === 'pdf' ? 'PDF Document' : 'Resource Asset'}</span>
							</div>
							<a href={`/learn/${item.id}`} class="btn-action secondary">View Asset</a>
						</div>
					{:else}
						<div class="empty-state">
							<Download size={28} />
							<p>No digital resources owned.</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 3: LIVE EVENTS                                   -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_events'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Live Events & Workshops</h1>
						<p class="pane-sub">Scheduled interactive sessions and workshops.</p>
					</div>
				</header>

				<div class="row-list">
					{#each data.learner.upcomingEvents as ev}
						{@const isRegistered = data.learner.registeredEventIds.includes(ev.id)}
						<div class="list-row">
							<div class="row-icon"><Calendar size={16} /></div>
							<div class="row-main">
								<h3>{ev.title}</h3>
								<span class="row-sub-text">
									{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
							{#if isRegistered}
								<a href={ev.link || '#'} target="_blank" class="btn-action secondary">Join Live Call</a>
							{:else}
								<form method="POST" action="?/registerEvent">
									<input type="hidden" name="eventId" value={ev.id} />
									<button type="submit" class="btn-action">Register Free</button>
								</form>
							{/if}
						</div>
					{:else}
						<div class="empty-state">
							<Calendar size={28} />
							<p>No upcoming events scheduled at this moment.</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 4: COHORT CLASSES                                -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_classes'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>My Cohort Classes</h1>
						<p class="pane-sub">Active batch assignments and curriculum tracks.</p>
					</div>
				</header>

				<div class="row-list">
					{#each data.learner.cohorts as cls}
						<div class="cohort-card">
							<div class="cohort-top">
								<h3>{cls.name}</h3>
								<span class="badge-tag">Enrolled Member</span>
							</div>
							{#if cls.suggestedAssets && cls.suggestedAssets.length > 0}
								<div class="materials-strip">
									<span class="materials-label">Recommended Materials:</span>
									{#each cls.suggestedAssets as asset}
										<div class="mat-row">
											<span>{asset.title}</span>
											<a href={`/catalog`} class="mat-link">View Asset <ExternalLink size={11} /></a>
										</div>
									{/each}
								</div>
							{/if}
						</div>
					{:else}
						<div class="empty-state">
							<Users2 size={28} />
							<p>You are not currently assigned to any cohort classes.</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 5: CERTIFICATIONS                                -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_certs'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>My Certifications</h1>
						<p class="pane-sub">Passed credentials and purchased exam attempts.</p>
					</div>
					<a href="/certifications" class="btn-subtle">Certifications Marketplace</a>
				</header>

				<div class="row-list">
					{#each data.learner.issuedCertificates as cert}
						<div class="list-row">
							<div class="row-icon"><FileBadge2 size={16} /></div>
							<div class="row-main">
								<h3>{cert.metadata?.testName || 'Skill Certification'}</h3>
								<span class="row-sub-text green">Credential Issued & Verified</span>
							</div>
							<a href={`/certificates/${cert.id}`} target="_blank" class="btn-action secondary">View Certificate</a>
						</div>
					{/each}

					{#each data.learner.ownedCerts as item}
						<div class="list-row">
							<div class="row-icon"><FileBadge2 size={16} /></div>
							<div class="row-main">
								<h3>{item.title}</h3>
								<span class="row-sub-text">Attempt Ready</span>
							</div>
							<a href={`/certifications/${item.id}/exam`} class="btn-action">Start Assessment</a>
						</div>
					{:else}
						{#if data.learner.issuedCertificates.length === 0}
							<div class="empty-state">
								<FileBadge2 size={28} />
								<p>No active or passed certifications.</p>
								<a href="/certifications" class="btn-primary">Browse Exams</a>
							</div>
						{/if}
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 5B: MY 1-ON-1 SESSIONS (LEARNER)                 -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_mentoring'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>1-on-1 Mentoring Sessions</h1>
						<p class="pane-sub">Upcoming and past dedicated sessions with cybersecurity practitioners.</p>
					</div>
					<a href="/mentoring" class="btn-primary">
						<Plus size={14} /> <span>Book New Session</span>
					</a>
				</header>

				<div class="row-list">
					{#each (data.learner.mentoringBookings || []) as session}
						{@const joinInfo = getJoinStatus(session.startsAt, session.endsAt)}
						<div class="list-row session-row" class:session-live={joinInfo.status === 'live'}>
							<div class="row-icon" class:live-icon={joinInfo.status === 'live'}>
								<Video size={16} />
							</div>
							<div class="row-main">
								<div class="name-row">
									<h3>Session with {session.instructorName}</h3>
									{#if joinInfo.status === 'live'}
										<span class="live-pill">
											<span class="pulse-dot"></span> LIVE NOW
										</span>
									{:else if session.status === 'cancelled'}
										<span class="pill-banned">Cancelled</span>
									{:else if joinInfo.status === 'completed'}
										<span class="pill-completed">Completed</span>
									{/if}
								</div>
								<div class="session-meta-line">
									<span><Calendar size={12} /> {new Date(session.startsAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(session.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })} IST</span>
									<span><Clock size={12} /> {session.durationMins} mins</span>
									{#if session.pricePaise === 0}
										<span class="free-tag">Free</span>
									{:else}
										<span>₹{(session.pricePaise / 100).toFixed(0)}</span>
									{/if}
								</div>
								{#if session.notes}
									<p class="session-notes-preview">Agenda: {session.notes}</p>
								{/if}
							</div>

							<div class="session-action-col">
								{#if session.status === 'cancelled'}
									<span class="status-muted-label">Cancelled</span>
								{:else if joinInfo.status === 'live'}
									<a
										href={session.meetingUrl}
										target="_blank"
										rel="noopener noreferrer"
										class="btn-join-live"
									>
										<Video size={14} />
										<span>Join Meeting</span>
									</a>
								{:else if joinInfo.status === 'upcoming'}
									<div class="upcoming-join-wrap">
										<button class="btn-join-disabled" disabled title="Meeting link activates 5 minutes prior to start time">
											<Clock size={13} />
											<span>{joinInfo.label}</span>
										</button>
									</div>
								{:else}
									<span class="status-muted-label">Completed</span>
								{/if}
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<Video size={28} />
							<p>You have no scheduled mentoring sessions.</p>
							<a href="/mentoring" class="btn-primary">Browse Mentors</a>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 6: INSTRUCTOR OVERVIEW                           -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_overview'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Instructor Overview</h1>
						<p class="pane-sub">Course metrics, learners, and student activity.</p>
					</div>
					<button class="btn-primary" onclick={() => activeTab = 'teacher_courses'}>
						<Plus size={14} /> <span>Manage Courses</span>
					</button>
				</header>

				<div class="kpi-grid-4">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Students</span>
						<span class="kpi-box-val">{data.teacher.stats.totalStudents}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Courses</span>
						<span class="kpi-box-val">{data.teacher.stats.activeCourses}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Avg. Rating</span>
						<span class="kpi-box-val">{data.teacher.stats.avgRating}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Total Revenue</span>
						<span class="kpi-box-val">₹{data.teacher.stats.totalRevenue}</span>
					</div>
				</div>

				<div class="card-box" style="margin-top: 1.5rem;">
					<h3>Quick Course Overview</h3>
					<p class="card-sub-text">You have {data.teacher.courses.length} courses published or in draft mode.</p>
					<div class="row-list" style="margin-top: 1rem;">
						{#each data.teacher.courses.slice(0, 5) as course}
							<div class="list-row">
								<div class="row-icon"><BookOpen size={16} /></div>
								<div class="row-main">
									<h4>{course.title}</h4>
									<span class="row-sub-text">{course.pricePaise === 0 ? 'Free' : `₹${(course.pricePaise / 100).toFixed(0)}`}</span>
								</div>
								<a href={`/dashboard/teacher/courses/${course.id}/curriculum`} class="btn-action secondary">Edit Curriculum</a>
							</div>
						{:else}
							<p class="empty-text">No courses created yet.</p>
						{/each}
					</div>
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7: INSTRUCTOR MANAGE COURSES                     -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_courses'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Manage Instructor Courses</h1>
						<p class="pane-sub">Curricula, quizzes, and published assets.</p>
					</div>
					<a href="/dashboard/teacher/courses" class="btn-primary">
						<Plus size={14} /> <span>Create New Course</span>
					</a>
				</header>

				<div class="row-list">
					{#each data.teacher.courses as course}
						<div class="list-row">
							<div class="row-icon"><BookOpen size={16} /></div>
							<div class="row-main">
								<h3>{course.title}</h3>
								<span class="row-sub-text">Status: <strong>{course.status}</strong> • Price: {course.pricePaise === 0 ? 'Free' : `₹${(course.pricePaise / 100).toFixed(0)}`}</span>
							</div>
							<div class="action-group">
								<a href={`/dashboard/teacher/courses/${course.id}/curriculum`} class="btn-action secondary">Curriculum</a>
								<a href={`/catalog/${course.id}`} target="_blank" class="btn-action secondary">Preview</a>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<BookOpenCheck size={28} />
							<p>No courses created yet.</p>
							<a href="/dashboard/teacher/courses" class="btn-primary">Create Your First Course</a>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7A-2: INSTRUCTOR CERTIFICATIONS                 -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_certifications' && data.isTeacher}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Certification Exams</h1>
						<p class="pane-sub">Create and manage professional certifications, passing criteria, pricing, and MCQ exam questions.</p>
					</div>
					<button class="btn-primary" onclick={() => showCreateCertModal = true}>
						<Plus size={14} /> <span>New Certification</span>
					</button>
				</header>

				<!-- KPI row -->
				<div class="stats-row" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
					<div class="stat-card">
						<span class="stat-label">Total Certifications</span>
						<span class="stat-val">{teacherCerts.length}</span>
					</div>
					<div class="stat-card">
						<span class="stat-label">Published & Live</span>
						<span class="stat-val text-emerald">{teacherCerts.filter((c: any) => c.status === 'published').length}</span>
					</div>
					<div class="stat-card">
						<span class="stat-label">Drafts</span>
						<span class="stat-val text-muted">{teacherCerts.filter((c: any) => c.status === 'draft').length}</span>
					</div>
				</div>

				<div class="row-list">
					{#each teacherCerts as cert}
						<div class="list-row">
							<div class="row-icon"><Award size={16} /></div>
							<div class="row-main">
								<div class="cert-title-row">
									<h3>{cert.title}</h3>
									<span class="badge-minimal" class:badge-active={cert.status === 'published'}>
										{cert.status.toUpperCase()}
									</span>
								</div>
								<span class="row-sub-text">
									Passing: <strong>{cert.passingPercent}%</strong> •
									Fee: <strong>{cert.price}</strong> •
									Duration: {cert.duration} mins •
									{cert.isProctored ? 'Proctored Exam' : 'Standard'}
								</span>
							</div>
							<div class="action-group">
								<a href={`/dashboard/teacher/certifications/${cert.id}/questions`} class="btn-action primary">
									Manage Questions & MCQs
								</a>
								<form method="POST" action="?/toggleCertPublish" style="display:inline;">
									<input type="hidden" name="certId" value={cert.id} />
									<button type="submit" class="btn-action secondary" title={cert.status === 'published' ? 'Move to Draft' : 'Publish Live'}>
										{cert.status === 'published' ? 'Unpublish' : 'Publish'}
									</button>
								</form>
								<button
									class="btn-action secondary"
									onclick={() => {
										selectedCertForEdit = cert;
										editCertPriceInput = cert.rawPrice.toString();
										showEditCertPriceModal = true;
									}}
								>
									Set Price
								</button>
								<form method="POST" action="?/deleteCert" onsubmit={(e) => { if (!confirm(`Delete certification "${cert.title}"?`)) e.preventDefault(); }} style="display:inline;">
									<input type="hidden" name="certId" value={cert.id} />
									<button type="submit" class="btn-action danger" title="Delete Certification">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<Award size={32} />
							<p>No certification exams created yet.</p>
							<button class="btn-primary" onclick={() => showCreateCertModal = true}>Create Your First Certification</button>
						</div>
					{/each}
				</div>
			</div>

			<!-- Modal: Create Certification -->
			{#if showCreateCertModal}
				<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateCertModal = false; }} role="presentation">
					<form class="modal-card" method="POST" action="?/createCert">
						<header class="modal-header">
							<h3>Create Certification Exam</h3>
							<button type="button" class="btn-modal-close" onclick={() => showCreateCertModal = false}><X size={16} /></button>
						</header>
						<div class="modal-body">
							<p class="modal-desc">Define your certification exam title, passing threshold, and student enrollment fee.</p>

							<div class="form-group">
								<label for="certTitle" class="form-label">Certification Title *</label>
								<input
									type="text"
									id="certTitle"
									name="title"
									required
									placeholder="e.g. Certified Cloud Security Architect (CCSA)"
									class="form-input"
								/>
							</div>

							<div class="form-row-2">
								<div class="form-group">
									<label for="certPassing" class="form-label">Passing Threshold (%)</label>
									<input
										type="number"
										id="certPassing"
										name="passingPercent"
										min="40"
										max="100"
										value="70"
										class="form-input"
									/>
								</div>
								<div class="form-group">
									<label for="certPrice" class="form-label">Exam Fee (INR ₹)</label>
									<input
										type="number"
										id="certPrice"
										name="price"
										min="0"
										step="50"
										value="0"
										placeholder="0 for Free"
										class="form-input"
									/>
								</div>
							</div>
						</div>
						<footer class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showCreateCertModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Create & Configure Questions</button>
						</footer>
					</form>
				</div>
			{/if}

			<!-- Modal: Edit Price -->
			{#if showEditCertPriceModal && selectedCertForEdit}
				<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showEditCertPriceModal = false; }} role="presentation">
					<form class="modal-card" method="POST" action="?/updateCertPrice">
						<header class="modal-header">
							<h3>Update Certification Price</h3>
							<button type="button" class="btn-modal-close" onclick={() => showEditCertPriceModal = false}><X size={16} /></button>
						</header>
						<div class="modal-body">
							<input type="hidden" name="certId" value={selectedCertForEdit.id} />
							<p class="modal-desc">Update enrollment fee for <strong>{selectedCertForEdit.title}</strong>.</p>
							<div class="form-group">
								<label for="editPrice" class="form-label">Price (INR ₹)</label>
								<input
									type="number"
									id="editPrice"
									name="price"
									min="0"
									step="50"
									bind:value={editCertPriceInput}
									class="form-input"
								/>
							</div>
						</div>
						<footer class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showEditCertPriceModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Save Price</button>
						</footer>
					</form>
				</div>
			{/if}

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7B: INSTRUCTOR MENTORING STUDIO                  -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_mentoring' && data.isTeacher}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Mentoring Studio</h1>
						<p class="pane-sub">Manage your availability calendar, duration pricing, promo coupons, and booked sessions.</p>
					</div>
					<div class="subtab-pills">
						<button class="subtab-pill" class:active={teacherMentoringSubTab === 'calendar'} onclick={() => teacherMentoringSubTab = 'calendar'}>
							<CalendarDays size={13} /> Availability Calendar
						</button>
						<button class="subtab-pill" class:active={teacherMentoringSubTab === 'pricing'} onclick={() => teacherMentoringSubTab = 'pricing'}>
							<DollarSign size={13} /> Duration Pricing
						</button>
						<button class="subtab-pill" class:active={teacherMentoringSubTab === 'coupons'} onclick={() => { teacherMentoringSubTab = 'coupons'; loadTeacherCoupons(); }}>
							<Tag size={13} /> Promo Coupons
						</button>
						<button class="subtab-pill" class:active={teacherMentoringSubTab === 'bookings'} onclick={() => teacherMentoringSubTab = 'bookings'}>
							<Users size={13} /> Bookings ({teacherBookings.length})
						</button>
					</div>
				</header>

				<!-- Opt-in Status Banner -->
				<div class="optin-card" class:is-live={isMentoringEnabled}>
					<div class="optin-left">
						<div class="optin-badge-row">
							<span class="optin-badge" class:live={isMentoringEnabled}>
								<span class="status-indicator-dot" class:live={isMentoringEnabled}></span>
								{isMentoringEnabled ? 'LISTED ON MARKETPLACE' : 'UNLISTED / PAUSED'}
							</span>
							{#if data.profile?.mentoringHandle && isMentoringEnabled}
								<a href={`/mentoring/${data.profile.mentoringHandle}`} target="_blank" class="optin-public-link">
									View Public Profile ↗
								</a>
							{/if}
						</div>
						<h2 class="optin-title">1-on-1 Mentorship Offering</h2>
						<p class="optin-desc">
							{#if isMentoringEnabled}
								Your profile is currently active. Students can discover your profile, view packages, and schedule 1-on-1 sessions.
							{:else}
								Your mentorship profile is hidden. You are not listed on the public mentoring marketplace and cannot receive new booking requests.
							{/if}
						</p>
					</div>

					<div class="optin-right">
						{#if mentoringToggleMsg}
							<span class="optin-alert-msg">{mentoringToggleMsg}</span>
						{/if}
						<button
							class="btn-optin-toggle"
							class:active={isMentoringEnabled}
							disabled={isTogglingMentoring}
							onclick={() => handleToggleMentoring(!isMentoringEnabled)}
						>
							{#if isTogglingMentoring}
								<Loader2 size={14} class="spin" /> Updating...
							{:else if isMentoringEnabled}
								Pause Mentoring (Unlist)
							{:else}
								Enable Mentoring & Go Live
							{/if}
						</button>
					</div>
				</div>

				<!-- SUBTAB 1: CALENDAR -->
				{#if teacherMentoringSubTab === 'calendar'}
					<div class="mentoring-cal-container">
						<div class="cal-controls-bar">
							<div class="cal-month-nav">
								<button class="btn-cal-arrow" onclick={() => { if (currentCalMonth === 0) { currentCalMonth = 11; currentCalYear--; } else { currentCalMonth--; } }}>
									<ChevronLeft size={16} />
								</button>
								<span class="cal-month-title">
									{new Intl.DateTimeFormat('en-US', { month: 'long', year: 'numeric' }).format(new Date(currentCalYear, currentCalMonth, 1))}
								</span>
								<button class="btn-cal-arrow" onclick={() => { if (currentCalMonth === 11) { currentCalMonth = 0; currentCalYear++; } else { currentCalMonth++; } }}>
									<ChevronRight size={16} />
								</button>
							</div>
							<p class="cal-tip">Click on any date to manage or publish availability time windows.</p>
						</div>

						<!-- Month Grid -->
						<div class="month-calendar-grid">
							{#each ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'] as dayName}
								<div class="cal-day-header">{dayName}</div>
							{/each}

							{#each Array(firstDayOffset) as _}
								<div class="cal-cell empty"></div>
							{/each}

							{#each Array.from({ length: daysInMonth }, (_, i) => i + 1) as dayNum}
								{@const dStr = `${currentCalYear}-${(currentCalMonth + 1).toString().padStart(2, '0')}-${dayNum.toString().padStart(2, '0')}`}
								{@const dayWins = teacherWindows.filter((w: any) => w.date === dStr && w.status === 'active')}
								<div
									class="cal-cell"
									class:has-wins={dayWins.length > 0}
									onclick={() => openDayDrawer(dStr)}
									role="button"
									tabindex="0"
									onkeydown={(e) => { if (e.key === 'Enter') openDayDrawer(dStr); }}
								>
									<span class="cal-cell-day">{dayNum}</span>
									<div class="cal-cell-chips">
										{#each dayWins as w}
											<div class="cal-win-chip" class:booked={w.bookingCount > 0} title={`${w.windowStart}–${w.windowEnd} (${w.bookingCount} booked)`}>
												<span>{w.windowStart}–{w.windowEnd}</span>
												{#if w.bookingCount > 0}
													<span class="win-chip-count">{w.bookingCount}</span>
												{/if}
											</div>
										{/each}
									</div>
								</div>
							{/each}
						</div>
					</div>

					<!-- Day Drawer -->
					{#if isDayDrawerOpen}
						<div class="drawer-backdrop" onclick={() => isDayDrawerOpen = false} role="presentation"></div>
						<aside class="day-detail-drawer" role="dialog">
							<header class="day-drawer-header">
								<div>
									<p class="drawer-tag">Availability for</p>
									<h3>{formatDateLabel(selectedDayDateStr)}</h3>
								</div>
								<button class="close-btn" onclick={() => isDayDrawerOpen = false}><X size={18} /></button>
							</header>

							<div class="day-drawer-body">
								{#if windowError}
									<div class="error-banner"><AlertCircle size={15} /> <span>{windowError}</span></div>
								{/if}

								<!-- Existing Windows -->
								<div class="existing-wins-section">
									<label class="field-label">Active Windows on this Date</label>
									{#if selectedDayWindows.length === 0}
										<p class="empty-text">No time windows published for this date yet.</p>
									{:else}
										<div class="day-wins-list">
											{#each selectedDayWindows as win}
												<div class="day-win-card">
													<div class="win-time-block">
														<Clock size={14} />
														<strong>{win.windowStart} – {win.windowEnd}</strong>
													</div>
													<div class="win-durations-pills">
														{#each win.allowedDurations as dur}
															<span class="tag-chip">{dur}m</span>
														{/each}
													</div>
													<div class="win-meta-row">
														<span class="m-count">{win.bookingCount} Booked</span>
														<button class="btn-cancel-win" onclick={() => handleCancelWindow(win.id)}>Cancel Window</button>
													</div>
												</div>
											{/each}
										</div>
									{/if}
								</div>

								<!-- Add Window Form -->
								<div class="add-win-form">
									<h4>Add New Availability Window</h4>

									<!-- Quick Presets -->
									<div class="presets-block">
										<span class="presets-label">Quick Presets:</span>
										<div class="presets-chips">
											<button
												type="button"
												class="preset-btn"
												onclick={() => { newWinStart = '10:00'; newWinEnd = '14:00'; }}
											>
												Morning (10am–2pm)
											</button>
											<button
												type="button"
												class="preset-btn"
												onclick={() => { newWinStart = '14:00'; newWinEnd = '18:00'; }}
											>
												Afternoon (2pm–6pm)
											</button>
											<button
												type="button"
												class="preset-btn"
												onclick={() => { newWinStart = '18:00'; newWinEnd = '21:00'; }}
											>
												Evening (6pm–9pm)
											</button>
											<button
												type="button"
												class="preset-btn"
												onclick={() => { newWinStart = '10:00'; newWinEnd = '18:00'; }}
											>
												Full Day (10am–6pm)
											</button>
										</div>
									</div>

									<div class="form-row-2">
										<div class="field-sm">
											<label for="winStart">Start Time (24h)</label>
											<input type="time" id="winStart" bind:value={newWinStart} class="inp-text" />
										</div>
										<div class="field-sm">
											<label for="winEnd">End Time (24h)</label>
											<input type="time" id="winEnd" bind:value={newWinEnd} class="inp-text" />
										</div>
									</div>

									<div class="field-sm">
										<label>Permitted Session Durations</label>
										<div class="durations-toggle-row">
											{#each [30, 45, 60] as dur}
												<button
													type="button"
													class="dur-toggle-btn"
													class:active={newWinDurations.includes(dur)}
													onclick={() => {
														if (newWinDurations.includes(dur)) {
															if (newWinDurations.length > 1) {
																newWinDurations = newWinDurations.filter(d => d !== dur);
															}
														} else {
															newWinDurations = [...newWinDurations, dur].sort((a, b) => a - b);
														}
													}}
												>
													{dur} mins
												</button>
											{/each}
										</div>
									</div>

									<div class="field-sm">
										<label for="winMeeting">Meeting URL (Google Meet, Zoom, Teams)</label>
										<input type="url" id="winMeeting" bind:value={newWinMeetingUrl} placeholder="https://meet.google.com/..." class="inp-text" />
									</div>

									<button class="btn-primary full" disabled={isSavingWindow} onclick={handleAddAvailabilityWindow}>
										{#if isSavingWindow}Saving...{:else}Publish Window{/if}
									</button>
								</div>
							</div>
						</aside>
					{/if}

				<!-- SUBTAB 2: DURATION PRICING -->
				{:else if teacherMentoringSubTab === 'pricing'}
					<div class="pricing-panel-wrap card-box">
						<h3>Duration Tier Pricing</h3>
						<p class="card-sub-text">Set your fees for 30, 45, and 60-minute mentoring sessions. Amounts are in INR (₹).</p>

						{#if pricingSavedMsg}
							<div class="success-banner-sm"><Check size={14} /> <span>{pricingSavedMsg}</span></div>
						{/if}

						<div class="pricing-tiers-list">
							<div class="pricing-tier-row">
								<div class="tier-info">
									<strong>30 Minutes</strong>
									<span class="tier-sub">Quick architecture / portfolio review</span>
								</div>
								<div class="tier-input-wrap">
									<span class="currency-sym">₹</span>
									<input type="number" min="0" step="50" bind:value={price30} class="tier-inp" />
								</div>
							</div>

							<div class="pricing-tier-row">
								<div class="tier-info">
									<strong>45 Minutes</strong>
									<span class="tier-sub">Code walkthrough & roadmap guidance</span>
								</div>
								<div class="tier-input-wrap">
									<span class="currency-sym">₹</span>
									<input type="number" min="0" step="50" bind:value={price45} class="tier-inp" />
								</div>
							</div>

							<div class="pricing-tier-row">
								<div class="tier-info">
									<strong>60 Minutes</strong>
									<span class="tier-sub">Deep-dive technical mentoring & mock interview</span>
								</div>
								<div class="tier-input-wrap">
									<span class="currency-sym">₹</span>
									<input type="number" min="0" step="50" bind:value={price60} class="tier-inp" />
								</div>
							</div>
						</div>

						<button class="btn-primary" disabled={isSavingPricing} onclick={handleSavePricing} style="align-self: flex-start; margin-top: 1.5rem;">
							{#if isSavingPricing}Saving...{:else}Save Duration Prices{/if}
						</button>
					</div>

				<!-- SUBTAB 3: PROMO COUPONS -->
				{:else if teacherMentoringSubTab === 'coupons'}
					<div class="card-box">
						<h3>Mentor Promo Coupons</h3>
						<p class="card-sub-text">Generate special discount codes exclusively for your 1-on-1 mentoring sessions.</p>

						{#if couponCreatedMsg}
							<div class="success-banner-sm"><Check size={14} /> <span>{couponCreatedMsg}</span></div>
						{/if}

						<div class="coupon-create-bar">
							<input type="text" placeholder="CODE (e.g. MENTOR50)" bind:value={newCouponCode} class="inp-text" style="text-transform: uppercase;" />
							<select bind:value={newCouponType} class="inp-text" style="max-width: 140px;">
								<option value="percent">% Discount</option>
								<option value="flat">₹ Flat Discount</option>
							</select>
							<input type="number" placeholder="Value" bind:value={newCouponValue} class="inp-text" style="max-width: 100px;" />
							<input type="number" placeholder="Max uses" bind:value={newCouponMaxUses} class="inp-text" style="max-width: 110px;" />
							<button class="btn-primary" disabled={isSavingCoupon} onclick={handleCreateCoupon}>
								<Plus size={14} /> Create
							</button>
						</div>

						<div class="table-container" style="margin-top: 1.5rem;">
							<table class="admin-table">
								<thead>
									<tr>
										<th>Code</th>
										<th>Discount</th>
										<th>Uses</th>
										<th>Status</th>
									</tr>
								</thead>
								<tbody>
									{#each teacherCoupons as c}
										<tr>
											<td><code>{c.code}</code></td>
											<td>{c.type === 'percent' ? `${c.value}% Off` : `₹${(c.value / 100).toFixed(0)} Off`}</td>
											<td>{c.usesCount} / {c.maxUses !== null ? c.maxUses : '∞'}</td>
											<td><span class="pill-active">{c.isActive ? 'Active' : 'Disabled'}</span></td>
										</tr>
									{:else}
										<tr>
											<td colspan="4" style="text-align: center; padding: 1.5rem; color: var(--text-muted);">
												No custom coupons created yet.
											</td>
										</tr>
									{/each}
								</tbody>
							</table>
						</div>
					</div>

				<!-- SUBTAB 4: BOOKINGS -->
				{:else if teacherMentoringSubTab === 'bookings'}
					<div class="row-list">
						{#each teacherBookings as b}
							<div class="list-row">
								<div class="row-icon"><UserCircle size={16} /></div>
								<div class="row-main">
									<h3>{b.studentName || 'Student'} ({b.studentEmail})</h3>
									<div class="session-meta-line">
										<span><Calendar size={12} /> {new Date(b.startsAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(b.startsAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}</span>
										<span><Clock size={12} /> {b.durationMins} mins</span>
										<span>₹{(b.pricePaise / 100).toFixed(0)}</span>
									</div>
									{#if b.notes}
										<p class="session-notes-preview">Agenda: {b.notes}</p>
									{/if}
								</div>
								<div class="session-action-col">
									{#if b.status === 'confirmed'}
										<button class="btn-action secondary" onclick={() => handleMarkBookingCompleted(b.id)}>
											Mark Completed
										</button>
									{:else}
										<span class="status-muted-label">{b.status}</span>
									{/if}
								</div>
							</div>
						{:else}
							<div class="empty-state">
								<Users size={28} />
								<p>No student bookings recorded yet.</p>
							</div>
						{/each}
					</div>
				{/if}
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 8: ADMIN COCKPIT                                 -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'admin_cockpit'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Platform Admin Cockpit</h1>
						<p class="pane-sub">Global platform modules, email notifications, and health metrics.</p>
					</div>
					<span class="status-pill">System Operational</span>
				</header>

				<div class="kpi-grid-4">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Users</span>
						<span class="kpi-box-val">{data.admin.kpis.totalUsers}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Published Courses</span>
						<span class="kpi-box-val">{data.admin.kpis.totalCourses}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Cert Exams</span>
						<span class="kpi-box-val">{data.admin.kpis.totalCerts}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Outbox Queue</span>
						<span class="kpi-box-val">{data.admin.kpis.outboxPending}</span>
					</div>
				</div>

				<div class="grid-2-col" style="margin-top: 1.5rem;">
					<!-- Module Toggles -->
					<div class="card-box">
						<h3>Core Platform Modules</h3>
						<p class="card-sub-text">Instantly toggle public features across the application.</p>

						<form method="POST" action="?/updateSettings" class="form-col">
							<label class="toggle-item">
								<div>
									<span class="t-name">Asset & Course Catalog</span>
									<span class="t-desc">Public catalog browsing and purchasing</span>
								</div>
								<input type="checkbox" name="enableCatalog" checked={data.admin.settings.enableCatalog} class="toggle-cb" />
							</label>

							<label class="toggle-item">
								<div>
									<span class="t-name">1-on-1 Mentoring Booking</span>
									<span class="t-desc">Instructor schedule booking portal</span>
								</div>
								<input type="checkbox" name="enableMentoring" checked={data.admin.settings.enableMentoring} class="toggle-cb" />
							</label>

							<label class="toggle-item">
								<div>
									<span class="t-name">Certifications Engine</span>
									<span class="t-desc">Skill assessments and credential issuing</span>
								</div>
								<input type="checkbox" name="enableCertifications" checked={data.admin.settings.enableCertifications} class="toggle-cb" />
							</label>

							<button type="submit" class="btn-primary" style="align-self: flex-start; margin-top: 6px;">
								Save Module Settings
							</button>
						</form>
					</div>

					<!-- Email Templates -->
					<div class="card-box">
						<h3>Notification Templates</h3>
						<p class="card-sub-text">Customize automated transactional emails.</p>

						<form method="POST" action="?/saveTemplate" class="form-col">
							<div class="tab-strip-sm">
								{#each data.admin.templates as tpl}
									<button 
										type="button" 
										class="tab-btn-sm" 
										class:active={selectedTemplate.id === tpl.id} 
										onclick={() => selectedTemplate = tpl}
									>
										{tpl.id}
									</button>
								{/each}
							</div>

							<input type="hidden" name="id" value={selectedTemplate.id} />

							<div class="field-sm">
								<label for="tplSubject">Subject</label>
								<input type="text" id="tplSubject" name="subject" bind:value={selectedTemplate.subject} class="inp-text" />
							</div>

							<div class="field-sm">
								<label for="tplBody">Content (Markdown)</label>
								<textarea id="tplBody" name="body" bind:value={selectedTemplate.body} rows="4" class="inp-code"></textarea>
							</div>

							<button type="submit" class="btn-primary" style="align-self: flex-start;">
								Save Template
							</button>
						</form>
					</div>
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 8B: ADMIN MENTORING OVERSIGHT                    -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'admin_mentoring' && data.isAdmin}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Mentoring Revenue & Governance</h1>
						<p class="pane-sub">Platform-wide session analytics, instructor activity breakdown, and governance controls.</p>
					</div>
				</header>

				<!-- KPI ROW -->
				<div class="kpi-grid-4">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Bookings</span>
						<span class="kpi-box-val">{adminMentoringStats.totalSessionsBooked}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Completed Sessions</span>
						<span class="kpi-box-val">{adminMentoringStats.totalSessionsCompleted}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Gross Revenue</span>
						<span class="kpi-box-val">₹{(adminMentoringStats.totalRevenuePaise / 100).toLocaleString('en-IN')}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Instructors</span>
						<span class="kpi-box-val">{adminMentoringStats.activeInstructors}</span>
					</div>
				</div>

				<!-- INSTRUCTORS BREAKDOWN TABLE -->
				<div class="card-box" style="margin-top: 1.5rem;">
					<h3>Instructor Mentoring Activity</h3>
					<p class="card-sub-text">Overview of all registered teachers, their active windows, and total revenue earned.</p>

					<div class="table-container" style="margin-top: 1rem;">
						<table class="admin-table">
							<thead>
								<tr>
									<th>Instructor</th>
									<th>Active Windows</th>
									<th>Completed</th>
									<th>Gross Revenue</th>
									<th>Status</th>
									<th style="text-align: right;">Governance</th>
								</tr>
							</thead>
							<tbody>
								{#each adminInstructorsList as inst}
									<tr>
										<td>
											<div class="table-user-cell">
												<span class="user-name-bold">{inst.name}</span>
												<span class="user-email-muted">{inst.email}</span>
											</div>
										</td>
										<td>{inst.activeWindowsCount} Windows</td>
										<td>{inst.sessionsCompleted} Sessions</td>
										<td><strong>₹{(inst.grossRevenuePaise / 100).toLocaleString('en-IN')}</strong></td>
										<td>
											{#if inst.isSuspended}
												<span class="pill-banned">Suspended</span>
											{:else}
												<span class="pill-active">Active</span>
											{/if}
										</td>
										<td style="text-align: right;">
											<div class="admin-action-group">
												<button class="btn-table-action" onclick={() => openInstructorDetail(inst.id)}>
													Details
												</button>
												<button class="btn-table-action" onclick={() => openPriceBoundsModal(inst)}>
													Price Limits
												</button>
												<button
													class="btn-table-action"
													class:danger={!inst.isSuspended}
													onclick={() => handleAdminToggleSuspend(inst.id, inst.isSuspended)}
												>
													{inst.isSuspended ? 'Lift Suspension' : 'Suspend'}
												</button>
											</div>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>

				<!-- Instructor Detail Modal/Drawer -->
				{#if isInstructorDetailDrawerOpen && selectedInstructorDetail}
					<div class="drawer-backdrop" onclick={() => isInstructorDetailDrawerOpen = false} role="presentation"></div>
					<aside class="day-detail-drawer" style="max-width: 580px;" role="dialog">
						<header class="day-drawer-header">
							<div>
								<p class="drawer-tag">Instructor Oversight</p>
								<h3>{selectedInstructorDetail.instructor.name}</h3>
								<p class="pane-sub" style="margin: 0;">{selectedInstructorDetail.instructor.email}</p>
							</div>
							<button class="close-btn" onclick={() => isInstructorDetailDrawerOpen = false}><X size={18} /></button>
						</header>

						<div class="day-drawer-body">
							<h4>Active Availability Windows ({selectedInstructorDetail.windows.length})</h4>
							<div class="day-wins-list" style="margin-bottom: 2rem;">
								{#each selectedInstructorDetail.windows as w}
									<div class="day-win-card">
										<div class="win-time-block">
											<strong>{w.date} • {w.windowStart}–{w.windowEnd}</strong>
											<span class="badge-tag">{w.status}</span>
										</div>
										<p style="font-size: 0.75rem; color: var(--text-muted); word-break: break-all; margin: 4px 0;">{w.meetingUrl}</p>
										{#if w.status === 'active'}
											<button class="btn-cancel-win" onclick={() => handleAdminCancelWindow(w.id)}>
												Admin Cancel Window
											</button>
										{/if}
									</div>
								{:else}
									<p class="empty-text">No availability windows.</p>
								{/each}
							</div>

							<h4>Session Bookings ({selectedInstructorDetail.bookings.length})</h4>
							<div class="day-wins-list">
								{#each selectedInstructorDetail.bookings as b}
									<div class="day-win-card">
										<div class="win-time-block">
											<strong>{b.studentName} ({b.studentEmail})</strong>
											<span class="badge-tag">{b.status}</span>
										</div>
										<p style="font-size: 0.75rem; color: var(--text-secondary); margin: 4px 0;">
											{new Date(b.startsAt).toLocaleDateString()} at {new Date(b.startsAt).toLocaleTimeString()} • {b.durationMins}m • ₹{(b.pricePaise / 100).toFixed(0)}
										</p>
									</div>
								{:else}
									<p class="empty-text">No session bookings.</p>
								{/each}
							</div>
						</div>
					</aside>
				{/if}

				<!-- Price Bounds Modal -->
				{#if isPriceBoundsModalOpen}
					<div class="drawer-backdrop" onclick={() => isPriceBoundsModalOpen = false} role="presentation"></div>
					<div class="admin-modal-card" role="dialog">
						<h3>Set Mentoring Price Bounds</h3>
						<p class="card-sub-text">Define minimum and maximum price floor/ceiling for this instructor.</p>

						<div class="form-col" style="margin: 1.5rem 0;">
							<div class="form-row-2">
								<div class="field-sm">
									<label for="b30min">30m Min Price (₹)</label>
									<input id="b30min" type="number" bind:value={bound30Min} class="inp-text" />
								</div>
								<div class="field-sm">
									<label for="b30max">30m Max Price (₹)</label>
									<input id="b30max" type="number" bind:value={bound30Max} class="inp-text" />
								</div>
							</div>
							<div class="form-row-2">
								<div class="field-sm">
									<label for="b60min">60m Min Price (₹)</label>
									<input id="b60min" type="number" bind:value={bound60Min} class="inp-text" />
								</div>
								<div class="field-sm">
									<label for="b60max">60m Max Price (₹)</label>
									<input id="b60max" type="number" bind:value={bound60Max} class="inp-text" />
								</div>
							</div>
						</div>

						<div class="modal-actions-row">
							<button class="btn-subtle" onclick={() => isPriceBoundsModalOpen = false}>Cancel</button>
							<button class="btn-primary" onclick={handleSavePriceBounds}>Save Price Bounds</button>
						</div>
					</div>
				{/if}
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 9: ADMIN USERS                                   -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'admin_users'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>User & Role Management</h1>
						<p class="pane-sub">Manage user permissions, roles, and account statuses.</p>
					</div>
					<div class="search-bar-wrap">
						<Search size={13} class="s-icon" />
						<input type="text" placeholder="Search name, email, role..." bind:value={userSearch} class="search-inp-sm" />
					</div>
				</header>

				<div class="table-container">
					<table class="admin-table">
						<thead>
							<tr>
								<th>User</th>
								<th>Role</th>
								<th>Status</th>
								<th>Created</th>
								<th style="text-align: right;">Action</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredUsers as u}
								<tr>
									<td>
										<div class="table-user-cell">
											<span class="user-name-bold">{u.name || 'Unnamed'}</span>
											<span class="user-email-muted">{u.email}</span>
										</div>
									</td>
									<td>
										<form method="POST" action="?/updateUserRole" class="inline-form">
											<input type="hidden" name="userId" value={u.id} />
											<select 
												name="role" 
												class="role-select" 
												value={u.role}
												disabled={u.role === 'owner' && !data.isOwner}
												onchange={(e) => e.currentTarget.form?.requestSubmit()}
											>
												<option value="student">student</option>
												<option value="teacher">teacher</option>
												{#if data.isOwner}
													<option value="admin">admin</option>
												{/if}
												{#if u.role === 'owner'}
													<option value="owner">owner</option>
												{/if}
											</select>
										</form>
									</td>
									<td>
										{#if u.banned}
											<span class="pill-banned">Banned</span>
										{:else}
											<span class="pill-active">Active</span>
										{/if}
									</td>
									<td>
										<span class="table-date">{new Date(u.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
									</td>
									<td style="text-align: right;">
										{#if u.role !== 'owner' && u.id !== data.user.id}
											<form method="POST" action="?/toggleUserBan" class="inline-form">
												<input type="hidden" name="userId" value={u.id} />
												<input type="hidden" name="isBanned" value={u.banned ? 'true' : 'false'} />
												<button type="submit" class="btn-table-action" class:danger={!u.banned}>
													{u.banned ? 'Unban' : 'Ban'}
												</button>
											</form>
										{/if}
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="5" style="text-align: center; padding: 2rem; color: var(--text-muted);">
										No users matching search query.
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 10: ADMIN AUDIT LOGS                             -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'admin_audit'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Security & Audit Logs</h1>
						<p class="pane-sub">Immutable trail of platform actions and permission updates.</p>
					</div>
				</header>

				<div class="row-list">
					{#each data.admin.auditLogs as log}
						<div class="audit-row">
							<div class="audit-dot"></div>
							<div class="audit-main">
								<p>
									<strong class="audit-action-tag">{log.action}</strong>
									<span class="audit-target">({log.entityType})</span>
									{#if log.actorEmail}
										<span class="audit-actor">by {log.actorEmail}</span>
									{/if}
								</p>
								<span class="audit-timestamp">
									{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<ShieldAlert size={28} />
							<p>No audit logs recorded yet.</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 11: OWNER VAULT (Strictly Owner)                 -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'owner_vault' && data.isOwner}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<div class="vault-tag-header">
							<Lock size={12} /> <span>Root Authority</span>
						</div>
						<h1>Owner Security Vault</h1>
						<p class="pane-sub">Irreversible ownership delegation and root tenant governance.</p>
					</div>
				</header>

				<div class="card-box" style="border-color: rgba(139, 92, 246, 0.3);">
					<div class="card-head-simple">
						<KeyRound size={16} style="color: #8b5cf6;" />
						<h3>Transfer Tenant Ownership</h3>
					</div>
					<p class="card-sub-text">Delegate the root `owner` position to an existing administrator. This action immediately demotes you to an admin.</p>

					{#if data.admin.eligibleAdmins.length > 0}
						<form method="POST" action="?/transferOwnership" class="form-col" style="margin-top: 1rem;">
							<div class="field-sm">
								<label for="ownerTarget">Select Target Admin</label>
								<select id="ownerTarget" name="newOwnerId" bind:value={selectedAdminId} class="inp-text">
									{#each data.admin.eligibleAdmins as admin}
										<option value={admin.id}>{admin.name || 'Admin'} ({admin.email})</option>
									{/each}
								</select>
							</div>

							{#if selectedAdmin}
								<div class="warning-box">
									<AlertTriangle size={15} style="color: #d97706; flex-shrink: 0;" />
									<div>
										<strong>Irreversible Operation</strong>
										<p>Type matching email (<code>{selectedAdmin.email}</code>) to confirm.</p>
									</div>
								</div>

								<div class="field-sm">
									<label for="confirmEmailInput">Confirmation Email</label>
									<input 
										id="confirmEmailInput" 
										type="text" 
										name="confirmEmail" 
										bind:value={confirmOwnerEmail} 
										placeholder={selectedAdmin.email}
										class="inp-text" 
									/>
								</div>

								<button 
									type="submit" 
									class="btn-danger" 
									disabled={confirmOwnerEmail.trim().toLowerCase() !== selectedAdmin.email.toLowerCase()}
								>
									Confirm & Transfer Ownership
								</button>
							{/if}
						</form>
					{:else}
						<p class="empty-text">No eligible administrators found. Promote a user to <code>admin</code> in the User Management tab first.</p>
					{/if}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 12: ACCOUNT SETTINGS                             -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'settings'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>Account & Security Settings</h1>
						<p class="pane-sub">Manage your profile, login preferences, and credentials.</p>
					</div>
				</header>

				<div class="grid-2-col">
					<!-- Profile Update -->
					<div class="card-box">
						<div class="card-head-simple">
							<UserCircle size={16} />
							<h3>Profile Details</h3>
						</div>

						<form method="POST" action="?/updateProfile" class="form-col" style="margin-top: 1rem;">
							<div class="field-sm">
								<label for="profileName">Full Name</label>
								<input type="text" id="profileName" name="name" value={data.user.name || ''} class="inp-text" />
							</div>
							<div class="field-sm">
								<label for="profileEmail">Email Address</label>
								<input type="text" id="profileEmail" value={data.user.email} disabled class="inp-text" style="opacity: 0.6;" />
							</div>
							<button type="submit" class="btn-primary" style="align-self: flex-start;">
								Update Name
							</button>
						</form>
					</div>

					<!-- Login Preference -->
					<div class="card-box">
						<div class="card-head-simple">
							<Shield size={16} />
							<h3>Sign In Preference</h3>
						</div>
						<p class="card-sub-text">Choose your default login method.</p>

						<form method="POST" action="?/updatePreference" class="form-col" style="margin-top: 1rem;">
							<div class="radio-stack">
								<label class="radio-card">
									<input 
										type="radio" 
										name="preference" 
										value="otp" 
										checked={data.profile?.loginPreference !== 'password'} 
									/>
									<div>
										<strong>Magic Email OTP</strong>
										<span>One-time passcode sent to your inbox</span>
									</div>
								</label>
								<label class="radio-card">
									<input 
										type="radio" 
										name="preference" 
										value="password" 
										checked={data.profile?.loginPreference === 'password'} 
									/>
									<div>
										<strong>Account Password</strong>
										<span>Sign in with your email and password</span>
									</div>
								</label>
							</div>

							<button type="submit" class="btn-primary" style="align-self: flex-start; margin-top: 6px;">
								Save Preference
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}
	</main>
</div>

<style>
	/* ── Shell ──────────────────────────────────────────────── */
	.dash-shell {
		display: grid;
		grid-template-columns: 220px 1fr;
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}

	/* ── Sidebar ────────────────────────────────────────────── */
	.dash-sidebar {
		border-right: 1px solid var(--border);
		background: var(--bg-subtle);
		display: flex;
		flex-direction: column;
		height: calc(100vh - var(--nav-h));
		position: sticky;
		top: var(--nav-h);
	}

	.user-badge-header {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 14px 14px 12px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.user-avatar-sm {
		width: 28px;
		height: 28px;
		border-radius: 50%;
		background: var(--text-primary);
		color: var(--bg);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.6875rem;
		font-weight: 700;
		flex-shrink: 0;
	}

	.user-header-meta {
		display: flex;
		flex-direction: column;
		min-width: 0;
	}

	.user-header-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.user-header-role {
		font-size: 0.625rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--text-muted);
	}

	.user-header-role.teacher { color: #2563eb; }
	.user-header-role.admin { color: #16a34a; }
	.user-header-role.owner { color: #8b5cf6; }

	.sidebar-nav-scroll {
		flex: 1;
		padding: 12px 8px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		overflow-y: auto;
	}

	.nav-group {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.group-title {
		font-size: 0.5625rem;
		font-weight: 700;
		letter-spacing: 0.1em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 0 8px 4px;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		height: 32px;
		padding: 0 8px;
		background: none;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		position: relative;
		transition: background var(--t-fast), color var(--t-fast);
	}

	.nav-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.nav-btn.active {
		background: var(--bg);
		color: var(--text-primary);
		font-weight: 600;
	}

	.nav-btn.active::before {
		content: '';
		position: absolute;
		left: 0;
		top: 5px;
		bottom: 5px;
		width: 2px;
		background: var(--text-primary);
		border-radius: 99px;
	}

	.count-pill {
		margin-left: auto;
		font-size: 0.625rem;
		font-weight: 600;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		padding: 1px 5px;
		border-radius: 99px;
		color: var(--text-secondary);
	}

	.vault-tag {
		margin-left: auto;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.12);
		padding: 1px 5px;
		border-radius: 3px;
		text-transform: uppercase;
	}

	/* ── Canvas ─────────────────────────────────────────────── */
	.dash-canvas {
		padding: 2.25rem 2.75rem 6rem;
		max-width: 1060px;
		min-width: 0;
	}

	.tab-pane {
		display: flex;
		flex-direction: column;
	}

	.pane-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
		gap: 1rem;
		flex-wrap: wrap;
	}

	.pane-header h1 {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.pane-sub {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.alert-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		margin-bottom: 1.5rem;
	}

	.alert-banner.success {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: #15803d;
	}

	.alert-banner.error {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #b91c1c;
	}

	/* ── Rows & Lists ────────────────────────────────────────── */
	.row-list {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		overflow: hidden;
	}

	.list-row {
		display: flex;
		align-items: center;
		padding: 12px 16px;
		border-bottom: 1px solid var(--border-subtle);
		gap: 12px;
		transition: background var(--t-fast);
	}

	.list-row:last-child { border-bottom: none; }
	.list-row:hover { background: var(--bg-subtle); }

	.row-icon {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-sm);
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		flex-shrink: 0;
	}

	.row-main {
		flex: 1;
		min-width: 0;
	}

	.row-main h3, .row-main h4 {
		font-size: 0.875rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.row-sub-text {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.row-sub-text.green { color: #16a34a; }

	.progress-wrap {
		display: flex;
		align-items: center;
		gap: 8px;
		max-width: 220px;
	}

	.progress-bar {
		flex: 1;
		height: 4px;
		background: var(--bg-elevated);
		border-radius: 99px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--text-primary);
	}

	.progress-text {
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.btn-action {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 5px 11px;
		background: var(--text-primary);
		color: var(--bg);
		border: 1px solid var(--text-primary);
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		font-weight: 500;
		cursor: pointer;
		text-decoration: none;
	}

	.btn-action.secondary {
		background: var(--bg);
		color: var(--text-primary);
		border-color: var(--border);
	}

	.btn-action.secondary:hover { border-color: var(--border-strong); }

	.action-group {
		display: flex;
		gap: 6px;
	}

	/* ── Buttons ─────────────────────────────────────────────── */
	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		height: 32px;
		padding: 0 12px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		text-decoration: none;
	}

	.btn-subtle {
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 10px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		text-decoration: none;
	}

	.btn-subtle:hover { border-color: var(--border-strong); }

	.btn-danger {
		height: 34px;
		padding: 0 14px;
		background: #dc2626;
		color: #ffffff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		align-self: flex-start;
	}

	.btn-danger:disabled { opacity: 0.4; cursor: not-allowed; }

	/* ── KPI Box ─────────────────────────────────────────────── */
	.kpi-grid-4 {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		overflow: hidden;
	}

	.kpi-box {
		padding: 14px 18px;
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.kpi-box:last-child { border-right: none; }

	.kpi-box-label {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.kpi-box-val {
		font-size: 1.375rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	/* ── Grids & Cards ───────────────────────────────────────── */
	.grid-2-col {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.5rem;
	}

	.card-box {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 18px;
	}

	.card-box h3 {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.card-head-simple {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 4px;
	}

	.card-sub-text {
		font-size: 0.78125rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.form-col {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 12px;
	}

	.toggle-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 8px 10px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		cursor: pointer;
		gap: 10px;
	}

	.t-name {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.t-desc {
		display: block;
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.toggle-cb {
		width: 16px;
		height: 16px;
		accent-color: var(--text-primary);
		cursor: pointer;
		flex-shrink: 0;
	}

	.field-sm {
		display: flex;
		flex-direction: column;
		gap: 3px;
	}

	.field-sm label {
		font-size: 0.71875rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.inp-text {
		height: 32px;
		padding: 0 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: var(--text-primary);
		outline: none;
	}

	.inp-text:focus { border-color: var(--border-strong); background: var(--bg); }

	.inp-code {
		padding: 8px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		font-family: ui-monospace, monospace;
		color: var(--text-primary);
		outline: none;
	}

	.tab-strip-sm {
		display: flex;
		gap: 12px;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 8px;
	}

	.tab-btn-sm {
		background: none;
		border: none;
		padding: 4px 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
		cursor: pointer;
		position: relative;
	}

	.tab-btn-sm.active {
		color: var(--text-primary);
		font-weight: 600;
	}

	.tab-btn-sm.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--text-primary);
	}

	/* ── Table ───────────────────────────────────────────────── */
	.table-container {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		overflow: hidden;
	}

	.admin-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.admin-table th {
		text-align: left;
		padding: 8px 14px;
		background: var(--bg-subtle);
		border-bottom: 1px solid var(--border);
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.admin-table td {
		padding: 10px 14px;
		border-bottom: 1px solid var(--border-subtle);
	}

	.admin-table tr:last-child td { border-bottom: none; }

	.table-user-cell {
		display: flex;
		flex-direction: column;
	}

	.user-name-bold {
		font-weight: 600;
		color: var(--text-primary);
	}

	.user-email-muted {
		font-size: 0.71875rem;
		color: var(--text-muted);
	}

	.role-select {
		height: 26px;
		padding: 0 6px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--text-primary);
		cursor: pointer;
	}

	.pill-active {
		font-size: 0.6875rem;
		color: #16a34a;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid rgba(22, 163, 74, 0.2);
		padding: 2px 6px;
		border-radius: 3px;
	}

	.pill-banned {
		font-size: 0.6875rem;
		color: #dc2626;
		background: rgba(220, 38, 38, 0.08);
		border: 1px solid rgba(220, 38, 38, 0.2);
		padding: 2px 6px;
		border-radius: 3px;
	}

	.btn-table-action {
		height: 24px;
		padding: 0 8px;
		background: none;
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.71875rem;
		cursor: pointer;
		font-family: inherit;
		color: var(--text-secondary);
	}

	.btn-table-action.danger { color: #dc2626; border-color: rgba(220, 38, 38, 0.3); }

	.search-bar-wrap {
		position: relative;
		width: 240px;
	}

	.s-icon {
		position: absolute;
		left: 8px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}

	.search-inp-sm {
		width: 100%;
		height: 30px;
		padding: 0 8px 0 26px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--text-primary);
		outline: none;
	}

	/* ── Audit Stream ────────────────────────────────────────── */
	.audit-row {
		display: flex;
		gap: 10px;
		padding: 10px 14px;
		border-bottom: 1px solid var(--border-subtle);
		align-items: flex-start;
	}

	.audit-row:last-child { border-bottom: none; }

	.audit-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-primary);
		margin-top: 6px;
		flex-shrink: 0;
	}

	.audit-action-tag { font-size: 0.8125rem; color: var(--text-primary); font-weight: 600; }
	.audit-target { font-size: 0.75rem; color: var(--text-muted); }
	.audit-actor { font-size: 0.75rem; color: var(--text-secondary); margin-left: 4px; }
	.audit-timestamp { display: block; font-size: 0.6875rem; color: var(--text-muted); margin-top: 2px; }

	/* ── Settings Radio Stack ────────────────────────────────── */
	.radio-stack {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.radio-card {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 10px 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		cursor: pointer;
	}

	.radio-card input { margin-top: 3px; accent-color: var(--text-primary); }
	.radio-card strong { display: block; font-size: 0.8125rem; color: var(--text-primary); }
	.radio-card span { display: block; font-size: 0.71875rem; color: var(--text-muted); }

	.warning-box {
		display: flex;
		gap: 8px;
		padding: 10px;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--text-secondary);
	}

	.warning-box strong { color: var(--text-primary); display: block; margin-bottom: 2px; }

	.empty-state {
		padding: 3rem 1.5rem;
		text-align: center;
		color: var(--text-muted);
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.status-pill {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #16a34a;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid rgba(22, 163, 74, 0.2);
		padding: 3px 8px;
		border-radius: 99px;
	}

	.vault-tag-header {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		font-size: 0.625rem;
		font-weight: 700;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.1);
		border: 1px solid rgba(139, 92, 246, 0.25);
		padding: 2px 6px;
		border-radius: 3px;
		text-transform: uppercase;
		margin-bottom: 6px;
	}

	/* ── Mentoring Components & Styles ───────────────────────── */
	.subtab-pills {
		display: flex;
		gap: 6px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 3px;
		border-radius: var(--radius-sm);
	}

	.subtab-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 6px 12px;
		background: transparent;
		border: none;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		font-family: inherit;
		transition: all var(--t-fast);
	}

	.subtab-pill:hover {
		color: var(--text-primary);
	}

	.subtab-pill.active {
		background: var(--text-primary);
		color: var(--bg);
		font-weight: 600;
	}

	.session-row {
		display: flex;
		align-items: flex-start;
		gap: 14px;
		padding: 16px 18px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		transition: border-color var(--t-fast);
	}

	.session-row.session-live {
		border-color: #16a34a;
		background: rgba(22, 163, 74, 0.03);
	}

	.live-icon {
		color: #16a34a !important;
	}

	.live-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.6875rem;
		font-weight: 700;
		color: #16a34a;
		background: rgba(22, 163, 74, 0.1);
		border: 1px solid rgba(22, 163, 74, 0.25);
		padding: 2px 7px;
		border-radius: 99px;
		letter-spacing: 0.05em;
	}

	.pulse-dot {
		width: 6px;
		height: 6px;
		border-radius: 99px;
		background: #16a34a;
		animation: pulse 1.5s infinite;
	}

	@keyframes pulse {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(1.3); }
	}

	.session-meta-line {
		display: flex;
		flex-wrap: wrap;
		gap: 12px;
		font-size: 0.75rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.session-meta-line span {
		display: flex;
		align-items: center;
		gap: 4px;
	}

	.session-notes-preview {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 6px;
		line-height: 1.4;
	}

	.session-action-col {
		margin-left: auto;
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 6px;
	}

	.btn-join-live {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: #16a34a;
		color: #ffffff;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: opacity var(--t-fast);
	}

	.btn-join-live:hover {
		opacity: 0.9;
	}

	.btn-join-disabled {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 14px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		color: var(--text-muted);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		cursor: not-allowed;
		font-family: inherit;
	}

	.free-tag {
		color: #16a34a;
		font-weight: 600;
	}

	.status-muted-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		text-transform: capitalize;
	}

	/* Mentoring Opt-in Banner */
	.optin-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px 24px;
		margin-bottom: 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 24px;
		transition: border-color var(--t-fast);
	}
	.optin-card.is-live {
		border-color: #10b981;
		background: rgba(16, 185, 129, 0.02);
	}
	.optin-left {
		flex: 1;
		min-width: 0;
	}
	.optin-badge-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 8px;
	}
	.optin-badge {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.06em;
		padding: 3px 8px;
		border-radius: 4px;
		background: #f4f4f5;
		color: #71717a;
		border: 1px solid #e4e4e7;
	}
	.optin-badge.live {
		background: #ecfdf5;
		color: #047857;
		border-color: #a7f3d0;
	}
	.status-indicator-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #a1a1aa;
	}
	.status-indicator-dot.live {
		background: #10b981;
	}
	.optin-public-link {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		text-decoration: underline;
		letter-spacing: -0.01em;
	}
	.optin-title {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.optin-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}
	.optin-right {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
		gap: 8px;
		flex-shrink: 0;
	}
	.optin-alert-msg {
		font-size: 0.75rem;
		font-weight: 600;
		color: #047857;
	}
	.btn-optin-toggle {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: 6px;
		padding: 8px 16px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		transition: background var(--t-fast);
	}
	.btn-optin-toggle:hover {
		background: #27272a;
	}
	.btn-optin-toggle.active {
		background: #ef4444;
		color: #fff;
	}
	.btn-optin-toggle.active:hover {
		background: #dc2626;
	}

	/* Calendar Styles */
	.mentoring-cal-container {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
	}

	.cal-controls-bar {
		padding: 16px 20px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		border-bottom: 1px solid var(--border);
		background: var(--bg-surface);
	}

	.cal-month-nav {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.btn-cal-arrow {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px 6px;
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
	}

	.btn-cal-arrow:hover {
		color: var(--text-primary);
		border-color: var(--text-muted);
	}

	.cal-month-title {
		font-size: 0.9375rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}

	.cal-tip {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	.month-calendar-grid {
		display: grid;
		grid-template-columns: repeat(7, 1fr);
		background: var(--border-subtle);
		gap: 1px;
	}

	.cal-day-header {
		background: var(--bg-surface);
		padding: 10px;
		text-align: center;
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.cal-cell {
		background: var(--bg);
		min-height: 90px;
		padding: 8px;
		display: flex;
		flex-direction: column;
		cursor: pointer;
		transition: background var(--t-fast);
	}

	.cal-cell:hover {
		background: var(--bg-surface);
	}

	.cal-cell.empty {
		background: var(--bg-surface);
		cursor: default;
	}

	.cal-cell-day {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 6px;
	}

	.cal-cell-chips {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.cal-win-chip {
		font-size: 0.6875rem;
		padding: 3px 6px;
		background: rgba(37, 99, 235, 0.08);
		border: 1px solid rgba(37, 99, 235, 0.2);
		border-radius: 3px;
		color: #2563eb;
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.cal-win-chip.booked {
		background: rgba(22, 163, 74, 0.1);
		border-color: rgba(22, 163, 74, 0.25);
		color: #16a34a;
	}

	.win-chip-count {
		font-size: 0.625rem;
		font-weight: 700;
		background: #16a34a;
		color: #ffffff;
		border-radius: 99px;
		padding: 0 4px;
	}

	/* Day Drawer */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 900;
		backdrop-filter: blur(2px);
	}

	.day-detail-drawer {
		position: fixed;
		top: 0;
		right: 0;
		bottom: 0;
		width: 100%;
		max-width: 440px;
		background: var(--bg-surface);
		border-left: 1px solid var(--border);
		z-index: 1000;
		display: flex;
		flex-direction: column;
		box-shadow: -8px 0 32px rgba(0, 0, 0, 0.4);
		animation: slideIn 0.2s ease-out;
	}

	.day-drawer-header {
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
	}

	.day-drawer-body {
		padding: 24px;
		overflow-y: auto;
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.day-wins-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-top: 8px;
	}

	.day-win-card {
		padding: 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
	}

	.win-time-block {
		display: flex;
		align-items: center;
		justify-content: space-between;
		font-size: 0.8125rem;
	}

	.win-durations-pills {
		display: flex;
		gap: 4px;
		margin: 6px 0;
	}

	.win-meta-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-top: 8px;
		border-top: 1px solid var(--border-subtle);
		font-size: 0.75rem;
	}

	.m-count {
		color: var(--text-secondary);
	}

	.btn-cancel-win {
		background: transparent;
		border: none;
		color: #ef4444;
		font-size: 0.6875rem;
		cursor: pointer;
		font-weight: 500;
	}

	.btn-cancel-win:hover {
		text-decoration: underline;
	}

	.add-win-form {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 18px;
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.add-win-form h4 {
		font-size: 0.875rem;
		font-weight: 600;
		margin: 0;
	}

	.presets-block {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.presets-label {
		font-size: 0.6875rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-muted);
	}

	.presets-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.preset-btn {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 4px;
		padding: 4px 8px;
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all var(--t-fast);
	}

	.preset-btn:hover {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
	}

	.durations-toggle-row {
		display: flex;
		gap: 8px;
	}

	.dur-toggle-btn {
		flex: 1;
		padding: 8px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		color: var(--text-secondary);
		cursor: pointer;
		font-family: inherit;
	}

	.dur-toggle-btn.active {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
		font-weight: 600;
	}

	/* Pricing Tiers */
	.pricing-tiers-list {
		display: flex;
		flex-direction: column;
		gap: 14px;
		margin-top: 1.5rem;
	}

	.pricing-tier-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 14px 18px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
	}

	.tier-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.tier-sub {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.tier-input-wrap {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 4px 8px;
	}

	.currency-sym {
		font-size: 0.8125rem;
		color: var(--text-muted);
		font-weight: 600;
	}

	.tier-inp {
		width: 80px;
		background: transparent;
		border: none;
		font-size: 0.9375rem;
		font-weight: 700;
		color: var(--text-primary);
		outline: none;
		text-align: right;
	}

	.coupon-create-bar {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 1.5rem;
	}

	.success-banner-sm {
		padding: 8px 12px;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid rgba(22, 163, 74, 0.25);
		border-radius: var(--radius-sm);
		color: #16a34a;
		font-size: 0.8125rem;
		display: flex;
		align-items: center;
		gap: 6px;
		margin-top: 12px;
	}

	/* Admin & Teacher Modals */
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.6);
		z-index: 999;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 16px;
		backdrop-filter: blur(4px);
	}

	.modal-card {
		width: 100%;
		max-width: 520px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		overflow: hidden;
		box-shadow: 0 20px 48px rgba(0, 0, 0, 0.4);
		animation: modalFadeIn 0.15s ease-out;
	}

	@keyframes modalFadeIn {
		from { opacity: 0; transform: scale(0.96); }
		to { opacity: 1; transform: scale(1); }
	}

	.modal-header {
		padding: 18px 22px;
		border-bottom: 1px solid var(--border);
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.modal-header h3 {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.btn-modal-close {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 4px;
		border-radius: 4px;
	}
	.btn-modal-close:hover { color: var(--text-primary); }

	.modal-body {
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.modal-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin: 0;
	}

	.modal-footer {
		padding: 16px 22px;
		border-top: 1px solid var(--border);
		background: var(--bg);
		display: flex;
		justify-content: flex-end;
		gap: 10px;
	}

	.cert-title-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 4px;
	}

	.badge-active {
		background: #ecfdf5 !important;
		color: #047857 !important;
		border-color: #a7f3d0 !important;
	}

	.btn-action.danger {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.2);
	}
	.btn-action.danger:hover {
		background: rgba(239, 68, 68, 0.08);
		border-color: #ef4444;
	}

	.admin-modal-card {
		position: fixed;
		top: 50%;
		left: 50%;
		transform: translate(-50%, -50%);
		width: 100%;
		max-width: 480px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 24px;
		z-index: 1000;
		box-shadow: 0 16px 40px rgba(0, 0, 0, 0.5);
	}

	.modal-actions-row {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 1rem;
	}

	.admin-action-group {
		display: flex;
		gap: 6px;
		justify-content: flex-end;
	}

	@media (max-width: 860px) {
		.dash-shell { grid-template-columns: 1fr; }
		.dash-sidebar { display: none; }
		.dash-canvas { padding: 1.5rem; }
		.grid-2-col { grid-template-columns: 1fr; }
		.kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
	}
</style>

