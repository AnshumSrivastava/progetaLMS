<script lang="ts">
	import { onMount, onDestroy } from 'svelte';
	import SlideViewer from '$lib/components/learning/SlideViewer.svelte';
	import QuizEngine from '$lib/components/learning/QuizEngine.svelte';
	import VideoPlayer from '$lib/components/learning/VideoPlayer.svelte';
	import ReadingView from '$lib/components/learning/ReadingView.svelte';
	import { layoutMode } from '$lib/stores/layoutMode';

	let { data } = $props();

	// Set the layout mode based on lesson type
	$effect(() => {
		if (data.contentType === 'slides') layoutMode.set('immersive');
		else if (data.contentType === 'test') layoutMode.set('exam');
		else layoutMode.set('default');
	});

	onDestroy(() => layoutMode.set('default'));

	async function handleQuizSubmit(answers: Record<string, string>) {
		try {
			// Submits the test for automated evaluation and certificate generation
			const res = await fetch('/api/assessments/submit', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					testId: data.lesson.id,
					answers
				})
			});
			const result = await res.json();
			if (result.success && result.certificateId) {
				// We can optionally show a toast or redirect, but QuizEngine shows "Assessment Submitted" UI.
				// The email with cert link is sent asynchronously.
			}
		} catch (e) {
			console.error('Failed to submit quiz', e);
		}
	}
</script>

{#if data.contentType === 'slides'}
	<!-- ── IMMERSIVE SLIDE VIEWER ──────────────────────────────── -->
	<div class="slides-wrap">
		<SlideViewer slides={data.parsedContent} />
	</div>

{:else if data.contentType === 'test'}
	<!-- ── EXAM / ASSESSMENT ────────────────────────────────────── -->
	<div class="exam-wrap">
		<QuizEngine questions={data.parsedContent} testId={data.lesson.id} onsubmit={handleQuizSubmit} />
	</div>

{:else if data.contentType === 'video'}
	<!-- ── VIDEO LESSON ─────────────────────────────────────────── -->
	<VideoPlayer videoData={data.parsedContent} />

{:else if data.contentType === 'html' || data.contentType === 'reading'}
	<!-- ── HTML / READING MATERIAL ─────────────────────────────────────── -->
	<div style="padding: 2rem; max-width: 800px; margin: 0 auto; line-height: 1.6;">
		{@html data.parsedContent}
	</div>

{:else}
	<!-- Fallback empty state if invalid ID -->
	<div style="padding: 3rem; text-align: center; color: var(--text-muted)">Lesson format not supported.</div>
{/if}

<style>
	/* ── Slides: true full-screen immersive ── */
	.slides-wrap {
		position: fixed;
		inset: 0;
		z-index: 50;
		background: var(--bg-subtle);
	}

	/* ── Exam: fills the shell content area ── */
	.exam-wrap {
		width: 100%;
		height: 100%;
		overflow: hidden;
		display: flex;
		flex-direction: column;
	}

</style>
