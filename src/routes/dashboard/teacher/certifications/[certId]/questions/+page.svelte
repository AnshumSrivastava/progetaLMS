<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { 
		ArrowLeft, 
		Plus, 
		Trash2, 
		ClipboardPaste, 
		Save, 
		AlertTriangle, 
		Check,
		Loader2,
		X
	} from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';
	import { parseQuestionBatch } from '$lib/shared/parsers/questionBatchParser';
	import { onMount } from 'svelte';

	let { data } = $props<{ data: PageData }>();

	type EditorRow = {
		id: string; // Keep track for UI keys
		content: string;
		opt0: string;
		opt1: string;
		opt2: string;
		opt3: string;
		explanation: string;
	};

	let rows = $state<EditorRow[]>([]);
	let isSaving = $state(false);
	let saveError = $state('');
	let saveSuccess = $state('');

	let isSubmittingSettings = $state(false);

	let showPasteArea = $state(false);
	let pastedText = $state('');
	let pasteError = $state('');

	onMount(() => {
		loadFromData();
	});

	function loadFromData() {
		rows = data.questions.map(q => {
			const wrongOpts = q.options.filter(o => !o.isCorrect);
			return {
				id: Math.random().toString(36).substring(7),
				content: q.content,
				opt0: q.options.find(o => o.isCorrect)?.content || '',
				opt1: wrongOpts[0]?.content || '',
				opt2: wrongOpts[1]?.content || '',
				opt3: wrongOpts[2]?.content || '',
				explanation: q.explanation || ''
			};
		});

		if (rows.length === 0) {
			addBlankRow();
		}
	}

	function addBlankRow() {
		rows = [...rows, { 
			id: Math.random().toString(36).substring(7),
			content: '', opt0: '', opt1: '', opt2: '', opt3: '', explanation: '' 
		}];
	}

	function removeRow(index: number) {
		rows = rows.filter((_, i) => i !== index);
		if (rows.length === 0) addBlankRow();
	}

	function parsePastedInput() {
		pasteError = '';
		if (!pastedText.trim()) {
			pasteError = 'Please paste questions text before parsing.';
			return;
		}

		const result = parseQuestionBatch(pastedText);
		if (result.questions.length === 0) {
			pasteError = 'Could not detect any questions. Check the format.';
			return;
		}

		const newRows = result.questions.map(q => {
			const wrongOpts = q.options.filter(o => !o.isCorrect);
			return {
				id: Math.random().toString(36).substring(7),
				content: q.content,
				opt0: q.options.find(o => o.isCorrect)?.content || '',
				opt1: wrongOpts[0]?.content || '',
				opt2: wrongOpts[1]?.content || '',
				opt3: wrongOpts[2]?.content || '',
				explanation: q.explanation || ''
			};
		});

		rows = [...rows, ...newRows];
		pastedText = '';
		showPasteArea = false;
	}

	let validCount = $derived(rows.filter(r => r.content.trim() && r.opt0.trim() && r.opt1.trim()).length);

	function autosize(node: HTMLTextAreaElement) {
		function resize() {
			node.style.height = 'auto';
			node.style.height = node.scrollHeight + 'px';
		}
		node.addEventListener('input', resize);
		setTimeout(resize, 0);
		return {
			destroy() {
				node.removeEventListener('input', resize);
			}
		}
	}
</script>

