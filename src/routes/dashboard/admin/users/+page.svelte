<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import { Search, Crown, ShieldAlert, ChevronLeft, ChevronRight, UserX } from 'lucide-svelte';

	let { data, form } = $props<{ data: PageData, form: ActionData }>();
</script>

<svelte:head>
	<title>User Management — {APP_NAME} Admin</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Users & Roles</h1>
			<p class="page-subtitle">Manage all platform users, assign roles, and handle access control.</p>
		</div>
	</header>

	{#if form?.error}
		<div class="banner error">
			{form.error}
		</div>
	{/if}
	
	{#if form?.success}
		<div class="banner success">
			Action completed successfully.
		</div>
	{/if}

	<div class="invite-card">
		<div>
			<h3>Invite Administrator</h3>
			<p>Send an invitation to a new admin via email.</p>
		</div>
		<form method="POST" action="?/inviteAdmin" use:enhance class="invite-form">
			<input type="email" name="email" placeholder="admin@example.com" required class="invite-input" />
			<button type="submit" class="primary-btn">Send Invite</button>
		</form>
	</div>

	<div class="table-container">
		<div class="table-toolbar">
			<div class="search-box">
				<Search size={16} class="search-icon" />
				<input type="text" placeholder="Search users by name or email..." />
			</div>
		</div>

		<table class="data-table">
			<thead>
				<tr>
					<th>User</th>
					<th>Role</th>
					<th>Joined</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.allUsers as user}
					<tr>
						<td class="col-user">
							<div class="user-cell">
								<div class="avatar" class:avatar-owner={user.role === 'owner'} class:avatar-admin={user.role === 'admin'}>
									{user.name ? user.name[0].toUpperCase() : 'U'}
								</div>
								<div class="user-info">
									<strong>{user.name || 'Unnamed'}</strong>
									<span>{user.email}</span>
								</div>
							</div>
						</td>
						<td>
							{#if user.role === 'owner'}
								<span class="status-badge owner"><Crown size={12} style="display:inline;margin-right:4px;" />Owner</span>
							{:else if user.role === 'admin'}
								<span class="status-badge admin"><ShieldAlert size={12} style="display:inline;margin-right:4px;" />Admin</span>
							{:else if user.role === 'teacher'}
								<span class="status-badge teacher">Teacher</span>
							{:else}
								<span class="status-badge student">Student</span>
							{/if}
						</td>
						<td>{new Date(user.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</td>
						<td class="col-actions">
							{#if user.role === 'owner'}
								<span style="font-size: 0.8rem; color: var(--text-muted); font-style: italic;">System Owner</span>
							{:else}
								<div style="display: flex; gap: 8px; align-items: center;">
									<form method="POST" action="?/updateRole" use:enhance style="display: flex; gap: 8px; align-items: center;">
										<input type="hidden" name="userId" value={user.id} />
										<select name="role" class="role-select">
											<option value="student" selected={user.role === 'student'}>Student</option>
											<option value="teacher" selected={user.role === 'teacher'}>Teacher</option>
											<option value="admin" selected={user.role === 'admin'}>Admin</option>
										</select>
										<button type="submit" class="action-btn text-success" title="Update Role">Update</button>
									</form>
									
									{#if data.currentUserRole === 'owner'}
										<div class="owner-actions">
											<form method="POST" action="?/transferOwnership" use:enhance onsubmit={() => confirm('Transfer ownership? You will be demoted to Admin.')}>
												<input type="hidden" name="userId" value={user.id} />
												<button type="submit" class="action-btn text-warning" title="Transfer Ownership"><Crown size={16} /></button>
											</form>
											<form method="POST" action="?/deleteUser" use:enhance onsubmit={() => confirm('Delete user? This cannot be undone.')}>
												<input type="hidden" name="userId" value={user.id} />
												<button type="submit" class="action-btn text-error" title="Delete User"><UserX size={16} /></button>
											</form>
										</div>
									{/if}
								</div>
							{/if}
						</td>
					</tr>
				{/each}
			</tbody>
		</table>

		<!-- Pagination Footer -->
		<div class="pagination-footer">
			<div class="pagination-info">
				Showing page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} total users)
			</div>
			<div class="pagination-controls">
				<a href="?page={Math.max(1, data.pagination.page - 1)}" class="page-btn" class:disabled={data.pagination.page <= 1}>
					<ChevronLeft size={16} /> Prev
				</a>
				<a href="?page={Math.min(data.pagination.totalPages, data.pagination.page + 1)}" class="page-btn" class:disabled={data.pagination.page >= data.pagination.totalPages}>
					Next <ChevronRight size={16} />
				</a>
			</div>
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
		margin-bottom: 2rem;
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

	.banner {
		padding: 12px 16px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
	}
	.banner.success {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.banner.error {
		background: rgba(239, 68, 68, 0.1);
		color: #ef4444;
	}

	.invite-card {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1.5rem 2rem;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		margin-bottom: 2rem;
		box-shadow: var(--shadow-sm);
	}
	.invite-card h3 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.invite-card p {
		font-size: 0.9rem;
		color: var(--text-secondary);
	}
	.invite-form {
		display: flex;
		gap: 12px;
	}
	.invite-input {
		padding: 10px 16px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		min-width: 280px;
		font-size: 0.95rem;
	}
	.invite-input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.primary-btn {
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
	.primary-btn:hover {
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
		width: 320px;
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
		padding: 10px 12px 10px 38px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.search-box input:focus {
		outline: none;
		border-color: var(--border-strong);
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
		font-size: 0.95rem;
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
		width: 38px;
		height: 38px;
		border-radius: 50%;
		background: var(--bg-elevated);
		color: var(--text-secondary);
		border: 1px solid var(--border-strong);
		display: flex;
		align-items: center;
		justify-content: center;
		font-weight: 600;
		font-size: 1rem;
	}
	.avatar-owner {
		background: rgba(234, 179, 8, 0.1);
		color: #eab308;
		border-color: rgba(234, 179, 8, 0.3);
	}
	.avatar-admin {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
		border-color: rgba(59, 130, 246, 0.3);
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
		font-size: 0.85rem;
		color: var(--text-muted);
	}

	.status-badge {
		display: inline-flex;
		align-items: center;
		padding: 4px 10px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status-badge.owner {
		background: rgba(234, 179, 8, 0.1);
		color: #eab308;
	}
	.status-badge.admin {
		background: rgba(59, 130, 246, 0.1);
		color: #3b82f6;
	}
	.status-badge.teacher {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.status-badge.student {
		background: var(--bg-elevated);
		color: var(--text-secondary);
	}

	.col-actions {
		display: flex;
		justify-content: flex-start;
		gap: 12px;
	}
	
	.role-select {
		padding: 6px 12px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.role-select:focus {
		outline: none;
		border-color: var(--accent);
	}

	.action-btn {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 6px 10px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		transition: all 0.2s;
	}
	.action-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}
	.action-btn.text-success:hover { color: #10b981; }
	.action-btn.text-warning:hover { color: #eab308; }
	.action-btn.text-error:hover { color: #ef4444; }

	.owner-actions {
		display: flex;
		gap: 4px;
		margin-left: 12px;
		padding-left: 12px;
		border-left: 1px solid var(--border);
	}

	.pagination-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 1rem 1.5rem;
		border-top: 1px solid var(--border);
		background: var(--bg-elevated);
	}
	.pagination-info {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.pagination-controls {
		display: flex;
		gap: 8px;
	}
	.page-btn {
		display: flex;
		align-items: center;
		gap: 4px;
		padding: 6px 12px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.85rem;
		font-weight: 500;
		text-decoration: none;
		transition: all 0.2s;
	}
	.page-btn:hover:not(.disabled) {
		background: var(--accent-muted);
		border-color: var(--accent);
		color: var(--accent);
	}
	.page-btn.disabled {
		opacity: 0.4;
		pointer-events: none;
	}
</style>
