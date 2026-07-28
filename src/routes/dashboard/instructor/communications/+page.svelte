<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Send, Link2, Ticket } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let emailSubject = $state('');
	let emailBody = $state('');
	let selectedClass = $state('');
	let includeCoupon = $state(false);
	let saveTemplate = $state(false);
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Communications — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Communications</h1>
			<p class="page-subtitle">Send announcements, resources, or coupon codes directly to your students.</p>
		</div>
	</header>

	<div class="grid grid-cols-1 md:grid-cols-3 gap-8">
		<!-- Main Form -->
		<div class="md:col-span-2">
			<form method="POST" action="?/send" use:enhance={() => { isSubmitting = true; return async ({ update }) => { isSubmitting = false; update(); }; }} class="panel-card form-panel">
				<div class="form-group">
					<label class="form-label" for="recipient">To:</label>
					<select id="recipient" name="recipient" class="form-input" bind:value={selectedClass}>
						<option value="">Select a Class (Cohort)...</option>
						{#each data.cohorts as cls}
							<option value={cls.id}>{cls.name}</option>
						{/each}
					</select>
				</div>
				
				<div class="form-group">
					<label class="form-label" for="subject">Subject:</label>
					<input id="subject" name="subject" type="text" class="form-input" placeholder="Welcome to the course!" bind:value={emailSubject} />
				</div>

				<div class="form-group">
					<label class="form-label" for="body">Message:</label>
					<textarea id="body" name="body" class="form-textarea large" placeholder="Write your announcement here..." bind:value={emailBody}></textarea>
				</div>

				<div class="form-attachments">
					<h4>Attachments & Offers</h4>
					<div class="attachment-options">
						<label class="attach-checkbox">
							<input type="checkbox" name="attachResource" />
							<Link2 size={16} /> Attach Resource: Incident Response Playbook
						</label>
						<label class="attach-checkbox">
							<input type="checkbox" name="includeCoupon" bind:checked={includeCoupon} />
							<Ticket size={16} /> Include 50% Coupon Code (STUDENT50)
						</label>
					</div>
				</div>

				<div class="mt-4 p-4 border border-blue-100 bg-blue-50 rounded-md">
					<label class="flex items-center gap-2 text-sm font-medium text-blue-900 mb-2">
						<input type="checkbox" name="saveTemplate" bind:checked={saveTemplate} />
						Save this message as a Template
					</label>
					{#if saveTemplate}
						<input type="text" name="templateName" placeholder="Template Name (e.g. Course Welcome)" class="form-input text-sm" required />
					{/if}
				</div>

				<div class="form-actions right mt-6">
					<button type="submit" class="primary-btn" disabled={!selectedClass || !emailSubject || !emailBody || isSubmitting}>
						<Send size={16} /> {isSubmitting ? 'Sending...' : 'Send Message'}
					</button>
				</div>

				{#if form?.error}
					<div class="success-banner mt-4" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
						{form.error}
					</div>
				{/if}

				{#if form?.success}
					<div class="success-banner mt-4">
						Message successfully sent to the selected class!
					</div>
				{/if}
			</form>
		</div>

		<!-- Saved Templates -->
		<div class="md:col-span-1">
			<div class="panel-card p-4">
				<h3 class="text-lg font-semibold mb-4 text-gray-800 border-b pb-2">Saved Templates</h3>
				
				{#if data.templates && data.templates.length > 0}
					<div class="space-y-3">
						{#each data.templates as tpl}
							<div class="p-3 border border-gray-200 rounded-md hover:border-blue-300 bg-gray-50 transition">
								<h4 class="font-medium text-gray-800 text-sm">{tpl.name}</h4>
								<p class="text-xs text-gray-500 mb-2 truncate">{tpl.subject}</p>
								<div class="flex items-center justify-between mt-2">
									<button 
										class="text-xs font-medium text-blue-600 hover:text-blue-800"
										onclick={() => { emailSubject = tpl.subject; emailBody = tpl.body; }}
									>
										Use Template
									</button>
									<form method="POST" action="?/deleteTemplate" use:enhance onsubmit={() => confirm('Delete this template?')}>
										<input type="hidden" name="templateId" value={tpl.id} />
										<button type="submit" class="text-xs text-red-600 hover:text-red-800">Delete</button>
									</form>
								</div>
							</div>
						{/each}
					</div>
				{:else}
					<p class="text-sm text-gray-500 italic">No saved templates yet. Check "Save this message as a Template" when sending to save one.</p>
				{/if}
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

	.panel-card {
		background: var(--bg-subtle);
		border-radius: 12px;
		padding: 2.5rem;
		box-shadow: var(--shadow-sm);
		border: 1px solid var(--border);
	}
	.form-panel {
		max-width: 800px;
	}
	.form-group {
		margin-bottom: 1.5rem;
	}
	.form-label {
		display: block;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 8px;
	}
	.form-input, .form-textarea {
		width: 100%;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 14px;
		font-size: 1rem;
		color: var(--text-primary);
		transition: border-color 0.2s;
	}
	.form-input:focus, .form-textarea:focus {
		outline: none;
		border-color: var(--accent);
	}
	.form-textarea {
		min-height: 120px;
		resize: vertical;
		font-family: monospace;
	}
	.form-textarea.large {
		min-height: 200px;
		font-family: inherit;
	}
	
	.form-actions {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-top: 2rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--border);
	}
	.form-actions.right {
		justify-content: flex-end;
	}
	
	.primary-btn {
		display: flex;
		align-items: center;
		gap: 8px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 1rem;
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

	.form-attachments {
		margin-top: 2rem;
		padding: 1.5rem;
		background: var(--bg);
		border: 1px dashed var(--border-strong);
		border-radius: 8px;
	}
	.form-attachments h4 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 12px;
	}
	.attachment-options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.attach-checkbox {
		display: flex;
		align-items: center;
		gap: 10px;
		font-size: 0.95rem;
		color: var(--text-secondary);
		cursor: pointer;
	}
	.attach-checkbox:hover {
		color: var(--text-primary);
	}

	.success-banner {
		margin-top: 1.5rem;
		padding: 14px 16px;
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.95rem;
		display: flex;
		align-items: center;
		gap: 8px;
	}
	.mt-4 {
		margin-top: 1rem;
	}
</style>
