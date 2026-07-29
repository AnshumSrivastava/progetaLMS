<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, Plus, Trash2, MoreHorizontal, Copy } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';

	let { data } = $props<{ data: PageData }>();

	let showCreateModal = $state(false);
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Coupons — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Coupons & Promotions</h1>
			<p class="page-subtitle">Generate discount codes to drive course sales.</p>
		</div>
		<button class="create-btn" onclick={() => showCreateModal = true}>
			<Plus size={16} /> Create Coupon
		</button>
	</header>

	{#if showCreateModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
			<form class="modal-content" method="POST" action="?/createCoupon" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					showCreateModal = false;
				};
			}}>
				<h3>Create New Coupon</h3>
				<p>Generate a new discount code for your students.</p>
				
				<div class="form-row" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
					<div style="flex: 1;">
						<label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Code</label>
						<input type="text" name="code" class="modal-input" placeholder="e.g. CYBER2026" required style="margin-bottom: 0;" />
					</div>
					<div style="flex: 1;">
						<label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Usage Limit</label>
						<input type="number" name="limit" class="modal-input" placeholder="Unlimited" style="margin-bottom: 0;" />
					</div>
				</div>

				<div class="form-row" style="display: flex; gap: 1rem; margin-bottom: 1.5rem;">
					<div style="flex: 1;">
						<label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Type</label>
						<select name="type" class="modal-input" required style="margin-bottom: 0;">
							<option value="percent">Percentage (%)</option>
							<option value="flat">Flat Amount ($)</option>
						</select>
					</div>
					<div style="flex: 1;">
						<label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Discount Value</label>
						<input type="number" name="value" class="modal-input" placeholder="e.g. 20" required style="margin-bottom: 0;" />
					</div>
				</div>

				<div style="margin-bottom: 1.5rem;">
					<label style="display: block; margin-bottom: 0.5rem; font-size: 0.9rem; font-weight: 600;">Applies To Resource</label>
					<select name="assetId" class="modal-input" required style="margin-bottom: 0;">
						<option value="all">All Resources</option>
						{#each data.availableResources as resource}
							<option value={resource.id}>{resource.name}</option>
						{/each}
					</select>
				</div>

				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showCreateModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create Coupon'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="table-container">
		<div class="table-toolbar">
			<div class="search-box">
				<Search size={16} class="search-icon" />
				<input type="text" placeholder="Search codes..." />
			</div>
		</div>

		<table class="data-table">
			<thead>
				<tr>
					<th>Code</th>
					<th>Discount</th>
					<th>Applies To</th>
					<th>Usage</th>
					<th>Status</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.coupons as coupon}
					<tr>
						<td class="col-code">
							<div class="code-pill">
								{coupon.code}
								<button class="copy-btn" title="Copy code"><Copy size={12} /></button>
							</div>
						</td>
						<td><strong>{coupon.discount}</strong></td>
						<td>{coupon.course}</td>
						<td>
							<div class="usage-bar-wrap">
								<div class="usage-text">
									{coupon.uses} {coupon.limit ? `/ ${coupon.limit}` : 'uses'}
								</div>
								{#if coupon.limit}
									<div class="usage-bar">
										<div class="usage-fill" style="width: {(coupon.uses / coupon.limit) * 100}%"></div>
									</div>
								{/if}
							</div>
						</td>
						<td>
							<span class="status-badge" class:active={coupon.status === 'Active'} class:exhausted={coupon.status === 'Exhausted'}>
								{coupon.status}
							</span>
						</td>
						<td class="col-actions">
							<button class="action-btn text-error" title="Delete Coupon"><Trash2 size={16} /></button>
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

	.code-pill {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 6px 12px;
		background: var(--bg);
		border: 1px dashed var(--border-strong);
		border-radius: 6px;
		font-family: monospace;
		font-weight: 600;
		color: var(--text-primary);
		letter-spacing: 0.05em;
	}
	.copy-btn {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px;
	}
	.copy-btn:hover {
		color: var(--text-primary);
	}

	.usage-bar-wrap {
		width: 120px;
	}
	.usage-text {
		font-size: 0.8rem;
		margin-bottom: 4px;
	}
	.usage-bar {
		width: 100%;
		height: 4px;
		background: var(--border);
		border-radius: 4px;
		overflow: hidden;
	}
	.usage-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 4px;
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
	.status-badge.exhausted {
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
</style>
