<script lang="ts">
	import { onDestroy } from 'svelte';
	import QuizEngine from '$lib/components/learning/QuizEngine.svelte';
	import { layoutMode } from '$lib/stores/layoutMode';
	import type { PageData } from './$types';

	let { data } = $props();

	// Enable full-screen immersive exam mode
	$effect(() => {
		layoutMode.set('exam');
	});

	onDestroy(() => {
		layoutMode.set('default');
	});

	async function handleQuizSubmit(answers: Record<string, string>) {
		try {
			// Submit the test for automated evaluation and certificate generation
			const res = await fetch('/api/assessments/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					testId: data.testId,
					answers
				})
			});
			const result = await res.json();
			if (result.success && result.certificateId) {
				// The QuizEngine automatically handles the "Assessment Submitted" screen.
				// The email with the cert link is sent asynchronously by the backend outbox.
			}
		} catch (e) {
			console.error('Failed to submit quiz', e);
		}
	}
</script>

<div class="exam-wrap">
	{#if data.cannotTake}
		<div class="locked-screen">
			<div class="locked-card">
				<h2>Assessment Locked</h2>
				<p>{data.reason}</p>
				<a href="/dashboard" class="return-btn">Return to Dashboard</a>
			</div>
		</div>
	{:else}
		<QuizEngine questions={data.parsedContent} testId={data.testId} onsubmit={handleQuizSubmit} />
	{/if}
</div>

<style>
	/* Full screen exam container */
	.exam-wrap {
		width: 100%;
		height: 100%;
		min-height: 100vh;
		overflow: hidden;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}

	.locked-screen {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		background: var(--bg-subtle);
		padding: 2rem;
	}

	.locked-card {
		background: var(--bg);
		padding: 3rem;
		border-radius: 12px;
		box-shadow: var(--shadow-md);
		border: 1px solid var(--border);
		text-align: center;
		max-width: 400px;
		width: 100%;
	}

	.locked-card h2 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 1rem;
	}

	.locked-card p {
		color: var(--text-secondary);
		margin-bottom: 2rem;
		font-size: 1.05rem;
		line-height: 1.5;
	}

	.return-btn {
		display: inline-block;
		background: var(--text-primary);
		color: var(--bg);
		padding: 12px 24px;
		border-radius: 8px;
		font-weight: 600;
		text-decoration: none;
		transition: opacity 0.2s;
	}

	.return-btn:hover {
		opacity: 0.9;
	}
</style>
