<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, Filter, ShieldCheck, Mail, MoreHorizontal, UserX, UserCheck } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';
	import { enhance } from '$app/forms';

	let { data, form } = $props<{ data: PageData, form: ActionData }>();

	let isSubmitting = $state(false);
	let isSubmittingCoupon = $state(false);
	let showCouponModal = $state(false);
</script>

<svelte:head>
	<title>Students — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Students</h1>
			<p class="page-subtitle">View enrolled students, track progress, and manage access.</p>
		</div>
		<button class="create-btn" onclick={() => showCouponModal = true}>
			<ShieldCheck size={16} /> Invite with Coupon
		</button>
	</header>

	{#if showCouponModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCouponModal = false; }}>
			<form class="modal-content" method="POST" action="?/inviteWithCoupon" use:enhance={() => {
				isSubmittingCoupon = true;
				return async ({ update }) => {
					await update();
					isSubmittingCoupon = false;
					showCouponModal = false;
				};
			}}>
				<h3>Invite Student with Unique Coupon</h3>
				<p>Send an exclusive, one-time-use coupon to a single student.</p>
				
				<div class="form-group" style="margin-bottom: 1rem;">
					<label class="form-label">Student Email</label>
					<input type="email" name="email" class="modal-input" placeholder="student@example.com" required style="margin-bottom: 0;" />
				</div>

				<div class="form-group" style="margin-bottom: 1rem;">
					<label class="form-label">Assign to Class</label>
					<select name="cohortId" class="modal-input" required style="margin-bottom: 0;">
						<option value="">Select a Class...</option>
						{#each data.availableClasses as cls}
							<option value={cls.id}>{cls.name}</option>
						{/each}
					</select>
				</div>

				<div class="form-row" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
					<div style="flex: 1;">
						<label class="form-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Discount Type</label>
						<select name="discountType" class="modal-input" required style="margin-bottom: 0;">
							<option value="percent">Percentage (%)</option>
							<option value="flat">Flat Amount ($)</option>
						</select>
					</div>
					<div style="flex: 1;">
						<label class="form-label" style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Discount Value</label>
						<input type="number" name="discountValue" class="modal-input" placeholder="e.g. 20" required style="margin-bottom: 0;" />
					</div>
				</div>

				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showCouponModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmittingCoupon}>
						{isSubmittingCoupon ? 'Sending...' : 'Generate & Send Invite'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<!-- Batch Add Section -->
	<form class="batch-add-section" method="POST" action="?/batchAdd" use:enhance={() => {
		isSubmitting = true;
		return async ({ update }) => {
			await update();
			isSubmitting = false;
		};
	}}>
		<h3>Batch Add Students</h3>
		<p class="section-desc">Paste a list of emails to automatically send enrollment invitations.</p>
		
		<div class="form-group" style="margin-bottom: 1rem;">
			<label class="form-label" for="classSelect">Assign to Class (Optional)</label>
			<select id="classSelect" name="cohortId" class="batch-select">
				<option value="">No Class (Unassigned)</option>
				{#each data.availableClasses as cls}
					<option value={cls.id}>{cls.name}</option>
				{/each}
			</select>
		</div>

		<textarea 
			name="emails"
			class="batch-textarea" 
			placeholder="student1@email.com, student2@email.com&#10;student3@email.com"
			required
		></textarea>
		
		<div class="batch-actions">
			<button type="submit" class="primary-btn" disabled={isSubmitting}>
				<UserCheck size={16} /> {isSubmitting ? 'Sending...' : 'Send Invitations'}
			</button>
		</div>

		{#if form?.success}
			<div class="success-banner">
				{form.count} Invitations successfully sent!
			</div>
		{/if}
		{#if form?.inviteSuccess}
			<div class="success-banner">
				Invite and unique coupon successfully sent to {form.email}!
			</div>
		{/if}
	</form>

	<div class="table-container">
		<div class="table-toolbar">
			<div class="search-box">
				<Search size={16} class="search-icon" />
				<input type="text" placeholder="Search by name or email..." />
			</div>
			<button class="filter-btn">
				<Filter size={16} /> Filter
			</button>
		</div>

		<table class="data-table">
			<thead>
				<tr>
					<th>Student</th>
					<th>Enrolled Courses</th>
					<th>Completed</th>
					<th>Access</th>
					<th>Joined</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.students as student}
					<tr>
						<td class="col-user">
							<div class="user-cell">
								<div class="avatar">{student.name[0]}</div>
								<div class="user-info">
									<strong>{student.name}</strong>
									<span>{student.email}</span>
								</div>
							</div>
						</td>
						<td>{student.enrolled}</td>
						<td>{student.completed}</td>
						<td>
							<span class="status-badge" class:active={student.access === 'Active'} class:revoked={student.access === 'Revoked'}>
								{student.access}
							</span>
						</td>
						<td>{student.joined}</td>
						<td class="col-actions">
							<button class="action-btn" title="Email Student"><Mail size={16} /></button>
							{#if student.access === 'Active'}
								<button class="action-btn text-error" title="Revoke Access"><UserX size={16} /></button>
							{:else}
								<button class="action-btn text-success" title="Restore Access"><UserCheck size={16} /></button>
							{/if}
							<button class="action-btn" title="More Options"><MoreHorizontal size={16} /></button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
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
		gap: 8px;
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

	/* Table */
	.table-container {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.table-toolbar {
		display: flex;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.search-box {
		position: relative;
		width: 300px;
	}
	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}
	.search-box input {
		width: 100%;
		padding: 8px 12px 8px 36px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.search-box input:focus {
		outline: none;
		border-color: var(--border-strong);
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 8px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.filter-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.data-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.data-table th {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}

	.data-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
		font-size: 0.9rem;
		color: var(--text-secondary);
		vertical-align: middle;
	}
	.data-table tr:last-child td {
		border-bottom: none;
	}
	.data-table tr:hover td {
		background: var(--bg-elevated);
	}

	.user-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--accent-muted);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 0.9rem;
	}
	.user-info {
		display: flex;
		flex-direction: column;
	}
	.user-info strong {
		color: var(--text-primary);
		font-weight: 500;
	}
	.user-info span {
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	.status-badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
	}
	.status-badge.active {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.status-badge.revoked {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.col-actions {
		display: flex;
		gap: 4px;
		justify-content: flex-end;
	}
	.action-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		transition: all 0.2s;
	}
	.action-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}
	.action-btn.text-error:hover {
		color: #ef4444;
	}
	.action-btn.text-success:hover {
		color: #10b981;
	}

	/* Batch Add Section */
	.batch-add-section {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 2rem;
		margin-bottom: 2rem;
		box-shadow: var(--shadow-sm);
	}
	.batch-add-section h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.section-desc {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-bottom: 1rem;
		margin-top: 4px;
	}
	.batch-textarea {
		width: 100%;
		min-height: 120px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 12px;
		font-size: 0.95rem;
		font-family: monospace;
		color: var(--text-primary);
		resize: vertical;
		transition: border-color 0.2s;
	}
	.batch-select {
		width: 100%;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 12px;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-label {
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
	}
	.batch-textarea:focus, .batch-select:focus {
		outline: none;
		border-color: var(--accent);
	}
	.batch-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}
	.primary-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 10px 20px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.95rem;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.primary-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	.success-banner {
		margin-top: 1rem;
		padding: 12px 16px;
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}
</style>
