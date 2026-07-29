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
	<QuizEngine questions={data.parsedContent} testId={data.testId} onsubmit={handleQuizSubmit} />
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
</style>
