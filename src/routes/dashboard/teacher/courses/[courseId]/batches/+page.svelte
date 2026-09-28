<script lang="ts">
	import {
		Plus,
		Calendar,
		Users,
		Video,
		MessageCircle,
		Link as LinkIcon,
		FileText,
		CheckCircle2,
		ArrowRightLeft,
		Clock,
		AlertCircle,
		ExternalLink
	} from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let showCreateModal = $state(false);
	let activeTransferModalBatch = $state<any | null>(null);
	let transferTargetStudent = $state<any | null>(null);
	let transferToCohortId = $state('');
	let transferReason = $state('');

	// Active tab inside batch details: 'overview' | 'sessions' | 'roster'
	let activeBatchView = $state<Record<string, 'links' | 'sessions' | 'roster'>>({});

	function setBatchTab(batchId: string, tab: 'links' | 'sessions' | 'roster') {
		activeBatchView[batchId] = tab;
	}

	function openTransferModal(student: any, fromBatch: any) {
		transferTargetStudent = student;
		activeTransferModalBatch = fromBatch;
		transferToCohortId = '';
		transferReason = '';
	}

	function closeTransferModal() {
		transferTargetStudent = null;
		activeTransferModalBatch = null;
	}
</script>

<svelte:head>
	<title>Batches & Live Classes — {data.course.title}</title>
</svelte:head>

