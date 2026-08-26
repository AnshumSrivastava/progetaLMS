<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { 
		ArrowLeft, 
		Plus, 
		Trash2, 
		CheckCircle2, 
		Circle, 
		FileSpreadsheet, 
		Download, 
		Copy, 
		Upload, 
		AlertTriangle, 
		Sparkles, 
		FileText,
		Loader2
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { 
		parseQuestionBatch, 
		generateSampleCsvTemplate, 
		formatQuestionsAsTsv, 
		type ParsedBatchQuestion 
	} from '$lib/shared/parsers/questionBatchParser';

	let { data } = $props<{ data: PageData }>();

	// Single Question Modal State
	let showAddModal = $state(false);
	let isSubmitting = $state(false);
	let newQuestionContent = $state('');
	
	// Pre-fill static fields for the single question modal
	let singleOptCorrect = $state('');
	let singleOptWrong1 = $state('');
	let singleOptWrong2 = $state('');
	let singleOptWrong3 = $state('');
	let singleExplanation = $state('');

	// ── BATCH IMPORT STATE ─────────────────────────────────────────────
	let showBatchModal = $state(false);
	let batchTab = $state<'paste' | 'grid' | 'file'>('paste');
	let pastedText = $state('');
	let batchQuestions = $state<ParsedBatchQuestion[]>([]);
	let isImportingBatch = $state(false);
	let batchImportError = $state('');
	let batchSuccessMsg = $state('');
	let copyFeedback = $state(false);

	let validBatchCount = $derived(batchQuestions.filter(q => q.isValid).length);
	let invalidBatchCount = $derived(batchQuestions.length - validBatchCount);

	function openBatchModal() {
		showBatchModal = true;
		batchImportError = '';
		batchSuccessMsg = '';
		if (batchQuestions.length === 0) {
			// Initialize with 2 empty editable rows if empty
			addBlankRowToGrid();
		}
	}

	function parsePastedInput() {
		batchImportError = '';
		if (!pastedText.trim()) {
			batchImportError = 'Please paste questions text before parsing.';
			return;
		}

		const result = parseQuestionBatch(pastedText);
		if (result.questions.length === 0) {
			batchImportError = 'Could not detect any questions. Check the format.';
			return;
		}

		batchQuestions = result.questions;
	}

	function handlePasteInput() {
		// Debounced parsing
		setTimeout(() => {
			if (pastedText.trim()) parsePastedInput();
		}, 400);
	}

	function addBlankRowToGrid() {
		batchQuestions = [
			...batchQuestions,
			{
				content: '',
				options: [
					{ content: '', isCorrect: true },
					{ content: '', isCorrect: false },
					{ content: '', isCorrect: false },
					{ content: '', isCorrect: false }
				],
				correctOptionIndex: 0,
				explanation: '',
				points: 1,
				isValid: false,
				errors: ['Question text is empty']
			}
		];
	}

	function removeRowFromGrid(index: number) {
		batchQuestions = batchQuestions.filter((_, i) => i !== index);
	}

	function clearAllGridRows() {
		batchQuestions = [];
		addBlankRowToGrid();
	}

	function validateGridRow(row: ParsedBatchQuestion): ParsedBatchQuestion {
		const errors: string[] = [];
		if (!row.content.trim()) errors.push('Question text is missing');
		
		const filledOpts = row.options.filter(o => o.content.trim() !== '');
		if (filledOpts.length < 2) errors.push('At least 1 correct and 1 wrong answer required');
		if (!row.options[0].content.trim()) errors.push('Correct answer is required');

		return {
			...row,
			isValid: errors.length === 0,
			errors
		};
	}

	function handleCellChange(rowIdx: number) {
		batchQuestions[rowIdx] = validateGridRow(batchQuestions[rowIdx]);
		batchQuestions = [...batchQuestions];
	}

	function handleWrongAnswersChange(rowIdx: number, value: string) {
		const parts = value.split(',').map(s => s.trim()).filter(Boolean);
		batchQuestions[rowIdx].options[1].content = parts[0] || '';
		batchQuestions[rowIdx].options[2].content = parts[1] || '';
		batchQuestions[rowIdx].options[3].content = parts[2] || '';
		handleCellChange(rowIdx);
	}

	function getWrongAnswersText(row: ParsedBatchQuestion): string {
		return [
			row.options[1]?.content,
			row.options[2]?.content,
			row.options[3]?.content
		].filter(Boolean).join(', ');
	}



	function handleFileUpload(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		const reader = new FileReader();
		reader.onload = (event) => {
			const text = event.target?.result as string;
			pastedText = text;
			parsePastedInput();
		};
		reader.readAsText(file);
	}

	function downloadSampleTemplate() {
		const template = generateSampleCsvTemplate();
		const blob = new Blob([template], { type: 'text/csv;charset=utf-8;' });
		const url = URL.createObjectURL(blob);
		const link = document.createElement('a');
		link.setAttribute('href', url);
		link.setAttribute('download', 'certification_questions_template.csv');
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}

	async function copyGridAsExcelTsv() {
		const tsv = formatQuestionsAsTsv(batchQuestions);
		await navigator.clipboard.writeText(tsv);
		copyFeedback = true;
		setTimeout(() => copyFeedback = false, 2000);
	}

	async function executeBatchImport() {
		const validQuestions = batchQuestions.filter(q => q.isValid);
		if (validQuestions.length === 0) {
			batchImportError = 'There are no valid questions ready to import. Please review errors.';
			return;
		}

		isImportingBatch = true;
		batchImportError = '';

		try {
			const res = await fetch(`/api/certifications/${data.cert.id}/questions/batch`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					questions: validQuestions.map(q => ({
						content: q.content,
						options: q.options.filter(o => o.content.trim() !== ''),
						explanation: q.explanation || undefined,
						points: q.points || 1
					}))
				})
			});

			const json = await res.json();
			if (!res.ok) {
				batchImportError = json.error || 'Failed to import questions';
				return;
			}

			batchSuccessMsg = `Successfully imported ${json.importedCount} questions!`;
			await invalidateAll();
			setTimeout(() => {
				showBatchModal = false;
				batchQuestions = [];
				pastedText = '';
				batchSuccessMsg = '';
			}, 1200);
		} catch (err: any) {
			batchImportError = err.message || 'Error occurred during batch upload';
		} finally {
			isImportingBatch = false;
		}
	}
