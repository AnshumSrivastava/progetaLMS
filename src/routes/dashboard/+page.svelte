<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
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
		Trash2,
		FileSpreadsheet,
		Eye,
		HelpCircle,
		Gamepad2,
		Smartphone,
		Laptop,
		Sparkles,
		MessageSquare,
		Copy,
		Edit,
		Share2,
		Send
	} from 'lucide-svelte';
	import LaunchpadLogo from '$lib/components/ui/LaunchpadLogo.svelte';
	import { APP_NAME } from '$lib/shared/constants';
	import { goto } from '$app/navigation';
	import { page } from '$app/stores';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	// 3-Tier Workspace Modes: 'owner' (Admin/Owner Command Center), 'teacher' (Instructor Studio), 'learner' (Student View)
	let workspaceMode = $state<'owner' | 'teacher' | 'learner'>(
		data.isAdmin ? 'owner' :
		data.isTeacher ? 'teacher' : 'learner'
	);

	// Default tab selection based on primary role & workspace mode
	let activeTab = $state(
		data.isAdmin ? 'admin_cockpit' :
		data.isTeacher ? 'teacher_overview' :
		'my_overview'
	);

	// Collapsible Sidebar State
	let isSidebarCollapsed = $state(false);

	function updateSidebarWidth(collapsed: boolean) {
		if (typeof document !== 'undefined') {
			document.documentElement.style.setProperty('--dash-sidebar-w', collapsed ? '68px' : '240px');
		}
	}

	function toggleSidebar() {
		isSidebarCollapsed = !isSidebarCollapsed;
		try {
			localStorage.setItem('launchpad_sidebar_collapsed', String(isSidebarCollapsed));
		} catch {}
		updateSidebarWidth(isSidebarCollapsed);
	}

	// User search & role filter in admin tab
	let userSearch = $state('');
	let adminRoleFilter = $state<'all' | 'student' | 'teacher' | 'admin' | 'owner' | 'banned'>('all');
	let selectedUserIdForDrawer = $state<string | null>(null);
	let isUserDrawerOpen = $state(false);

	let selectedUserForDrawer = $derived(
		selectedUserIdForDrawer
			? (data.admin?.allUsers || []).find((u: any) => u.id === selectedUserIdForDrawer) || null
			: null
	);

	let filteredUsers = $derived(
		(data.admin?.allUsers || []).filter((u: any) => {
			// Role filter
			if (adminRoleFilter === 'banned') {
				if (!u.banned) return false;
			} else if (adminRoleFilter !== 'all') {
				if (u.role !== adminRoleFilter) return false;
			}

			// Text search
			if (!userSearch.trim()) return true;
			const q = userSearch.toLowerCase();
			return (
				(u.name && u.name.toLowerCase().includes(q)) ||
				u.email.toLowerCase().includes(q) ||
				u.role.toLowerCase().includes(q) ||
				u.id.toLowerCase().includes(q)
			);
		})
	);

	function openUserDrawer(u: any) {
		selectedUserIdForDrawer = u.id;
		isUserDrawerOpen = true;
	}

	function closeUserDrawer() {
		isUserDrawerOpen = false;
		selectedUserIdForDrawer = null;
	}

	// Template editor state
	let selectedTemplate = $state(data.admin.templates[0] || { id: 'welcome', subject: '', body: '' });

	// Owner vault state
	let selectedAdminId = $state(data.admin.eligibleAdmins[0]?.id || '');
	let confirmOwnerEmail = $state('');
	let selectedAdmin = $derived(data.admin.eligibleAdmins.find(a => a.id === selectedAdminId));

	// ── MENTORING CLIENT STATE & DYNAMIC 5-MIN TIMER ───────────
	let currentTime = $state(Date.now());

	function switchWorkspaceMode(mode: 'owner' | 'teacher' | 'learner') {
		workspaceMode = mode;
		try {
			localStorage.setItem('launchpad_workspace_mode', mode);
		} catch {}
		if (mode === 'owner') {
			activeTab = 'admin_cockpit';
		} else if (mode === 'teacher') {
			activeTab = 'teacher_overview';
		} else {
			activeTab = 'my_overview';
		}
	}

	onMount(() => {
		try {
			const saved = localStorage.getItem('launchpad_sidebar_collapsed');
			if (saved !== null) {
				isSidebarCollapsed = saved === 'true';
			}
			const savedMode = localStorage.getItem('launchpad_workspace_mode');
			if (savedMode === 'owner' && data.isAdmin) {
				workspaceMode = 'owner';
			} else if (savedMode === 'teacher' && data.isTeacher) {
				workspaceMode = 'teacher';
			} else if (savedMode === 'learner') {
				workspaceMode = 'learner';
			}
		} catch {}
		updateSidebarWidth(isSidebarCollapsed);

		// Synchronize tab and workspace mode from query parameters if present
		const urlParams = new URLSearchParams(window.location.search);
		const tabParam = urlParams.get('tab');
		const modeParam = urlParams.get('mode');
		if (tabParam) {
			activeTab = tabParam;
			if (tabParam.startsWith('admin_') || tabParam === 'owner_vault') {
				workspaceMode = 'owner';
			} else if (tabParam.startsWith('teacher_')) {
				workspaceMode = 'teacher';
			} else if (tabParam.startsWith('my_')) {
				workspaceMode = 'learner';
			}
		} else if (modeParam === 'owner' && data.isAdmin) {
			workspaceMode = 'owner';
			if (!activeTab.startsWith('admin_') && activeTab !== 'owner_vault') activeTab = 'admin_cockpit';
		} else if (modeParam === 'teacher' && data.isTeacher) {
			workspaceMode = 'teacher';
			if (activeTab.startsWith('my_') || activeTab.startsWith('admin_')) activeTab = 'teacher_overview';
		} else if (modeParam === 'learner') {
			workspaceMode = 'learner';
			if (activeTab.startsWith('teacher_') || activeTab.startsWith('admin_')) activeTab = 'my_overview';
		}

		const timer = setInterval(() => {
			currentTime = Date.now();
		}, 1000);
		return () => clearInterval(timer);
	});

	onDestroy(() => {
		if (typeof document !== 'undefined') {
			document.documentElement.style.removeProperty('--dash-sidebar-w');
		}
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

	function formatDateLabel(dateStr: string) {
		if (!dateStr) return '';
		const d = new Date(dateStr + 'T00:00:00');
		return new Intl.DateTimeFormat('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }).format(d);
	}

	// ── TEACHER STUDIO STATE & MODALS ─────────────────────────
	let showCreateCourseModal = $state(false);
	let newCourseTitle = $state('');
	let newCourseFormat = $state<'self_paced' | 'live_batch'>('self_paced');

	let showEditCoursePriceModal = $state(false);
	let selectedCourseForPrice = $state<any>(null);
	let editCoursePrice = $state('0');
	let editCourseCurrency = $state('INR');

	let showCreateClassModal = $state(false);
	let newClassName = $state('');
	let newClassCourseId = $state('');

	let showInviteModal = $state(false);
	let inviteEmail = $state('');
	let inviteCohortId = $state('');
	let inviteDiscountType = $state<'percent' | 'flat'>('percent');
	let inviteDiscountValue = $state('20');

	let showCreateCouponModal = $state(false);
	let newCouponCodeInput = $state('');
	let newCouponTypeInput = $state<'percent' | 'flat'>('percent');
	let newCouponValueInput = $state('15');
	let newCouponLimitInput = $state('50');

	let broadcastCohortId = $state('all');
	let broadcastSubject = $state('');
	let broadcastMessage = $state('');
	let copiedCohortId = $state<string | null>(null);

	function copyCohortInviteLink(cohortId: string) {
		if (typeof window === 'undefined') return;
		const url = `${window.location.origin}/batches/${cohortId}`;
		navigator.clipboard.writeText(url);
		copiedCohortId = cohortId;
		setTimeout(() => { copiedCohortId = null; }, 3000);
	}

	function openEditPriceModal(course: any) {
		selectedCourseForPrice = course;
		editCoursePrice = course.rawPrice !== undefined ? String(course.rawPrice) : '0';
		editCourseCurrency = course.rawCurrency || 'INR';
		showEditCoursePriceModal = true;
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

<div class="dash-shell" class:sidebar-collapsed={isSidebarCollapsed}>
	<!-- ── MODERN COLLAPSIBLE SIDEBAR ────────────────────────────── -->
	<aside class="dash-sidebar" class:collapsed={isSidebarCollapsed}>
		<!-- Brand Header Block (Aligned with website top navbar) -->
		<div class="brand-header-row" class:collapsed={isSidebarCollapsed}>
			{#if !isSidebarCollapsed}
				<a href="/" class="brand-link-dash" title="Launchpad Home">
					<LaunchpadLogo class="brand-dash-logo" />
					<span class="brand-text">Launchpad</span>
				</a>
				<button
					type="button"
					class="collapse-toggle-btn"
					onclick={toggleSidebar}
					title="Collapse sidebar"
					aria-label="Collapse sidebar"
				>
					<ChevronLeft size={16} />
				</button>
			{:else}
				<div class="brand-collapsed-container">
					<a href="/" class="brand-icon-box-link" title="Launchpad Home">
						<LaunchpadLogo class="brand-dash-logo sm" />
					</a>
					<button
						type="button"
						class="collapse-toggle-btn sm"
						onclick={toggleSidebar}
						title="Expand sidebar"
						aria-label="Expand sidebar"
					>
						<ChevronRight size={14} />
					</button>
				</div>
			{/if}
		</div>

		<nav class="sidebar-nav-scroll">
			{#if workspaceMode === 'owner' && data.isAdmin}
				<!-- ── OWNER & ADMIN COMMAND CENTER NAVIGATION ──────── -->
				<div class="nav-group">
					<span class="group-title">Command Center</span>
					<button class="nav-btn" class:active={activeTab === 'admin_cockpit'} onclick={() => activeTab = 'admin_cockpit'} title="Platform Overview & Modules">
						<LayoutDashboard size={18} /> <span>Platform Cockpit</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_users'} onclick={() => activeTab = 'admin_users'} title="User & Role Governance">
						<Users size={18} /> <span>User Governance</span>
						{#if (data.admin?.allUsers || []).length > 0}
							<span class="count-pill">{(data.admin?.allUsers || []).length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_mentoring'} onclick={() => activeTab = 'admin_mentoring'} title="Mentoring Oversight">
						<GraduationCap size={18} /> <span>Mentoring Oversight</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'admin_audit'} onclick={() => activeTab = 'admin_audit'} title="Security & Audit Logs">
						<ShieldAlert size={18} /> <span>Audit & Security Logs</span>
					</button>
				</div>

				<!-- Owner Vault Section (Strictly Owner) -->
				{#if data.isOwner}
					<div class="nav-group">
						<span class="group-title">Root Governance</span>
						<button class="nav-btn vault-btn" class:active={activeTab === 'owner_vault'} onclick={() => activeTab = 'owner_vault'} title="Owner Vault">
							<Lock size={18} /> <span>Owner Vault</span>
							<span class="vault-tag">Root</span>
						</button>
					</div>
				{/if}

			{:else if workspaceMode === 'teacher' && data.isTeacher}
				<!-- ── INSTRUCTOR STUDIO NAVIGATION ─────────────── -->
				<div class="nav-group">
					<span class="group-title">Studio Workspace</span>
					<button class="nav-btn" class:active={activeTab === 'teacher_overview'} onclick={() => activeTab = 'teacher_overview'} title="Studio Overview">
						<LayoutDashboard size={18} /> <span>Studio Overview</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_courses'} onclick={() => activeTab = 'teacher_courses'} title="Courses & Batches">
						<BookOpenCheck size={18} /> <span>Courses & Batches</span>
						{#if data.teacher.courses.length > 0}
							<span class="count-pill">{data.teacher.courses.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_classes'} onclick={() => activeTab = 'teacher_classes'} title="Classes & Cohorts">
						<Users2 size={18} /> <span>Classes & Cohorts</span>
						{#if data.teacher.classes.length > 0}
							<span class="count-pill">{data.teacher.classes.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_students'} onclick={() => activeTab = 'teacher_students'} title="Enrolled Students">
						<Users size={18} /> <span>Enrolled Students</span>
						{#if data.teacher.stats.totalStudents > 0}
							<span class="count-pill">{data.teacher.stats.totalStudents}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_mentoring'} onclick={() => { activeTab = 'teacher_mentoring'; loadTeacherCoupons(); }} title="1-on-1 Mentoring">
						<Video size={18} /> <span>1-on-1 Mentoring</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_certifications'} onclick={() => activeTab = 'teacher_certifications'} title="Certifications">
						<Award size={18} /> <span>Certifications</span>
						{#if (data.teacher.certifications || []).length > 0}
							<span class="count-pill">{data.teacher.certifications.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_coupons'} onclick={() => activeTab = 'teacher_coupons'} title="Coupons & Promos">
						<Tag size={18} /> <span>Coupons & Promos</span>
						{#if data.teacher.coupons.length > 0}
							<span class="count-pill">{data.teacher.coupons.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_communications'} onclick={() => activeTab = 'teacher_communications'} title="Announcements">
						<Mail size={18} /> <span>Announcements</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'teacher_settings'} onclick={() => activeTab = 'teacher_settings'} title="Profile & Bio">
						<Settings size={18} /> <span>Studio Settings</span>
					</button>
				</div>
			{:else}
				<!-- ── LEARNER NAVIGATION ────────────────────────── -->
				<div class="nav-group">
					<span class="group-title">Learner Portal</span>
					<button class="nav-btn" class:active={activeTab === 'my_overview'} onclick={() => activeTab = 'my_overview'} title="Overview">
						<LayoutDashboard size={18} /> <span>Dashboard</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_courses'} onclick={() => activeTab = 'my_courses'} title="Courses">
						<GraduationCap size={18} /> <span>Courses</span>
						{#if data.learner.ownedCourses.length > 0}
							<span class="count-pill">{data.learner.ownedCourses.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_resources'} onclick={() => activeTab = 'my_resources'} title="Lessons">
						<BookOpenCheck size={18} /> <span>Lessons</span>
						{#if data.learner.ownedResources.length > 0}
							<span class="count-pill">{data.learner.ownedResources.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_certs'} onclick={() => activeTab = 'my_certs'} title="Assessments">
						<FileBadge2 size={18} /> <span>Assessments</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_mentoring'} onclick={() => activeTab = 'my_mentoring'} title="1-on-1 Mentoring">
						<Video size={18} /> <span>1-on-1 Mentoring</span>
						{#if (data.learner.mentoringBookings || []).length > 0}
							<span class="count-pill">{data.learner.mentoringBookings.length}</span>
						{/if}
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_classes'} onclick={() => activeTab = 'my_classes'} title="Cohort Batches">
						<Users2 size={18} /> <span>Cohort Batches</span>
					</button>
					<button class="nav-btn" class:active={activeTab === 'my_events'} onclick={() => activeTab = 'my_events'} title="Live Events">
						<Calendar size={18} /> <span>Live Events</span>
					</button>
				</div>
			{/if}

			<!-- ── 3-TIER WORKSPACE SWITCHER (For Admin / Owner / Teachers) ──────── -->
			{#if data.isTeacher}
				<div class="nav-group mode-toggle-group" style="margin-top: auto; padding-top: 10px; border-top: 1px solid var(--border-subtle);">
					<span class="group-title" style="padding-bottom: 2px;">Switch Workspace</span>
					
					<!-- Owner / Admin Mode Option -->
					{#if data.isAdmin}
						<button
							type="button"
							class="workspace-switch-btn admin-switch"
							class:active-mode={workspaceMode === 'owner'}
							onclick={() => switchWorkspaceMode('owner')}
							title="Switch to Owner Command Center"
						>
							<Shield size={15} />
							<span>{data.isOwner ? 'Owner Center' : 'Admin Center'}</span>
						</button>
					{/if}

					<!-- Teacher Studio Option -->
					<button
						type="button"
						class="workspace-switch-btn teacher-switch"
						class:active-mode={workspaceMode === 'teacher'}
						onclick={() => switchWorkspaceMode('teacher')}
						title="Switch to Instructor Studio"
					>
						<Sparkles size={15} />
						<span>Instructor Studio</span>
					</button>

					<!-- Learner View Option -->
					<button
						type="button"
						class="workspace-switch-btn learner-switch"
						class:active-mode={workspaceMode === 'learner'}
						onclick={() => switchWorkspaceMode('learner')}
						title="Switch to Personal Learner View"
					>
						<GraduationCap size={15} />
						<span>Learner View</span>
					</button>
				</div>
			{/if}

			<!-- ── User Settings ───────────────────────────────── -->
			<div class="nav-group settings-nav-group" style="{data.isTeacher ? 'margin-top: 4px;' : 'margin-top: auto;'} padding-top: 6px; border-top: 1px solid var(--border-subtle);">
				<button class="nav-btn" class:active={activeTab === 'settings'} onclick={() => activeTab = 'settings'} title="Settings">
					<Settings size={18} /> <span>Account Settings</span>
				</button>
			</div>
		</nav>
	</aside>

	<!-- ── MAIN CONTENT CANVAS ─────────────────────────────── -->
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

		<!-- ── DUAL-HANDSHAKE BATCH TRANSFER BANNER ─────────────── -->
		{#if data.learner?.pendingTransfer}
			<div class="transfer-offer-banner mb-6 p-4 rounded-[var(--radius-md)] bg-indigo-500/10 border border-indigo-500/30">
				<div class="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
					<div class="flex items-start gap-3">
						<div class="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 mt-0.5">
							<RotateCcw size={18} />
						</div>
						<div>
							<div class="flex items-center gap-2">
								<span class="text-[11px] font-mono font-bold tracking-wider uppercase text-indigo-400">BATCH TRANSFER OFFER</span>
								<span class="text-[11px] text-[var(--text-muted)] font-mono">
									Expires {new Date(data.learner.pendingTransfer.expiresAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
								</span>
							</div>
							<h3 class="text-[15px] font-bold text-[var(--text-primary)] mt-0.5">
								Transfer to: {data.learner.pendingTransfer.toCohortName}
							</h3>
							<p class="text-[12.5px] text-[var(--text-secondary)] mt-1">
								Mentor <strong>{data.learner.pendingTransfer.mentorName || 'Instructor'}</strong> has invited you to transfer from <em>{data.learner.pendingTransfer.fromCohortName}</em> into <strong>{data.learner.pendingTransfer.toCohortName}</strong>.
							</p>
							<div class="flex flex-wrap items-center gap-4 mt-2 text-[12px] text-[var(--text-secondary)] font-mono">
								{#if data.learner.pendingTransfer.toCohortSchedule}
									<span class="flex items-center gap-1.5"><Clock size={12} class="text-indigo-400" /> {data.learner.pendingTransfer.toCohortSchedule}</span>
								{/if}
								{#if data.learner.pendingTransfer.reason}
									<span class="text-[var(--text-muted)] italic">Note: "{data.learner.pendingTransfer.reason}"</span>
								{/if}
							</div>
						</div>
					</div>

					<div class="flex items-center gap-2 shrink-0 self-end md:self-center">
						<form method="POST" action="?/acceptBatchTransfer" use:enhance>
							<input type="hidden" name="requestId" value={data.learner.pendingTransfer.id} />
							<button type="submit" class="px-4 py-2 rounded-[var(--radius-sm)] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[13px] transition-colors shadow-sm">
								Accept Transfer
							</button>
						</form>
						<form method="POST" action="?/declineBatchTransfer" use:enhance>
							<input type="hidden" name="requestId" value={data.learner.pendingTransfer.id} />
							<button type="submit" class="px-3 py-2 rounded-[var(--radius-sm)] bg-[var(--surface)] hover:bg-[var(--bg-subtle)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px] transition-colors">
								Decline
							</button>
						</form>
					</div>
				</div>
			</div>
		{/if}

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 1: MY OVERVIEW (SKILLUP INSPIRED DESIGN)         -->
		<!-- ════════════════════════════════════════════════════ -->
		{#if activeTab === 'my_overview'}
			<div class="overview-pane">
				<!-- Welcome Greeting Banner -->
				<div class="dash-welcome-row">
					<div class="dash-welcome-avatar">
						{#if (data.user as any)?.image}
							<img src={(data.user as any).image} alt={data.user.name} class="w-full h-full object-cover rounded-full" />
						{:else}
							<span>{data.user.name ? data.user.name.slice(0, 2).toUpperCase() : 'LP'}</span>
						{/if}
					</div>
					<div>
						<h1 class="dash-welcome-title">Welcome Back {data.user.name ? data.user.name.split(' ')[0] : 'Learner'}</h1>
						<p class="dash-welcome-sub">Here overview of your course</p>
					</div>
				</div>

				<!-- 3 Quick Stat Cards Row -->
				<div class="dash-stats-row">
					<!-- Card 1: Total Enrolled -->
					<div class="dash-stat-box">
						<div class="dash-stat-top">
							<span class="dash-stat-label">Total Enrolled</span>
							<div class="dash-stat-badge">
								<Eye size={14} />
							</div>
						</div>
						<div class="dash-stat-number">{data.learner.ownedCourses.length}</div>
					</div>

					<!-- Card 2: Completed -->
					<div class="dash-stat-box">
						<div class="dash-stat-top">
							<span class="dash-stat-label">Completed</span>
							<div class="dash-stat-badge">
								<Check size={14} strokeWidth={2.5} />
							</div>
						</div>
						<div class="dash-stat-number">{data.learner.issuedCertificates.length}</div>
					</div>

					<!-- Card 3: Quiz Score / Credentials -->
					<div class="dash-stat-box">
						<div class="dash-stat-top">
							<span class="dash-stat-label">Quiz Score</span>
							<div class="dash-stat-badge">
								<HelpCircle size={14} />
							</div>
						</div>
						<div class="dash-stat-number">{data.learner.avgQuizScore || '—'}</div>
					</div>
				</div>

				<!-- Main 2-Column Split: Recent Enrolled Course (Left) + Daily Progress (Right) -->
				<div class="dash-grid-split">
					<!-- Left Column: Recent Enrolled Course -->
					<div class="dash-courses-panel">
						<div class="dash-sec-head">
							<h2 class="dash-sec-title">Recent enrolled course</h2>
						</div>

						<div class="dash-course-cards-wrap">
							{#if data.learner.liveBatches && data.learner.liveBatches.filter(h => h.hasAccess).length > 0}
								{#each data.learner.liveBatches.filter(h => h.hasAccess).slice(0, 1) as liveHub}
									<div
										class="dash-card-item border border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
										onclick={() => activeTab = 'my_classes'}
										role="button"
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && (activeTab = 'my_classes')}
									>
										<div class="dash-card-icon-sq text-emerald-400 bg-emerald-500/10">
											<Video size={18} />
										</div>
										<div class="flex-1 min-w-0 pr-2">
											<div class="flex items-center gap-1.5 mb-0.5">
												<span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
												<span class="text-[10px] font-mono font-bold text-emerald-400 uppercase">Live Cohort Batch</span>
											</div>
											<h3 class="dash-card-title truncate">{liveHub.batch.courseTitle}</h3>
											<div class="text-[11px] text-[var(--text-secondary)] font-mono">{liveHub.batch.name}</div>
										</div>
										<span class="text-[11px] font-semibold text-indigo-400 shrink-0">Open Hub &rarr;</span>
									</div>
								{/each}
							{/if}

							{#if data.learner.ownedCourses.length > 0}
								{#each data.learner.ownedCourses.slice(0, 2) as course, idx}
									<div
										class="dash-card-item"
										onclick={() => goto(`/learn/${course.id}`)}
										role="button"
										tabindex="0"
										onkeydown={(e) => e.key === 'Enter' && goto(`/learn/${course.id}`)}
									>
										<div class="dash-card-icon-sq">
											{#if idx % 2 === 0}
												<Smartphone size={18} />
											{:else}
												<Gamepad2 size={18} />
											{/if}
										</div>
										<h3 class="dash-card-title">{course.title}</h3>
										<div class="dash-progress-meta">
											<div class="dash-mini-bar">
												<div class="dash-mini-fill" style="width: 25%"></div>
											</div>
											<span class="dash-lesson-txt">Enrolled</span>
										</div>
									</div>
								{/each}
							{:else}
								<div class="dash-empty-prompt">
									<BookOpen size={24} class="text-[var(--text-muted)] mb-2" />
									<p class="text-[13px] text-[var(--text-secondary)] mb-3">No enrolled courses yet.</p>
									<a href="/catalog" class="dash-btn-explore-sm">Explore Courses</a>
								</div>
							{/if}
						</div>
					</div>

					<!-- Right Column: Daily Progress Widget -->
					<div class="dash-daily-panel">
						<div class="dash-daily-box">
							<h3 class="dash-daily-heading">Active courses</h3>
							<div class="dash-daily-tags">
								{#if data.learner.ownedCourses.length > 0}
									{#each data.learner.ownedCourses.slice(0, 3) as c}
										<div class="dash-daily-pill" onclick={() => goto(`/learn/${c.id}`)} role="button" tabindex="0">
											<span class="dash-daily-icon"><BookOpen size={14} /></span>
											<span class="dash-daily-label">{c.title}</span>
										</div>
									{/each}
								{:else}
									<div class="dash-daily-empty">
										<p class="text-[12px] text-[var(--text-muted)]">Enroll in a course to track your active learning progress.</p>
									</div>
								{/if}
							</div>
						</div>
					</div>
				</div>

				<!-- Bottom: Upcoming Class / Recent Enrolled Class -->
				<div class="dash-upcoming-section">
					<div class="dash-upcoming-header">
						<h2 class="dash-sec-title">Upcoming Class</h2>
						<div class="dash-upcoming-controls">
							<button class="dash-chip-active">All</button>
							<button class="dash-chip-btn" onclick={() => activeTab = 'my_events'} title="Search events">
								<Search size={14} />
							</button>
							<button class="dash-chip-btn" onclick={() => activeTab = 'my_events'} title="Explore workshops">
								<Plus size={14} />
							</button>
						</div>
					</div>

					{#if data.learner.upcomingEvents && data.learner.upcomingEvents.length > 0}
						<div class="dash-upcoming-grid">
							{#each data.learner.upcomingEvents.slice(0, 2) as ev}
								{@const isReg = data.learner.registeredEventIds.includes(ev.id)}
								<div class="dash-event-card">
									<div class="dash-event-left">
										<span class="dash-event-tag">LIVE WORKSHOP</span>
										<h3 class="dash-event-title">{ev.title}</h3>
										<span class="dash-event-time">
											{new Date(ev.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} IST
										</span>
									</div>
									<div class="dash-event-right">
										{#if isReg}
											<a href={ev.link || '#'} target="_blank" class="dash-btn-joined">Join Live &rarr;</a>
										{:else}
											<form method="POST" action="?/registerEvent">
												<input type="hidden" name="eventId" value={ev.id} />
												<button type="submit" class="dash-btn-register">Register Free</button>
											</form>
										{/if}
									</div>
								</div>
							{/each}
						</div>
					{:else}
						<div class="p-6 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] text-center text-[var(--text-secondary)] text-[13px]">
							No live workshops scheduled at this time.
						</div>
					{/if}
				</div>
			</div>
		{:else if activeTab === 'my_courses'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono font-bold">MY LEARNING</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">My Courses</h1>
						<p class="pane-sub">Continue your learning and manage your enrolled courses.</p>
					</div>
					<a href="/courses" class="btn-subtle">Browse courses &rarr;</a>
				</header>

				<!-- Enrolled Courses -->
				<div class="mb-8">
					<div class="flex items-baseline justify-between mb-3">
						<h2 class="text-[1.1rem] font-bold text-[var(--text-primary)]">Enrolled Courses</h2>
						<span class="meta-mono">{data.learner.ownedCourses.length} TOTAL</span>
					</div>

					<div class="row-list">
						{#each data.learner.ownedCourses as course}
							<div class="list-row">
								<div class="row-icon"><BookOpen size={16} /></div>
								<div class="row-main">
									<h3>{course.title}</h3>
									<div class="progress-wrap">
										<div class="progress-bar"><div class="progress-fill" style="width: 25%"></div></div>
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
								<a href="/courses" class="btn-primary">Explore Courses</a>
							</div>
						{/each}
					</div>
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
		<!-- TAB 3: LIVE EVENTS (SECTION 27)                       -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_events'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono">SCHEDULED WORKSHOPS</span>
						<h1 class="text-[1.5rem] font-bold text-[var(--text-primary)] mt-1">Live Events & Workshops</h1>
						<p class="pane-sub">Upcoming interactive sessions, practitioner AMAs, and cohort discussions.</p>
					</div>
				</header>

				<div class="space-y-3">
					{#each data.learner.upcomingEvents as ev}
						{@const isRegistered = data.learner.registeredEventIds.includes(ev.id)}
						<div class="p-4 bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-colors hover:border-[var(--border-strong)]">
							<div class="flex items-start gap-3.5">
								<div class="w-10 h-10 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0 text-[var(--text-primary)]">
									<Calendar size={18} />
								</div>
								<div>
									<div class="flex items-center gap-2">
										<span class="meta-mono text-[10px]">LIVE WORKSHOP</span>
										{#if isRegistered}
										<span class="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[var(--color-surface-subtle)] text-[var(--color-text-secondary)] border border-[var(--color-border)]">REGISTERED</span>
										{/if}
									</div>
									<h3 class="text-[15px] font-bold text-[var(--text-primary)] mt-0.5">{ev.title}</h3>
									<span class="text-[12px] text-[var(--text-secondary)]">
										{new Date(ev.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
									</span>
								</div>
							</div>
							
							<div class="flex items-center gap-2 sm:self-center">
								{#if isRegistered}
									<a href={ev.link || '#'} target="_blank" class="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--surface)] border border-[var(--border-strong)] text-[12px] font-semibold text-[var(--text-primary)] hover:bg-[var(--surface-subtle)] transition-colors">
										Join Live Call &rarr;
									</a>
								{:else}
									<form method="POST" action="?/registerEvent">
										<input type="hidden" name="eventId" value={ev.id} />
										<button type="submit" class="px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--color-primary)] text-white text-[12px] font-semibold hover:bg-[var(--color-primary-hover)] transition-colors">
											Register Free
										</button>
									</form>
								{/if}
							</div>
						</div>
					{:else}
						<div class="p-12 text-center border border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] space-y-2">
							<Calendar size={28} class="mx-auto text-[var(--text-muted)]" />
							<h3 class="text-[14px] font-bold text-[var(--text-primary)]">No upcoming events</h3>
							<p class="text-[12px] text-[var(--text-secondary)] max-w-sm mx-auto">There are no live practitioner workshops scheduled at this moment. Check back soon.</p>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 4: COHORT CLASSES (SECTION 26)                    -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_classes'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono">LIVE CLASSROOMS</span>
						<h1 class="text-[1.5rem] font-bold text-[var(--text-primary)] mt-1">My Live Cohort Batches</h1>
						<p class="pane-sub">Access your external live class links, private WhatsApp/Teams community, and session recordings.</p>
					</div>
				</header>

				{#if data.learner.liveBatches && data.learner.liveBatches.length > 0}
					<div class="space-y-6">
						{#each data.learner.liveBatches as hub}
							{#if hub.isExpired}
								<!-- Expired 3-Month Retention Notice Card -->
								<div class="p-5 rounded-[var(--radius-md)] bg-[var(--surface)] border border-[var(--border)] opacity-75">
									<div class="flex items-center gap-2 text-amber-500 font-semibold text-[13px] mb-1">
										<Clock size={15} />
										<span>Batch Retention Period Concluded</span>
									</div>
									<h3 class="text-[15px] font-bold text-[var(--text-primary)]">
										{hub.courseTitle} — {hub.batchName}
									</h3>
									<p class="text-[12.5px] text-[var(--text-secondary)] mt-1 leading-relaxed">
										The 3-month access retention window following batch completion on {hub.completedAt ? new Date(hub.completedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : ''} has concluded. Live links and recordings for this batch are now archived.
									</p>
								</div>
							{:else if hub.hasAccess}
								<!-- Active Live Classroom Hub Card -->
								<div class="bg-[var(--surface)] border border-[var(--border)] rounded-[var(--radius-md)] p-6 transition-all hover:border-[var(--border-strong)] shadow-sm">
									<!-- Hub Header -->
									<div class="flex flex-col sm:flex-row sm:items-start justify-between gap-4 pb-5 border-b border-[var(--border)]">
										<div>
											<div class="flex items-center gap-2 mb-1.5">
												<span class="meta-mono text-[10px] text-indigo-400">LIVE CLASSROOM BATCH</span>
												<span class="text-[var(--border-strong)]">·</span>
												<span class="text-[12px] text-[var(--text-secondary)] font-medium">Instructor: <strong>{hub.batch.instructorName}</strong></span>
											</div>
											<h2 class="text-[1.25rem] font-bold text-[var(--text-primary)]">
												{hub.batch.courseTitle}
											</h2>
											<div class="text-[14px] text-[var(--text-secondary)] font-medium mt-0.5">
												Batch: {hub.batch.name}
											</div>
										</div>

										<div class="shrink-0 flex items-center gap-2">
											{#if hub.batch.status === 'live'}
												<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono">
													<span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span> IN PROGRESS
												</span>
											{:else if hub.batch.status === 'completed'}
												<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
													<Check size={12} strokeWidth={2.5} /> COMPLETED ({hub.daysRemaining ?? 90}d left)
												</span>
											{:else}
												<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
													<Clock size={12} /> SCHEDULED
												</span>
											{/if}
										</div>
									</div>

									<!-- Schedule & Timing Strip -->
									<div class="my-4 p-3.5 bg-[var(--bg-subtle)] border border-[var(--border-subtle)] rounded-[var(--radius-sm)] flex flex-wrap items-center gap-6 text-[12.5px] text-[var(--text-secondary)]">
										{#if hub.batch.startDate}
											<div class="flex items-center gap-2 font-mono">
												<Calendar size={14} class="text-[var(--text-muted)]" />
												<span>Starts {new Date(hub.batch.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
											</div>
										{/if}
										{#if hub.batch.scheduleText}
											<div class="flex items-center gap-2 font-mono">
												<Clock size={14} class="text-[var(--text-muted)]" />
												<span>{hub.batch.scheduleText} ({hub.batch.timezone || 'IST'})</span>
											</div>
										{/if}
									</div>

									<!-- Main External Action Buttons: Live Class (Meet) & Community (WhatsApp) -->
									<div class="grid grid-cols-1 md:grid-cols-2 gap-3.5 my-5">
										<!-- Meeting Link Button -->
										{#if hub.batch.meetingUrl}
											<a
												href={hub.batch.meetingUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center justify-between p-4 rounded-[var(--radius-sm)] bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-[13.5px] transition-all shadow-sm"
											>
												<div class="flex items-center gap-2.5">
													<Video size={18} />
													<div>
														<div class="leading-tight">Join Live Classroom</div>
														<div class="text-[11px] font-normal text-indigo-200 mt-0.5">Google Meet / Zoom</div>
													</div>
												</div>
												<ExternalLink size={15} class="opacity-80" />
											</a>
										{:else}
											<div class="flex items-center justify-between p-4 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px]">
												<div class="flex items-center gap-2.5">
													<Video size={18} class="text-[var(--text-muted)]" />
													<span>Live meeting link will be shared before class</span>
												</div>
											</div>
										{/if}

										<!-- WhatsApp / Community Link Button -->
										{#if hub.batch.communityUrl}
											<a
												href={hub.batch.communityUrl}
												target="_blank"
												rel="noopener noreferrer"
												class="flex items-center justify-between p-4 rounded-[var(--radius-sm)] bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[13.5px] transition-all shadow-sm"
											>
												<div class="flex items-center gap-2.5">
													<MessageSquare size={18} />
													<div>
														<div class="leading-tight">Join Batch Discussion Group</div>
														<div class="text-[11px] font-normal text-emerald-200 mt-0.5">WhatsApp / Teams</div>
													</div>
												</div>
												<ExternalLink size={15} class="opacity-80" />
											</a>
										{:else}
											<div class="flex items-center justify-between p-4 rounded-[var(--radius-sm)] bg-[var(--surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)] text-[13px]">
												<div class="flex items-center gap-2.5">
													<MessageSquare size={18} class="text-[var(--text-muted)]" />
													<span>Batch community link coming soon</span>
												</div>
											</div>
										{/if}
									</div>

									<!-- Session Recordings & Study Materials Links -->
									<div class="mt-6 pt-5 border-t border-[var(--border)]">
										<div class="flex items-center justify-between mb-3">
											<span class="text-[12px] font-bold text-[var(--text-primary)] uppercase tracking-wider font-mono">
												Session Recordings & Materials
											</span>
											<span class="text-[11px] text-[var(--text-muted)] font-mono">
												{hub.batch.sessions?.length || 0} sessions available
											</span>
										</div>

										{#if hub.batch.sessions && hub.batch.sessions.length > 0}
											<div class="divide-y divide-[var(--border-subtle)] border border-[var(--border)] rounded-[var(--radius-sm)] overflow-hidden bg-[var(--surface-subtle)]">
												{#each hub.batch.sessions as session}
													<div class="p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-[13px]">
														<div>
															<div class="flex items-center gap-2">
																<span class="font-semibold text-[var(--text-primary)]">{session.title}</span>
																{#if session.date}
																	<span class="text-[11px] text-[var(--text-muted)] font-mono">
																		({new Date(session.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })})
																	</span>
																{/if}
															</div>
															{#if session.notes}
																<p class="text-[12px] text-[var(--text-secondary)] mt-1">{session.notes}</p>
															{/if}
														</div>

														<div class="flex items-center gap-2 shrink-0">
															{#if session.recordingUrl}
																<a
																	href={session.recordingUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 text-[12px] font-medium transition-colors"
																>
																	<Video size={13} /> Watch Recording <ExternalLink size={11} />
																</a>
															{/if}
															{#if session.materialsUrl}
																<a
																	href={session.materialsUrl}
																	target="_blank"
																	rel="noopener noreferrer"
																	class="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[var(--radius-sm)] bg-[var(--surface)] hover:bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--border)] text-[12px] font-medium transition-colors"
																>
																	<FileBadge2 size={13} /> Notes & Materials <ExternalLink size={11} />
																</a>
															{/if}
														</div>
													</div>
												{/each}
											</div>
										{:else}
											<div class="p-4 rounded-[var(--radius-sm)] bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-center text-[12.5px] text-[var(--text-secondary)]">
												Class recordings and notes links will be posted by the mentor after each live session.
											</div>
										{/if}
									</div>

									<!-- Retention Window Policy Note -->
									<div class="mt-4 pt-3 flex items-center justify-between text-[11px] text-[var(--text-muted)] font-mono">
										<span>Access policy: Content & recording links retained for 3 months (90 days) post-completion.</span>
										{#if hub.daysRemaining !== null}
											<span class="text-indigo-400 font-semibold">{hub.daysRemaining} days access remaining</span>
										{/if}
									</div>
								</div>
							{/if}
						{/each}
					</div>
				{:else}
					<div class="p-12 text-center border border-dashed border-[var(--border)] rounded-[var(--radius-md)] bg-[var(--surface)] space-y-3">
						<Users2 size={32} class="mx-auto text-[var(--text-muted)]" />
						<h3 class="text-[15px] font-bold text-[var(--text-primary)]">No Live Batch Enrollments</h3>
						<p class="text-[13px] text-[var(--text-secondary)] max-w-md mx-auto">
							You are not currently enrolled in any live classroom batches. Explore our scheduled practitioner cohorts to reserve your seat.
						</p>
						<a href="/catalog" class="inline-flex items-center gap-2 px-4 py-2 rounded-[var(--radius-sm)] bg-[var(--text-primary)] text-[var(--surface)] text-[13px] font-semibold transition-opacity hover:opacity-90">
							Explore Live Batches <ArrowRight size={14} />
						</a>
					</div>
				{/if}
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 5: CERTIFICATIONS                                -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'my_certs'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<h1>My Certifications</h1>
						<p class="pane-sub">Your passed certifications and purchased exam attempts.</p>
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
		<!-- TAB 6: INSTRUCTOR STUDIO (SECTION 28)                -->
		<!-- ════════════════════════════════════════════════════ -->
		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 6: INSTRUCTOR STUDIO: OVERVIEW                   -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_overview'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">INSTRUCTOR STUDIO</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Studio Overview</h1>
						<p class="pane-sub">Manage your courses, live cohorts, student roster, and mentoring appointments.</p>
					</div>
					<div class="flex items-center gap-2">
						<button class="btn-primary" onclick={() => showCreateCourseModal = true}>
							<Plus size={14} /> <span>New Course</span>
						</button>
						<button class="btn-action secondary" onclick={() => showCreateClassModal = true}>
							<Users2 size={14} /> <span>New Cohort</span>
						</button>
					</div>
				</header>

				<!-- 4 KPI cards -->
				<div class="kpi-grid-4">
					<div class="kpi-box">
						<span class="kpi-box-label">Enrolled Learners</span>
						<span class="kpi-box-val">{data.teacher.stats.totalStudents}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Courses</span>
						<span class="kpi-box-val">{data.teacher.courses.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Cohorts</span>
						<span class="kpi-box-val">{data.teacher.classes.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Revenue Generated</span>
						<span class="kpi-box-val">₹{data.teacher.stats.totalRevenue}</span>
					</div>
				</div>

				<div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
					<!-- Card 1: Recent Courses -->
					<div class="card-box">
						<div class="flex items-center justify-between mb-3">
							<h3 class="font-bold text-[15px] text-[var(--text-primary)]">Your Courses</h3>
							<button class="text-xs text-[var(--lp-accent)] font-medium hover:underline" onclick={() => activeTab = 'teacher_courses'}>
								View All ({data.teacher.courses.length})
							</button>
						</div>
						<div class="row-list">
							{#each data.teacher.courses.slice(0, 4) as course}
								<div class="list-row">
									<div class="row-icon"><BookOpen size={16} /></div>
									<div class="row-main">
										<div class="flex items-center gap-2">
											<h4>{course.title}</h4>
											<span class="badge-minimal" class:badge-active={course.status === 'Published'}>
												{course.status}
											</span>
										</div>
										<span class="row-sub-text">
											{course.price} • {course.students} Learners
										</span>
									</div>
									<a href={`/dashboard/teacher/courses/${course.id}/curriculum`} class="btn-action secondary text-xs">
										Curriculum
									</a>
								</div>
							{:else}
								<p class="empty-text">No courses created yet.</p>
							{/each}
						</div>
					</div>

					<!-- Card 2: Live Cohort Batches -->
					<div class="card-box">
						<div class="flex items-center justify-between mb-3">
							<h3 class="font-bold text-[15px] text-[var(--text-primary)]">Live Cohort Batches</h3>
							<button class="text-xs text-[var(--lp-accent)] font-medium hover:underline" onclick={() => activeTab = 'teacher_classes'}>
								View All ({data.teacher.classes.length})
							</button>
						</div>
						<div class="row-list">
							{#each data.teacher.classes.slice(0, 4) as cohort}
								<div class="list-row">
									<div class="row-icon"><Users2 size={16} /></div>
									<div class="row-main">
										<div class="flex items-center gap-2">
											<h4>{cohort.name}</h4>
											<span class="badge-minimal badge-active">Active</span>
										</div>
										<span class="row-sub-text">
											{cohort.course} • {cohort.students} Students
										</span>
									</div>
									<button
										type="button"
										class="btn-action secondary text-xs"
										onclick={() => copyCohortInviteLink(cohort.id)}
									>
										{copiedCohortId === cohort.id ? 'Copied Link!' : 'Invite Link'}
									</button>
								</div>
							{:else}
								<p class="empty-text">No active cohorts yet.</p>
							{/each}
						</div>
					</div>
				</div>

				<!-- Recent Student Activity -->
				{#if (data.teacher.recentActivity || []).length > 0}
					<div class="card-box mt-6">
						<h3 class="font-bold text-[15px] text-[var(--text-primary)] mb-3">Recent Enrollment Activity</h3>
						<div class="row-list">
							{#each data.teacher.recentActivity.slice(0, 5) as act}
								<div class="list-row">
									<div class="row-icon"><Users size={16} /></div>
									<div class="row-main">
										<h4><strong>{act.name}</strong> {act.action} <em>{act.target}</em></h4>
										<span class="row-sub-text font-mono text-xs">{act.time}</span>
									</div>
								</div>
							{/each}
						</div>
					</div>
				{/if}
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7: INSTRUCTOR MANAGE COURSES                     -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_courses'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">COURSE CATALOG & CURRICULA</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Courses & Batches</h1>
						<p class="pane-sub">Create self-paced video/text courses and timed live classroom cohorts.</p>
					</div>
					<button class="btn-primary" onclick={() => showCreateCourseModal = true}>
						<Plus size={14} /> <span>Create New Course</span>
					</button>
				</header>

				<!-- KPI row -->
				<div class="kpi-grid-4" style="margin-bottom: 24px;">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Courses</span>
						<span class="kpi-box-val">{data.teacher.courses.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Published</span>
						<span class="kpi-box-val text-emerald-500">{data.teacher.courses.filter(c => c.status === 'Published').length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Drafts</span>
						<span class="kpi-box-val text-muted">{data.teacher.courses.filter(c => c.status === 'Draft').length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Total Learners</span>
						<span class="kpi-box-val">{data.teacher.courses.reduce((acc, c) => acc + (c.students || 0), 0)}</span>
					</div>
				</div>

				<div class="row-list">
					{#each data.teacher.courses as course}
						<div class="list-row">
							<div class="row-icon"><BookOpen size={16} /></div>
							<div class="row-main">
								<div class="cert-title-row">
									<h3>{course.title}</h3>
									<span class="badge-minimal" class:badge-active={course.status === 'Published'}>
										{course.status.toUpperCase()}
									</span>
									{#if course.deliveryFormat === 'live_batch'}
										<span class="badge-minimal" style="background: rgba(16, 185, 129, 0.12); color: #10b981; border-color: rgba(16, 185, 129, 0.3); font-weight: 700;">
											● LIVE COHORT
										</span>
									{:else}
										<span class="badge-minimal" style="background: rgba(99, 102, 241, 0.1); color: #818cf8; border-color: rgba(99, 102, 241, 0.3);">
											SELF-PACED
										</span>
									{/if}
									{#if course.isCourseAdmin}
										<span class="badge-minimal" style="background: rgba(245, 158, 11, 0.1); color: #f59e0b; border-color: rgba(245, 158, 11, 0.3);">
											Admin / Lead
										</span>
									{/if}
								</div>
								<span class="row-sub-text">
									Price: <strong>{course.price}</strong> •
									Learners: <strong>{course.students}</strong> •
									Mode: <strong>{course.deliveryFormat === 'live_batch' ? 'Live Classroom Cohort' : 'Self-Paced Web Reader'}</strong>
								</span>
							</div>
							<div class="action-group">
								<a href={`/dashboard/teacher/courses/${course.id}/curriculum`} class="btn-action primary" title="Open Curriculum Builder">
									<Edit size={13} /> Curriculum
								</a>
								<a href={`/dashboard/teacher/courses/${course.id}/batches`} class="btn-action secondary" title="Configure Live Cohort Batches">
									<Calendar size={13} /> Batches
								</a>
								<button
									type="button"
									class="btn-action secondary"
									onclick={() => openEditPriceModal(course)}
									title="Edit Price"
								>
									<DollarSign size={13} /> Price
								</button>
								<form method="POST" action="?/toggleCoursePublish" style="display:inline;" use:enhance>
									<input type="hidden" name="courseId" value={course.id} />
									<button type="submit" class="btn-action secondary">
										<Power size={13} /> {course.status === 'Published' ? 'Unpublish' : 'Publish'}
									</button>
								</form>
								<a href={`/catalog/${course.id}`} target="_blank" class="btn-action secondary" title="Preview Public Page">
									<Eye size={13} />
								</a>
								<form
									method="POST"
									action="?/deleteCourse"
									style="display:inline;"
									use:enhance
									onsubmit={(e) => { if (!confirm(`Delete "${course.title}"? This cannot be undone.`)) e.preventDefault(); }}
								>
									<input type="hidden" name="courseId" value={course.id} />
									<button type="submit" class="btn-action danger" title="Delete Course">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<BookOpenCheck size={28} />
							<p>No courses created yet.</p>
							<button class="btn-primary" onclick={() => showCreateCourseModal = true}>
								Create Your First Course
							</button>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7B: INSTRUCTOR COHORT BATCHES & CLASSES          -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_classes'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">COHORT MANAGEMENT</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Classes & Live Cohorts</h1>
						<p class="pane-sub">Timed batch schedules, external classroom links (Teams, WhatsApp, Zoom), and seat reservations.</p>
					</div>
					<button class="btn-primary" onclick={() => showCreateClassModal = true}>
						<Plus size={14} /> <span>Create New Class</span>
					</button>
				</header>

				<!-- KPI row -->
				<div class="kpi-grid-4" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Cohorts</span>
						<span class="kpi-box-val">{data.teacher.classes.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Batches</span>
						<span class="kpi-box-val text-emerald-500">{data.teacher.classes.filter(c => c.isActive).length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Cohort Enrollees</span>
						<span class="kpi-box-val">{data.teacher.classes.reduce((sum, c) => sum + (c.students || 0), 0)}</span>
					</div>
				</div>

				<div class="row-list">
					{#each data.teacher.classes as cohort}
						<div class="list-row">
							<div class="row-icon"><Users2 size={16} /></div>
							<div class="row-main">
								<div class="cert-title-row">
									<h3>{cohort.name}</h3>
									<span class="badge-minimal" class:badge-active={cohort.isActive}>
										{cohort.isActive ? 'ACTIVE' : 'COMPLETED'}
									</span>
									<span class="badge-minimal" style="background: rgba(99, 102, 241, 0.1); color: #818cf8;">
										{cohort.course}
									</span>
								</div>
								<span class="row-sub-text">
									Schedule: <strong>{cohort.scheduleText || 'Custom / Flexible'}</strong> •
									Enrolled: <strong>{cohort.students} / {cohort.maxStudents || 'Unlimited'}</strong>
									{#if cohort.startDate}
										• Starts: {new Date(cohort.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
									{/if}
								</span>
							</div>
							<div class="action-group">
								<button
									type="button"
									class="btn-action secondary"
									onclick={() => copyCohortInviteLink(cohort.id)}
									title="Copy direct batch invitation link"
								>
									<Copy size={13} /> {copiedCohortId === cohort.id ? 'Copied!' : 'Copy Link'}
								</button>
								{#if cohort.courseId}
									<a href={`/dashboard/teacher/courses/${cohort.courseId}/batches`} class="btn-action secondary">
										<Calendar size={13} /> Manage in Hub
									</a>
								{/if}
								{#if cohort.meetingUrl}
									<a href={cohort.meetingUrl} target="_blank" rel="noreferrer" class="btn-action primary">
										<Video size={13} /> Meeting
									</a>
								{/if}
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<Users2 size={28} />
							<p>No cohort classes created yet.</p>
							<button class="btn-primary" onclick={() => showCreateClassModal = true}>
								Create First Class Cohort
							</button>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7C: ENROLLED STUDENTS ROSTER                     -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_students'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">LEARNER ROSTER</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Enrolled Students</h1>
						<p class="pane-sub">View learners enrolled across your courses and timed cohort batches.</p>
					</div>
					<button class="btn-primary" onclick={() => showInviteModal = true}>
						<Mail size={14} /> <span>Invite Student with Discount</span>
					</button>
				</header>

				<!-- KPI row -->
				<div class="kpi-grid-4" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Unique Students</span>
						<span class="kpi-box-val">{data.teacher.stats.totalStudents}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Cohorts</span>
						<span class="kpi-box-val">{data.teacher.classes.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Published Courses</span>
						<span class="kpi-box-val">{data.teacher.stats.activeCourses}</span>
					</div>
				</div>

				<div class="row-list">
					{#each (data.teacher.students || []) as student}
						<div class="list-row">
							<div class="row-icon"><UserCircle size={16} /></div>
							<div class="row-main">
								<div class="cert-title-row">
									<h3>{student.name || 'Anonymous Student'}</h3>
									<span class="badge-minimal badge-active">{student.status || 'Active'}</span>
								</div>
								<span class="row-sub-text">
									Email: <strong>{student.email}</strong> •
									Cohort: <strong>{student.cohortName}</strong> •
									Enrolled: {student.joinedAt ? new Date(student.joinedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' }) : 'Recently'}
								</span>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<Users size={28} />
							<p>No students enrolled in cohorts yet.</p>
							<button class="btn-primary" onclick={() => showInviteModal = true}>
								Invite Your First Student
							</button>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7D: DISCOUNT COUPONS                             -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_coupons'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">PROMOTIONS & CODES</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Coupons & Promos</h1>
						<p class="pane-sub">Create custom discount vouchers for students enrolling in your courses and batches.</p>
					</div>
					<button class="btn-primary" onclick={() => showCreateCouponModal = true}>
						<Plus size={14} /> <span>Create New Coupon</span>
					</button>
				</header>

				<!-- KPI row -->
				<div class="kpi-grid-4" style="grid-template-columns: repeat(3, 1fr); margin-bottom: 24px;">
					<div class="kpi-box">
						<span class="kpi-box-label">Total Coupons</span>
						<span class="kpi-box-val">{data.teacher.coupons.length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Coupons</span>
						<span class="kpi-box-val text-emerald-500">{data.teacher.coupons.filter(c => c.isActive).length}</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Total Redemptions</span>
						<span class="kpi-box-val">{data.teacher.coupons.reduce((sum, c) => sum + (c.timesUsed || 0), 0)}</span>
					</div>
				</div>

				<div class="row-list">
					{#each data.teacher.coupons as coupon}
						<div class="list-row">
							<div class="row-icon"><Tag size={16} /></div>
							<div class="row-main">
								<div class="cert-title-row">
									<h3 class="font-mono text-indigo-400 font-bold tracking-wider">{coupon.code}</h3>
									<span class="badge-minimal" class:badge-active={coupon.isActive}>
										{coupon.isActive ? 'ACTIVE' : 'PAUSED'}
									</span>
								</div>
								<span class="row-sub-text">
									Discount: <strong>{coupon.type === 'percent' ? `${coupon.value}% OFF` : `₹${coupon.value} OFF`}</strong> •
									Uses: <strong>{coupon.timesUsed || 0} / {coupon.maxUses || '∞'}</strong>
								</span>
							</div>
							<div class="action-group">
								<form method="POST" action="?/toggleCouponActive" style="display:inline;" use:enhance>
									<input type="hidden" name="couponId" value={coupon.id} />
									<button type="submit" class="btn-action secondary">
										<Power size={13} /> {coupon.isActive ? 'Deactivate' : 'Activate'}
									</button>
								</form>
								<form
									method="POST"
									action="?/deleteCoupon"
									style="display:inline;"
									use:enhance
									onsubmit={(e) => { if (!confirm(`Delete coupon "${coupon.code}"?`)) e.preventDefault(); }}
								>
									<input type="hidden" name="couponId" value={coupon.id} />
									<button type="submit" class="btn-action danger" title="Delete Coupon">
										<Trash2 size={13} />
									</button>
								</form>
							</div>
						</div>
					{:else}
						<div class="empty-state">
							<Tag size={28} />
							<p>No discount coupons created yet.</p>
							<button class="btn-primary" onclick={() => showCreateCouponModal = true}>
								Create First Coupon
							</button>
						</div>
					{/each}
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7E: COMMUNICATIONS & ANNOUNCEMENTS               -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_communications'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">STUDENT BROADCASTS</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Announcements & Templates</h1>
						<p class="pane-sub">Send broadcast announcements to students in your active cohorts or save recurring templates.</p>
					</div>
				</header>

				<div class="card-box max-w-3xl">
					<h3 class="font-bold text-[16px] text-[var(--text-primary)] mb-2">Send Broadcast Announcement</h3>
					<p class="text-xs text-[var(--text-secondary)] mb-4">Messages are dispatched instantly to all registered students in the selected group.</p>

					<form method="POST" action="?/sendBroadcast" use:enhance class="flex flex-col gap-4">
						<div>
							<label for="broadcast-cohort" class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Recipient Group</label>
							<select
								id="broadcast-cohort"
								name="cohortId"
								bind:value={broadcastCohortId}
								class="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--lp-accent)]"
							>
								<option value="all">All My Enrolled Students (All Batches & Courses)</option>
								{#each data.teacher.classes as c}
									<option value={c.id}>Batch: {c.name} ({c.course})</option>
								{/each}
							</select>
						</div>

						<div>
							<label for="broadcast-subject" class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject Line</label>
							<input
								id="broadcast-subject"
								type="text"
								name="subject"
								bind:value={broadcastSubject}
								placeholder="e.g. Schedule update for upcoming weekend session"
								required
								class="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--lp-accent)]"
							/>
						</div>

						<div>
							<label for="broadcast-msg" class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Message Body</label>
							<textarea
								id="broadcast-msg"
								name="message"
								bind:value={broadcastMessage}
								rows="5"
								placeholder="Write your announcement details here..."
								required
								class="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--lp-accent)]"
							></textarea>
						</div>

						<div class="flex justify-end gap-2 mt-2">
							<button type="submit" class="btn-primary">
								<Send size={14} /> <span>Broadcast Announcement</span>
							</button>
						</div>
					</form>
				</div>
			</div>

		<!-- ════════════════════════════════════════════════════ -->
		<!-- TAB 7F: INSTRUCTOR STUDIO SETTINGS                   -->
		<!-- ════════════════════════════════════════════════════ -->
		{:else if activeTab === 'teacher_settings'}
			<div class="tab-pane">
				<header class="pane-header">
					<div>
						<span class="meta-mono text-[var(--lp-accent)] font-bold">INSTRUCTOR IDENTITY</span>
						<h1 class="text-[1.75rem] font-bold text-[var(--text-primary)] mt-1">Studio Settings</h1>
						<p class="pane-sub">Update your public teacher display name, biography, and credentials.</p>
					</div>
				</header>

				<div class="card-box max-w-2xl">
					<form method="POST" action="?/saveInstructorProfile" use:enhance class="flex flex-col gap-4">
						<div>
							<label for="inst-name" class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Instructor Full Name</label>
							<input
								id="inst-name"
								type="text"
								name="name"
								value={data.user?.name || ''}
								required
								class="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--lp-accent)]"
							/>
						</div>

						<div>
							<label for="inst-bio" class="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Professional Bio & Qualifications</label>
							<textarea
								id="inst-bio"
								name="bio"
								rows="4"
								value={data.profile?.bio || ''}
								placeholder="e.g. Lead Cybersecurity Architect with 12+ years experience in threat modeling and DevSecOps..."
								class="w-full px-3 py-2 text-sm rounded-[var(--radius-sm)] bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--lp-accent)]"
							></textarea>
						</div>

						<div class="flex justify-end gap-2 mt-2">
							<button type="submit" class="btn-primary">
								<span>Save Profile Settings</span>
							</button>
						</div>
					</form>
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
									<FileSpreadsheet size={13} /> Batch / Questions
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
						<div class="title-with-badge">
							<h1>Platform Command Center</h1>
							<span class="badge-role-owner" style="font-size: 0.72rem; padding: 2px 8px;">{data.isOwner ? 'Root Owner Authority' : 'Administrator'}</span>
						</div>
						<p class="pane-sub">Executive oversight: Platform gross revenue, active learners, system health, and core module controls.</p>
					</div>
					<div class="admin-header-actions">
						<span class="status-pill">System Operational</span>
					</div>
				</header>

				<!-- Executive KPI Grid -->
				<div class="kpi-grid-4">
					<div class="kpi-box highlight-revenue">
						<span class="kpi-box-label">Platform Gross Revenue</span>
						<span class="kpi-box-val text-success">₹{data.admin.kpis.totalRevenueFormatted || '0'}</span>
						<span class="kpi-box-sub">{data.admin.kpis.totalPaidOrders || 0} paid checkouts</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Total Registered Users</span>
						<span class="kpi-box-val">{data.admin.kpis.totalUsers}</span>
						<span class="kpi-box-sub">{(data.admin.allUsers || []).filter(u => u.role === 'student').length} learners · {(data.admin.allUsers || []).filter(u => u.role === 'teacher').length} instructors</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Published Assets & Tests</span>
						<span class="kpi-box-val">{data.admin.kpis.totalCourses + data.admin.kpis.totalCerts}</span>
						<span class="kpi-box-sub">{data.admin.kpis.totalCourses} courses · {data.admin.kpis.totalCerts} certifications</span>
					</div>
					<div class="kpi-box">
						<span class="kpi-box-label">Active Cohorts & Outbox</span>
						<span class="kpi-box-val">{data.admin.kpis.totalCohorts}</span>
						<span class="kpi-box-sub">{data.admin.kpis.outboxPending} pending background events</span>
					</div>
				</div>

				<div class="grid-2-col" style="margin-top: 1.5rem;">
					<!-- Module Toggles -->
					<div class="card-box">
						<h3>Core Platform Modules</h3>
						<p class="card-sub-text">Instantly toggle public features across the application.</p>

						<form method="POST" action="?/updateSettings" class="form-col" use:enhance>
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

						<form method="POST" action="?/saveTemplate" class="form-col" use:enhance>
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

				<!-- Quick Governance Actions Grid -->
				<div class="card-box" style="margin-top: 1.5rem;">
					<h3>Quick Governance Shortcuts</h3>
					<p class="card-sub-text">Direct shortcuts to high-priority platform management tasks.</p>

					<div class="governance-shortcuts-grid">
						<button type="button" class="gov-shortcut-card" onclick={() => activeTab = 'admin_users'}>
							<div class="gov-shortcut-icon users-icon"><Users size={20} /></div>
							<div class="gov-shortcut-info">
								<strong>User & Access Management</strong>
								<span>Inspect learners, grant instant bypass access, or ban accounts</span>
							</div>
							<ArrowRight size={16} class="gov-shortcut-arrow" />
						</button>

						<button type="button" class="gov-shortcut-card" onclick={() => activeTab = 'admin_mentoring'}>
							<div class="gov-shortcut-icon mentoring-icon"><Video size={20} /></div>
							<div class="gov-shortcut-info">
								<strong>Mentoring Revenue Oversight</strong>
								<span>Inspect teacher bookings, pricing limits, and platform fee splits</span>
							</div>
							<ArrowRight size={16} class="gov-shortcut-arrow" />
						</button>

						<button type="button" class="gov-shortcut-card" onclick={() => activeTab = 'admin_audit'}>
							<div class="gov-shortcut-icon security-icon"><ShieldAlert size={20} /></div>
							<div class="gov-shortcut-info">
								<strong>Audit & Security Trails</strong>
								<span>Review immutable logs of all role updates and permission changes</span>
							</div>
							<ArrowRight size={16} class="gov-shortcut-arrow" />
						</button>

						{#if data.isOwner}
							<button type="button" class="gov-shortcut-card vault-shortcut" onclick={() => activeTab = 'owner_vault'}>
								<div class="gov-shortcut-icon vault-icon"><Lock size={20} /></div>
								<div class="gov-shortcut-info">
									<strong>Owner Root Security Vault</strong>
									<span>Root authority, tenant ownership transfer & platform protection</span>
								</div>
								<ArrowRight size={16} class="gov-shortcut-arrow" />
							</button>
						{/if}
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
						<div class="title-with-badge">
							<h1>User & Role Management</h1>
							<span class="count-tag-header">{(data.admin?.allUsers || []).length} registered</span>
						</div>
						<p class="pane-sub">Manage learner access, instructor status, security credentials, and direct asset enrollments.</p>
					</div>
					<div class="search-bar-wrap">
						<Search size={14} class="s-icon" />
						<input type="text" placeholder="Search name, email, role, or ID..." bind:value={userSearch} class="search-inp-sm" />
					</div>
				</header>

				<!-- Filter sub-tabs -->
				<div class="user-filter-bar">
					<div class="role-filter-pills">
						<button 
							type="button" 
							class="role-filter-btn" 
							class:active={adminRoleFilter === 'all'} 
							onclick={() => adminRoleFilter = 'all'}
						>
							All Users ({ (data.admin?.allUsers || []).length })
						</button>
						<button 
							type="button" 
							class="role-filter-btn" 
							class:active={adminRoleFilter === 'student'} 
							onclick={() => adminRoleFilter = 'student'}
						>
							Students ({ (data.admin?.allUsers || []).filter(u => u.role === 'student').length })
						</button>
						<button 
							type="button" 
							class="role-filter-btn" 
							class:active={adminRoleFilter === 'teacher'} 
							onclick={() => adminRoleFilter = 'teacher'}
						>
							Instructors ({ (data.admin?.allUsers || []).filter(u => u.role === 'teacher').length })
						</button>
						<button 
							type="button" 
							class="role-filter-btn" 
							class:active={adminRoleFilter === 'admin'} 
							onclick={() => adminRoleFilter = 'admin'}
						>
							Admins ({ (data.admin?.allUsers || []).filter(u => u.role === 'admin').length })
						</button>
						<button 
							type="button" 
							class="role-filter-btn danger" 
							class:active={adminRoleFilter === 'banned'} 
							onclick={() => adminRoleFilter = 'banned'}
						>
							Banned ({ (data.admin?.allUsers || []).filter(u => u.banned).length })
						</button>
					</div>
				</div>

				<div class="table-container">
					<table class="admin-table user-mgmt-table">
						<thead>
							<tr>
								<th>User</th>
								<th>Role Assignment</th>
								<th>Status & Security</th>
								<th>Enrollments</th>
								<th>Created</th>
								<th style="text-align: right;">Powers & Actions</th>
							</tr>
						</thead>
						<tbody>
							{#each filteredUsers as u}
								<tr class:row-banned={u.banned}>
									<td>
										<div class="table-user-cell">
											<div class="user-meta-top">
												<span class="user-name-bold">{u.name || 'Unnamed Account'}</span>
												{#if u.role === 'owner'}
													<span class="badge-role-owner">Root Owner</span>
												{:else if u.role === 'admin'}
													<span class="badge-role-admin">Admin</span>
												{:else if u.role === 'teacher'}
													<span class="badge-role-teacher">Instructor</span>
												{:else}
													<span class="badge-role-student">Student</span>
												{/if}
											</div>
											<span class="user-email-muted">{u.email}</span>
										</div>
									</td>
									<td>
										<form method="POST" action="?/updateUserRole" class="inline-form" use:enhance>
											<input type="hidden" name="userId" value={u.id} />
											<select 
												name="role" 
												class="role-select-styled" 
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
										<div class="status-stack">
											<div class="status-row">
												{#if u.banned}
													<span class="pill-banned">Banned</span>
												{:else}
													<span class="pill-active">Active</span>
												{/if}
												{#if u.emailVerified}
													<span class="pill-verified" title="Email verified">✓ Verified</span>
												{:else}
													<span class="pill-unverified" title="Email not verified">Unverified</span>
												{/if}
											</div>
										</div>
									</td>
									<td>
										<button 
											type="button" 
											class="enrollments-counter-btn"
											onclick={() => openUserDrawer(u)}
											title="Click to view & manage enrollments"
										>
											<BookOpen size={12} />
											<span>{u.enrollmentsCount || 0} Assets</span>
											{#if u.cohortsCount > 0}
												<span class="cohort-tag-sm">+{u.cohortsCount} cohorts</span>
											{/if}
										</button>
									</td>
									<td>
										<span class="table-date">{new Date(u.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
									</td>
									<td>
										<div class="user-table-actions">
											<!-- View / Manage Details Drawer Button -->
											<button 
												type="button" 
												class="btn-icon-action" 
												onclick={() => openUserDrawer(u)}
												title="Inspect user, grant/revoke access"
											>
												<Eye size={14} />
												<span>Inspect</span>
											</button>

											<!-- Ban / Unban Toggle -->
											{#if u.role !== 'owner' && u.id !== data.user.id}
												<form method="POST" action="?/toggleUserBan" class="inline-form" use:enhance>
													<input type="hidden" name="userId" value={u.id} />
													<input type="hidden" name="isBanned" value={u.banned ? 'true' : 'false'} />
													<button 
														type="submit" 
														class="btn-table-action" 
														class:danger={!u.banned}
														class:success={u.banned}
														title={u.banned ? 'Restore account access' : 'Restrict account from platform'}
													>
														{u.banned ? 'Unban' : 'Ban'}
													</button>
												</form>
											{/if}

											<!-- Owner only: Delete User -->
											{#if data.isOwner && u.role !== 'owner' && u.id !== data.user.id}
												<form 
													method="POST" 
													action="?/deleteUserAccount" 
													class="inline-form" 
													use:enhance
													onsubmit={(e) => {
														if (!confirm(`Are you sure you want to permanently DELETE ${u.email}? This will erase all their enrollments and cannot be undone.`)) {
															e.preventDefault();
														}
													}}
												>
													<input type="hidden" name="userId" value={u.id} />
													<button 
														type="submit" 
														class="btn-icon-danger" 
														title="Owner Power: Permanently purge account"
													>
														<Trash2 size={13} />
													</button>
												</form>
											{/if}
										</div>
									</td>
								</tr>
							{:else}
								<tr>
									<td colspan="6" style="text-align: center; padding: 3rem 1rem; color: var(--text-muted);">
										<div class="empty-users-state">
											<Users size={32} style="opacity: 0.3; margin-bottom: 0.5rem;" />
											<p style="font-weight: 500; font-size: 0.95rem;">No users found</p>
											<p style="font-size: 0.8rem; color: var(--text-muted);">Try adjusting your search query or role filter.</p>
										</div>
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

				<div class="card-box">
					<div class="card-head-simple">
						<KeyRound size={16} />
						<h3>Transfer Tenant Ownership</h3>
					</div>
					<p class="card-sub-text">Delegate the root `owner` position to an existing administrator. This action immediately demotes you to an admin.</p>

					{#if data.admin.eligibleAdmins.length > 0}
						<form method="POST" action="?/transferOwnership" class="form-col" style="margin-top: 1rem;" use:enhance>
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

		<!-- ── TEACHER STUDIO GLOBAL MODALS ─────────────────── -->
		{#if showCreateCourseModal}
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateCourseModal = false; }} role="presentation">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Create Course Draft</h3>
						<button type="button" class="btn-modal-close" onclick={() => showCreateCourseModal = false}><X size={16} /></button>
					</div>
					<form method="POST" action="?/createCourse" use:enhance>
						<div class="modal-body">
							<p class="modal-desc">
								Initialize a new course workspace. You will configure modules, quizzes, and live cohorts in the builder.
							</p>
							<div class="input-field">
								<label for="new-course-title">Course Title</label>
								<input
									id="new-course-title"
									type="text"
									name="title"
									bind:value={newCourseTitle}
									placeholder="e.g. Advanced Network Defense & Threat Hunting"
									required
									class="input-box"
								/>
							</div>

							<div class="input-field">
								<label>Course Offering Type</label>
								<div class="grid grid-cols-2 gap-3 mt-1">
									<label class="p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all {newCourseFormat === 'self_paced' ? 'border-[var(--lp-accent)] bg-indigo-500/10' : 'border-[var(--border)] bg-[var(--surface)]'}">
										<div class="flex items-center gap-2">
											<input type="radio" name="deliveryFormat" value="self_paced" bind:group={newCourseFormat} />
											<span class="font-bold text-xs text-[var(--text-primary)]">Self-Paced Course</span>
										</div>
										<span class="text-[11px] text-[var(--text-secondary)] pl-5">On-demand web reader. Default price: ₹5,999</span>
									</label>

									<label class="p-3 border rounded-lg cursor-pointer flex flex-col gap-1 transition-all {newCourseFormat === 'live_batch' ? 'border-emerald-500 bg-emerald-500/10' : 'border-[var(--border)] bg-[var(--surface)]'}">
										<div class="flex items-center gap-2">
											<input type="radio" name="deliveryFormat" value="live_batch" bind:group={newCourseFormat} />
											<span class="font-bold text-xs text-emerald-400">Live Classroom Cohort</span>
										</div>
										<span class="text-[11px] text-[var(--text-secondary)] pl-5">Live batches with Meet & WhatsApp. Default price: ₹16,999</span>
									</label>
								</div>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showCreateCourseModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Create Course Draft</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		{#if showEditCoursePriceModal && selectedCourseForPrice}
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showEditCoursePriceModal = false; }} role="presentation">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Edit Pricing: {selectedCourseForPrice.title}</h3>
						<button type="button" class="btn-modal-close" onclick={() => showEditCoursePriceModal = false}><X size={16} /></button>
					</div>
					<form method="POST" action="?/updateCoursePrice" use:enhance>
						<input type="hidden" name="courseId" value={selectedCourseForPrice.id} />
						<div class="modal-body">
							<div class="input-field">
								<label for="edit-course-price">Price (Enter 0 for Free)</label>
								<input
									id="edit-course-price"
									type="number"
									step="0.01"
									min="0"
									name="price"
									bind:value={editCoursePrice}
									class="input-box"
									required
								/>
							</div>
							<div class="input-field">
								<label for="edit-course-currency">Currency</label>
								<select id="edit-course-currency" name="currency" bind:value={editCourseCurrency} class="input-box">
									<option value="INR">INR (₹)</option>
									<option value="USD">USD ($)</option>
								</select>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showEditCoursePriceModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Save Pricing</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		{#if showCreateClassModal}
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateClassModal = false; }} role="presentation">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Create Live Class Cohort</h3>
						<button type="button" class="btn-modal-close" onclick={() => showCreateClassModal = false}><X size={16} /></button>
					</div>
					<form method="POST" action="?/createClass" use:enhance>
						<div class="modal-body">
							<p class="modal-desc">
								Cohorts let you organize students into timed batches, reserve seats, and schedule live interactive sessions.
							</p>
							<div class="input-field">
								<label for="create-class-course">Associated Course</label>
								<select id="create-class-course" name="courseId" bind:value={newClassCourseId} class="input-box" required>
									<option value="" disabled>Select course...</option>
									{#each data.teacher.courses as c}
										<option value={c.id}>{c.title}</option>
									{/each}
								</select>
							</div>
							<div class="input-field">
								<label for="create-class-name">Cohort / Batch Name</label>
								<input
									id="create-class-name"
									type="text"
									name="className"
									bind:value={newClassName}
									placeholder="e.g. October 2026 Weekend Evening Batch"
									required
									class="input-box"
								/>
							</div>
							<div class="input-field">
								<label for="create-class-price">Batch Price Override (Optional)</label>
								<input
									id="create-class-price"
									type="number"
									name="price"
									min="0"
									step="0.01"
									placeholder="Leave blank to use base course price"
									class="input-box"
								/>
								<span style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px; display: block;">Set a specific price for this batch, or leave empty to use the course's default price.</span>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showCreateClassModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Create Cohort</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		{#if showInviteModal}
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showInviteModal = false; }} role="presentation">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Invite Student with Discount</h3>
						<button type="button" class="btn-modal-close" onclick={() => showInviteModal = false}><X size={16} /></button>
					</div>
					<form method="POST" action="?/inviteWithCoupon" use:enhance>
						<div class="modal-body">
							<p class="modal-desc">
								Generate an exclusive single-use invite voucher for a prospective learner.
							</p>
							<div class="input-field">
								<label for="invite-email">Student Email Address</label>
								<input
									id="invite-email"
									type="email"
									name="email"
									bind:value={inviteEmail}
									placeholder="student@example.com"
									required
									class="input-box"
								/>
							</div>
							<div class="input-field">
								<label for="invite-cohort">Target Cohort</label>
								<select id="invite-cohort" name="cohortId" bind:value={inviteCohortId} class="input-box" required>
									<option value="" disabled>Select cohort...</option>
									{#each data.teacher.classes as c}
										<option value={c.id}>{c.name} ({c.course})</option>
									{/each}
								</select>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="input-field">
									<label for="invite-discount-type">Discount Type</label>
									<select id="invite-discount-type" name="discountType" bind:value={inviteDiscountType} class="input-box">
										<option value="percent">Percentage (% OFF)</option>
										<option value="flat">Flat Amount (₹ OFF)</option>
									</select>
								</div>
								<div class="input-field">
									<label for="invite-discount-val">Discount Value</label>
									<input
										id="invite-discount-val"
										type="number"
										min="1"
										name="discountValue"
										bind:value={inviteDiscountValue}
										class="input-box"
										required
									/>
								</div>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showInviteModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Generate & Send Invite</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		{#if showCreateCouponModal}
			<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateCouponModal = false; }} role="presentation">
				<div class="modal-card">
					<div class="modal-header">
						<h3>Create Promotional Coupon</h3>
						<button type="button" class="btn-modal-close" onclick={() => showCreateCouponModal = false}><X size={16} /></button>
					</div>
					<form method="POST" action="?/createCoupon" use:enhance>
						<div class="modal-body">
							<div class="input-field">
								<label for="coupon-code">Coupon Code</label>
								<input
									id="coupon-code"
									type="text"
									name="code"
									bind:value={newCouponCodeInput}
									placeholder="e.g. FLASH50"
									style="text-transform: uppercase;"
									required
									class="input-box"
								/>
							</div>
							<div class="grid grid-cols-2 gap-3">
								<div class="input-field">
									<label for="coupon-type">Type</label>
									<select id="coupon-type" name="type" bind:value={newCouponTypeInput} class="input-box">
										<option value="percent">Percentage (% OFF)</option>
										<option value="flat">Flat Amount (₹ OFF)</option>
									</select>
								</div>
								<div class="input-field">
									<label for="coupon-val">Value</label>
									<input
										id="coupon-val"
										type="number"
										min="1"
										name="value"
										bind:value={newCouponValueInput}
										class="input-box"
										required
									/>
								</div>
							</div>
							<div class="input-field">
								<label for="coupon-limit">Max Redemptions Limit (Optional)</label>
								<input
									id="coupon-limit"
									type="number"
									min="1"
									name="limit"
									bind:value={newCouponLimitInput}
									placeholder="e.g. 50"
									class="input-box"
								/>
							</div>
						</div>
						<div class="modal-footer">
							<button type="button" class="btn-action secondary" onclick={() => showCreateCouponModal = false}>Cancel</button>
							<button type="submit" class="btn-primary">Create Coupon</button>
						</div>
					</form>
				</div>
			</div>
		{/if}

		<!-- ════════════════════════════════════════════════════ -->
		<!-- USER INSPECTION & DIRECT ACCESS DRAWER               -->
		<!-- ════════════════════════════════════════════════════ -->
		{#if isUserDrawerOpen && selectedUserForDrawer}
			<div 
				class="drawer-backdrop" 
				onclick={(e) => { if (e.target === e.currentTarget) closeUserDrawer(); }}
				role="presentation"
			>
				<aside class="user-drawer-panel">
					<header class="drawer-header">
						<div class="drawer-title-box">
							<div class="drawer-user-avatar">
								{selectedUserForDrawer.name ? selectedUserForDrawer.name.charAt(0).toUpperCase() : 'U'}
							</div>
							<div>
								<h2 class="drawer-user-name">{selectedUserForDrawer.name || 'Unnamed User'}</h2>
								<p class="drawer-user-email">{selectedUserForDrawer.email}</p>
							</div>
						</div>
						<button type="button" class="drawer-close-btn" onclick={closeUserDrawer} title="Close drawer">
							<X size={18} />
						</button>
					</header>

					<div class="drawer-body">
						<!-- Account Summary & Security Controls -->
						<div class="drawer-section">
							<h3 class="drawer-section-title">Account Security & Credentials</h3>
							<div class="drawer-grid-stats">
								<div class="stat-tile">
									<span class="stat-tile-label">Role</span>
									<span class="stat-tile-val capitalize">{selectedUserForDrawer.role}</span>
								</div>
								<div class="stat-tile">
									<span class="stat-tile-label">Status</span>
									<span class="stat-tile-val" class:text-danger={selectedUserForDrawer.banned}>
										{selectedUserForDrawer.banned ? 'Banned' : 'Active'}
									</span>
								</div>
								<div class="stat-tile">
									<span class="stat-tile-label">Email Verified</span>
									<span class="stat-tile-val">
										{selectedUserForDrawer.emailVerified ? 'Yes' : 'No'}
									</span>
								</div>
								<div class="stat-tile">
									<span class="stat-tile-label">Joined</span>
									<span class="stat-tile-val">
										{new Date(selectedUserForDrawer.createdAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
									</span>
								</div>
							</div>

							<!-- Quick Security Actions -->
							<div class="quick-security-actions">
								<!-- Verify / Unverify Email -->
								<form method="POST" action="?/toggleEmailVerification" class="inline-form" use:enhance>
									<input type="hidden" name="userId" value={selectedUserForDrawer.id} />
									<input type="hidden" name="currentStatus" value={selectedUserForDrawer.emailVerified ? 'true' : 'false'} />
									<button type="submit" class="btn-drawer-action">
										<CheckCircle2 size={14} />
										<span>{selectedUserForDrawer.emailVerified ? 'Mark Email Unverified' : 'Mark Email Verified'}</span>
									</button>
								</form>

								<!-- Ban / Unban -->
								{#if selectedUserForDrawer.role !== 'owner' && selectedUserForDrawer.id !== data.user.id}
									<form method="POST" action="?/toggleUserBan" class="inline-form" use:enhance>
										<input type="hidden" name="userId" value={selectedUserForDrawer.id} />
										<input type="hidden" name="isBanned" value={selectedUserForDrawer.banned ? 'true' : 'false'} />
										<button 
											type="submit" 
											class="btn-drawer-action"
											class:btn-drawer-danger={!selectedUserForDrawer.banned}
										>
											<ShieldAlert size={14} />
											<span>{selectedUserForDrawer.banned ? 'Remove Account Ban' : 'Ban Account'}</span>
										</button>
									</form>
								{/if}
							</div>
						</div>

						<!-- Direct Asset Granting Power (Admin & Owner) -->
						<div class="drawer-section">
							<div class="section-title-with-badge">
								<h3 class="drawer-section-title">Grant Direct Access (Admin Bypass)</h3>
								<span class="badge-power">No Checkout Required</span>
							</div>
							<p class="drawer-hint">Instantly unlock any Course, Certification, or Content asset for this user.</p>

							<form method="POST" action="?/grantAssetAccess" class="grant-asset-form" use:enhance>
								<input type="hidden" name="userId" value={selectedUserForDrawer.id} />
								<div class="grant-select-wrap">
									<select name="assetId" class="grant-asset-select" required>
										<option value="" disabled selected>Select course or content to grant...</option>
										{#each (data.admin?.grantableAssets || []) as asset}
											<option value={asset.id}>
												[{asset.type.toUpperCase()}] {asset.title}
											</option>
										{/each}
									</select>
									<button type="submit" class="btn-grant-submit">
										<Plus size={14} />
										<span>Grant Access</span>
									</button>
								</div>
							</form>
						</div>

						<!-- Current Enrolled Assets -->
						<div class="drawer-section">
							<div class="section-title-with-badge">
								<h3 class="drawer-section-title">Active Asset Access</h3>
								<span class="count-pill">{(selectedUserForDrawer.enrolledAssets || []).length}</span>
							</div>

							{#if (selectedUserForDrawer.enrolledAssets || []).length > 0}
								<div class="enrolled-assets-list">
									{#each selectedUserForDrawer.enrolledAssets as assetItem}
										<div class="enrolled-asset-row">
											<div class="enrolled-asset-info">
												<span class="enrolled-asset-type">{assetItem.type}</span>
												<span class="enrolled-asset-title">{assetItem.title}</span>
												<span class="enrolled-asset-date">
													Granted: {new Date(assetItem.grantedAt).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
												</span>
											</div>
											<form 
												method="POST" 
												action="?/revokeAssetAccess" 
												class="inline-form"
												use:enhance
												onsubmit={(e) => {
													if (!confirm(`Are you sure you want to revoke access to "${assetItem.title}" for this user?`)) {
														e.preventDefault();
													}
												}}
											>
												<input type="hidden" name="userId" value={selectedUserForDrawer.id} />
												<input type="hidden" name="assetId" value={assetItem.assetId} />
												<button type="submit" class="btn-revoke-access" title="Revoke access immediately">
													Revoke
												</button>
											</form>
										</div>
									{/each}
								</div>
							{:else}
								<div class="empty-drawer-box">
									<BookOpenCheck size={24} style="opacity: 0.3; margin-bottom: 0.25rem;" />
									<p>No active course or asset enrollments.</p>
								</div>
							{/if}
						</div>

						<!-- Owner Only Zone -->
						{#if data.isOwner && selectedUserForDrawer.role !== 'owner' && selectedUserForDrawer.id !== data.user.id}
							<div class="drawer-section owner-danger-zone">
								<h3 class="drawer-section-title text-danger">Owner Root Actions</h3>
								<p class="drawer-hint">Irreversible root actions that purge this user and all associated records.</p>

								<form 
									method="POST" 
									action="?/deleteUserAccount" 
									use:enhance
									onsubmit={(e) => {
										if (!confirm(`CAUTION: Are you sure you want to PERMANENTLY PURGE ${selectedUserForDrawer.email}? This cannot be undone.`)) {
											e.preventDefault();
										}
									}}
								>
									<input type="hidden" name="userId" value={selectedUserForDrawer.id} />
									<button type="submit" class="btn-owner-purge">
										<Trash2 size={14} />
										<span>Permanently Purge User Account</span>
									</button>
								</form>
							</div>
						{/if}
					</div>
				</aside>
			</div>
		{/if}
	</main>
</div>

<style>
	/* ── Shell ──────────────────────────────────────────────── */
	.dash-shell {
		display: grid;
		grid-template-columns: var(--dash-sidebar-w, 240px) 1fr;
		min-height: 100vh;
		background: var(--bg);
		transition: grid-template-columns 0.2s cubic-bezier(0.2, 0, 0, 1);
	}

	.dash-shell.sidebar-collapsed {
		grid-template-columns: 68px 1fr;
	}

	@media (max-width: 900px) {
		.dash-shell,
		.dash-shell.sidebar-collapsed {
			grid-template-columns: 1fr;
		}
	}

	/* ── Sidebar ────────────────────────────────────────────── */
	.dash-sidebar {
		border-right: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		flex-direction: column;
		height: 100vh;
		position: sticky;
		top: 0;
		z-index: 60;
		width: var(--dash-sidebar-w, 240px);
		transition: width 0.2s cubic-bezier(0.2, 0, 0, 1);
	}

	.dash-sidebar.collapsed {
		width: 68px;
	}

	@media (max-width: 900px) {
		.dash-sidebar {
			display: none;
		}
	}

	.brand-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		height: var(--nav-h);
		min-height: var(--nav-h);
		padding: 0 16px;
		border-bottom: 1px solid var(--border);
		box-sizing: border-box;
	}

	.brand-header-row.collapsed {
		padding: 0 6px;
		justify-content: center;
	}

	.brand-link-dash {
		display: flex;
		align-items: center;
		gap: 10px;
		text-decoration: none;
		min-width: 0;
	}

	.brand-collapsed-container {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 4px;
		width: 100%;
	}

	.brand-icon-box-link {
		display: flex;
		align-items: center;
		justify-content: center;
		text-decoration: none;
	}

	.collapse-toggle-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 26px;
		height: 26px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.collapse-toggle-btn:hover {
		background: var(--border-subtle);
		color: var(--text-primary);
	}

	.collapse-toggle-btn.sm {
		width: 20px;
		height: 24px;
		border-radius: 4px;
		padding: 0;
	}

	:global(.brand-dash-logo) {
		width: 24px;
		height: 24px;
		color: var(--text-primary);
		flex-shrink: 0;
	}

	:global(.brand-dash-logo.sm) {
		width: 22px;
		height: 22px;
	}

	.brand-text {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		white-space: nowrap;
	}

	.sidebar-nav-scroll {
		flex: 1;
		padding: 14px 12px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		overflow-y: auto;
		overflow-x: hidden;
	}

	.dash-sidebar.collapsed .sidebar-nav-scroll {
		padding: 12px 6px;
		gap: 10px;
	}

	.nav-group {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.dash-sidebar.collapsed .nav-group {
		gap: 6px;
		align-items: center;
	}

	.group-title {
		font-size: 0.65rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: var(--text-muted);
		padding: 8px 12px 4px;
		white-space: nowrap;
	}

	.dash-sidebar.collapsed .group-title {
		display: none;
	}

	.nav-btn {
		display: flex;
		align-items: center;
		gap: 12px;
		height: 40px;
		padding: 0 12px;
		background: none;
		border: none;
		border-radius: 10px;
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-align: left;
		cursor: pointer;
		font-family: inherit;
		transition: all 0.15s ease;
		white-space: nowrap;
		width: 100%;
		box-sizing: border-box;
	}

	.nav-btn:hover {
		background: var(--color-surface-subtle);
		color: var(--text-primary);
	}

	.nav-btn.active {
		background: #f0f2f5;
		color: var(--text-primary);
		font-weight: 600;
	}

	:global([data-theme='dark']) .nav-btn.active {
		background: #20232a;
		color: #ffffff;
	}

	.dash-sidebar.collapsed .nav-btn {
		justify-content: center;
		padding: 0;
		width: 42px;
		height: 42px;
		margin: 0 auto;
	}

	.dash-sidebar.collapsed .nav-btn span,
	.dash-sidebar.collapsed .count-pill,
	.dash-sidebar.collapsed .vault-tag {
		display: none;
	}

	.count-pill {
		margin-left: auto;
		font-size: 0.6875rem;
		font-weight: 600;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		padding: 2px 7px;
		border-radius: 99px;
		color: var(--text-secondary);
	}

	.vault-tag {
		margin-left: auto;
		font-size: 0.5625rem;
		font-weight: 700;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.12);
		padding: 2px 6px;
		border-radius: 4px;
		text-transform: uppercase;
	}

	/* ── Canvas ─────────────────────────────────────────────── */
	.dash-canvas {
		padding: calc(var(--nav-h) + 1.75rem) 2.5rem 5rem;
		max-width: 1140px;
		min-width: 0;
		width: 100%;
	}

	@media (max-width: 640px) {
		.dash-canvas {
			padding: calc(var(--nav-h) + 1rem) 1rem 4rem;
		}
	}

	/* Overview Pane */
	.overview-pane {
		display: flex;
		flex-direction: column;
	}

	/* Welcome Row */
	.dash-welcome-row {
		display: flex;
		align-items: center;
		gap: 16px;
		margin-bottom: 2rem;
	}

	.dash-welcome-avatar {
		width: 52px;
		height: 52px;
		border-radius: 50%;
		background: #09090b;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.1rem;
		flex-shrink: 0;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
	}

	:global([data-theme='dark']) .dash-welcome-avatar {
		background: #27272a;
	}

	.dash-welcome-title {
		font-size: 1.55rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.025em;
		line-height: 1.2;
	}

	.dash-welcome-sub {
		font-size: 0.875rem;
		color: var(--text-secondary);
		margin-top: 3px;
	}

	/* Stat Cards Row */
	.dash-stats-row {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		gap: 18px;
		margin-bottom: 2.25rem;
	}

	@media (max-width: 768px) {
		.dash-stats-row {
			grid-template-columns: 1fr;
		}
	}

	.dash-stat-box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 22px 24px;
		box-shadow: 0 2px 10px rgba(0, 0, 0, 0.02);
		transition: all 0.15s ease;
	}

	.dash-stat-box:hover {
		box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
	}

	.dash-stat-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.dash-stat-label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}

	.dash-stat-badge {
		width: 32px;
		height: 32px;
		border-radius: 9px;
		background: #09090b;
		color: #ffffff;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	:global([data-theme='dark']) .dash-stat-badge {
		background: #27272a;
	}

	.dash-stat-number {
		font-size: 1.85rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-top: 14px;
		letter-spacing: -0.02em;
	}

	/* Main Split Grid */
	.dash-grid-split {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 22px;
		margin-bottom: 2.5rem;
	}

	@media (max-width: 990px) {
		.dash-grid-split {
			grid-template-columns: 1fr;
		}
	}

	.dash-sec-head {
		margin-bottom: 16px;
	}

	.dash-sec-title {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.015em;
	}

	.dash-course-cards-wrap {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
		gap: 16px;
	}

	.dash-card-item {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 22px;
		cursor: pointer;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
		transition: all 0.15s ease;
		display: flex;
		flex-direction: column;
	}

	.dash-card-item:hover {
		border-color: var(--text-primary);
		box-shadow: 0 6px 18px rgba(0, 0, 0, 0.05);
	}

	.dash-card-icon-sq {
		width: 42px;
		height: 42px;
		border-radius: 12px;
		background: var(--color-surface-subtle);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
		margin-bottom: 16px;
	}

	.dash-card-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1.4;
		margin-bottom: 20px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex: 1;
	}

	.dash-progress-meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.dash-mini-bar {
		flex: 1;
		height: 9px;
		background: #eef0f3;
		border-radius: 999px;
		overflow: hidden;
	}

	:global([data-theme='dark']) .dash-mini-bar {
		background: #252830;
	}

	.dash-mini-fill {
		height: 100%;
		background: #09090b;
		border-radius: 999px;
	}

	:global([data-theme='dark']) .dash-mini-fill {
		background: #ffffff;
	}

	.dash-lesson-txt {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		white-space: nowrap;
	}

	/* Daily Progress Widget */
	.dash-daily-box {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 22px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
		height: 100%;
	}

	.dash-daily-heading {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 18px;
		letter-spacing: -0.015em;
	}

	.dash-daily-tags {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.dash-daily-pill {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 12px 16px;
		border-radius: 14px;
		background: var(--color-surface-subtle);
		border: 1px solid var(--border);
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-primary);
		transition: all 0.12s ease;
	}

	.dash-daily-pill:hover {
		background: #f0f2f5;
	}

	:global([data-theme='dark']) .dash-daily-pill:hover {
		background: #22252c;
	}

	.dash-daily-icon {
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-primary);
	}

	/* Upcoming Class Section */
	.dash-upcoming-section {
		margin-top: 8px;
	}

	.dash-upcoming-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 16px;
	}

	.dash-upcoming-controls {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.dash-chip-active {
		padding: 6px 16px;
		border-radius: 999px;
		background: #09090b;
		color: #ffffff;
		font-size: 0.78rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
	}

	:global([data-theme='dark']) .dash-chip-active {
		background: #ffffff;
		color: #09090b;
	}

	.dash-chip-btn {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 1px solid var(--border);
		background: var(--surface);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.12s ease;
	}

	.dash-chip-btn:hover {
		color: var(--text-primary);
		border-color: var(--text-primary);
	}

	.dash-upcoming-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(320px, 1fr));
		gap: 16px;
	}

	.dash-event-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: 20px;
		padding: 20px 24px;
		display: flex;
		justify-content: space-between;
		align-items: center;
		gap: 16px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
	}

	.dash-event-tag {
		font-size: 0.65rem;
		font-weight: 700;
		color: var(--text-muted);
		letter-spacing: 0.08em;
		text-transform: uppercase;
	}

	.dash-event-title {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 4px 0 6px;
	}

	.dash-event-time {
		font-size: 0.78rem;
		color: var(--text-secondary);
		font-weight: 500;
	}

	.dash-btn-register {
		padding: 9px 18px;
		border-radius: 12px;
		background: #09090b;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		white-space: nowrap;
		transition: opacity 0.12s ease;
	}

	:global([data-theme='dark']) .dash-btn-register {
		background: #ffffff;
		color: #09090b;
	}

	.dash-btn-register:hover {
		opacity: 0.9;
	}

	.dash-btn-joined {
		padding: 9px 18px;
		border-radius: 12px;
		background: var(--color-surface-subtle);
		color: var(--text-primary);
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		border: 1px solid var(--border);
		white-space: nowrap;
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

	.input-box {
		width: 100%;
		height: 38px;
		padding: 0 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.875rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color 0.15s;
	}
	.input-box:focus { border-color: var(--lp-accent); background: var(--bg); }
	select.input-box { height: 38px; }

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

	/* Workspace Mode Switcher Buttons */
	.mode-toggle-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.workspace-switch-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		width: 100%;
		padding: 7px 10px;
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
		font-weight: 600;
		cursor: pointer;
		transition: all 0.15s ease;
		border: 1px solid var(--border);
		background: var(--bg-surface);
		color: var(--text-secondary);
	}

	.workspace-switch-btn:hover {
		background: var(--bg-subtle);
		color: var(--text-primary);
		border-color: var(--border-hover);
	}

	.workspace-switch-btn.admin-switch {
		border-color: var(--border);
		background: var(--surface-subtle);
		color: var(--text-primary);
	}

	.workspace-switch-btn.admin-switch:hover {
		background: var(--bg-elevated);
		border-color: var(--border-hover, var(--border));
	}

	.workspace-switch-btn.admin-switch.active-mode {
		background: var(--text-primary);
		border-color: var(--text-primary);
		color: var(--bg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.workspace-switch-btn.teacher-switch {
		border-color: var(--border);
		background: var(--surface-subtle);
		color: var(--text-secondary);
	}

	.workspace-switch-btn.teacher-switch:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.workspace-switch-btn.teacher-switch.active-mode {
		background: var(--text-primary);
		border-color: var(--text-primary);
		color: var(--bg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.workspace-switch-btn.learner-switch {
		border-color: var(--border);
		background: var(--surface-subtle);
		color: var(--text-secondary);
	}

	.workspace-switch-btn.learner-switch:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.workspace-switch-btn.learner-switch.active-mode {
		background: var(--text-primary);
		border-color: var(--text-primary);
		color: var(--bg);
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
	}

	.dash-sidebar.collapsed .workspace-switch-btn {
		justify-content: center;
		padding: 7px 0;
		width: 36px;
		margin: 0 auto;
	}
	.dash-sidebar.collapsed .workspace-switch-btn span {
		display: none;
	}

	.highlight-revenue {
		background: var(--surface-subtle);
		border-color: var(--border);
	}

	.text-success {
		color: var(--text-primary);
		font-weight: 700;
	}

	.kpi-box-sub {
		font-size: 0.7rem;
		color: var(--text-muted);
		margin-top: 4px;
	}

	/* Quick Governance Shortcuts Grid - Minimal & Monochromatic */
	.governance-shortcuts-grid {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 12px;
		margin-top: 1rem;
	}

	@media (max-width: 900px) {
		.governance-shortcuts-grid {
			grid-template-columns: 1fr;
		}
	}

	.gov-shortcut-card {
		display: flex;
		align-items: center;
		gap: 14px;
		padding: 14px 16px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		cursor: pointer;
		text-align: left;
		transition: all 0.15s ease;
		width: 100%;
	}

	.gov-shortcut-card:hover {
		background: var(--surface);
		border-color: var(--text-primary);
		transform: translateY(-1px);
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
	}

	.gov-shortcut-card.vault-shortcut {
		border-color: var(--border);
		background: var(--surface-subtle);
	}

	.gov-shortcut-card.vault-shortcut:hover {
		background: var(--surface);
		border-color: var(--text-primary);
	}

	.gov-shortcut-icon {
		width: 40px;
		height: 40px;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-primary);
	}

	.gov-shortcut-icon.users-icon,
	.gov-shortcut-icon.mentoring-icon,
	.gov-shortcut-icon.security-icon,
	.gov-shortcut-icon.vault-icon {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.gov-shortcut-info {
		flex: 1;
		min-width: 0;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.gov-shortcut-info strong {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.gov-shortcut-info span {
		font-size: 0.72rem;
		color: var(--text-muted);
		line-height: 1.3;
	}

	.gov-shortcut-arrow {
		color: var(--text-muted);
		transition: transform 0.15s ease;
		flex-shrink: 0;
	}

	.gov-shortcut-card:hover .gov-shortcut-arrow {
		color: var(--text-primary);
		transform: translateX(3px);
	}

	@media (max-width: 860px) {
		.dash-shell { grid-template-columns: 1fr; }
		.dash-sidebar { display: none; }
		.dash-canvas { padding: 1.5rem; }
		.grid-2-col { grid-template-columns: 1fr; }
		.kpi-grid-4 { grid-template-columns: repeat(2, 1fr); }
	}

	/* ── User & Role Management Enhanced Styles ───────────── */
	.title-with-badge {
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.count-tag-header {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 2px 8px;
		border-radius: 99px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.user-filter-bar {
		margin-bottom: 1rem;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
	}

	.role-filter-pills {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}

	.role-filter-btn {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 6px 14px;
		border-radius: 99px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.role-filter-btn:hover {
		background: var(--surface-subtle);
		color: var(--text-primary);
		border-color: var(--border-hover, var(--border));
	}

	.role-filter-btn.active {
		background: var(--text-primary);
		color: var(--bg);
		border-color: var(--text-primary);
	}

	.role-filter-btn.danger.active {
		background: #ef4444;
		border-color: #ef4444;
		color: #ffffff;
	}

	.user-meta-top {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 2px;
	}

	.badge-role-owner {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		background: var(--text-primary);
		color: var(--bg);
		border: 1px solid var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge-role-admin {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		background: var(--bg-elevated);
		border: 1px solid var(--border-hover, var(--border));
		color: var(--text-primary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge-role-teacher {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: 4px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.badge-role-student {
		font-size: 0.65rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 4px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text-muted);
	}

	.role-select-styled {
		font-size: 0.75rem;
		font-weight: 600;
		padding: 5px 8px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-primary);
		cursor: pointer;
		outline: none;
		transition: border-color 0.15s ease;
	}

	.role-select-styled:focus {
		border-color: var(--text-primary);
	}

	.status-stack {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.status-row {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.pill-verified {
		font-size: 0.68rem;
		font-weight: 600;
		padding: 2px 7px;
		border-radius: 99px;
		background: var(--surface-subtle);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}

	.pill-unverified {
		font-size: 0.68rem;
		font-weight: 500;
		padding: 2px 7px;
		border-radius: 99px;
		background: transparent;
		color: var(--text-muted);
		border: 1px solid var(--border);
	}

	.enrollments-counter-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface-subtle);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.enrollments-counter-btn:hover {
		background: var(--surface);
		color: var(--text-primary);
		border-color: var(--text-primary);
	}

	.cohort-tag-sm {
		font-size: 0.65rem;
		padding: 1px 5px;
		border-radius: 3px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text-secondary);
	}

	.user-table-actions {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 6px;
	}

	.btn-icon-action {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 5px 10px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon-action:hover {
		background: var(--surface-subtle);
		color: var(--text-primary);
	}

	.btn-icon-danger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		border-radius: 6px;
		border: 1px solid rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.06);
		color: #ef4444;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-icon-danger:hover {
		background: #ef4444;
		color: #ffffff;
	}

	.btn-table-action.success {
		color: #10b981;
		border-color: rgba(16, 185, 129, 0.3);
	}

	.btn-table-action.success:hover {
		background: rgba(16, 185, 129, 0.1);
	}

	.row-banned {
		opacity: 0.65;
		background: rgba(239, 68, 68, 0.02);
	}

	/* ── User Inspection Drawer Styles ─────────────────────── */
	.drawer-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.6);
		backdrop-filter: blur(4px);
		z-index: 100;
		display: flex;
		justify-content: flex-end;
	}

	.user-drawer-panel {
		width: 100%;
		max-width: 520px;
		height: 100vh;
		background: var(--surface);
		border-left: 1px solid var(--border);
		display: flex;
		flex-direction: column;
		box-shadow: -10px 0 30px rgba(0, 0, 0, 0.2);
		animation: drawerSlideIn 0.25s cubic-bezier(0.16, 1, 0.3, 1);
	}

	@keyframes drawerSlideIn {
		from { transform: translateX(100%); }
		to { transform: translateX(0); }
	}

	.drawer-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--surface-subtle);
	}

	.drawer-title-box {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.drawer-user-avatar {
		width: 44px;
		height: 44px;
		border-radius: 12px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		color: var(--text-primary);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 700;
		font-size: 1.15rem;
	}

	.drawer-user-name {
		font-size: 1.05rem;
		font-weight: 700;
		color: var(--text-primary);
		margin: 0;
	}

	.drawer-user-email {
		font-size: 0.8rem;
		color: var(--text-muted);
		margin: 2px 0 0;
	}

	.drawer-close-btn {
		width: 32px;
		height: 32px;
		border-radius: 8px;
		border: 1px solid var(--border);
		background: var(--surface);
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.15s ease;
	}

	.drawer-close-btn:hover {
		background: var(--surface-subtle);
		color: var(--text-primary);
	}

	.drawer-body {
		flex: 1;
		overflow-y: auto;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.drawer-section {
		display: flex;
		flex-direction: column;
		gap: 0.75rem;
	}

	.drawer-section-title {
		font-size: 0.82rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--text-secondary);
		margin: 0;
	}

	.section-title-with-badge {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.badge-power {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
		background: var(--surface-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}

	.drawer-hint {
		font-size: 0.75rem;
		color: var(--text-muted);
		margin: 0;
	}

	.drawer-grid-stats {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
		gap: 8px;
	}

	.stat-tile {
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		padding: 8px 12px;
		border-radius: 8px;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.stat-tile-label {
		font-size: 0.68rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.stat-tile-val {
		font-size: 0.88rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.stat-tile-val.text-danger {
		color: #ef4444;
	}

	.quick-security-actions {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-top: 4px;
	}

	.btn-drawer-action {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		padding: 7px 12px;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface-subtle);
		color: var(--text-primary);
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-drawer-action:hover {
		background: var(--border-subtle);
	}

	.btn-drawer-action.btn-drawer-danger {
		color: #ef4444;
		border-color: rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.05);
	}

	.btn-drawer-action.btn-drawer-danger:hover {
		background: rgba(239, 68, 68, 0.12);
	}

	/* Grant Asset Form */
	.grant-asset-form {
		margin-top: 4px;
	}

	.grant-select-wrap {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.grant-asset-select {
		width: 100%;
		padding: 8px 10px;
		font-size: 0.8rem;
		border-radius: 6px;
		border: 1px solid var(--border);
		background: var(--surface-subtle);
		color: var(--text-primary);
		outline: none;
	}

	.grant-asset-select:focus {
		border-color: var(--text-primary);
	}

	.btn-grant-submit {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		padding: 8px 14px;
		border-radius: 6px;
		background: var(--text-primary);
		color: var(--bg);
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		transition: opacity 0.15s ease;
	}

	.btn-grant-submit:hover {
		opacity: 0.9;
	}

	/* Enrolled Assets List */
	.enrolled-assets-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.enrolled-asset-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: var(--surface-subtle);
		border: 1px solid var(--border);
		border-radius: 8px;
		gap: 12px;
	}

	.enrolled-asset-info {
		display: flex;
		flex-direction: column;
		gap: 2px;
		min-width: 0;
	}

	.enrolled-asset-type {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.enrolled-asset-title {
		font-size: 0.84rem;
		font-weight: 600;
		color: var(--text-primary);
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}

	.enrolled-asset-date {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.btn-revoke-access {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 4px 8px;
		border-radius: 4px;
		border: 1px solid rgba(239, 68, 68, 0.3);
		background: rgba(239, 68, 68, 0.08);
		color: #ef4444;
		cursor: pointer;
		transition: all 0.15s ease;
		flex-shrink: 0;
	}

	.btn-revoke-access:hover {
		background: #ef4444;
		color: #ffffff;
	}

	.empty-drawer-box {
		padding: 2rem 1rem;
		border: 1px dashed var(--border);
		border-radius: 8px;
		text-align: center;
		color: var(--text-muted);
		font-size: 0.8rem;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.owner-danger-zone {
		border: 1px solid rgba(239, 68, 68, 0.2);
		background: rgba(239, 68, 68, 0.03);
		padding: 1rem;
		border-radius: 8px;
	}

	.btn-owner-purge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 8px 14px;
		border-radius: 6px;
		background: #ef4444;
		color: #ffffff;
		font-size: 0.8rem;
		font-weight: 600;
		border: none;
		cursor: pointer;
		margin-top: 8px;
		transition: background 0.15s ease;
	}

	.btn-owner-purge:hover {
		background: #dc2626;
	}
</style>