<div class="batches-page">
	<header class="workspace-header">
		<div>
			<h1>Batches & Live Classroom Hub</h1>
			<p>Schedule batches, provide meeting & WhatsApp links, post recording links, and manage student rosters.</p>
		</div>

		<button type="button" class="btn-create-batch" onclick={() => (showCreateModal = true)}>
			<Plus size={16} />
			<span>Create New Batch</span>
		</button>
	</header>

	{#if form?.success}
		<div class="alert-success mb-6">{form.message}</div>
	{:else if form?.error}
		<div class="alert-danger mb-6">{form.error}</div>
	{/if}

	{#if (data.course as any).deliveryFormat === 'self_paced'}
		<div class="notice-box">
			<AlertCircle size={20} class="text-amber-500 flex-shrink-0" />
			<div>
				<strong>This course is currently set to Self-Paced.</strong>
				<p>To enable cohort-driven seat reservation and batch schedules on the public catalog, switch the delivery format to <em>Live Classroom</em> in <a href={`/dashboard/teacher/courses/${data.course.id}/settings`} class="text-accent underline">Course Settings</a>.</p>
			</div>
		</div>
	{/if}

	<!-- ── Create Batch Modal / Drawer ────────────────────────── -->
	{#if showCreateModal}
		<div class="modal-backdrop" onclick={() => (showCreateModal = false)}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Create New Live Batch</h2>
					<button type="button" class="btn-close" onclick={() => (showCreateModal = false)}>✕</button>
				</div>

				<form method="POST" action="?/createBatch" class="modal-body" use:enhance={() => { return async ({ update }) => { showCreateModal = false; update(); }; }}>
					<div class="form-group">
						<label for="batch-name-input">Batch Name</label>
						<input id="batch-name-input" type="text" name="name" placeholder="e.g. October 2026 Weekend Cohort" class="input-field" required />
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="form-group">
							<label for="batch-start-date">Start Date</label>
							<input id="batch-start-date" type="date" name="startDate" class="input-field" required />
						</div>
						<div class="form-group">
							<label for="batch-end-date">End Date</label>
							<input id="batch-end-date" type="date" name="endDate" class="input-field" />
						</div>
					</div>

					<div class="grid grid-cols-2 gap-4">
						<div class="form-group">
							<label for="batch-schedule">Schedule & Days</label>
							<input id="batch-schedule" type="text" name="scheduleText" placeholder="e.g. Sat & Sun · 10 AM to 1 PM IST" class="input-field" />
						</div>
						<div class="form-group">
							<label for="batch-seats">Max Seat Capacity</label>
							<input id="batch-seats" type="number" name="maxStudents" placeholder="e.g. 30 (Leave empty for unlimited)" min="1" class="input-field" />
						</div>
					</div>

					<div class="form-group">
						<label for="batch-meet-link">Live Meeting Link (Google Meet / Zoom)</label>
						<input id="batch-meet-link" type="url" name="meetingUrl" placeholder="https://meet.google.com/xyz-abc" class="input-field" />
					</div>

					<div class="form-group">
						<label for="batch-wa-link">Batch WhatsApp / Community Link</label>
						<input id="batch-wa-link" type="url" name="communityUrl" placeholder="https://chat.whatsapp.com/xyz" class="input-field" />
					</div>

					<div class="modal-footer">
						<button type="button" class="btn-secondary" onclick={() => (showCreateModal = false)}>Cancel</button>
						<button type="submit" class="btn-primary">Create Batch</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- ── Transfer Ping Modal ─────────────────────────────────── -->
	{#if activeTransferModalBatch && transferTargetStudent}
		<div class="modal-backdrop" onclick={closeTransferModal}>
			<div class="modal-card" onclick={(e) => e.stopPropagation()}>
				<div class="modal-header">
					<h2>Offer Batch Transfer Ping</h2>
					<button type="button" class="btn-close" onclick={closeTransferModal}>✕</button>
				</div>

				<form method="POST" action="?/sendTransferPing" class="modal-body" use:enhance={() => { return async ({ update }) => { closeTransferModal(); update(); }; }}>
					<input type="hidden" name="studentId" value={transferTargetStudent.userId} />
					<input type="hidden" name="fromCohortId" value={activeTransferModalBatch.id} />

					<p class="text-[13px] text-[var(--text-secondary)] mb-4">
						Send an official Transfer Ping to <strong>{transferTargetStudent.name || transferTargetStudent.email}</strong>. Once sent, the student will see an accept offer banner on their dashboard.
					</p>

					<div class="form-group">
						<label for="transfer-target-select">Destination Batch</label>
						<select id="transfer-target-select" name="toCohortId" class="input-field" bind:value={transferToCohortId} required>
							<option value="">Select target batch...</option>
							{#each data.batches.filter((b) => b.id !== activeTransferModalBatch.id) as target}
								<option value={target.id} disabled={target.isSoldOut}>
									{target.name} ({target.seatsLeft !== null ? `${target.seatsLeft} seats left` : 'Open'})
								</option>
							{/each}
						</select>
					</div>

					<div class="form-group">
						<label for="transfer-reason">Reason or Note for Student</label>
						<input id="transfer-reason" type="text" name="reason" placeholder="e.g. Schedule adjustment per your request" class="input-field" bind:value={transferReason} />
					</div>

					<div class="modal-footer">
						<button type="button" class="btn-secondary" onclick={closeTransferModal}>Cancel</button>
						<button type="submit" class="btn-primary" disabled={!transferToCohortId}>Send Transfer Ping</button>
					</div>
				</form>
			</div>
		</div>
	{/if}

	<!-- ── Batches List ────────────────────────────────────────── -->
	{#if data.batches && data.batches.length > 0}
		<div class="batches-stack">
			{#each data.batches as batch}
				{@const currentTab = activeBatchView[batch.id] || 'links'}
				{@const batchStudents = data.roster[batch.id] || []}
				{@const sessions = (batch.sessionsData as any[]) || []}

				<div class="batch-card">
					<!-- Batch Card Header -->
					<div class="batch-header">
						<div>
							<div class="flex items-center gap-2 mb-1">
								<span class="status-pill status-{batch.status}">{batch.status}</span>
								{#if batch.isSoldOut}
									<span class="soldout-pill">Sold Out</span>
								{/if}
							</div>
							<h3 class="batch-name">{batch.name}</h3>
							<span class="batch-schedule-meta">
								<Clock size={13} />
								<span>{batch.scheduleText || 'Schedule TBD'}</span>
							</span>
						</div>

						<div class="batch-stats">
							<div class="stat-box">
								<span class="stat-num">{batch.enrolledCount}</span>
								<span class="stat-sub">Enrolled</span>
							</div>
							<div class="stat-box">
								<span class="stat-num">{batch.seatsLeft ?? '∞'}</span>
								<span class="stat-sub">Seats Left</span>
							</div>
						</div>
					</div>

					<!-- Batch Inner Tabs -->
					<div class="batch-tabs-bar">
						<button type="button" class="batch-tab-btn" class:active={currentTab === 'links'} onclick={() => setBatchTab(batch.id, 'links')}>
							<LinkIcon size={14} />
							<span>Live Links & Schedule</span>
						</button>
						<button type="button" class="batch-tab-btn" class:active={currentTab === 'sessions'} onclick={() => setBatchTab(batch.id, 'sessions')}>
							<Video size={14} />
							<span>Recordings & Materials ({sessions.length})</span>
						</button>
						<button type="button" class="batch-tab-btn" class:active={currentTab === 'roster'} onclick={() => setBatchTab(batch.id, 'roster')}>
							<Users size={14} />
							<span>Enrolled Students ({batchStudents.length})</span>
						</button>
					</div>

					<!-- TAB 1: Links & Schedule -->
					{#if currentTab === 'links'}
						<div class="batch-panel">
							<form method="POST" action="?/updateLinks" class="space-y-4" use:enhance>
								<input type="hidden" name="batchId" value={batch.id} />

								<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div class="form-group">
										<label>
											<Video size={14} class="text-blue-500 inline mr-1" />
											Live Meeting URL (Google Meet / Zoom)
										</label>
										<input type="url" name="meetingUrl" value={batch.meetingUrl || ''} placeholder="https://meet.google.com/..." class="input-field" />
									</div>

									<div class="form-group">
										<label>
											<MessageCircle size={14} class="text-green-500 inline mr-1" />
											Batch WhatsApp / Community Invite
										</label>
										<input type="url" name="communityUrl" value={batch.communityUrl || ''} placeholder="https://chat.whatsapp.com/..." class="input-field" />
									</div>
								</div>

								<div class="form-group">
									<label>Class Days & Timings</label>
									<input type="text" name="scheduleText" value={batch.scheduleText || ''} placeholder="e.g. Every Monday & Thursday · 8:00 PM to 10:00 PM IST" class="input-field" />
								</div>

								<div class="flex justify-between items-center pt-2 border-t border-[var(--border)]">
									{#if batch.status !== 'completed'}
										<form method="POST" action="?/markCompleted" use:enhance>
											<input type="hidden" name="batchId" value={batch.id} />
											<button type="submit" class="btn-complete-batch" onclick={(e) => { if (!confirm('Marking this batch completed will initiate the 3-month access retention countdown for all students. Continue?')) e.preventDefault(); }}>
												<CheckCircle2 size={15} />
												<span>Mark Batch Completed (Start 90-Day Timer)</span>
											</button>
										</form>
									{:else}
										<span class="text-[12px] text-green-600 font-semibold">
											✓ Completed on {batch.completedAt ? new Date(batch.completedAt).toLocaleDateString() : ''} · 3-month retention clock running
										</span>
									{/if}

									<button type="submit" class="btn-save-sm">Save Links</button>
								</div>
							</form>
						</div>

					<!-- TAB 2: Recordings & Materials Links -->
					{:else if currentTab === 'sessions'}
						<div class="batch-panel">
							<div class="mb-4">
								<h4 class="text-[14px] font-bold text-[var(--text-primary)]">Post-Class Recordings & Materials (Links Only)</h4>
								<p class="text-[12px] text-[var(--text-muted)]">Paste Google Drive, YouTube unlisted, Notion, or cloud recording links for this batch.</p>
							</div>

							<!-- Add Session Link Form -->
							<form method="POST" action="?/addSessionLink" class="add-session-box" use:enhance>
								<input type="hidden" name="batchId" value={batch.id} />
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
									<input type="text" name="title" placeholder="Session Title (e.g. Day 1: Network Defense)" class="input-field" required />
									<input type="date" name="date" class="input-field" required />
								</div>
								<div class="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
									<input type="url" name="recordingUrl" placeholder="Recording URL (Google Drive / YouTube)" class="input-field" />
									<input type="url" name="materialsUrl" placeholder="Materials URL (Notion / GitHub / Drive)" class="input-field" />
								</div>
								<div class="flex justify-end">
									<button type="submit" class="btn-save-sm">
										<Plus size={14} />
										<span>Add Session Links</span>
									</button>
								</div>
							</form>

							<!-- Existing Sessions List -->
							{#if sessions.length > 0}
								<div class="sessions-list mt-4">
									{#each sessions as s}
										<div class="session-item">
											<div>
												<strong class="session-title">{s.title}</strong>
												<span class="session-date">{s.date}</span>
											</div>

											<div class="session-actions">
												{#if s.recordingUrl}
													<a href={s.recordingUrl} target="_blank" rel="noopener noreferrer" class="link-chip chip-rec">
														<Video size={12} />
														<span>Recording</span>
														<ExternalLink size={10} />
													</a>
												{/if}
												{#if s.materialsUrl}
													<a href={s.materialsUrl} target="_blank" rel="noopener noreferrer" class="link-chip chip-mat">
														<FileText size={12} />
														<span>Notes & Labs</span>
														<ExternalLink size={10} />
													</a>
												{/if}
											</div>
										</div>
									{/each}
								</div>
							{:else}
								<p class="text-[13px] text-[var(--text-muted)] italic py-3 text-center">No session links shared for this batch yet.</p>
							{/if}
						</div>

					<!-- TAB 3: Enrolled Students Roster & Transfer Ping -->
					{:else if currentTab === 'roster'}
						<div class="batch-panel">
							{#if batchStudents.length > 0}
								<div class="roster-table-wrap">
									<table class="roster-table">
										<thead>
											<tr>
												<th>Student</th>
												<th>Email</th>
												<th>Status</th>
												<th>Joined Date</th>
												<th style="text-align: right;">Batch Actions</th>
											</tr>
										</thead>
										<tbody>
											{#each batchStudents as student}
												<tr>
													<td><strong>{student.name || 'Student'}</strong></td>
													<td>{student.email}</td>
													<td>
														<span class="roster-badge status-{student.status}">{student.status}</span>
													</td>
													<td>{new Date(student.joinedAt).toLocaleDateString()}</td>
													<td style="text-align: right;">
														{#if student.status === 'active' && data.batches.length > 1}
															<button
																type="button"
																class="btn-ping-transfer"
																onclick={() => openTransferModal(student, batch)}
																title="Send batch transfer offer"
															>
																<ArrowRightLeft size={13} />
																<span>Transfer Ping</span>
															</button>
														{/if}
													</td>
												</tr>
											{/each}
										</tbody>
									</table>
								</div>
							{:else}
								<p class="text-[13px] text-[var(--text-muted)] italic py-4 text-center">No students currently enrolled in this batch.</p>
							{/if}
						</div>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<div class="empty-tray">
			<Calendar size={32} class="text-[var(--text-muted)] mb-2" />
			<h3>No Batches Scheduled Yet</h3>
			<p>Create your first live batch to start accepting students into scheduled cohort classes.</p>
			<button type="button" class="btn-create-batch mt-3" onclick={() => (showCreateModal = true)}>
				<Plus size={16} />
				<span>Create Batch</span>
			</button>
		</div>
	{/if}
</div>

<style>
	.batches-page {
		max-width: 960px;
	}

	.workspace-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
		gap: 16px;
	}

	.workspace-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.workspace-header p {
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	.btn-create-batch {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 9px 18px;
		background: #201948;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.875rem;
		cursor: pointer;
		transition: background 0.15s ease;
		white-space: nowrap;
	}

	.btn-create-batch:hover {
		background: #151030;
	}

	.notice-box {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 14px 18px;
		background: rgba(245, 158, 11, 0.08);
		border: 1px solid rgba(245, 158, 11, 0.25);
		border-radius: 10px;
		font-size: 0.875rem;
		color: var(--text-primary);
		margin-bottom: 24px;
	}

	.batches-stack {
		display: flex;
		flex-direction: column;
		gap: 24px;
	}

	.batch-card {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
	}

	.batch-header {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		padding: 20px 24px;
		border-bottom: 1px solid var(--border);
	}

	.batch-name {
		font-size: 1.2rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.batch-schedule-meta {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		color: var(--text-secondary);
	}

	.batch-stats {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.stat-box {
		display: flex;
		flex-direction: column;
		align-items: flex-end;
	}

	.stat-num {
		font-size: 1.35rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1;
	}

	.stat-sub {
		font-size: 0.6875rem;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.04em;
	}

	.status-pill {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 2px 7px;
		border-radius: 4px;
	}

	.status-upcoming {
		background: rgba(59, 130, 246, 0.1);
		color: #2563eb;
	}

	.status-in_progress {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	.status-completed {
		background: rgba(100, 116, 139, 0.1);
		color: #475569;
	}

	.soldout-pill {
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		padding: 2px 7px;
		border-radius: 4px;
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
	}

	/* Tabs Bar */
	.batch-tabs-bar {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 0 16px;
		background: var(--bg-subtle, #f8fafc);
		border-bottom: 1px solid var(--border);
	}

	.batch-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 14px;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		background: none;
		border: none;
		border-bottom: 2px solid transparent;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.batch-tab-btn:hover {
		color: var(--text-primary);
	}

	.batch-tab-btn.active {
		color: #6366f1;
		border-bottom-color: #6366f1;
	}

	.batch-panel {
		padding: 20px 24px;
	}

	.form-group {
		margin-bottom: 1rem;
	}

	.form-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 6px;
	}

	.input-field {
		width: 100%;
		padding: 9px 12px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		font-size: 0.875rem;
		color: var(--text-primary);
		outline: none;
	}

	.input-field:focus {
		border-color: #6366f1;
	}

	.btn-save-sm {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		background: #201948;
		color: #ffffff;
		border: none;
		border-radius: 6px;
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-complete-batch {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 12px;
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-complete-batch:hover {
		background: rgba(16, 185, 129, 0.2);
	}

	.add-session-box {
		padding: 16px;
		background: var(--bg-subtle, #f8fafc);
		border: 1px dashed var(--border);
		border-radius: 10px;
	}

	.sessions-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.session-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
	}

	.session-title {
		font-size: 0.875rem;
		color: var(--text-primary);
		display: block;
	}

	.session-date {
		font-size: 0.75rem;
		color: var(--text-muted);
	}

	.session-actions {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.link-chip {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 4px 9px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		text-decoration: none;
	}

	.chip-rec {
		background: rgba(37, 99, 235, 0.1);
		color: #2563eb;
	}

	.chip-mat {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	/* Roster Table */
	.roster-table-wrap {
		overflow-x: auto;
	}

	.roster-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8125rem;
	}

	.roster-table th {
		text-align: left;
		padding: 8px 12px;
		color: var(--text-muted);
		font-size: 0.6875rem;
		text-transform: uppercase;
		border-bottom: 1px solid var(--border);
	}

	.roster-table td {
		padding: 10px 12px;
		border-bottom: 1px solid var(--border);
		color: var(--text-primary);
	}

	.roster-badge {
		font-size: 0.6875rem;
		padding: 2px 7px;
		border-radius: 4px;
		font-weight: 700;
		text-transform: uppercase;
	}

	.roster-badge.status-active {
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
	}

	.roster-badge.status-transferred {
		background: rgba(245, 158, 11, 0.1);
		color: #d97706;
	}

	.btn-ping-transfer {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		padding: 5px 10px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		color: #6366f1;
		cursor: pointer;
		transition: all 0.15s ease;
	}

	.btn-ping-transfer:hover {
		background: #6366f1;
		color: #ffffff;
		border-color: #6366f1;
	}

	/* Modal */
	.modal-backdrop {
		position: fixed;
		inset: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1100;
		padding: 16px;
	}

	.modal-card {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 540px;
		overflow: hidden;
		box-shadow: 0 20px 40px -10px rgba(0, 0, 0, 0.25);
	}

	.modal-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 18px 24px;
		border-bottom: 1px solid var(--border);
	}

	.modal-header h2 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.btn-close {
		background: none;
		border: none;
		font-size: 1.1rem;
		color: var(--text-muted);
		cursor: pointer;
	}

	.modal-body {
		padding: 20px 24px;
	}

	.modal-footer {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 16px;
		padding-top: 14px;
		border-top: 1px solid var(--border);
	}

	.btn-primary {
		padding: 8px 18px;
		background: #201948;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 600;
		cursor: pointer;
	}

	.btn-secondary {
		padding: 8px 16px;
		background: var(--bg-subtle);
		color: var(--text-primary);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.875rem;
		cursor: pointer;
	}

	.alert-success {
		padding: 12px 16px;
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.alert-danger {
		padding: 12px 16px;
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.empty-tray {
		padding: 50px 20px;
		background: var(--bg-elevated);
		border: 1px dashed var(--border);
		border-radius: 14px;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
	}

	.empty-tray h3 {
		font-size: 1.1rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.empty-tray p {
		font-size: 0.875rem;
		color: var(--text-muted);
		max-width: 440px;
	}
</style>