</script>

<svelte:head>
	<title>Edit Certification — {APP_NAME} Instructor</title>
</svelte:head>

<div class="workspace-shell">
	<header class="builder-header">
		<div class="header-left">
			<a href="/dashboard" class="back-btn">
				<ArrowLeft size={16} />
				<span>Exit to Dashboard</span>
			</a>
			<div class="divider"></div>
			<span class="course-title">{data.cert.title}</span>
			<span class="status-badge {data.cert.status === 'published' ? 'published' : 'draft'}">{data.cert.status}</span>
		</div>
		<div class="header-right">
			<button class="btn-batch-header" onclick={openBatchModal}>
				<FileSpreadsheet size={15} />
				<span>Batch / Excel Upload</span>
			</button>
		</div>
	</header>

	<div class="workspace-content">
		<div class="main-column">
			<div class="section-header">
				<div>
					<h2>Exam Questions ({data.questions.length})</h2>
					<p class="section-sub">Manage multiple choice questions and answers for this certification exam.</p>
				</div>
				<div class="header-actions-row">
					<button class="secondary-btn" onclick={openBatchModal}>
						<FileSpreadsheet size={15} /> Batch / Excel Upload
					</button>
					<button class="primary-btn" onclick={() => showAddModal = true}>
						<Plus size={16} /> Add Single Question
					</button>
				</div>
			</div>

			<div class="questions-list">
				{#each data.questions as question, qIdx (question.id)}
					<div class="question-card">
						<div class="q-header">
							<div class="q-title-wrap">
								<span class="q-num-badge">Q{qIdx + 1}</span>
								<h3>{question.content}</h3>
							</div>
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
							{#each question.options as option, optIdx}
								<div class="option-item {option.isCorrect ? 'correct' : ''}">
									<span class="opt-letter">{String.fromCharCode(65 + optIdx)}</span>
									{#if option.isCorrect}
										<CheckCircle2 size={16} class="correct-icon" />
									{:else}
										<Circle size={16} class="incorrect-icon" />
									{/if}
									<span class="opt-text">{option.content}</span>
								</div>
							{/each}
						</div>
					</div>
				{:else}
					<div class="empty-state">
						<FileSpreadsheet size={40} class="empty-icon" />
						<h3>No questions added yet</h3>
						<p>You can add questions individually or copy and paste an entire table directly from Excel or Google Sheets.</p>
						<div class="empty-actions">
							<button class="primary-btn" onclick={openBatchModal}>
								<FileSpreadsheet size={16} /> Batch Upload from Excel
							</button>
							<button class="secondary-btn" onclick={() => showAddModal = true}>
								<Plus size={16} /> Add Single Question
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Side Panel: Settings -->
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
					<label class="form-label" for="passingPercent">Passing Criteria (%)</label>
					<input type="number" id="passingPercent" name="passingPercent" class="form-input" min="1" max="100" value={data.cert.passingPercent} required />
				</div>

				<div class="form-group">
					<label class="form-label" for="maxAttempts">Max Student Attempts</label>
					<input type="number" id="maxAttempts" name="maxAttempts" class="form-input" min="1" value={data.cert.maxAttempts || ''} placeholder="Leave blank for unlimited" />
				</div>

				<div class="form-group">
					<label class="form-label" for="status">Publication Status</label>
					<select id="status" name="status" class="form-input" value={data.cert.status}>
						<option value="draft">Draft (Hidden from students)</option>
						<option value="published">Published & Live</option>
					</select>
				</div>

				<button type="submit" class="primary-btn full-width" disabled={isSubmitting}>
					{isSubmitting ? 'Saving...' : 'Save Settings'}
				</button>
			</form>

			{#if data.questions.length > 0}
				<div class="danger-zone-card">
					<h4>Batch Actions</h4>
					<form method="POST" action="?/deleteAllQuestions" onsubmit={(e) => { if (!confirm(`Are you sure you want to delete ALL ${data.questions.length} questions from this exam?`)) e.preventDefault(); }}>
						<button type="submit" class="btn-clear-all">
							<Trash2 size={13} /> Delete All Questions
						</button>
					</form>
				</div>
			{/if}
		</div>
	</div>
</div>

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- MODAL: BATCH / EXCEL UPLOAD                                         -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
{#if showBatchModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showBatchModal = false; }} role="presentation">
		<div class="batch-modal-card">
			<header class="batch-modal-header">
				<div class="header-titles">
					<div class="batch-tag"><FileSpreadsheet size={14} /> Batch Question Importer</div>
					<h2>Upload Questions from Excel / Spreadsheet</h2>
				</div>
				<div class="header-actions">
					<button type="button" class="btn-sample-download" onclick={downloadSampleTemplate}>
						<Download size={14} /> Download Template
					</button>
					<button class="btn-close-modal" onclick={() => showBatchModal = false}>
						<X size={18} />
					</button>
				</div>
			</header>

			<div class="batch-modal-body split-layout">
				<!-- PANEL A: Input -->
				<div class="input-panel">
					<div class="panel-header">
						<h4>1. Paste or Upload Data</h4>
						<p class="format-hint">Format: Question · Correct Answer · Wrong 1 · Wrong 2 · Wrong 3 · Explanation</p>
					</div>
					
					<textarea
						bind:value={pastedText}
						oninput={handlePasteInput}
						class="paste-textarea full-height"
						placeholder={`Question\tCorrect Answer\tWrong Answer 1\tWrong Answer 2\tWrong Answer 3\tExplanation\nWhat is DNS?\tDomain Name System\tDynamic Network Server\tData Node Storage\tDirect Network Sync\tResolves domain names to IP addresses\nWhich layer is TCP?\tTransport\tNetwork\tApplication\tData Link\tTCP is Layer 4`}
					></textarea>

					<div class="upload-bar">
						<Upload size={16} class="text-muted" />
						<span>Or upload CSV/TSV:</span>
						<input type="file" accept=".csv,.tsv,.txt" onchange={handleFileUpload} />
					</div>

					{#if batchImportError}
						<div class="alert-banner error mt-4"><AlertTriangle size={16} /> <span>{batchImportError}</span></div>
					{/if}
					{#if batchSuccessMsg}
						<div class="alert-banner success mt-4"><Check size={16} /> <span>{batchSuccessMsg}</span></div>
					{/if}
				</div>

				<!-- PANEL B: Preview Grid -->
				<div class="preview-panel">
					<div class="grid-toolbar">
						<div class="toolbar-left">
							<h4>2. Preview & Edit</h4>
							<button type="button" class="btn-grid-tool" onclick={addBlankRowToGrid}>
								<Plus size={14} /> Add Row
							</button>
							<button type="button" class="btn-grid-tool" onclick={clearAllGridRows}>
								<Trash2 size={14} /> Clear All
							</button>
						</div>
						<div class="toolbar-right">
							<span class="counter-badge ready">{validBatchCount} Ready</span>
							{#if invalidBatchCount > 0}
								<span class="counter-badge error">{invalidBatchCount} Invalid</span>
							{/if}
						</div>
					</div>

					<div class="spreadsheet-container full-height">
						<table class="spreadsheet-table">
							<thead>
								<tr>
									<th style="width: 38px;">#</th>
									<th style="min-width: 200px;">Question Text *</th>
									<th style="min-width: 160px; color: #047857;">Correct Answer *</th>
									<th style="min-width: 200px;">Wrong Answers (comma separated)</th>
									<th style="min-width: 140px;">Explanation</th>
									<th style="width: 40px;"></th>
								</tr>
							</thead>
							<tbody>
								{#each batchQuestions as row, rIdx}
									<tr class:row-invalid={!row.isValid}>
										<td class="cell-index">
											<div class="status-stack">
												{rIdx + 1}
												{#if !row.isValid}
													<AlertTriangle size={12} class="text-error" title={row.errors.join('; ')} />
												{/if}
											</div>
										</td>
										<td class="cell-input">
											<textarea
												bind:value={row.content}
												oninput={() => handleCellChange(rIdx)}
												placeholder="Type question text..."
												class="grid-cell-inp grid-textarea"
												rows="2"
											></textarea>
										</td>
										<td class="cell-input correct-bg">
											<input
												type="text"
												bind:value={row.options[0].content}
												oninput={() => handleCellChange(rIdx)}
												placeholder="Correct Answer"
												class="grid-cell-inp"
											/>
										</td>
										<td class="cell-input">
											<input
												type="text"
												value={getWrongAnswersText(row)}
												oninput={(e) => handleWrongAnswersChange(rIdx, e.currentTarget.value)}
												placeholder="Wrong 1, Wrong 2, Wrong 3"
												class="grid-cell-inp"
											/>
										</td>
										<td class="cell-input">
											<input
												type="text"
												bind:value={row.explanation}
												oninput={() => handleCellChange(rIdx)}
												placeholder="Optional explanation..."
												class="grid-cell-inp"
											/>
										</td>
										<td class="cell-actions">
											<button
												type="button"
												class="btn-row-del"
												title="Delete row"
												onclick={() => removeRowFromGrid(rIdx)}
											>
												<Trash2 size={13} />
											</button>
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			</div>

			<footer class="batch-modal-footer">
				<div class="footer-summary">
					<span>Total: <strong>{batchQuestions.length}</strong></span>
					<span class="text-emerald">• Ready to import: <strong>{validBatchCount}</strong></span>
					{#if invalidBatchCount > 0}
						<span class="text-error">• Needs correction: <strong>{invalidBatchCount}</strong></span>
					{/if}
				</div>
				<div class="footer-actions">
					<button type="button" class="action-btn" onclick={() => showBatchModal = false}>Cancel</button>
					<button
						type="button"
						class="create-btn"
						disabled={validBatchCount === 0 || isImportingBatch}
						onclick={executeBatchImport}
					>
						{#if isImportingBatch}
							<Loader2 size={14} class="spin" /> Importing {validBatchCount} Questions...
						{:else}
							<Check size={15} /> Import {validBatchCount} Questions
						{/if}
					</button>
				</div>
			</footer>
		</div>
	</div>
{/if}

<!-- ═══════════════════════════════════════════════════════════════════ -->
<!-- MODAL: ADD SINGLE QUESTION                                          -->
<!-- ═══════════════════════════════════════════════════════════════════ -->
{#if showAddModal}
	<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showAddModal = false; }} role="presentation">
		<form class="modal-content large" method="POST" action="?/addQuestion" use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				await invalidateAll();
				isSubmitting = false;
				showAddModal = false;
				newQuestionContent = '';
				singleOptCorrect = '';
				singleOptWrong1 = '';
				singleOptWrong2 = '';
				singleOptWrong3 = '';
				singleExplanation = '';
			};
		}}>
			<h3>Add Multiple Choice Question</h3>
			
			<div class="form-group">
				<label class="form-label" for="singleQContent">Question Text *</label>
				<textarea id="singleQContent" class="form-input" placeholder="What is the primary purpose of..." required bind:value={newQuestionContent} name="content"></textarea>
			</div>

			<div class="form-group">
				<label class="form-label" for="singleOptCorrect" style="color: #047857;">Correct Answer *</label>
				<input type="text" id="singleOptCorrect" name="opt_0" class="form-input" placeholder="The correct answer goes here..." style="border-color: #a7f3d0; background: #ecfdf5;" bind:value={singleOptCorrect} required />
				<p style="font-size: 0.75rem; color: var(--text-muted); margin-top: 4px;">This is the only correct answer. Options will be shuffled for students automatically.</p>
			</div>

			<div class="form-group">
				<label class="form-label">Wrong Answers *</label>
				<div class="options-stack" style="display: flex; flex-direction: column; gap: 8px;">
					<input type="text" name="opt_1" class="form-input" placeholder="Wrong Answer 1 (Required)" bind:value={singleOptWrong1} required />
					<input type="text" name="opt_2" class="form-input" placeholder="Wrong Answer 2 (Optional)" bind:value={singleOptWrong2} />
					<input type="text" name="opt_3" class="form-input" placeholder="Wrong Answer 3 (Optional)" bind:value={singleOptWrong3} />
				</div>
			</div>
			
			<div class="form-group">
				<label class="form-label" for="singleExplanation">Explanation (Optional)</label>
				<input type="text" id="singleExplanation" name="explanation" class="form-input" placeholder="Why is this correct?" bind:value={singleExplanation} />
			</div>

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
		font-size: 0.85rem;
		font-weight: 500;
	}
	.back-btn:hover {
		color: var(--text-primary);
	}
	.divider {
		width: 1px;
		height: 20px;
		background: var(--border);
	}
	.course-title {
		font-weight: 600;
		font-size: 0.95rem;
		color: var(--text-primary);
	}
	.btn-batch-header {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 6px 12px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
	}
	.btn-batch-header:hover {
		background: var(--text-primary);
		color: var(--bg);
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
		align-items: flex-start;
		margin-bottom: 1.5rem;
		gap: 1rem;
	}
	.section-header h2 {
		font-size: 1.25rem;
		font-weight: 700;
		margin: 0;
	}
	.section-sub {
		font-size: 0.82rem;
		color: var(--text-secondary);
		margin: 4px 0 0;
	}
	.header-actions-row {
		display: flex;
		gap: 8px;
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
		padding: 1.25rem 1.5rem;
	}
	.q-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 1rem;
		gap: 12px;
	}
	.q-title-wrap {
		display: flex;
		align-items: flex-start;
		gap: 10px;
	}
	.q-num-badge {
		font-size: 0.72rem;
		font-weight: 700;
		background: var(--border);
		color: var(--text-primary);
		padding: 2px 8px;
		border-radius: 4px;
		flex-shrink: 0;
		margin-top: 2px;
	}
	.q-header h3 {
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
		margin: 0;
	}

	.options-list {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.option-item {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 8px 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.85rem;
	}
	.opt-letter {
		font-size: 0.75rem;
		font-weight: 700;
		color: var(--text-muted);
		width: 16px;
	}
	.opt-text {
		flex: 1;
	}
	.option-item.correct {
		border-color: #10b981;
		background: rgba(16, 185, 129, 0.05);
	}
	.correct-icon { color: #10b981; }
	.incorrect-icon { color: var(--text-muted); }
	.correct-pill {
		font-size: 0.65rem;
		font-weight: 700;
		text-transform: uppercase;
		background: #10b981;
		color: #fff;
		padding: 2px 6px;
		border-radius: 4px;
	}

	.empty-state {
		text-align: center;
		padding: 3rem 1.5rem;
		background: var(--bg-subtle);
		border: 1.5px dashed var(--border);
		border-radius: 12px;
	}
	:global(.empty-icon) {
		color: var(--text-muted);
		margin-bottom: 0.75rem;
	}
	.empty-state h3 {
		font-size: 1.1rem;
		font-weight: 700;
		margin: 0 0 0.5rem;
	}
	.empty-state p {
		font-size: 0.85rem;
		color: var(--text-secondary);
		max-width: 440px;
		margin: 0 auto 1.5rem;
	}
	.empty-actions {
		display: flex;
		justify-content: center;
		gap: 10px;
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

	.danger-zone-card {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.25rem 1.5rem;
		margin-top: 1rem;
	}
	.danger-zone-card h4 {
		font-size: 0.85rem;
		font-weight: 700;
		margin: 0 0 0.75rem;
	}
	.btn-clear-all {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid rgba(239, 68, 68, 0.3);
		color: #ef4444;
		padding: 6px 12px;
		border-radius: 6px;
		font-size: 0.75rem;
		font-weight: 600;
		cursor: pointer;
		width: 100%;
		justify-content: center;
	}
	.btn-clear-all:hover {
		background: rgba(239, 68, 68, 0.08);
	}

	.form-group { margin-bottom: 1.25rem; }
	.form-label {
		display: block;
		font-size: 0.82rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 6px;
	}
	.form-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		color: var(--text-primary);
		font-size: 0.88rem;
	}

	.primary-btn {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 9px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.primary-btn.full-width { width: 100%; }
	.secondary-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border);
		padding: 8px 14px;
		border-radius: 8px;
		font-weight: 600;
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
	.text-error { color: #ef4444; }

	/* ── BATCH MODAL STYLING ────────────────────────────────────────── */
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0, 0, 0, 0.65);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 1000;
		padding: 20px;
		backdrop-filter: blur(4px);
	}

	.batch-modal-card {
		background: var(--bg-surface);
		border: 1px solid var(--border);
		border-radius: 14px;
		width: 100%;
		max-width: 1100px;
		height: 90vh;
		max-height: 850px;
		display: flex;
		flex-direction: column;
		box-shadow: 0 24px 64px rgba(0, 0, 0, 0.4);
		overflow: hidden;
	}

	.batch-modal-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		padding: 20px 24px 16px;
		border-bottom: 1px solid var(--border);
	}
	.batch-tag {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.6875rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.08em;
		color: var(--text-muted);
		margin-bottom: 4px;
	}
	.batch-modal-header h2 {
		font-size: 1.15rem;
		font-weight: 700;
		margin: 0;
	}
	.btn-close-modal {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}
	.btn-close-modal:hover { color: var(--text-primary); }

	.batch-tabs-bar {
		display: flex;
		gap: 8px;
		padding: 10px 24px;
		background: var(--bg);
		border-bottom: 1px solid var(--border);
	}
	.batch-tab-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: 1px solid transparent;
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-secondary);
		cursor: pointer;
		transition: all 0.12s;
	}
	.batch-tab-btn.active {
		background: var(--bg-surface);
		border-color: var(--border);
		color: var(--text-primary);
	}

	.batch-modal-body {
		flex: 1;
		overflow-y: auto;
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}

	.alert-banner {
		display: flex;
		align-items: center;
		gap: 8px;
		padding: 10px 14px;
		border-radius: 8px;
		font-size: 0.82rem;
		font-weight: 500;
	}
	.alert-banner.error {
		background: #fef2f2;
		color: #b91c1c;
		border: 1px solid #fecaca;
	}
	.alert-banner.success {
		background: #ecfdf5;
		color: #065f46;
		border: 1px solid #a7f3d0;
	}

	.split-layout {
		display: grid;
		grid-template-columns: 350px 1fr;
		gap: 20px;
		height: 100%;
		overflow: hidden;
		padding: 20px 24px;
	}
	
	.input-panel, .preview-panel {
		display: flex;
		flex-direction: column;
		height: 100%;
		overflow: hidden;
	}
	
	.panel-header {
		margin-bottom: 12px;
	}
	.panel-header h4 {
		margin: 0 0 4px 0;
		font-size: 0.95rem;
		font-weight: 700;
	}
	.format-hint {
		margin: 0;
		font-size: 0.75rem;
		color: var(--text-secondary);
	}
	
	.full-height {
		flex: 1;
		min-height: 0;
	}
	
	.upload-bar {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-top: 12px;
		padding: 10px;
		background: var(--bg-surface);
		border: 1px dashed var(--border);
		border-radius: 8px;
		font-size: 0.8rem;
		font-weight: 500;
	}
	
	.correct-bg {
		background: rgba(16, 185, 129, 0.05);
	}
	
	.grid-textarea {
		resize: none;
		font-family: inherit;
		line-height: 1.4;
	}
	
	.status-stack {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 4px;
	}

	/* Paste Tab */
	.instruction-box {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 10px;
		gap: 16px;
	}
	.instruction-box h4 {
		font-size: 0.88rem;
		font-weight: 700;
		margin: 0 0 4px;
	}
	.instruction-box p {
		font-size: 0.8rem;
		color: var(--text-secondary);
		margin: 0 0 10px;
	}
	.format-chips {
		display: flex;
		flex-wrap: wrap;
		gap: 6px;
	}
	.chip {
		font-size: 0.7rem;
		font-weight: 600;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 2px 8px;
		border-radius: 4px;
		color: var(--text-secondary);
	}
	.chip.highlight {
		background: #ecfdf5;
		border-color: #a7f3d0;
		color: #047857;
	}
	.btn-sample-download {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--bg-surface);
		border: 1px solid var(--border);
		padding: 8px 12px;
		border-radius: 6px;
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		white-space: nowrap;
	}
	.btn-sample-download:hover {
		background: var(--text-primary);
		color: var(--bg);
	}

	.paste-input-wrap {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.field-label {
		font-size: 0.8rem;
		font-weight: 700;
		color: var(--text-primary);
	}
	.paste-textarea {
		width: 100%;
		height: 280px;
		background: var(--bg);
		border: 1.5px solid var(--border);
		border-radius: 8px;
		padding: 12px;
		font-family: monospace;
		font-size: 0.82rem;
		color: var(--text-primary);
		line-height: 1.5;
		resize: vertical;
		white-space: pre;
	}
	.paste-actions-row {
		display: flex;
		justify-content: flex-end;
	}

	/* Spreadsheet Grid Tab */
	.grid-toolbar {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding-bottom: 8px;
	}
	.toolbar-left {
		display: flex;
		gap: 8px;
	}
	.btn-grid-tool {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 5px 10px;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
	}
	.btn-grid-tool:hover {
		background: var(--text-primary);
		color: var(--bg);
	}
	.toolbar-right {
		display: flex;
		gap: 6px;
	}
	.counter-badge {
		font-size: 0.72rem;
		font-weight: 700;
		padding: 3px 8px;
		border-radius: 4px;
	}
	.counter-badge.ready { background: #ecfdf5; color: #047857; }
	.counter-badge.error { background: #fef2f2; color: #b91c1c; }

	.spreadsheet-container {
		flex: 1;
		overflow: auto;
		border: 1px solid var(--border);
		border-radius: 8px;
		background: var(--bg);
		max-height: 420px;
	}
	.spreadsheet-table {
		width: 100%;
		border-collapse: collapse;
		font-size: 0.8rem;
	}
	.spreadsheet-table th {
		position: sticky;
		top: 0;
		background: var(--bg-subtle);
		border-bottom: 1.5px solid var(--border);
		border-right: 1px solid var(--border);
		padding: 8px 10px;
		font-weight: 700;
		text-align: left;
		color: var(--text-secondary);
		font-size: 0.72rem;
		text-transform: uppercase;
		letter-spacing: 0.04em;
		z-index: 2;
	}
	.spreadsheet-table td {
		border-bottom: 1px solid var(--border);
		border-right: 1px solid var(--border);
		padding: 4px;
		vertical-align: middle;
	}
	.cell-index {
		text-align: center;
		font-weight: 700;
		color: var(--text-muted);
		font-size: 0.72rem;
	}
	.status-pill {
		display: inline-flex;
		align-items: center;
		gap: 3px;
		font-size: 0.68rem;
		font-weight: 700;
		padding: 2px 6px;
		border-radius: 4px;
	}
	.status-pill.valid { background: #ecfdf5; color: #047857; }
	.status-pill.invalid { background: #fef2f2; color: #b91c1c; }
	
	.grid-cell-inp {
		width: 100%;
		background: transparent;
		border: 1px solid transparent;
		padding: 4px 6px;
		border-radius: 4px;
		font-size: 0.8rem;
		color: var(--text-primary);
	}
	.grid-cell-inp:focus {
		background: var(--bg-surface);
		border-color: var(--text-primary);
		outline: none;
	}
	.correct-pills-row {
		display: flex;
		gap: 2px;
	}
	.correct-pill-btn {
		width: 24px;
		height: 24px;
		border-radius: 4px;
		border: 1px solid var(--border);
		background: var(--bg-surface);
		font-size: 0.72rem;
		font-weight: 700;
		color: var(--text-secondary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.correct-pill-btn.selected {
		background: #10b981;
		color: #fff;
		border-color: #10b981;
	}
	.btn-row-del {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}
	.btn-row-del:hover { color: #ef4444; }

	/* File Tab */
	.file-tab-content {
		display: flex;
		flex-direction: column;
		gap: 20px;
		align-items: center;
		padding: 2rem 0;
	}
	.upload-dropzone {
		border: 2px dashed var(--border);
		border-radius: 12px;
		padding: 3rem 2rem;
		text-align: center;
		width: 100%;
		max-width: 500px;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}
	:global(.drop-icon) { color: var(--text-muted); margin-bottom: 6px; }
	.file-input-hidden { display: none; }
	.template-download-box {
		text-align: center;
		font-size: 0.82rem;
		color: var(--text-secondary);
	}

	.batch-modal-footer {
		display: flex;
		justify-content: space-between;
		align-items: center;
		padding: 16px 24px;
		border-top: 1px solid var(--border);
		background: var(--bg);
	}
	.footer-summary {
		font-size: 0.82rem;
		color: var(--text-secondary);
		display: flex;
		gap: 8px;
	}
	.footer-actions {
		display: flex;
		gap: 10px;
	}
	:global(.spin) { animation: spin 1s linear infinite; }
	@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }

	/* Single Modal */
	.modal-content {
		background: var(--bg);
		padding: 2rem;
		border-radius: 16px;
		width: 100%;
		max-width: 450px;
		max-height: 90vh;
		overflow-y: auto;
	}
	.modal-content.large { max-width: 600px; }
	.modal-content h3 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
	}
	.option-row {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 10px;
	}
	.radio-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 2px;
	}
	.radio-btn.active { color: #10b981; }
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 10px;
		margin-top: 1.5rem;
	}
	.action-btn {
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-primary);
		padding: 9px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.create-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 9px 16px;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.create-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.status-badge {
		padding: 3px 8px;
		border-radius: 20px;
		font-size: 0.7rem;
		font-weight: 700;
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
