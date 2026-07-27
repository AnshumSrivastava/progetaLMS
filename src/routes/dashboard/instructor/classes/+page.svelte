<script lang="ts">
	import { Users2, Search, Filter, MoreHorizontal, Plus } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data } = $props<{ data: PageData }>();

	let showCreateModal = $state(false);
	let isSubmitting = $state(false);

	let showAddStudentsModal = $state(false);
	let bulkEmails = $state('');
	let selectedClassIdForAdd = $state('');
	let copySuccess = $state<string | null>(null);

	function submitAddStudents() {
		if (bulkEmails.trim()) {
			showAddStudentsModal = false;
			bulkEmails = '';
			// Here we would typically hit an API to add students
		}
	}

	function copyInviteLink(classId: string) {
		const link = `http://localhost:5173/join/${classId}`;
		navigator.clipboard.writeText(link);
		copySuccess = classId;
		setTimeout(() => copySuccess = null, 3000);
	}
</script>

<svelte:head>
	<title>Classes — Instructor Portal</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Classes</h1>
			<p class="page-subtitle">Manage cohorts, assign courses, and track group progress.</p>
		</div>
		<button class="create-btn" onclick={() => showCreateModal = true}>
			<Plus size={16} /> New Class
		</button>
	</header>

	{#if showCreateModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
			<form class="modal-content" method="POST" action="?/createClass" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					showCreateModal = false;
				};
			}}>
				<h3>Create New Class</h3>
				<p>Create a new cohort of students and assign them a course.</p>
				
				<div class="form-group">
					<label class="form-label" for="className">Class Name</label>
					<input id="className" name="className" type="text" class="modal-input" placeholder="e.g. Fall 2026 Cohort" required />
				</div>
				
				<div class="form-group">
					<label class="form-label" for="courseSelect">Assign Course</label>
					<select id="courseSelect" name="courseId" class="modal-input" required>
						<option value="">Select a course to assign...</option>
						{#each data.availableCourses as course}
							<option value={course.id}>{course.title}</option>
						{/each}
					</select>
				</div>
				
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showCreateModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create Class'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if showAddStudentsModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showAddStudentsModal = false; }}>
			<div class="modal-content">
				<h3>Add Students to Class</h3>
				<p>Paste a list of emails (comma separated) to invite them to this cohort.</p>
				<textarea class="modal-textarea" placeholder="student1@email.com, student2@email.com" bind:value={bulkEmails}></textarea>
				<div class="modal-actions">
					<button class="action-btn" onclick={() => showAddStudentsModal = false}>Cancel</button>
					<button class="create-btn" onclick={submitAddStudents} disabled={!bulkEmails.trim()}>Send Invites</button>
				</div>
			</div>
		</div>
	{/if}

	<div class="table-container">
		<div class="table-toolbar">
			<div class="search-box">
				<Search size={16} class="search-icon" />
				<input type="text" placeholder="Search classes..." />
			</div>
			<button class="filter-btn">
				<Filter size={16} /> Filter
			</button>
		</div>

		<table class="data-table">
			<thead>
				<tr>
					<th>Class Name</th>
					<th>Assigned Course</th>
					<th>Students</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.classes as cls}
					<tr>
						<td class="col-title">
							<div class="title-cell">
								<div class="icon-wrap"><Users2 size={16} /></div>
								<strong>{cls.name}</strong>
							</div>
						</td>
						<td>{cls.course}</td>
						<td>{cls.students} Enrolled</td>
						<td>
							<span class="status-badge" class:active={cls.status === 'Active'} class:draft={cls.status === 'Draft'}>
								{cls.status}
							</span>
						</td>
						<td class="col-actions">
							<button class="action-btn outline" onclick={() => { selectedClassIdForAdd = cls.id; showAddStudentsModal = true; }}>
								Add Students
							</button>
							<button class="action-btn outline" onclick={() => copyInviteLink(cls.id)}>
								{copySuccess === cls.id ? 'Copied!' : 'Copy Invite Link'}
							</button>
							<button class="icon-btn" title="More Options"><MoreHorizontal size={16} /></button>
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
	.create-btn:hover:not(:disabled) {
		opacity: 0.9;
	}
	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 20px;
	}
	.modal-content {
		background: var(--bg);
		padding: 2rem;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		box-shadow: var(--shadow-md);
	}
	.modal-content h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
	}
	.modal-content p {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}
	.form-group {
		margin-bottom: 1.25rem;
	}
	.form-label {
		display: block;
		font-size: 0.9rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 6px;
	}
	.modal-input {
		width: 100%;
		padding: 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.95rem;
		transition: border-color 0.2s;
	}
	.modal-textarea {
		width: 100%;
		padding: 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: monospace;
		min-height: 120px;
		resize: vertical;
		transition: border-color 0.2s;
	}
	.modal-input:focus, .modal-textarea:focus {
		outline: none;
		border-color: var(--accent);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
		margin-top: 2rem;
	}
	.action-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-weight: 600;
		cursor: pointer;
		padding: 10px 18px;
		border-radius: 8px;
	}
	.action-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
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
	.title-cell {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.title-cell strong {
		color: var(--text-primary);
		font-weight: 600;
		font-size: 1rem;
	}
	.icon-wrap {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: var(--accent-muted);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
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
	.status-badge.draft {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
	}
	.col-actions {
		display: flex;
		gap: 8px;
		justify-content: flex-end;
		align-items: center;
	}
	.action-btn.outline {
		border: 1px solid var(--border-strong);
	}
	.icon-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		transition: all 0.2s;
	}
	.icon-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}
</style>
