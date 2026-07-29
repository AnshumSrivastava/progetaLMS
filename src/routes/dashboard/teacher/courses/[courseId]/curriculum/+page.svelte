<script lang="ts">
	import { Plus, GripVertical, FileText, PlaySquare, CheckSquare, Presentation, Edit2, Trash2 } from 'lucide-svelte';

	let { data, form } = $props();

	// Initialize from DB or use empty if not set
	let modules = $state(data.course?.metadata?.curriculum || []);
	
	function addModule() {
		modules = [...modules, { id: 'm_' + Math.random().toString(36).substr(2, 9), title: 'New Module', lessons: [] }];
	}
	
	function addLesson(modIndex) {
		const newLesson = { id: 'l_' + Math.random().toString(36).substr(2, 9), title: 'New Lesson', type: 'video', icon: PlaySquare };
		modules[modIndex].lessons = [...modules[modIndex].lessons, newLesson];
		modules = [...modules];
	}
</script>

<svelte:head>
	<title>Curriculum Builder</title>
</svelte:head>

<div class="workspace-header">
	<div>
		<h1>Curriculum</h1>
		<p>Organize your course into modules and lessons.</p>
	</div>
	<div style="display: flex; gap: 10px;">
		<button class="secondary-btn" onclick={addModule}>
			<Plus size={16} /> Add Module
		</button>
		<form method="POST" action="?/save">
			<input type="hidden" name="curriculum" value={JSON.stringify(modules)} />
			<button class="primary-btn" type="submit">Save Curriculum</button>
		</form>
	</div>
</div>

<div class="curriculum-builder">
	{#each modules as mod}
		<div class="module-card">
			<div class="module-header">
				<div class="drag-handle"><GripVertical size={16} /></div>
				<h2>{mod.title}</h2>
				<div class="module-actions">
					<button class="icon-btn" title="Edit Title"><Edit2 size={14} /></button>
					<button class="icon-btn text-error" title="Delete Module" onclick={() => { modules = modules.filter(m => m.id !== mod.id); }}><Trash2 size={14} /></button>
				</div>
			</div>

			<div class="lesson-list">
				{#each mod.lessons as lesson}
					<a href="/dashboard/teacher/courses/{data.course.id}/editor/{lesson.type}?lessonId={lesson.id}" class="lesson-item">
						<div class="drag-handle"><GripVertical size={14} /></div>
						<div class="lesson-icon">
							{#if lesson.type === 'video'}<PlaySquare size={16} />{:else if lesson.type === 'reading'}<FileText size={16} />{:else if lesson.type === 'slides'}<Presentation size={16} />{:else}<CheckSquare size={16} />{/if}
						</div>
						<span class="lesson-title">{lesson.title}</span>
						<div class="lesson-type-badge">{lesson.type}</div>
					</a>
				{/each}
				
				<button class="add-lesson-btn" onclick={() => addLesson(modules.indexOf(mod))}>
					<Plus size={14} /> Add Lesson
				</button>
			</div>
		</div>
	{/each}
</div>

<style>
	.workspace-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2rem;
	}
	.workspace-header h1 {
		font-size: 1.5rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}
	.workspace-header p {
		color: var(--text-muted);
		font-size: 0.95rem;
	}

	.primary-btn {
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
	.primary-btn:hover {
		opacity: 0.9;
	}

	.secondary-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		color: var(--text-primary);
		border: 1px solid var(--border);
		padding: 8px 16px;
		border-radius: 6px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.secondary-btn:hover {
		background: var(--bg-elevated);
	}

	.curriculum-builder {
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		max-width: 800px;
	}

	.module-card {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.module-header {
		display: flex;
		align-items: center;
		padding: 1rem;
		background: var(--bg-elevated);
		border-bottom: 1px solid var(--border);
	}
	.drag-handle {
		color: var(--text-muted);
		cursor: grab;
		padding: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.drag-handle:hover {
		color: var(--text-primary);
	}
	.module-header h2 {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-left: 8px;
		flex: 1;
	}
	.module-actions {
		display: flex;
		gap: 4px;
	}

	.icon-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 4px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.icon-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}
	.icon-btn.text-error:hover {
		color: #ef4444;
	}

	.lesson-list {
		padding: 1rem;
		display: flex;
		flex-direction: column;
		gap: 8px;
	}

	.lesson-item {
		display: flex;
		align-items: center;
		padding: 10px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		text-decoration: none;
		transition: all 0.2s;
	}
	.lesson-item:hover {
		border-color: var(--border-strong);
		box-shadow: 0 2px 4px rgba(0,0,0,0.02);
	}
	.lesson-icon {
		margin-left: 8px;
		margin-right: 12px;
		color: var(--accent);
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.lesson-title {
		font-weight: 500;
		color: var(--text-primary);
		font-size: 0.9rem;
		flex: 1;
	}
	.lesson-type-badge {
		font-size: 0.7rem;
		font-weight: 600;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--bg-subtle);
		color: var(--text-muted);
		padding: 4px 8px;
		border-radius: 4px;
	}

	.add-lesson-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		padding: 10px;
		background: transparent;
		border: 1px dashed var(--border-strong);
		border-radius: 8px;
		color: var(--text-secondary);
		font-weight: 500;
		font-size: 0.85rem;
		cursor: pointer;
		margin-top: 4px;
		transition: all 0.2s;
	}
	.add-lesson-btn:hover {
		border-color: var(--accent);
		color: var(--accent);
		background: var(--accent-muted);
	}
</style>
