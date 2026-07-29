<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Award, Plus, FileText, LayoutList, Tag, Power } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: PageData }>();

	let showCreateModal = $state(false);
	let showPriceModal = $state(false);
	let showEmailModal = $state(false);
	let selectedCertId = $state('');
	let selectedCertPrice = $state(0);
	let selectedCertCurrency = $state('INR');
	let selectedCertEmailTemplate = $state('');
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

	{#if showPriceModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showPriceModal = false; }}>
			<form class="modal-content" method="POST" action="?/updatePrice" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					showPriceModal = false;
				};
			}}>
				<h3>Edit Certification Price</h3>
				<p>Set the price for this certification. Minimum is 0.</p>
				<input type="hidden" name="certId" value={selectedCertId} />
				<div style="display: flex; gap: 8px; margin-bottom: 1.5rem;">
					<select name="currency" class="modal-input" style="width: 100px; margin-bottom: 0;" bind:value={selectedCertCurrency}>
						<option value="INR">INR</option>
						<option value="USD">USD</option>
						<option value="EUR">EUR</option>
						<option value="GBP">GBP</option>
					</select>
					<input type="number" name="price" class="modal-input" style="flex: 1; margin-bottom: 0;" placeholder="e.g. 1500" min="0" step="0.01" required bind:value={selectedCertPrice} />
				</div>
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showPriceModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Updating...' : 'Update Price'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if showEmailModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showEmailModal = false; }}>
			<form class="modal-content" method="POST" action="?/updateEmailTemplate" style="max-width: 600px;" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					showEmailModal = false;
				};
			}}>
				<h3>Automated Completion Email</h3>
				<p>Customize the email sent when a student passes. <br>Variables: <code>&#123;&#123;studentName&#125;&#125;</code>, <code>&#123;&#123;testName&#125;&#125;</code>. <br>The PDF certificate will be attached automatically.</p>
				<input type="hidden" name="certId" value={selectedCertId} />
				<textarea name="certEmailTemplate" class="modal-input" style="min-height: 200px; resize: vertical;" placeholder="<h2>Congratulations, &#123;&#123;studentName&#125;&#125;!</h2>&#10;<p>You passed &#123;&#123;testName&#125;&#125;.</p>" bind:value={selectedCertEmailTemplate}></textarea>
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showEmailModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Saving...' : 'Save Email'}
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
						<td>{cert.price}</td>
						<td>{cert.passingPercent}%</td>
						<td>
							<div class="action-buttons">
								<a href="/dashboard/teacher/certifications/{cert.id}/questions" class="icon-btn" title="Manage Questions">
									<LayoutList size={16} /> Edit
								</a>
								<button class="icon-btn" title="Edit Price" onclick={() => {
									selectedCertId = cert.id;
									selectedCertCurrency = cert.rawCurrency;
									selectedCertPrice = cert.rawPrice;
									showPriceModal = true;
								}}>
									<Tag size={16} /> Price
								</button>
								<button class="icon-btn" title="Edit Email" onclick={() => {
									selectedCertId = cert.id;
									selectedCertEmailTemplate = cert.certEmailTemplate;
									showEmailModal = true;
								}}>
									<FileText size={16} /> Email
								</button>
								<form method="POST" action="?/togglePublish" use:enhance style="display: inline;">
									<input type="hidden" name="certId" value={cert.id} />
									<button class="icon-btn" title={cert.status === 'Published' ? 'Unpublish' : 'Publish'}>
										<Power size={16} /> {cert.status === 'Published' ? 'Unpublish' : 'Publish'}
									</button>
								</form>
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