<svelte:head>
	<title>Edit Certification Questions — {APP_NAME} Instructor</title>
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
			<button class="btn-paste-toggle" onclick={() => showPasteArea = !showPasteArea}>
				<ClipboardPaste size={15} /> Paste from Excel
			</button>
			<button class="btn-add-row" onclick={addBlankRow}>
				<Plus size={15} /> Add Row
			</button>
			<form method="POST" action="?/saveAll" use:enhance={({ formData, cancel }) => {
				const validRows = rows.filter(r => r.content.trim() && r.opt0.trim() && r.opt1.trim());
				if (validRows.length === 0) {
					saveError = 'No valid questions to save. Ensure Question, Correct Answer, and Wrong 1 are filled.';
					cancel();
					return;
				}
				
				formData.append('questions', JSON.stringify(validRows));
				isSaving = true;
				saveError = '';
				saveSuccess = '';

				return async ({ result, update }) => {
					isSaving = false;
					if (result.type === 'success') {
						saveSuccess = 'Saved all questions successfully!';
						setTimeout(() => saveSuccess = '', 3000);
						await update();
					} else {
						saveError = 'Failed to save questions. Please try again.';
					}
				};
			}}>
				<button type="submit" class="btn-save-all" disabled={isSaving || validCount === 0}>
					{#if isSaving}
						<Loader2 size={15} class="spin" /> Saving...
					{:else}
						<Save size={15} /> Save All ({validCount})
					{/if}
				</button>
			</form>
		</div>
	</header>

	<div class="workspace-content">
		
		{#if showPasteArea}
			<div class="paste-panel">
				<div class="paste-header">
					<h4>Paste from Excel / Spreadsheet</h4>
					<p class="format-hint">Columns: Question · Correct Answer · Wrong 1 · Wrong 2 · Wrong 3 · Explanation</p>
					<button class="btn-close-paste" onclick={() => showPasteArea = false}><X size={16} /></button>
				</div>
				<textarea
					bind:value={pastedText}
					class="paste-textarea"
					placeholder="What is DNS?	Domain Name System	Dynamic Network Server	Data Node Storage	Direct Network Sync	Resolves domain names"
				></textarea>
				<div class="paste-actions">
					<button class="primary-btn" onclick={parsePastedInput}>Parse & Add to Table</button>
					{#if pasteError}
						<span class="text-error"><AlertTriangle size={14} /> {pasteError}</span>
					{/if}
				</div>
			</div>
		{/if}

		{#if saveError}
			<div class="alert-banner error mb-4"><AlertTriangle size={16} /> <span>{saveError}</span></div>
		{/if}
		{#if saveSuccess}
			<div class="alert-banner success mb-4"><Check size={16} /> <span>{saveSuccess}</span></div>
		{/if}

		<div class="table-container">
			<table class="questions-table">
				<thead>
					<tr>
						<th class="col-num">#</th>
						<th class="col-question">Question *</th>
						<th class="col-correct">Correct Answer *</th>
						<th class="col-wrong">Wrong 1 *</th>
						<th class="col-wrong">Wrong 2</th>
						<th class="col-wrong">Wrong 3</th>
						<th class="col-expl">Explanation</th>
						<th class="col-actions"></th>
					</tr>
				</thead>
				<tbody>
					{#each rows as row, rIdx (row.id)}
						<tr>
							<td class="cell-num">{rIdx + 1}</td>
							<td class="cell-input">
								<textarea use:autosize bind:value={row.content} placeholder="Type question..." class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-input correct-bg">
								<textarea use:autosize bind:value={row.opt0} placeholder="Correct answer" class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-input">
								<textarea use:autosize bind:value={row.opt1} placeholder="Wrong 1" class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-input">
								<textarea use:autosize bind:value={row.opt2} placeholder="Wrong 2 (optional)" class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-input">
								<textarea use:autosize bind:value={row.opt3} placeholder="Wrong 3 (optional)" class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-input">
								<textarea use:autosize bind:value={row.explanation} placeholder="Explanation..." class="grid-cell-inp" rows="1"></textarea>
							</td>
							<td class="cell-actions">
								<button type="button" class="btn-row-del" onclick={() => removeRow(rIdx)} title="Delete row">
									<Trash2 size={14} />
								</button>
							</td>
						</tr>
					{/each}
				</tbody>
			</table>
			<div class="table-footer">
				<button class="btn-add-row-bottom" onclick={addBlankRow}>+ Add Row</button>
			</div>
		</div>

		<div class="settings-section">
			<h3>Exam Settings</h3>
			<form class="settings-form" method="POST" action="?/updateSettings" use:enhance={() => {
				isSubmittingSettings = true;
				return async ({ update }) => {
					await update();
					await invalidateAll();
					isSubmittingSettings = false;
				};
			}}>
				<div class="settings-row">
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
					
					<div class="form-group settings-actions">
						<button type="submit" class="primary-btn" disabled={isSubmittingSettings}>
							{isSubmittingSettings ? 'Saving...' : 'Save Settings'}
						</button>
					</div>
				</div>
			</form>
		</div>
	</div>
</div>

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
	.status-badge {
		font-size: 0.7rem;
		padding: 2px 8px;
		border-radius: 12px;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
	}
	.status-badge.draft {
		background: var(--bg-subtle);
		color: var(--text-secondary);
		border: 1px solid var(--border);
	}
	.status-badge.published {
		background: #ecfdf5;
		color: #047857;
		border: 1px solid #a7f3d0;
	}
	.header-right {
		display: flex;
		align-items: center;
		gap: 8px;
	}
	
	.btn-paste-toggle, .btn-add-row, .btn-save-all {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 6px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		font-weight: 600;
		cursor: pointer;
		border: none;
		transition: all 0.2s;
	}
	
	.btn-paste-toggle {
		background: var(--bg-subtle);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}
	.btn-paste-toggle:hover {
		background: var(--border);
	}
	
	.btn-add-row {
		background: var(--bg-subtle);
		color: var(--text-primary);
		border: 1px solid var(--border);
	}
	.btn-add-row:hover {
		background: var(--border);
	}
	
	.btn-save-all {
		background: var(--primary);
		color: white;
	}
	.btn-save-all:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.btn-save-all:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.workspace-content {
		padding: 1.5rem;
		max-width: 1600px;
		margin: 0 auto;
		width: 100%;
	}
	
	.paste-panel {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1.5rem;
		margin-bottom: 1.5rem;
		position: relative;
	}
	.paste-header {
		display: flex;
		flex-direction: column;
		gap: 4px;
		margin-bottom: 1rem;
	}
	.paste-header h4 {
		margin: 0;
		font-size: 1rem;
		color: var(--text-primary);
	}
	.format-hint {
		margin: 0;
		font-size: 0.8rem;
		color: var(--text-muted);
	}
	.btn-close-paste {
		position: absolute;
		top: 1rem;
		right: 1rem;
		background: transparent;
		border: none;
		color: var(--text-secondary);
		cursor: pointer;
		padding: 4px;
		border-radius: 4px;
	}
	.btn-close-paste:hover {
		background: var(--border);
		color: var(--text-primary);
	}
	.paste-textarea {
		width: 100%;
		height: 120px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		padding: 1rem;
		font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
		font-size: 0.85rem;
		resize: vertical;
		margin-bottom: 1rem;
	}
	.paste-actions {
		display: flex;
		align-items: center;
		gap: 1rem;
	}
	
	.table-container {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		overflow-x: auto;
		margin-bottom: 2rem;
		box-shadow: 0 1px 3px rgba(0,0,0,0.05);
	}
	
	.questions-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
		min-width: 1000px;
	}
	.questions-table th {
		background: var(--bg-subtle);
		padding: 12px 16px;
		font-size: 0.75rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.5px;
		color: var(--text-secondary);
		border-bottom: 1px solid var(--border);
	}
	.questions-table td {
		padding: 0;
		border-bottom: 1px solid var(--border);
		vertical-align: top;
	}
	
	.col-num { width: 40px; text-align: center; }
	.col-question { min-width: 250px; }
	.col-correct { min-width: 200px; }
	.col-wrong { min-width: 180px; }
	.col-expl { min-width: 180px; }
	.col-actions { width: 50px; text-align: center; }
	
	.cell-num {
		padding: 12px 0;
		text-align: center;
		font-size: 0.85rem;
		color: var(--text-muted);
		font-weight: 500;
	}
	
	.cell-input {
		position: relative;
	}
	.cell-input.correct-bg {
		background: #f0fdf4; /* subtle green */
	}
	
	.grid-cell-inp {
		width: 100%;
		background: transparent;
		border: none;
		padding: 12px 16px;
		font-size: 0.9rem;
		color: var(--text-primary);
		font-family: inherit;
		resize: none;
		overflow: hidden;
		min-height: 44px;
		line-height: 1.4;
		white-space: pre-wrap;
	}
	.grid-cell-inp:focus {
		outline: none;
		background: rgba(0,0,0,0.02);
	}
	
	.cell-actions {
		padding: 12px 0;
		text-align: center;
	}
	.btn-row-del {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 4px;
		transition: all 0.2s;
	}
	.btn-row-del:hover {
		background: #fee2e2;
		color: #ef4444;
	}
	
	.table-footer {
		padding: 12px 16px;
		background: var(--bg-subtle);
		border-top: 1px solid var(--border);
	}
	.btn-add-row-bottom {
		background: transparent;
		border: none;
		color: var(--text-secondary);
		font-size: 0.85rem;
		font-weight: 500;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.btn-add-row-bottom:hover {
		color: var(--text-primary);
	}
	
	.settings-section {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 1.5rem;
	}
	.settings-section h3 {
		margin: 0 0 1.5rem 0;
		font-size: 1.1rem;
		color: var(--text-primary);
	}
	.settings-row {
		display: flex;
		gap: 1.5rem;
		align-items: flex-end;
		flex-wrap: wrap;
	}
	.form-group {
		flex: 1;
		min-width: 200px;
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.form-label {
		font-size: 0.85rem;
		font-weight: 500;
		color: var(--text-secondary);
	}
	.form-input {
		width: 100%;
		padding: 8px 12px;
		border: 1px solid var(--border);
		border-radius: 6px;
		background: var(--bg);
		color: var(--text-primary);
		font-size: 0.9rem;
	}
	.settings-actions {
		flex: 0 0 auto;
	}
	.primary-btn {
		background: var(--primary);
		color: white;
		border: none;
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 500;
		font-size: 0.9rem;
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
	}
	.primary-btn:hover:not(:disabled) {
		filter: brightness(1.1);
	}
	.primary-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
	
	.alert-banner {
		padding: 12px 16px;
		border-radius: 6px;
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.9rem;
		font-weight: 500;
	}
	.alert-banner.error {
		background: #fef2f2;
		border: 1px solid #fecaca;
		color: #ef4444;
	}
	.alert-banner.success {
		background: #f0fdf4;
		border: 1px solid #bbf7d0;
		color: #10b981;
	}
	.spin {
		animation: spin 1s linear infinite;
	}
	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}
	.mb-4 { margin-bottom: 1rem; }
	.text-error { color: #ef4444; }
</style>
