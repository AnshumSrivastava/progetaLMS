<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Award, Plus, FileText, LayoutList } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: PageData }>();

	let showCreateModal = $state(false);
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Certifications — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Certifications</h1>
			<p class="page-subtitle">Manage assessment tests and certification exams.</p>
		</div>
		<button class="create-btn" onclick={() => showCreateModal = true}>
			<Plus size={16} /> New Certification
		</button>
	</header>

	{#if showCreateModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
			<form class="modal-content" method="POST" action="?/createCert" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					await invalidateAll();
					isSubmitting = false;
					showCreateModal = false;
				};
			}}>
				<h3>Create New Certification</h3>
				<p>Enter a title for the new certification exam.</p>
				<input type="text" name="title" class="modal-input" placeholder="e.g. Certified Security Professional" required />
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showCreateModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="table-container">
		<table class="data-table">
			<thead>
				<tr>
					<th>Title</th>
					<th>Status</th>
					<th>Price</th>
					<th>Passing Criteria</th>
					<th>Actions</th>
				</tr>
			</thead>
			<tbody>
				{#each data.certifications as cert}
					<tr>
						<td>
							<strong>{cert.title}</strong>
						</td>
						<td>
							<span class="status-badge {cert.status === 'published' ? 'published' : 'draft'}">
								{cert.status}
							</span>
						</td>
						<td>{cert.pricePaise === 0 ? 'Free' : `$${(cert.pricePaise / 100).toFixed(2)}`}</td>
						<td>{cert.passingPercent}%</td>
						<td>
							<div class="action-buttons">
								<a href="/dashboard/instructor/certifications/{cert.id}/questions" class="icon-btn" title="Manage Questions">
									<LayoutList size={16} /> Edit Questions
								</a>
							</div>
						</td>
					</tr>
				{/each}
				{#if data.certifications.length === 0}
					<tr>
						<td colspan="5" class="empty-state">
							<Award size={48} />
							<p>No certifications created yet.</p>
							<button class="action-btn mt-4" onclick={() => showCreateModal = true}>Create your first certification</button>
						</td>
					</tr>
				{/if}
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
	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.action-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	.modal-content {
		background: var(--bg);
		padding: 2rem;
		border-radius: 16px;
		width: 100%;
		max-width: 450px;
		box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
	}
	.modal-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 0.5rem;
	}
	.modal-content p {
		color: var(--text-muted);
		font-size: 0.9rem;
		margin-bottom: 1.5rem;
	}
	.modal-input {
		width: 100%;
		padding: 0.75rem 1rem;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.95rem;
		margin-bottom: 1.5rem;
	}
	.modal-input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}

	/* Table */
	.table-container {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.data-table {
		width: 100%;
		border-collapse: collapse;
	}
	.data-table th {
		text-align: left;
		padding: 1rem 1.5rem;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-muted);
		border-bottom: 1px solid var(--border);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.data-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
		color: var(--text-secondary);
		font-size: 0.95rem;
		vertical-align: middle;
	}
	.data-table tr:last-child td {
		border-bottom: none;
	}
	.data-table strong {
		color: var(--text-primary);
		font-weight: 600;
	}
	.status-badge {
		display: inline-block;
		padding: 4px 10px;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.status-badge.published {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.status-badge.draft {
		background: rgba(107, 114, 128, 0.1);
		color: var(--text-muted);
	}
	.action-buttons {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.icon-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		text-decoration: none;
	}
	.icon-btn:hover {
		background: var(--bg-hover);
	}
	.empty-state {
		text-align: center;
		padding: 4rem 2rem !important;
		color: var(--text-muted);
	}
	.empty-state p {
		margin-top: 1rem;
		font-size: 1rem;
	}
</style>
