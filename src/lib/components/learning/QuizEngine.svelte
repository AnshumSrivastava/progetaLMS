<script lang="ts">
	export let questions: { id: string; question: string; options: string[]; answer?: string }[] = [];
	export let onsubmit: ((answers: Record<string, string>) => Promise<any> | void) | undefined = undefined;
	export let maxAttempts: number | null = null;
	export let attemptsTaken: number = 0;

	let currentQuestionIndex = 0;
	let answers: Record<string, string> = {};
	let isSubmitted = false;
	let isSubmitting = false;
	let submitResult: any = null;
	let transitioning = false;

	// Shuffle helper function
	function shuffle(array: string[]) {
		let currentIndex = array.length, randomIndex;
		while (currentIndex > 0) {
			randomIndex = Math.floor(Math.random() * currentIndex);
			currentIndex--;
			[array[currentIndex], array[randomIndex]] = [array[randomIndex], array[currentIndex]];
		}
		return array;
	}

	let shuffledOptions: string[] = [];

	const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];
	const numberKeys = ['1', '2', '3', '4', '5', '6'];

	function selectOption(questionId: string, option: string) {
		answers = { ...answers, [questionId]: option };
	}

	async function nextQuestion() {
		if (transitioning || currentQuestionIndex >= questions.length - 1) return;
		transitioning = true;
		await new Promise(r => setTimeout(r, 220));
		currentQuestionIndex++;
		transitioning = false;
	}

	async function prevQuestion() {
		if (transitioning || currentQuestionIndex <= 0) return;
		transitioning = true;
		await new Promise(r => setTimeout(r, 220));
		currentQuestionIndex--;
		transitioning = false;
	}

	async function submitQuiz() {
		if (answeredCount >= questions.length) {
			isSubmitted = true;
			if (onsubmit) {
				isSubmitting = true;
				submitResult = await onsubmit(answers);
				isSubmitting = false;
				if (submitResult && submitResult.success) {
					attemptsTaken++;
				}
			}
		}
	}

	function handleReattempt() {
		currentQuestionIndex = 0;
		answers = {};
		isSubmitted = false;
		submitResult = null;
		transitioning = false;
	}

	function handleKeydown(e: KeyboardEvent) {
		// Don't intercept if focused on a button/input (except the options)
		const tag = (e.target as HTMLElement)?.tagName;
		if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') return;

		if (isSubmitted || transitioning) return;
		const key = e.key.toLowerCase();
		const curQ = questions[currentQuestionIndex];

		const letterIndex = optionLabels.findIndex(l => l.toLowerCase() === key);
		const numberIndex = numberKeys.findIndex(n => n === key);

		let optionIndex = -1;
		if (letterIndex !== -1 && letterIndex < curQ.options.length) optionIndex = letterIndex;
		else if (numberIndex !== -1 && numberIndex < curQ.options.length) optionIndex = numberIndex;

		if (optionIndex !== -1) {
			e.preventDefault();
			selectOption(curQ.id, shuffledOptions[optionIndex]);
			return;
		}

		if (key === 'enter') {
			e.preventDefault();
			if (isLastQuestion && answeredCount === questions.length) {
				submitQuiz();
			} else if (!isLastQuestion && answers[curQ.id]) {
				nextQuestion();
			}
		}

		if (key === 'arrowright' || key === 'arrowleft') {
			e.preventDefault();
			if (key === 'arrowright') nextQuestion();
			else prevQuestion();
		}
	}

	async function jumpToQuestion(index: number) {
		if (transitioning || index === currentQuestionIndex) return;
		transitioning = true;
		await new Promise(r => setTimeout(r, 180));
		currentQuestionIndex = index;
		transitioning = false;
	}

	$: currentQuestion = questions[currentQuestionIndex];
	$: isLastQuestion = currentQuestionIndex === questions.length - 1;
	$: answeredCount = Object.keys(answers).length;
	$: progressPct = ((currentQuestionIndex + 1) / questions.length) * 100;
	$: canSubmit = answeredCount === questions.length;

	$: {
		if (questions[currentQuestionIndex]) {
			// Create a copy of options and shuffle them so it changes each time
			shuffledOptions = shuffle([...questions[currentQuestionIndex].options]);
		}
	}
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="quiz-wrap">

	{#if isSubmitted}
		<!-- ── COMPLETION SCREEN ─────────────────────── -->
		<div class="done-screen">
			{#if isSubmitting}
				<div class="done-icon" style="color: var(--text-muted); background: var(--bg-elevated); border: 2px solid var(--border);">
					<svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="animate-spin" stroke-linecap="round" stroke-linejoin="round">
						<line x1="12" y1="2" x2="12" y2="6"></line>
						<line x1="12" y1="18" x2="12" y2="22"></line>
						<line x1="4.93" y1="4.93" x2="7.76" y2="7.76"></line>
						<line x1="16.24" y1="16.24" x2="19.07" y2="19.07"></line>
						<line x1="2" y1="12" x2="6" y2="12"></line>
						<line x1="18" y1="12" x2="22" y2="12"></line>
						<line x1="4.93" y1="19.07" x2="7.76" y2="16.24"></line>
						<line x1="16.24" y1="7.76" x2="19.07" y2="4.93"></line>
					</svg>
				</div>
				<h2 class="done-title">Grading Assessment...</h2>
				<p class="done-subtitle">Please wait while your answers are evaluated.</p>
			{:else if submitResult?.success}
				{#if submitResult.passed}
					<div class="done-icon" style="background: rgba(34, 197, 94, 0.1); color: #22c55e;">
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
					</div>
					<h2 class="done-title">Congratulations! You Passed</h2>
					<p class="done-subtitle">Your certificate has been issued and will be emailed to you as a PDF.</p>
				{:else}
					<div class="done-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
						<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="10"></circle>
							<line x1="15" y1="9" x2="9" y2="15"></line>
							<line x1="9" y1="9" x2="15" y2="15"></line>
						</svg>
					</div>
					<h2 class="done-title">You Did Not Pass</h2>
					<p class="done-subtitle">Keep studying and try again!</p>
				{/if}

				<div class="done-stats">
					<div class="done-stat">
						<div class="done-stat-num">{submitResult.score}</div>
						<div class="done-stat-lbl">Score / {submitResult.maxScore}</div>
					</div>
					<div class="done-divider"></div>
					<div class="done-stat">
						<div class="done-stat-num accent">{Math.round(submitResult.percent)}%</div>
						<div class="done-stat-lbl">Percentage</div>
					</div>
				</div>

				<div style="display: flex; gap: 12px; justify-content: center; flex-wrap: wrap;">
					<a href="/dashboard" class="done-btn outline">Return to Dashboard</a>
					{#if submitResult.passed && submitResult.certificateId}
						<a href="/certificates/{submitResult.certificateId}" target="_blank" class="done-btn">Download Certificate</a>
					{:else if !submitResult.passed}
						{#if maxAttempts === null || attemptsTaken < maxAttempts}
							<button type="button" class="done-btn" onclick={handleReattempt}>Reattempt Exam</button>
						{:else}
							<div style="width: 100%; text-align: center; margin-top: 12px; font-size: 0.9rem; color: var(--text-muted);">
								You have reached the maximum number of attempts.
							</div>
						{/if}
					{/if}
				</div>
			{:else}
				<div class="done-icon" style="background: rgba(239, 68, 68, 0.1); color: #ef4444;">
					<svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
						<circle cx="12" cy="12" r="10"></circle>
						<line x1="12" y1="8" x2="12" y2="12"></line>
						<line x1="12" y1="16" x2="12.01" y2="16"></line>
					</svg>
				</div>
				<h2 class="done-title">Error Submitting</h2>
				<p class="done-subtitle">{submitResult?.error || 'An unexpected error occurred while grading.'}</p>
				
				<div style="display: flex; gap: 12px; justify-content: center; margin-top: 24px;">
					<button type="button" class="done-btn outline" onclick={() => isSubmitted = false}>Back to Quiz</button>
					<button type="button" class="done-btn" onclick={submitQuiz}>Retry Submission</button>
				</div>
			{/if}
		</div>

	{:else}
		<!-- ── QUIZ INTERFACE ────────────────────────── -->
		<div class="quiz-layout">
			<!-- Main quiz area -->
			<div class="quiz-body">
				<div class="quiz-body-inner">

			<!-- Top Progress Bar -->
			<div class="top-progress">
				<div class="top-progress-track">
					<div class="top-progress-fill" style="width: {progressPct}%"></div>
				</div>
				<div class="progress-meta">
					<span class="progress-label">QUESTION {currentQuestionIndex + 1} / {questions.length}</span>
					<span class="progress-answered">{answeredCount} answered</span>
				</div>
			</div>

			<!-- Question + Options -->
			<div class="content" class:trans={transitioning}>
				<h3 class="q-text">{currentQuestion.question}</h3>

				<div class="options">
					{#each shuffledOptions as option, i}
						{@const sel = answers[currentQuestion.id] === option}
						<button
							type="button"
							class="opt"
							class:opt-selected={sel}
							onclick={() => selectOption(currentQuestion.id, option)}
						>
							<span class="opt-key" class:opt-key-sel={sel}>{optionLabels[i]}</span>
							<span class="opt-label">{option}</span>
							{#if sel}
								<span class="opt-check">
									<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
										<polyline points="20 6 9 17 4 12"></polyline>
									</svg>
								</span>
							{/if}
						</button>
					{/each}
				</div>
			</div>

			<!-- Footer Nav -->
			<div class="footer">
				<div class="kbd-hint">
					<kbd>{optionLabels[0]}</kbd>–<kbd>{optionLabels[currentQuestion.options.length - 1]}</kbd>
					<span>or</span>
					<kbd>1</kbd>–<kbd>{currentQuestion.options.length}</kbd>
					<span>to select · <kbd>Enter</kbd> to continue</span>
				</div>

				<div class="nav-btns">
					<button
						type="button"
						class="btn-ghost"
						onclick={prevQuestion}
						disabled={currentQuestionIndex === 0 || transitioning}
					>
						← Back
					</button>

					{#if isLastQuestion}
						<button
							type="button"
							class="btn-primary"
							onclick={submitQuiz}
							disabled={!canSubmit}
						>
							Submit Assessment
						</button>
					{:else}
						<button
							type="button"
							class="btn-primary"
							onclick={nextQuestion}
							disabled={!answers[currentQuestion.id] || transitioning}
						>
							Next → 
						</button>
					{/if}
				</div>
			</div>

				</div>
			</div>

			<!-- ── QUESTION NAVIGATOR PANEL ────────────── -->
			<aside class="q-nav">
				<div class="q-nav-header">
					<span class="q-nav-title">Questions</span>
					<span class="q-nav-count">{answeredCount}/{questions.length} done</span>
				</div>

				<!-- Mini progress bar -->
				<div class="q-nav-progress">
					<div class="q-nav-progress-fill" style="width: {(answeredCount / questions.length) * 100}%"></div>
				</div>

				<!-- Question grid -->
				<div class="q-grid">
					{#each questions as q, i}
						{@const isAnswered = !!answers[q.id]}
						{@const isCurrent = i === currentQuestionIndex}
						<button
							type="button"
							class="q-btn"
							class:q-btn-current={isCurrent}
							class:q-btn-answered={isAnswered && !isCurrent}
							onclick={() => jumpToQuestion(i)}
							title="Question {i + 1}{isAnswered ? ' — Answered' : ' — Not answered'}"
						>
							{#if isAnswered && !isCurrent}
								<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
							{:else}
								{i + 1}
							{/if}
						</button>
					{/each}
				</div>

				<!-- Legend -->
				<div class="q-legend">
					<div class="legend-row"><span class="legend-dot dot-current"></span> Current</div>
					<div class="legend-row"><span class="legend-dot dot-answered"></span> Answered</div>
					<div class="legend-row"><span class="legend-dot dot-empty"></span> Not answered</div>
				</div>

				{#if canSubmit}
					<button type="button" class="q-nav-submit" onclick={submitQuiz}>
						Submit Assessment
					</button>
				{/if}
			</aside>
		</div>
	{/if}
</div>

<style>
	/* ── Container ── */
	.quiz-wrap {
		width: 100%;
		height: 100%;
		min-height: 0;
		display: flex;
		background-color: var(--bg);
		overflow: hidden;
	}

	/* ── Completion Screen ── */
	.done-screen {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
		max-width: 560px;
		width: 100%;
		animation: fadeUp 0.45s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(20px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	.done-icon {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--accent-muted);
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 28px;
	}

	.done-title {
		font-size: 2rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: var(--text-primary);
		margin-bottom: 10px;
	}
	.done-subtitle {
		font-size: 1.05rem;
		color: var(--text-secondary);
		margin-bottom: 40px;
		line-height: 1.6;
	}

	.done-stats {
		display: flex;
		align-items: center;
		gap: 0;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 14px;
		overflow: hidden;
		width: 100%;
		margin-bottom: 40px;
	}
	.done-stat {
		flex: 1;
		padding: 24px 16px;
		text-align: center;
	}
	.done-stat-num {
		font-size: 2.25rem;
		font-weight: 700;
		color: var(--text-primary);
		line-height: 1;
		margin-bottom: 6px;
	}
	.done-stat-num.accent { color: var(--accent); }
	.done-stat-lbl {
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
	.done-divider {
		width: 1px;
		align-self: stretch;
		background: var(--border);
	}

	.done-btn {
		display: inline-block;
		background: var(--accent);
		color: #fff;
		font-weight: 600;
		font-size: 1rem;
		padding: 14px 36px;
		border: none;
		border-radius: 10px;
		text-decoration: none;
		cursor: pointer;
		transition: background 0.18s, transform 0.1s;
	}
	.done-btn.outline {
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border-strong);
	}
	.done-btn.outline:hover {
		background: var(--bg-elevated);
	}
	.done-btn:hover:not(.outline) { background: var(--accent-hover); }
	.done-btn:active { transform: scale(0.97); }

	.animate-spin {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	/* ── Quiz Body ── */
	.quiz-body-inner {
		width: 100%;
		max-width: 780px;
		margin: 0 auto;
		display: flex;
		flex-direction: column;
		gap: 0;
		animation: fadeUp 0.35s both;
	}

	/* Top Progress */
	.top-progress {
		margin-bottom: 36px;
	}
	.top-progress-track {
		width: 100%;
		height: 5px;
		background: var(--border);
		border-radius: 9999px;
		overflow: hidden;
		margin-bottom: 12px;
	}
	.top-progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 9999px;
		transition: width 0.4s cubic-bezier(0.22, 1, 0.36, 1);
	}
	.progress-meta {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.progress-label {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
	.progress-answered {
		font-size: 0.8rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	/* Question + Options area */
	.content {
		transition: opacity 0.22s ease, transform 0.22s ease;
	}
	.content.trans {
		opacity: 0;
		transform: translateY(-8px);
	}

	.q-text {
		font-size: clamp(1.35rem, 2.8vw, 1.85rem);
		font-weight: 600;
		line-height: 1.45;
		color: var(--text-primary);
		margin-bottom: 36px;
	}

	.options {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Option Card */
	.opt {
		display: flex;
		align-items: center;
		gap: 16px;
		width: 100%;
		padding: 16px 20px;
		background: var(--bg-subtle);
		border: 1.5px solid var(--border);
		border-radius: 12px;
		cursor: pointer;
		text-align: left;
		transition: border-color 0.18s, background 0.18s, box-shadow 0.18s;
		position: relative;
		overflow: hidden;
	}
	.opt:hover {
		border-color: var(--border-strong);
		background: var(--bg-elevated);
	}
	.opt:focus-visible {
		outline: 2px solid var(--accent);
		outline-offset: 2px;
	}
	.opt.opt-selected {
		border-color: var(--accent);
		background: var(--accent-muted);
		box-shadow: 0 0 0 1px var(--accent);
	}

	/* Keyboard shortcut badge */
	.opt-key {
		width: 30px;
		height: 30px;
		border-radius: 7px;
		border: 1.5px solid var(--border-strong);
		background: var(--bg);
		display: inline-flex;
		align-items: center;
		justify-content: center;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-secondary);
		flex-shrink: 0;
		transition: all 0.18s;
	}
	.opt-key.opt-key-sel {
		background: var(--accent);
		border-color: var(--accent);
		color: #fff;
	}

	.opt-label {
		flex: 1;
		font-size: 1.05rem;
		font-weight: 500;
		color: var(--text-primary);
		line-height: 1.5;
	}
	.opt-selected .opt-label {
		color: var(--accent);
		font-weight: 600;
	}

	.opt-check {
		color: var(--accent);
		display: flex;
		align-items: center;
		animation: pop 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}
	@keyframes pop {
		from { transform: scale(0); opacity: 0; }
		to   { transform: scale(1); opacity: 1; }
	}

	/* Footer */
	.footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: 40px;
		padding-top: 24px;
		border-top: 1px solid var(--border);
		flex-wrap: wrap;
		gap: 16px;
	}

	.kbd-hint {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.8rem;
		color: var(--text-muted);
		flex-wrap: wrap;
	}
	.kbd-hint kbd {
		background: var(--bg-elevated);
		border: 1px solid var(--border-strong);
		border-radius: 4px;
		padding: 1px 6px;
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-secondary);
		box-shadow: 0 1px 0 var(--border-strong);
	}

	.nav-btns {
		display: flex;
		gap: 12px;
		align-items: center;
	}

	.btn-ghost {
		padding: 10px 20px;
		border-radius: 8px;
		background: transparent;
		border: 1px solid var(--border-strong);
		color: var(--text-secondary);
		font-size: 0.9rem;
		font-weight: 500;
		cursor: pointer;
		transition: all 0.18s;
	}
	.btn-ghost:hover:not(:disabled) {
		background: var(--bg-elevated);
		color: var(--text-primary);
		border-color: var(--border-strong);
	}
	.btn-ghost:disabled {
		opacity: 0.3;
		cursor: not-allowed;
	}

	.btn-primary {
		padding: 11px 28px;
		border-radius: 8px;
		background: var(--accent);
		border: none;
		color: #fff;
		font-size: 0.95rem;
		font-weight: 600;
		cursor: pointer;
		transition: background 0.18s, transform 0.1s, opacity 0.18s;
	}
	.btn-primary:hover:not(:disabled) {
		background: var(--accent-hover);
	}
	.btn-primary:active:not(:disabled) {
		transform: scale(0.97);
	}
	.btn-primary:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	/* ── Layout wrapper ── */
	.quiz-layout {
		display: flex;
		width: 100%;
		height: 100%;
		min-height: 0;
		gap: 0;
	}

	/* Quiz body takes remaining space */
	.quiz-layout .quiz-body {
		flex: 1;
		min-width: 0;
		padding: 3rem 4rem;
		overflow-y: auto;
		display: flex;
		flex-direction: column;
		justify-content: center;
	}

	/* ── Question Navigator Panel ── */
	.q-nav {
		width: 220px;
		flex-shrink: 0;
		border-left: 1px solid var(--border);
		background: var(--bg-subtle);
		display: flex;
		flex-direction: column;
		padding: 24px 20px;
		gap: 16px;
		overflow-y: auto;
	}

	.q-nav-header {
		display: flex;
		align-items: baseline;
		justify-content: space-between;
		gap: 8px;
	}
	.q-nav-title {
		font-size: 0.8rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
	}
	.q-nav-count {
		font-family: 'JetBrains Mono', monospace;
		font-size: 0.72rem;
		color: var(--accent);
		font-weight: 600;
	}

	/* Navigator mini progress bar */
	.q-nav-progress {
		height: 3px;
		background: var(--border);
		border-radius: 9999px;
		overflow: hidden;
	}
	.q-nav-progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 9999px;
		transition: width 0.35s cubic-bezier(0.22, 1, 0.36, 1);
	}

	/* Question grid */
	.q-grid {
		display: grid;
		grid-template-columns: repeat(4, 1fr);
		gap: 8px;
	}

	.q-btn {
		aspect-ratio: 1;
		border-radius: 8px;
		border: 1.5px solid var(--border-strong);
		background: var(--bg-elevated);
		color: var(--text-secondary);
		font-size: 0.8rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.18s ease;
		padding: 0;
	}
	.q-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-muted);
	}

	/* Current question */
	.q-btn.q-btn-current {
		border-color: var(--accent);
		background: var(--accent);
		color: #fff;
		box-shadow: 0 0 0 3px var(--accent-muted);
	}

	/* Answered question */
	.q-btn.q-btn-answered {
		border-color: transparent;
		background: var(--accent-muted);
		color: var(--accent);
	}

	/* Legend */
	.q-legend {
		display: flex;
		flex-direction: column;
		gap: 6px;
		padding-top: 4px;
		border-top: 1px solid var(--border);
	}
	.legend-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.72rem;
		color: var(--text-muted);
	}
	.legend-dot {
		width: 10px;
		height: 10px;
		border-radius: 3px;
		flex-shrink: 0;
	}
	.dot-current  { background: var(--accent); }
	.dot-answered { background: var(--accent-muted); border: 1.5px solid var(--accent); }
	.dot-empty    { background: var(--bg-elevated); border: 1.5px solid var(--border-strong); }

	/* Submit from panel */
	.q-nav-submit {
		width: 100%;
		padding: 11px 0;
		border-radius: 8px;
		background: var(--accent);
		border: none;
		color: #fff;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		margin-top: auto;
		transition: background 0.18s, transform 0.1s;
		animation: popIn 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) both;
	}
	.q-nav-submit:hover {
		background: var(--accent-hover);
	}
	.q-nav-submit:active {
		transform: scale(0.97);
	}
	@keyframes popIn {
		from { opacity: 0; transform: scale(0.9); }
		to   { opacity: 1; transform: scale(1); }
	}

	/* ── Responsive ──────────────────────────────── */

	/* Tablet: navigator moves to bottom strip */
	@media (max-width: 900px) {
		.quiz-layout {
			flex-direction: column;
			overflow-y: auto;
		}

		.quiz-layout .quiz-body {
			padding-right: 0;
			padding-bottom: 0;
		}

		.q-nav {
			width: 100%;
			border-left: none;
			border-top: 1px solid var(--border);
			flex-direction: row;
			flex-wrap: wrap;
			padding: 16px 20px;
			gap: 12px;
			align-items: center;
		}

		.q-nav-header {
			flex-direction: column;
			align-items: flex-start;
			gap: 4px;
			flex-shrink: 0;
		}

		.q-nav-progress {
			width: 80px;
		}

		.q-grid {
			grid-template-columns: repeat(auto-fill, minmax(36px, 1fr));
			flex: 1;
		}

		.q-legend {
			flex-direction: row;
			gap: 12px;
			border-top: none;
			border-left: 1px solid var(--border);
			padding-top: 0;
			padding-left: 12px;
		}

		.q-nav-submit {
			margin-top: 0;
			width: auto;
			padding: 10px 20px;
			flex-shrink: 0;
		}
	}

	/* Mobile: single column, full-width options */
	@media (max-width: 600px) {
		.quiz-wrap {
			padding: 1.25rem 1rem;
			align-items: flex-start;
		}

		.quiz-body {
			padding: 1.25rem 0;
		}

		.top-progress {
			margin-bottom: 24px;
		}

		.q-text {
			font-size: 1.15rem;
			margin-bottom: 24px;
		}

		.opt {
			padding: 14px 16px;
			gap: 14px;
		}

		.opt-key {
			width: 28px;
			height: 28px;
			font-size: 0.75rem;
		}

		.opt-label {
			font-size: 0.95rem;
		}

		.footer {
			flex-direction: column-reverse;
			gap: 12px;
			align-items: stretch;
			margin-top: 24px;
		}

		.kbd-hint {
			display: none;
		}

		.nav-btns {
			width: 100%;
			justify-content: space-between;
		}

		.btn-primary, .btn-ghost {
			flex: 1;
			justify-content: center;
		}

		/* Done screen */
		.done-screen {
			padding: 1rem;
		}
		.done-stats {
			flex-direction: column;
			gap: 0;
		}
		.done-divider {
			width: auto;
			height: 1px;
			align-self: stretch;
		}

		/* Q nav on mobile */
		.q-nav {
			padding: 12px;
			gap: 8px;
		}

		.q-legend {
			display: none;
		}

		.q-nav-header {
			flex-direction: row;
			align-items: center;
			gap: 8px;
			width: 100%;
		}
	}
</style>
