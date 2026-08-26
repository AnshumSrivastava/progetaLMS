<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Lock, ShieldAlert, KeyRound, ArrowRight, AlertTriangle, Trash2, CheckCircle2 } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let selectedAdminId = $state(data.eligibleAdmins[0]?.id || '');
	let confirmEmail = $state('');

	let selectedAdmin = $derived(data.eligibleAdmins.find(a => a.id === selectedAdminId));
</script>

<svelte:head>
	<title>Owner Vault — {APP_NAME}</title>
</svelte:head>

<div class="vault-page">
	<header class="vault-header">
		<div class="header-left">
			<div class="vault-tag">
				<Lock size={12} />
				<span>Owner Security Zone</span>
			</div>
			<h1>Owner Vault</h1>
			<p class="subtitle">Root platform authority, ownership delegation, and high-privilege system controls.</p>
		</div>
	</header>

	{#if form?.success}
		<div class="alert-banner success">
			<CheckCircle2 size={16} />
			<span>{form.message || 'Operation executed successfully.'}</span>
		</div>
	{/if}

	{#if form?.error}
		<div class="alert-banner error">
			<AlertTriangle size={16} />
			<span>{form.error}</span>
		</div>
	{/if}

	<div class="vault-grid">
		<!-- ── Transfer Ownership ─────────────────────────────── -->
		<section class="vault-card primary-card">
			<div class="card-head">
				<KeyRound size={16} class="card-icon" />
				<div>
					<h2>Transfer Organization Ownership</h2>
					<p class="card-sub">Irrevocably transfer the root `owner` role to another vetted administrator.</p>
				</div>
			</div>

			{#if data.eligibleAdmins.length > 0}
				<form method="POST" action="?/transferOwnership" class="form-stack">
					<div class="field">
						<label for="adminSelect">Select Target Administrator</label>
						<select id="adminSelect" name="newOwnerId" bind:value={selectedAdminId} class="select-input">
							{#each data.eligibleAdmins as admin}
								<option value={admin.id}>{admin.name} ({admin.email})</option>
							{/each}
						</select>
					</div>

					{#if selectedAdmin}
						<div class="warning-box">
							<AlertTriangle size={15} class="warn-icon" />
							<div>
								<strong>Action Warning</strong>
								<p>You will be demoted to <code>admin</code>. Only the new owner ({selectedAdmin.email}) will have access to this vault.</p>
							</div>
						</div>

						<div class="field">
							<label for="confirmEmail">Type target email to confirm (<code>{selectedAdmin.email}</code>):</label>
							<input
								id="confirmEmail"
								type="text"
								name="confirmEmail"
								bind:value={confirmEmail}
								placeholder="Enter matching email address"
								class="text-input"
								autocomplete="off"
							/>
						</div>

						<button 
							type="submit" 
							class="btn-danger" 
							disabled={confirmEmail.trim().toLowerCase() !== selectedAdmin.email.toLowerCase()}
						>
							<span>Confirm & Transfer Ownership</span>
							<ArrowRight size={14} />
						</button>
					{/if}
				</form>
			{:else}
				<div class="empty-admins">
					<p>No eligible administrators found. To transfer ownership, invite or promote a user to the <code>admin</code> role first.</p>
					<a href="/dashboard/admin/users" class="btn-subtle">Manage Users</a>
				</div>
			{/if}
		</section>

		<!-- ── System Health & Danger Zone ────────────────────── -->
		<section class="vault-card">
			<div class="card-head">
				<ShieldAlert size={16} class="card-icon" />
				<div>
					<h2>System Danger Zone</h2>
					<p class="card-sub">Maintenance operations and queue purges.</p>
				</div>
			</div>

			<div class="danger-stack">
				<div class="danger-row">
					<div class="danger-info">
						<span class="danger-title">Flush Event Outbox</span>
						<span class="danger-desc">Purge all {data.stats.outboxCount} event outbox records from the queue.</span>
					</div>
					<form method="POST" action="?/flushOutbox">
						<button type="submit" class="btn-warn" onclick={(e) => !confirm('Are you sure you want to flush the outbox?') && e.preventDefault()}>
							<Trash2 size={13} />
							<span>Flush Outbox</span>
						</button>
					</form>
				</div>

				<div class="danger-row">
					<div class="danger-info">
						<span class="danger-title">Hard User Deletion Policy</span>
						<span class="danger-desc">Admins can soft-ban accounts. Permanent user account destruction is restricted to the Users Console.</span>
					</div>
					<a href="/dashboard/admin/users" class="btn-subtle">Open User Console</a>
				</div>
			</div>
		</section>
	</div>
</div>

<style>
	.vault-page {
		padding: 2.25rem 2.5rem 5rem;
		max-width: 980px;
	}

	.vault-header {
		padding-bottom: 1.5rem;
		border-bottom: 1px solid var(--border);
		margin-bottom: 2rem;
	}

	.vault-tag {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.625rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		text-transform: uppercase;
		color: #8b5cf6;
		background: rgba(139, 92, 246, 0.08);
		border: 1px solid rgba(139, 92, 246, 0.25);
		padding: 2px 7px;
		border-radius: var(--radius-sm);
		margin-bottom: 10px;
	}

	.vault-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.03em;
	}

	.vault-header .subtitle {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-top: 4px;
	}

	.alert-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		margin-bottom: 1.5rem;
	}

	.alert-banner.success {
		background: rgba(34, 197, 94, 0.08);
		border: 1px solid rgba(34, 197, 94, 0.2);
		color: #15803d;
	}

	.alert-banner.error {
		background: rgba(239, 68, 68, 0.08);
		border: 1px solid rgba(239, 68, 68, 0.2);
		color: #b91c1c;
	}

	.vault-grid {
		display: flex;
		flex-direction: column;
		gap: 1.75rem;
	}

	.vault-card {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
	}

	.card-head {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		margin-bottom: 18px;
	}

	.card-icon {
		color: #8b5cf6;
		margin-top: 2px;
		flex-shrink: 0;
	}

	.card-head h2 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.card-sub {
		font-size: 0.8125rem;
		color: var(--text-secondary);
		margin-top: 2px;
	}

	.form-stack {
		display: flex;
		flex-direction: column;
		gap: 14px;
	}

	.field {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}

	.field label {
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.select-input, .text-input {
		height: 36px;
		padding: 0 10px;
		background: var(--bg-elevated);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color var(--t-fast);
	}

	.select-input:focus, .text-input:focus {
		border-color: var(--border-strong);
		background: var(--bg);
	}

	.warning-box {
		display: flex;
		gap: 10px;
		padding: 12px;
		background: rgba(245, 158, 11, 0.06);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: var(--radius-sm);
		font-size: 0.78125rem;
		color: var(--text-secondary);
	}

	.warn-icon {
		color: #d97706;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.warning-box strong {
		display: block;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.btn-danger {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		height: 36px;
		padding: 0 16px;
		background: #dc2626;
		color: #ffffff;
		border: none;
		border-radius: var(--radius-sm);
		font-size: 0.8125rem;
		font-weight: 600;
		cursor: pointer;
		align-self: flex-start;
		transition: opacity var(--t-fast);
	}

	.btn-danger:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.btn-danger:not(:disabled):hover {
		opacity: 0.9;
	}

	.empty-admins {
		padding: 1.5rem 0;
		font-size: 0.8125rem;
		color: var(--text-muted);
		display: flex;
		flex-direction: column;
		gap: 10px;
		align-items: flex-start;
	}

	.danger-stack {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	.danger-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 14px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		gap: 16px;
	}

	.danger-title {
		display: block;
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.danger-desc {
		display: block;
		font-size: 0.75rem;
		color: var(--text-muted);
		margin-top: 2px;
	}

	.btn-warn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		height: 32px;
		padding: 0 12px;
		background: var(--bg);
		border: 1px solid #ef4444;
		color: #ef4444;
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		flex-shrink: 0;
	}

	.btn-warn:hover {
		background: #ef4444;
		color: #ffffff;
	}

	.btn-subtle {
		display: inline-flex;
		align-items: center;
		height: 30px;
		padding: 0 10px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-primary);
		text-decoration: none;
		flex-shrink: 0;
	}

	.btn-subtle:hover {
		border-color: var(--border-strong);
	}
</style>
