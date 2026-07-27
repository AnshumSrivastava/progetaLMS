<script lang="ts">
	import { Plus, GripVertical, CheckCircle2, Circle, Trash2, Save, ArrowLeft } from 'lucide-svelte';
	import { page } from '$app/stores';

	const courseId = $page.params.courseId;

	// Mock Quiz Data
	let quizTitle = 'Module 1 Quiz';
	let passingScore = 80;
	
	let questions = $state([
		{
			id: 'q1',
			text: 'Which of the following best describes a Zero Day vulnerability?',
			options: [
				{ id: 'o1', text: 'A vulnerability that has been patched for zero days.', isCorrect: false },
				{ id: 'o2', text: 'A vulnerability known to the vendor but not yet patched.', isCorrect: true },
				{ id: 'o3', text: 'A type of malware that self-replicates.', isCorrect: false },
				{ id: 'o4', text: 'An attack that occurs precisely at midnight.', isCorrect: false }
			]
		}
	]);

	function addQuestion() {
		questions = [...questions, {
			id: 'q' + Date.now(),
			text: '',
			options: [
				{ id: 'o' + Date.now() + '1', text: '', isCorrect: true },
				{ id: 'o' + Date.now() + '2', text: '', isCorrect: false }
			]
		}];
	}

	function addOption(qIndex: number) {
		const newQuestions = [...questions];
		newQuestions[qIndex].options.push({
			id: 'o' + Date.now(),
			text: '',
			isCorrect: false
		});
		questions = newQuestions;
	}

	function setCorrect(qIndex: number, oIndex: number) {
		const newQuestions = [...questions];
		newQuestions[qIndex].options.forEach((opt, idx) => {
			opt.isCorrect = (idx === oIndex);
		});
		questions = newQuestions;
	}

	function deleteQuestion(qIndex: number) {
		const newQuestions = [...questions];
		newQuestions.splice(qIndex, 1);
		questions = newQuestions;
	}

	function deleteOption(qIndex: number, oIndex: number) {
		const newQuestions = [...questions];
		newQuestions[qIndex].options.splice(oIndex, 1);
		// Ensure at least one correct option if we deleted the correct one
		if (!newQuestions[qIndex].options.some(o => o.isCorrect) && newQuestions[qIndex].options.length > 0) {
			newQuestions[qIndex].options[0].isCorrect = true;
		}
		questions = newQuestions;
	}
</script>

<svelte:head>
	<title>Quiz Editor</title>
</svelte:head>

<div class="editor-header">
	<a href={`/dashboard/instructor/courses/${courseId}/curriculum`} class="back-btn">
		<ArrowLeft size={16} /> Back to Curriculum
	</a>
	<div class="header-actions">
		<button class="save-btn">
			<Save size={16} /> Save Quiz
		</button>
	</div>
</div>

