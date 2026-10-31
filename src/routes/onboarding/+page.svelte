<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	export let form: ActionData;
	let isSubmitting = false;
</script>

<svelte:head>
	<title>Welcome — Complete Your Profile</title>
</svelte:head>

<div class="onboard-shell">
	<div class="onboard-container">
		<div class="onboard-header">
			<div class="onboard-badge">Quick Setup</div>
			<h1 class="onboard-title">Welcome to Launchpad</h1>
			<p class="onboard-subtitle">Please enter your full name to personalize your learning experience and credentials.</p>
		</div>

		<div class="onboard-card">
			{#if form?.error}
				<div class="onboard-error" role="alert" aria-live="polite">
					<span>{form.error}</span>
				</div>
			{/if}

			<form class="onboard-form" method="POST" action="?/saveName" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					update();
				};
			}}>
				<div class="form-group">
					<label for="name" class="form-label">Full Name</label>
					<input
						id="name"
						name="name"
						type="text"
						required
						autocomplete="name"
						class="form-input"
						placeholder="e.g. Jane Doe"
					/>
				</div>

				<button type="submit" disabled={isSubmitting} class="btn-submit">
					{isSubmitting ? 'Saving Profile...' : 'Continue to Dashboard →'}
				</button>
			</form>
		</div>
	</div>
</div>

<style>
	.onboard-shell {
		min-height: 100vh;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--color-background);
		padding: 24px;
	}

	.onboard-container {
		width: 100%;
		max-width: 440px;
	}

	.onboard-header {
		text-align: center;
		margin-bottom: 28px;
	}

	.onboard-badge {
		display: inline-block;
		padding: 4px 12px;
		border-radius: var(--radius-full);
		font-size: 0.72rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		background: var(--color-surface-subtle);
		color: var(--lp-accent);
		border: 1px solid var(--lp-accent-border);
		margin-bottom: 12px;
	}

	.onboard-title {
		font-size: 1.85rem;
		font-weight: 700;
		color: var(--color-text);
		letter-spacing: -0.02em;
		margin-bottom: 8px;
	}

	.onboard-subtitle {
		font-size: 0.88rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
	}

	.onboard-card {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: 32px 28px;
		box-shadow: var(--shadow-lg);
	}

	.onboard-error {
		padding: 12px 14px;
		background: rgba(239, 68, 68, 0.1);
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: var(--radius-sm);
		color: var(--semantic-danger);
		font-size: 0.85rem;
		margin-bottom: 20px;
	}

	.onboard-form {
		display: flex;
		flex-direction: column;
		gap: 20px;
	}

	.form-group {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.form-label {
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--color-text-secondary);
	}

	.form-input {
		width: 100%;
		padding: 12px 14px;
		background: var(--color-surface-subtle);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		font-size: 0.95rem;
		color: var(--color-text);
		outline: none;
		transition: border-color var(--t-fast), box-shadow var(--t-fast);
	}

	.form-input:focus {
		border-color: var(--color-border-strong);
		box-shadow: 0 0 0 3px var(--lp-accent-subtle);
	}

	.btn-submit {
		width: 100%;
		padding: 12px 20px;
		border-radius: var(--radius-sm);
		background: var(--color-text);
		color: var(--color-bg);
		border: none;
		font-size: 0.95rem;
		font-weight: 700;
		cursor: pointer;
		transition: opacity var(--t-fast);
	}

	.btn-submit:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-submit:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}
</style>
