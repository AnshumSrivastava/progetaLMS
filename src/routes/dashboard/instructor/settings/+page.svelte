<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	// Settings placeholder
</script>

<svelte:head>
	<title>Settings — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Settings</h1>
			<p class="page-subtitle">Configure your instructor profile and payment details.</p>
		</div>
	</header>

	<div class="settings-box">
		<p>Settings configuration coming soon.</p>
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
		padding: 3rem;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		text-align: center;
		color: var(--text-muted);
	}
</style>