<div class="editor-container">
	<div class="quiz-meta">
		<input type="text" bind:value={quizTitle} class="title-input" placeholder="Quiz Title" />
		<div class="meta-row">
			<label>Passing Score (%)</label>
			<input type="number" bind:value={passingScore} class="score-input" min="0" max="100" />
		</div>
	</div>

	<div class="questions-list">
		{#each questions as question, qIdx}
			<div class="question-card">
				<div class="question-header">
					<div class="drag-handle"><GripVertical size={16} /></div>
					<span class="q-number">Question {qIdx + 1}</span>
					<button class="delete-btn" onclick={() => deleteQuestion(qIdx)} title="Delete Question">
						<Trash2 size={16} />
					</button>
				</div>
				
				<div class="question-body">
					<textarea 
						bind:value={question.text} 
						class="q-text-input" 
						placeholder="Type your question here..."
						rows="2"
					></textarea>
					
					<div class="options-list">
						<div class="options-label">Answers (select correct one)</div>
						
						{#each question.options as option, oIdx}
							<div class="option-row" class:is-correct={option.isCorrect}>
								<button class="radio-btn" onclick={() => setCorrect(qIdx, oIdx)}>
									{#if option.isCorrect}
										<CheckCircle2 size={20} class="text-success" />
									{:else}
										<Circle size={20} class="text-muted" />
									{/if}
								</button>
								<input type="text" bind:value={option.text} class="opt-input" placeholder={`Option ${oIdx + 1}`} />
								{#if question.options.length > 2}
									<button class="del-opt-btn" onclick={() => deleteOption(qIdx, oIdx)}>
										<Trash2 size={14} />
									</button>
								{/if}
							</div>
						{/each}
						
						<button class="add-opt-btn" onclick={() => addOption(qIdx)}>
							<Plus size={14} /> Add Option
						</button>
					</div>
				</div>
			</div>
		{/each}
	</div>

	<button class="add-q-btn" onclick={addQuestion}>
		<Plus size={18} /> Add New Question
	</button>
</div>

<style>
	.editor-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 2rem;
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border);
	}
	.back-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		text-decoration: none;
		font-weight: 500;
		font-size: 0.9rem;
	}
	.back-btn:hover {
		color: var(--text-primary);
	}
	
	.save-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}

	.editor-container {
		max-width: 800px;
		margin: 0 auto;
	}

	.quiz-meta {
		margin-bottom: 2rem;
	}
	.title-input {
		width: 100%;
		font-size: 2rem;
		font-weight: 700;
		color: var(--text-primary);
		background: transparent;
		border: none;
		border-bottom: 2px solid transparent;
		padding: 0 0 8px 0;
		margin-bottom: 1rem;
		font-family: inherit;
		transition: border-color 0.2s;
	}
	.title-input:focus {
		outline: none;
		border-color: var(--border-strong);
	}
	.meta-row {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.meta-row label {
		font-weight: 600;
		color: var(--text-secondary);
		font-size: 0.9rem;
	}
	.score-input {
		width: 80px;
		padding: 6px 12px;
		border: 1px solid var(--border-strong);
		border-radius: 6px;
		background: var(--bg);
		color: var(--text-primary);
		font-family: inherit;
	}

	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 2rem;
		margin-bottom: 2rem;
	}

	.question-card {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}
	.question-header {
		display: flex;
		align-items: center;
		padding: 12px;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
	}
	.drag-handle {
		color: var(--text-muted);
		cursor: grab;
		padding: 4px;
	}
	.q-number {
		font-weight: 600;
		color: var(--text-primary);
		margin-left: 8px;
		flex: 1;
	}
	.delete-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
	}
	.delete-btn:hover {
		color: var(--error, #ef4444);
	}

	.question-body {
		padding: 1.5rem;
	}
	.q-text-input {
		width: 100%;
		padding: 12px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 1rem;
		font-family: inherit;
		margin-bottom: 1.5rem;
		resize: vertical;
	}
	.q-text-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.options-label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 12px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.options-list {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.option-row {
		display: flex;
		align-items: center;
		gap: 12px;
		padding: 8px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		transition: all 0.2s;
	}
	.option-row.is-correct {
		border-color: var(--accent);
		background: var(--accent-muted);
	}
	.radio-btn {
		background: transparent;
		border: none;
		cursor: pointer;
		display: flex;
		padding: 4px;
	}
	.text-success { color: #10b981; }
	.text-muted { color: var(--text-muted); }
	
	.opt-input {
		flex: 1;
		background: transparent;
		border: none;
		color: var(--text-primary);
		font-size: 0.95rem;
		padding: 4px;
	}
	.opt-input:focus {
		outline: none;
	}
	
	.del-opt-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		opacity: 0;
	}
	.option-row:hover .del-opt-btn {
		opacity: 1;
	}
	.del-opt-btn:hover {
		color: var(--error, #ef4444);
	}

	.add-opt-btn {
		align-self: flex-start;
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: none;
		color: var(--accent);
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		padding: 8px 0;
	}
	.add-opt-btn:hover {
		text-decoration: underline;
	}

	.add-q-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		padding: 1.5rem;
		background: transparent;
		border: 2px dashed var(--border-strong);
		border-radius: 12px;
		color: var(--text-secondary);
		font-weight: 600;
		font-size: 1rem;
		cursor: pointer;
		transition: all 0.2s;
	}
	.add-q-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-muted);
	}
</style>
