<script lang="ts">
	export let readingData: {
		title: string;
		readingTime: string;
		htmlContent: string;
	};

	let isCompleted = false;
</script>

<div class="reading-lesson-wrap">
	<article class="reading-content">
		
		<header class="reading-header">
			<div class="reading-meta">
				<span class="meta-item">
					<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 16 14"></polyline></svg>
					{readingData.readingTime}
				</span>
				<span class="meta-divider">•</span>
				<span class="meta-item">Reading Material</span>
			</div>
			
			<h1 class="reading-title">{readingData.title}</h1>
		</header>

		<div class="prose">
			{@html readingData.htmlContent}
		</div>

		<footer class="reading-footer">
			<hr class="footer-divider" />
			
			<div class="completion-area">
				<button 
					class="complete-btn" 
					class:completed={isCompleted}
					on:click={() => isCompleted = !isCompleted}
				>
					{#if isCompleted}
						<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
						Completed
					{:else}
						Mark as Complete
					{/if}
				</button>
				
				<p class="completion-text">
					{#if isCompleted}
						Great job! You've completed this lesson.
					{:else}
						Take your time to read through the material.
					{/if}
				</p>
			</div>
		</footer>

	</article>
</div>

<style>
	.reading-lesson-wrap {
		width: 100%;
		height: 100%;
		overflow-y: auto;
		background: var(--bg);
	}

	.reading-content {
		max-width: 800px;
		margin: 0 auto;
		padding: 4rem 2rem;
		animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(16px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* Header */
	.reading-header {
		margin-bottom: 3rem;
	}

	.reading-meta {
		display: flex;
		align-items: center;
		gap: 12px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		color: var(--text-muted);
		margin-bottom: 1rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
	}

	.reading-title {
		font-size: clamp(2rem, 4vw, 3rem);
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1.15;
		letter-spacing: -0.03em;
	}

	/* Prose Typography (Markdown style) */
	.prose {
		font-size: 1.125rem;
		line-height: 1.75;
		color: var(--text-secondary);
	}

	.prose :global(h2) {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-top: 3rem;
		margin-bottom: 1.5rem;
		letter-spacing: -0.02em;
	}

	.prose :global(h3) {
		font-size: 1.35rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-top: 2.5rem;
		margin-bottom: 1rem;
	}

	.prose :global(p) {
		margin-bottom: 1.5rem;
	}

	.prose :global(ul), .prose :global(ol) {
		margin-bottom: 1.5rem;
		padding-left: 1.5rem;
	}

	.prose :global(li) {
		margin-bottom: 0.5rem;
	}

	.prose :global(strong) {
		font-weight: 700;
		color: var(--text-primary);
	}

	.prose :global(a) {
		color: var(--accent);
		text-decoration: underline;
		text-underline-offset: 3px;
		transition: color 0.2s;
	}
	.prose :global(a:hover) {
		color: var(--accent-hover);
	}

	.prose :global(blockquote) {
		border-left: 4px solid var(--accent);
		background: var(--bg-subtle);
		padding: 1.5rem 2rem;
		margin: 2.5rem 0;
		font-style: italic;
		border-radius: 0 8px 8px 0;
		color: var(--text-primary);
	}

	.prose :global(blockquote p:last-child) {
		margin-bottom: 0;
	}

	.prose :global(code) {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.9em;
		background: var(--bg-elevated);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		color: var(--accent);
		border: 1px solid var(--border);
	}

	.prose :global(pre) {
		background: var(--bg-elevated);
		padding: 1.5rem;
		border-radius: 8px;
		overflow-x: auto;
		margin: 2rem 0;
		border: 1px solid var(--border);
	}

	.prose :global(pre code) {
		background: none;
		padding: 0;
		border: none;
		color: var(--text-primary);
	}

	/* Footer / Completion */
	.reading-footer {
		margin-top: 4rem;
	}

	.footer-divider {
		border: none;
		height: 1px;
		background: var(--border);
		margin-bottom: 3rem;
	}

	.completion-area {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		gap: 16px;
	}

	.complete-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 14px 32px;
		border-radius: 8px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		border: 2px solid var(--accent);
		background: transparent;
		color: var(--accent);
		transition: all 0.2s ease;
	}

	.complete-btn:hover:not(.completed) {
		background: var(--accent-muted);
	}

	.complete-btn.completed {
		background: var(--accent);
		color: #fff;
		border-color: var(--accent);
	}

	.completion-text {
		font-size: 0.95rem;
		color: var(--text-secondary);
	}

	@media (max-width: 768px) {
		.reading-content {
			padding: 2.5rem 1.5rem;
		}
		
		.prose {
			font-size: 1.05rem;
		}
		
		.prose :global(blockquote) {
			padding: 1.25rem 1.5rem;
		}
	}
</style>
