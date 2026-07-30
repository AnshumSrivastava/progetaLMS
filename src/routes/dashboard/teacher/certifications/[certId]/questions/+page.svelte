<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { ArrowLeft, Save, Plus, Trash2, CheckCircle2, Circle } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: PageData }>();

	let showAddModal = $state(false);
	let isSubmitting = $state(false);
	
	let newQuestionContent = $state('');
	let newOptions = $state([
		{ content: '', isCorrect: true },
		{ content: '', isCorrect: false }
	]);

	function addOption() {
		if (newOptions.length < 4) {
			newOptions = [...newOptions, { content: '', isCorrect: false }];
		}
	}

	function removeOption(index: number) {
		if (newOptions.length > 2) {
			newOptions = newOptions.filter((_, i) => i !== index);
		}
	}

	function setCorrectOption(index: number) {
		newOptions = newOptions.map((opt, i) => ({
			...opt,
			isCorrect: i === index
		}));
	}
</script>

<svelte:head>
	<title>Edit Certification — {APP_NAME} Instructor</title>
</svelte:head>

<div class="workspace-shell">
	<header class="builder-header">
		<div class="header-left">
			<a href="/dashboard/teacher/certifications" class="back-btn">
				<ArrowLeft size={18} />
				<span>Back</span>
			</a>
			<div class="divider"></div>
			<span class="course-title">{data.cert.title}</span>
			<span class="status-badge {data.cert.status === 'published' ? 'published' : 'draft'}">{data.cert.status}</span>
		</div>
	</header>

	<div class="workspace-content">
		<div class="main-column">
			<div class="section-header">
				<h2>Questions ({data.questions.length})</h2>
				<button class="primary-btn" onclick={() => showAddModal = true}>
					<Plus size={16} /> Add Question
				</button>
			</div>

			<div class="questions-list">
				{#each data.questions as question (question.id)}
					<div class="question-card">
						<div class="q-header">
							<h3>{question.content}</h3>
							<form method="POST" action="?/deleteQuestion" use:enhance={() => {
								return async ({ update }) => {
									await update();
									await invalidateAll();
								};
							}}>
								<input type="hidden" name="questionId" value={question.id} />
								<button class="icon-btn text-error" title="Delete Question"><Trash2 size={16}/></button>
							</form>
						</div>
						<div class="options-list">
							{#each question.options as option}
								<div class="option-item {option.isCorrect ? 'correct' : ''}">
									{#if option.isCorrect}
										<CheckCircle2 size={16} class="correct-icon" />
									{:else}
										<Circle size={16} class="incorrect-icon" />
									{/if}
									<span>{option.content}</span>
								</div>
							{/each}
						</div>
					</div>
				{/each}
				
				{#if data.questions.length === 0}
					<div class="empty-state">
						<p>No questions added yet. Add some multiple-choice questions to build the exam.</p>
					</div>
				{/if}
			</div>
		</div>

		<div class="side-column">
			<form class="settings-panel" method="POST" action="?/updateSettings" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					await invalidateAll();
					isSubmitting = false;
				};
			}}>
				<h3>Exam Settings</h3>
				
				<div class="form-group">
					<label class="form-label">Passing Criteria (%)</label>
					<input type="number" name="passingPercent" class="form-input" min="1" max="100" value={data.cert.passingPercent} required />
				</div>

				<div class="form-group">
					<label class="form-label">Max Attempts</label>
					<input type="number" name="maxAttempts" class="form-input" min="1" value={data.cert.maxAttempts || ''} placeholder="Leave blank for unlimited" />
				</div>

				<div class="form-group">
					<label class="form-label">Status</label>
					<select name="status" class="form-input" value={data.cert.status}>
						<option value="draft">Draft</option>
						<option value="published">Published</option>
					</select>
				</div>

				<button type="submit" class="primary-btn full-width" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save Settings'}
				</button>
			</form>
		</div>
	</div>
</div>

{#if showAddModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }}>
		<form class="modal-content large" method="POST" action="?/addQuestion" use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				await invalidateAll();
				isSubmitting = false;
				showAddModal = false;
				newQuestionContent = '';
				newOptions = [
					{ content: '', isCorrect: true },
					{ content: '', isCorrect: false }
				];
			};
		}}>
			<h3>Add Multiple Choice Question</h3>
			
			<div class="form-group">
				<label class="form-label">Question Text</label>
				<textarea class="form-input" placeholder="What is the capital of..." required bind:value={newQuestionContent} name="content"></textarea>
			</div>

			<div class="options-builder">
				<label class="form-label">Options (Select the correct one)</label>
				{#each newOptions as opt, i}
					<div class="option-row">
						<button type="button" class="radio-btn {opt.isCorrect ? 'active' : ''}" onclick={() => setCorrectOption(i)}>
							{#if opt.isCorrect}<CheckCircle2 size={20}/>{:else}<Circle size={20}/>{/if}
						</button>
						<input type="text" class="form-input option-input" placeholder="Option {i + 1}" bind:value={opt.content} required />
						{#if newOptions.length > 2}
							<button type="button" class="icon-btn text-error" onclick={() => removeOption(i)}><Trash2 size={16}/></button>
						{/if}
					</div>
				{/each}
				
				{#if newOptions.length < 4}
					<button type="button" class="secondary-btn mt-2" onclick={addOption}>
						<Plus size={14} /> Add Option
					</button>
				{/if}
			</div>

			<!-- Hidden input to pass options array -->
			<input type="hidden" name="options" value={JSON.stringify(newOptions)} />

			<div class="modal-actions mt-6">
				<button type="button" class="action-btn" onclick={() => showAddModal = false}>Cancel</button>
				<button type="submit" class="create-btn" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Add Question'}
				</button>
			</div>
		</form>
	</div>
{/if}

<style>
	.workspace-shell {
		min-height: 100vh;
		display: flex;
		flex-direction: column;
		background: var(--bg);
	}
	.builder-header {
		height: 60px;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 0 1.5rem;
		background: var(--bg);
		position: sticky;
		top: 0;
		z-index: 10;
	}
	.header-left {
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.back-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
	}
	.back-btn:hover {
		color: var(--text-primary);
	}
	.divider {
		width: 1px;
		height: 24px;
		background: var(--border);
	}
	.course-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	
	.workspace-content {
		display: grid;
		grid-template-columns: 1fr 320px;
		gap: 2rem;
		padding: 2rem;
		max-width: 1200px;
		margin: 0 auto;
		width: 100%;
	}

	.section-header {
		display: flex;
		justify-content: space-between;
		align-items: center;
		margin-bottom: 1.5rem;
	}
	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 600;
	}

	.questions-list {
		display: flex;
		flex-direction: column;
		gap: 1rem;
	}
	.question-card {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
	}
	.q-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
	}
	.q-header h3 {
		font-size: 1rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 8px;
	}
	.option-item {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.9rem;
	}
	.option-item.correct {
		border-color: #10b981;
		background: rgba(16, 185, 129, 0.05);
	}
	.correct-icon {
		color: #10b981;
	}
	.incorrect-icon {
		color: var(--text-muted);
	}

	.settings-panel {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
	}
	.settings-panel h3 {
		font-size: 1rem;
		font-weight: 600;
		margin-bottom: 1.25rem;
		padding-bottom: 0.75rem;
		border-bottom: 1px solid var(--border);
	}

	.form-group {
		margin-bottom: 1.25rem;
	}
	.form-label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 6px;
	}
	.form-input {
		width: 100%;
		padding: 10px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.form-input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.primary-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 10px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
	}
	.primary-btn.full-width {
		width: 100%;
	}
	.secondary-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border);
		padding: 8px 14px;
		border-radius: 8px;
		font-weight: 500;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.icon-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}
	.icon-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}
	.text-error {
		color: #ef4444;
	}
	.text-error:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.1);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0;
		left: 0;
		right: 0;
		bottom: 0;
		background: rgba(0, 0, 0, 0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
	}
	.modal-content {
		background: var(--bg);
		padding: 2rem;
		border-radius: 16px;
		width: 100%;
		max-width: 450px;
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal-content.large {
		max-width: 600px;
	}
	.modal-content h3 {
		font-size: 1.25rem;
		font-weight: 600;
		margin-bottom: 1.5rem;
	}
	
	.option-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}
	.option-input {
		margin-bottom: 0;
	}
	.radio-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
	}
	.radio-btn.active {
		color: #10b981;
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
	.action-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 10px 18px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}
	.create-btn {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 10px 18px;
		border-radius: 8px;
		font-weight: 600;
		cursor: pointer;
	}

	.status-badge {
		padding: 4px 10px;
		border-radius: 20px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
	}
	.status-badge.published {
		background: rgba(16, 185, 129, 0.1);
		color: #10b981;
	}
	.status-badge.draft {
		background: rgba(107, 114, 128, 0.1);
		color: var(--text-muted);
	}
</style>
