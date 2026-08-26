<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { 
		Users, 
		BookOpen, 
		Award, 
		Layers, 
		SlidersHorizontal, 
		Eye, 
		Mail, 
		Image as ImageIcon, 
		ShieldCheck, 
		ArrowRight,
		Activity,
		CheckCircle2,
		AlertCircle
	} from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedTemplate = $state(data.templates[0]);
</script>

<svelte:head>
	<title>Admin Cockpit — {APP_NAME}</title>
</svelte:head>

<div class="cockpit-page">
	<!-- ── COCKPIT HEADER ──────────────────────────────────── -->
	<header class="cockpit-header">
		<div>
			<h1>Admin Cockpit</h1>
			<p class="subtitle">Platform performance overview, module toggles, and system controls.</p>
		</div>
		<div class="status-indicator">
			<span class="status-dot"></span>
			<span>Platform Active</span>
		</div>
	</header>

	{#if form?.success}
		<div class="alert-strip success">
			<CheckCircle2 size={15} />
			<span>{form.message || 'Settings saved successfully.'}</span>
		</div>
	{/if}

	<!-- ── KPI METRICS STRIP ───────────────────────────────── -->
	<div class="kpi-strip">
		<a href="/dashboard/admin/users" class="kpi-item">
			<div class="kpi-label">
				<Users size={13} />
				<span>Total Users</span>
			</div>
			<span class="kpi-value">{data.kpis.totalUsers}</span>
		</a>
		<div class="kpi-item">
			<div class="kpi-label">
				<BookOpen size={13} />
				<span>Courses</span>
			</div>
			<span class="kpi-value">{data.kpis.totalCourses}</span>
		</div>
		<div class="kpi-item">
			<div class="kpi-label">
				<Award size={13} />
				<span>Certifications</span>
			</div>
			<span class="kpi-value">{data.kpis.totalCerts}</span>
		</div>
		<a href="/dashboard/admin/cohorts" class="kpi-item">
			<div class="kpi-label">
				<Layers size={13} />
				<span>Cohorts</span>
			</div>
			<span class="kpi-value">{data.kpis.totalCohorts}</span>
		</a>
	</div>

	<!-- ── MAIN TWO-COLUMN DASHBOARD ───────────────────────── -->
	<div class="cockpit-grid">
		<!-- ── MAIN COLUMN (Modules & Templates) ─────────────── -->
		<div class="main-col">
			<!-- Platform Modules Toggles -->
			<section class="admin-card">
				<div class="card-head">
					<SlidersHorizontal size={16} />
					<h2>Platform Modules</h2>
				</div>
				<p class="card-desc">Enable or disable core public-facing features across the LMS.</p>

				<form method="POST" action="?/updateSettings" class="form-stack">
					<label class="toggle-row">
						<div class="toggle-info">
							<span class="toggle-title">Asset & Course Catalog</span>
							<span class="toggle-sub">Allow public browsing and checkout of courses and digital assets</span>
						</div>
						<input type="checkbox" name="enableCatalog" checked={data.settings.enableCatalog} class="toggle-switch" />
					</label>

					<label class="toggle-row">
						<div class="toggle-info">
							<span class="toggle-title">1-on-1 Mentoring Hub</span>
							<span class="toggle-sub">Enable instructor schedule booking and mentoring sessions</span>
						</div>
						<input type="checkbox" name="enableMentoring" checked={data.settings.enableMentoring} class="toggle-switch" />
					</label>

					<label class="toggle-row">
						<div class="toggle-info">
							<span class="toggle-title">Certifications & Exam Engine</span>
							<span class="toggle-sub">Allow learners to purchase and take proctored certification tests</span>
						</div>
						<input type="checkbox" name="enableCertifications" checked={data.settings.enableCertifications} class="toggle-switch" />
					</label>

					<button type="submit" class="btn-primary">Save Platform Settings</button>
				</form>
			</section>

			<!-- Email Notification Templates -->
			<section class="admin-card">
				<div class="card-head">
					<Mail size={16} />
					<h2>Notification & Email Templates</h2>
				</div>
				<p class="card-desc">Customize automated transactional emails with dynamic variables.</p>

				<form method="POST" action="?/saveTemplate" class="template-form">
					<div class="template-tabs">
						{#each data.templates as tpl}
							<button 
								type="button" 
								class="tab-btn" 
								class:active={selectedTemplate.id === tpl.id} 
								onclick={() => selectedTemplate = tpl}
							>
								{tpl.id}
							</button>
						{/each}
					</div>

					<input type="hidden" name="id" value={selectedTemplate.id} />

					<div class="field">
						<label for="subject">Email Subject</label>
						<input 
							type="text" 
							id="subject" 
							name="subject" 
							bind:value={selectedTemplate.subject} 
							class="text-input" 
						/>
					</div>

					<div class="field">
						<div class="field-label-row">
							<label for="body">Markdown Content</label>
							<span class="var-hint">Supports <code>{"{{user.name}}"}</code></span>
						</div>
						<textarea 
							id="body" 
							name="body" 
							bind:value={selectedTemplate.body} 
							rows="5" 
							class="code-input"
						></textarea>
					</div>

					<button type="submit" class="btn-primary">Save Template</button>
				</form>
			</section>

			<!-- Asset Upload -->
			<section class="admin-card">
				<div class="card-head">
					<ImageIcon size={16} />
					<h2>Public Asset Storage</h2>
				</div>
				<FileUpload 
					accept="*/*"
					maxSizeMb={50}
					label="Upload Public Asset"
					description="Upload platform logos, certificates, or downloadable assets up to 50MB"
					onUploadSuccess={(url) => console.log("Uploaded file:", url)}
				/>
			</section>
		</div>

		<!-- ── SIDEBAR COLUMN (Role Testing & Live Activity) ─── -->
		<div class="side-col">
			<!-- Role Impersonation Box -->
			<section class="admin-card">
				<div class="card-head">
					<Eye size={16} />
					<h2>Role Preview Mode</h2>
				</div>
				<p class="card-desc">Temporarily switch your session view mode to inspect the platform as a student or teacher.</p>

				<form method="POST" action="?/impersonate" class="form-stack">
					<select name="role" class="select-input">
						<option value="student">Student Perspective</option>
						<option value="teacher">Teacher Perspective</option>
					</select>
					<button type="submit" class="btn-secondary">
						<span>Switch View Mode</span>
						<ArrowRight size={13} />
					</button>
				</form>
			</section>

			<!-- Live Activity Audit Stream -->
			<section class="admin-card">
				<div class="card-head-row">
					<div class="card-head" style="margin-bottom:0;">
						<Activity size={16} />
						<h2>Recent Audit Events</h2>
					</div>
					<a href="/dashboard/admin/audit" class="view-all-link">View All</a>
				</div>

				<div class="audit-stream">
					{#each data.recentAudit as log}
						<div class="audit-item">
							<div class="audit-dot"></div>
							<div class="audit-info">
								<p class="audit-action">
									<strong>{log.action}</strong>
									{#if log.actorEmail}
										<span class="actor-tag">by {log.actorEmail}</span>
									{/if}
								</p>
								<span class="audit-time">
									{new Date(log.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
								</span>
							</div>
						</div>
					{:else}
						<div class="empty-audit">
							<ShieldCheck size={20} />
							<span>No recent audit logs recorded</span>
						</div>
					{/each}
				</div>
			</section>
		</div>
	</div>
</div>

<style>
	.cockpit-page {
		padding: 2.25rem 2.5rem 5rem;
		max-width: 1120px;
	}

	.cockpit-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		padding-bottom: 1.25rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 1.5rem;
		flex-wrap: wrap;
		gap: 1rem;
	}

	.cockpit-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.cockpit-header .subtitle {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-top: 3px;
	}

	.status-indicator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		font-weight: 500;
		color: #16a34a;
		background: rgba(22, 163, 74, 0.08);
		border: 1px solid rgba(22, 163, 74, 0.2);
		padding: 4px 10px;
		border-radius: 999px;
	}

	.status-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: #16a34a;
	}

	.alert-strip {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		margin-bottom: 1.5rem;
	}

	.alert-strip.success {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: #15803d;
	}

	/* ── KPI Strip ───────────────────────────────────────────── */
	.kpi-strip {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		background: var(--bg);
		overflow: hidden;
		margin-bottom: 1.75rem;
	}

	.kpi-item {
		padding: 14px 18px;
		border-right: 1px solid var(--border-subtle);
		display: flex;
		flex-direction: column;
		gap: 4px;
		text-decoration: none;
		transition: background var(--t-fast);
	}

	.kpi-item:last-child {
		border-right: none;
	}

	.kpi-item:hover {
		background: var(--bg-subtle);
	}

	.kpi-label {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.6875rem;
		font-weight: 600;
		letter-spacing: 0.05em;
		text-transform: uppercase;
		color: var(--text-muted);
	}

	.kpi-value {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		line-height: 1.1;
		font-variant-numeric: tabular-nums;
	}

	/* ── Grid ────────────────────────────────────────────────── */
	.cockpit-grid {
		display: grid;
		grid-template-columns: 1.4fr 1fr;
		gap: 1.75rem;
		align-items: start;
	}

	.main-col, .side-col {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.admin-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
	}

	.card-head {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 6px;
		color: var(--text-primary);
	}

	.card-head h2 {
		font-size: 0.9375rem;
		font-weight: 600;
	}

	.card-head-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 12px;
	}

	.view-all-link {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
	}

	.view-all-link:hover {
		color: var(--text-primary);
	}

	.card-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		line-height: 1.45;
		margin-bottom: 14px;
	}

	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.toggle-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 10px 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		cursor: pointer;
		gap: 12px;
	}

	.toggle-title {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.toggle-sub {
		display: block;
		font-size: 0.71875rem;
		color: var(--text-muted);
		margin-top: 1px;
	}

	.toggle-switch {
		width: 16px;
		height: 16px;
		accent-color: var(--text-primary);
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-primary {
		height: 34px;
		padding: 0 14px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		align-self: flex-start;
		margin-top: 4px;
	}

	.btn-secondary {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 34px;
		padding: 0 12px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
	}

	.btn-secondary:hover {
		border-color: var(--border-strong);
	}

	.select-input, .text-input {
		height: 34px;
		padding: 0 10px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: var(--text-primary);
		outline: none;
		width: 100%;
	}

	.select-input:focus, .text-input:focus {
		border-color: var(--border-strong);
		background: var(--bg);
	}

	.template-tabs {
		display: flex;
		gap: 14px;
		border-bottom: 1px solid var(--border-subtle);
		margin-bottom: 14px;
	}

	.tab-btn {
		background: none;
		border: none;
		padding: 6px 0;
		font-size: 0.78125rem;
		color: var(--text-secondary);
		cursor: pointer;
		position: relative;
	}

	.tab-btn.active {
		color: var(--text-primary);
		font-weight: 600;
	}

	.tab-btn.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--text-primary);
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 12px;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-muted);
	}

	.field-label-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}

	.var-hint {
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.code-input {
		padding: 10px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: var(--text-primary);
		font-family: ui-monospace, monospace;
		outline: none;
	}

	.code-input:focus {
		border-color: var(--border-strong);
		background: var(--bg);
	}

	/* ── Audit Stream ────────────────────────────────────────── */
	.audit-stream {
		display: flex;
		flex-direction: column;
		gap: 10px;
	}

	.audit-item {
		display: flex;
		align-items: flex-start;
		gap: 10px;
		padding: 8px 0;
		border-bottom: 1px solid var(--border-subtle);
	}

	.audit-item:last-child {
		border-bottom: none;
	}

	.audit-dot {
		width: 6px;
		height: 6px;
		border-radius: 50%;
		background: var(--text-primary);
		margin-top: 6px;
		flex-shrink: 0;
	}

	.audit-info {
		flex: 1;
		min-width: 0;
	}

	.audit-action {
		font-size: 0.78125rem;
		color: var(--text-primary);
		line-height: 1.3;
	}

	.actor-tag {
		color: var(--text-muted);
		font-size: 0.71875rem;
		margin-left: 4px;
	}

	.audit-time {
		font-size: 0.6875rem;
		color: var(--text-muted);
		display: block;
		margin-top: 2px;
	}

	.empty-audit {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 6px;
		padding: 2rem 0;
		color: var(--text-muted);
		font-size: 0.78125rem;
	}

	@media (max-width: 900px) {
		.cockpit-grid { grid-template-columns: 1fr; }
		.kpi-strip { grid-template-columns: repeat(2, 1fr); }
	}
</style>
