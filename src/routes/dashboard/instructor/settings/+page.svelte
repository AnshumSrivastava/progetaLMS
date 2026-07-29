<script lang="ts">
	import { enhance } from '$app/forms';
	import { APP_NAME } from '$lib/shared/constants';
	import { Save, User } from 'lucide-svelte';

	let { data, form } = $props();
</script>

<svelte:head>
	<title>Settings — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Settings</h1>
			<p class="page-subtitle">Configure your instructor profile and public details.</p>
		</div>
	</header>

	<div class="settings-box">
		<h2 class="section-title"><User size={20} /> Public Instructor Profile</h2>
		<p class="section-desc">These details will be visible to students on your course pages.</p>
		
		{#if form?.error}
			<div class="error-msg">{form.error}</div>
		{/if}
		{#if form?.success}
			<div class="success-msg">Profile updated successfully!</div>
		{/if}

		<form method="POST" action="?/saveProfile" use:enhance class="settings-form">
			<div class="form-group">
				<label for="displayName">Display Name</label>
				<input type="text" id="displayName" name="displayName" value={data.profile?.displayName || ''} placeholder="e.g. John Doe" required />
			</div>
			<div class="form-group">
				<label for="bio">Instructor Bio</label>
				<textarea id="bio" name="bio" rows="4" placeholder="Tell students about your expertise...">{data.profile?.bio || ''}</textarea>
			</div>
			
			<div class="form-actions">
				<button type="submit" class="save-btn">
					<Save size={18} /> Save Profile
				</button>
			</div>
		</form>
	</div>
</div>

<style>
	.page-content {
		padding: 2.5rem;
		width: 100%;
		max-width: 800px;
		margin: 0 auto;
	}
	.page-header {
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
	.settings-box {
		padding: 2.5rem;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
	}
	.section-title {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 1.2rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.section-desc {
		font-size: 0.9rem;
		color: var(--text-muted);
		margin-bottom: 2rem;
	}
	
	.settings-form {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
	}
	.form-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-group label {
		font-size: 0.9rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.form-group input, .form-group textarea {
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		color: var(--text-primary);
		font-family: inherit;
		font-size: 0.95rem;
	}
	.form-group input:focus, .form-group textarea:focus {
		outline: none;
		border-color: var(--accent);
		box-shadow: 0 0 0 2px var(--accent-muted);
	}
	
	.form-actions {
		display: flex;
		justify-content: flex-end;
		margin-top: 1rem;
	}
	
	.save-btn {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 20px;
		background: var(--accent);
		color: white;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.save-btn:hover {
		opacity: 0.9;
	}
	
	.error-msg {
		background: var(--error-muted, #fee2e2);
		color: var(--error, #ef4444);
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
	.success-msg {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
		padding: 12px;
		border-radius: 8px;
		margin-bottom: 1.5rem;
		font-size: 0.9rem;
	}
</style>
