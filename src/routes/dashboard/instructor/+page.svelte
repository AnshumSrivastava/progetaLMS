<script lang="ts">
	import { Users, BookOpen, GraduationCap, TrendingUp, Plus, MoreHorizontal } from 'lucide-svelte';

	let { data } = $props();

	let metrics = $derived([
		{ label: 'Total Students', value: data.stats.totalStudents, change: '0%', icon: Users },
		{ label: 'Active Courses', value: data.stats.activeCourses, change: '0%', icon: BookOpen },
		{ label: 'Avg. Rating', value: data.stats.avgRating, change: '0%', icon: GraduationCap },
		{ label: 'Total Revenue', value: `₹${data.stats.totalRevenue}`, change: '0%', icon: TrendingUp },
	]);

	const recentActivity = [
		{ user: 'Alex M.', action: 'completed', target: 'Module 3: Zero Trust', time: '10 mins ago' },
		{ user: 'Sarah J.', action: 'enrolled in', target: 'Cloud Security Architecture', time: '1 hour ago' },
		{ user: 'David K.', action: 'earned certificate', target: 'Network Defense Associate', time: '3 hours ago' },
		{ user: 'Maria L.', action: 'completed', target: 'Module 1: Threat Landscape', time: '5 hours ago' },
		{ user: 'James T.', action: 'enrolled in', target: 'Cybersecurity Fundamentals', time: '1 day ago' },
	];
</script>

<svelte:head>
	<title>Overview — Instructor Portal</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Overview</h1>
			<p class="page-subtitle">Here's what's happening with your courses today.</p>
		</div>
		<button class="create-btn">
			<Plus size={16} /> Create Course
		</button>
	</header>

	<!-- Metrics strip -->
	<div class="metrics-grid">
		{#each metrics as metric}
			<div class="metric-card">
				<div class="metric-top">
					<p class="metric-label">{metric.label}</p>
					<metric.icon size={18} class="metric-icon" />
				</div>
				<div class="metric-bottom">
					<p class="metric-value">{metric.value}</p>
					<span class="metric-change positive">{metric.change}</span>
				</div>
			</div>
		{/each}
	</div>

	<div class="dash-grid">
		<!-- Main Column: Activity Chart / Reports (Placeholder for now) -->
		<div class="main-col">
			<section class="dash-section">
				<div class="section-header">
					<h2>Revenue & Enrollments</h2>
				</div>
				<div class="chart-placeholder">
					<TrendingUp size={32} />
					<p>Chart Data Unavailable</p>
					<span class="subtext">Connect your Stripe account to view detailed revenue charts.</span>
				</div>
			</section>
		</div>

		<!-- Sidebar Column: Activity -->
		<div class="side-col">
			<section class="dash-section">
				<div class="section-header">
					<h2>Recent Activity</h2>
				</div>
				
				<div class="activity-feed">
					{#each recentActivity as item}
						<div class="activity-item">
							<div class="activity-dot"></div>
							<div class="activity-content">
								<p class="activity-text">
									<strong>{item.user}</strong> {item.action} <em>{item.target}</em>
								</p>
								<span class="activity-time">{item.time}</span>
							</div>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.page-content {
		padding: 2.5rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2.5rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin-bottom: 4px;
	}
	.page-subtitle {
		font-size: 0.95rem;
		color: var(--text-muted);
	}

	.create-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.create-btn:hover {
		opacity: 0.9;
	}

	/* Metrics */
	.metrics-grid {
		display: grid;
		grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
		gap: 1.5rem;
		margin-bottom: 3rem;
	}

	.metric-card {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}

	.metric-top {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.metric-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.metric-icon {
		color: var(--text-muted);
	}

	.metric-bottom {
		display: flex;
		align-items: baseline;
		gap: 12px;
	}
	.metric-value {
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
	}
	.metric-change {
		font-size: 0.85rem;
		font-weight: 600;
	}
	.metric-change.positive {
		color: #10b981;
	}

	/* Layout Grid */
	.dash-grid {
		display: grid;
		grid-template-columns: 2fr 1.2fr;
		gap: 2rem;
	}

	.section-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 1.25rem;
	}
	.section-header h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.chart-placeholder {
		background: var(--bg-subtle);
		border: 1px dashed var(--border-strong);
		border-radius: 12px;
		height: 350px;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		color: var(--text-muted);
		gap: 12px;
	}
	.chart-placeholder p {
		font-weight: 600;
		font-size: 1.1rem;
		color: var(--text-secondary);
	}
	.chart-placeholder .subtext {
		font-size: 0.85rem;
	}

	/* Activity Feed */
	.activity-feed {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		height: 350px;
		overflow-y: auto;
	}

	.activity-item {
		display: flex;
		gap: 12px;
		position: relative;
	}
	.activity-item:not(:last-child)::before {
		content: '';
		position: absolute;
		left: 4px;
		top: 14px;
		bottom: -1.5rem;
		width: 1px;
		background: var(--border);
	}

	.activity-dot {
		width: 9px;
		height: 9px;
		border-radius: 50%;
		background: var(--accent);
		margin-top: 5px;
		position: relative;
		z-index: 2;
		box-shadow: 0 0 0 4px var(--bg-subtle);
	}

	.activity-content {
		flex: 1;
	}
	.activity-text {
		font-size: 0.9rem;
		color: var(--text-secondary);
		line-height: 1.4;
		margin-bottom: 4px;
	}
	.activity-text strong {
		color: var(--text-primary);
	}
	.activity-text em {
		font-style: normal;
		color: var(--text-primary);
		font-weight: 500;
	}
	.activity-time {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	@media (max-width: 1024px) {
		.dash-grid {
			grid-template-columns: 1fr;
		}
	}
</style>
