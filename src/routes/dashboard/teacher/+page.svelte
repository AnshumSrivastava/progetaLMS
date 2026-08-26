<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Users, BookOpen, GraduationCap, TrendingUp, Plus, Activity } from 'lucide-svelte';

	let { data } = $props();

	let metrics = $derived([
		{ label: 'Total Students', value: data.stats.totalStudents, icon: Users },
		{ label: 'Active Courses', value: data.stats.activeCourses, icon: BookOpen },
		{ label: 'Avg. Rating',    value: data.stats.avgRating, icon: GraduationCap },
		{ label: 'Total Revenue',  value: `₹${data.stats.totalRevenue}`, icon: TrendingUp },
	]);
</script>

<svelte:head>
	<title>Overview — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1>Teacher Overview</h1>
			<p class="subtitle">Course metrics and student enrollment activity.</p>
		</div>
		<a href="/dashboard/teacher/courses" class="create-btn">
			<Plus size={14} />
			<span>New Course</span>
		</a>
	</header>

	<!-- Metrics Strip (Border-Separated) -->
	<div class="metrics-strip">
		{#each metrics as metric}
			<div class="metric-item">
				<span class="metric-label">{metric.label}</span>
				<span class="metric-val">{metric.value}</span>
			</div>
		{/each}
	</div>

	<div class="dash-grid">
		<!-- Main Column: Revenue Notes -->
		<div class="main-col">
			<section class="card-section">
				<h2>Revenue & Performance</h2>
				<p class="info-text">Detailed revenue reports will render automatically once transaction data is received.</p>
			</section>
		</div>

		<!-- Sidebar Column: Activity -->
		<div class="side-col">
			<section class="card-section">
				<h2>Recent Activity</h2>
				<div class="activity-feed">
					{#each data.recentActivity as item}
						<div class="activity-row">
							<div class="activity-dot"></div>
							<div class="activity-main">
								<p><strong>{item.user}</strong> {item.action} <span>{item.target}</span></p>
								<span class="time">{item.time}</span>
							</div>
						</div>
					{:else}
						<div class="empty-feed">
							<Activity size={20} class="empty-icon" />
							<p>No recent activity recorded.</p>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.page-content {
		padding: 2rem 2.5rem;
		max-width: 1040px;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
	}

	.page-header h1 {
		font-size: 1.375rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.page-header .subtitle {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		background: var(--text-primary);
		color: var(--bg);
		border-radius: var(--radius-md);
		font-size: 0.8125rem;
		font-weight: 500;
		text-decoration: none;
	}

	.metrics-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		margin-bottom: 1.5rem;
	}

	.metric-item {
		padding: 16px 20px;
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 4px;
	}

	.metric-item:last-child {
		border-right: none;
	}

	.metric-label {
		font-size: 0.75rem;
		color: var(--text-muted);
		font-weight: 500;
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.metric-val {
		font-size: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.dash-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 1.5rem;
	}

	.card-section {
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 18px;
		background: var(--bg);
	}

	.card-section h2 {
		font-size: 0.9375rem;
		font-weight: 600;
		margin-bottom: 12px;
	}

	.info-text {
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.activity-feed {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.activity-row {
		display: flex;
		gap: 10px;
		align-items: flex-start;
	}

	.activity-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-primary);
		margin-top: 6px;
		flex-shrink: 0;
	}

	.activity-main p {
		font-size: 0.8125rem;
		color: var(--text-secondary);

	}

	.activity-main p strong {
		color: var(--text-primary);
		font-weight: 600;
	}

	.activity-main p span {
		color: var(--text-primary);
	}

	.time {
		font-size: 0.7rem;
		color: var(--text-muted);
	}

	.empty-feed {
		text-align: center;
		padding: 2rem 1rem;
		color: var(--text-muted);
		font-size: 0.8125rem;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
	}

	@media (max-width: 768px) {
		.metrics-strip { grid-template-columns: repeat(2, 1fr); }
		.dash-grid { grid-template-columns: 1fr; }
	}
</style>
