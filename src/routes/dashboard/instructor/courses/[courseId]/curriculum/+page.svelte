<script lang="ts">
	import { Plus, GripVertical, FileText, PlaySquare, CheckSquare, Presentation, Edit2, Trash2 } from 'lucide-svelte';

	// Mock curriculum structure
	let modules = [
		{
			id: 'm1',
			title: 'Module 1: Threat Landscape',
			lessons: [
				{ id: 'l1', title: 'Introduction to Cybersecurity', type: 'video', icon: PlaySquare },
				{ id: 'l2', title: 'Common Attack Vectors', type: 'reading', icon: FileText },
				{ id: 'l3', title: 'Threat Actors and Motivations', type: 'slides', icon: Presentation },
				{ id: 'l4', title: 'Module 1 Quiz', type: 'quiz', icon: CheckSquare },
			]
		},
		{
			id: 'm2',
			title: 'Module 2: Network Defense',
			lessons: [
				{ id: 'l5', title: 'Firewalls and IDS/IPS', type: 'video', icon: PlaySquare },
				{ id: 'l6', title: 'Network Segmentation', type: 'reading', icon: FileText },
			]
		}
	];
</script>

<svelte:head>
	<title>Curriculum Builder</title>
</svelte:head>

<div class="workspace-header">
	<div>
		<h1>Curriculum</h1>
		<p>Organize your course into modules and lessons.</p>
	</div>
	<button class="primary-btn">
		<Plus size={16} /> Add Module
	</button>
</div>

<div class="curriculum-builder">
	{#each modules as mod}
		<div class="module-card">
			<div class="module-header">
				<div class="drag-handle"><GripVertical size={16} /></div>
				<h2>{mod.title}</h2>
				<div class="module-actions">
					<button class="icon-btn" title="Edit Title"><Edit2 size={14} /></button>
					<button class="icon-btn text-error" title="Delete Module"><Trash2 size={14} /></button>
				</div>
			</div>

			<div class="lesson-list">
				{#each mod.lessons as lesson}
					<a href="/dashboard/instructor/courses/demo-course/editor/{lesson.type}" class="lesson-item">
						<div class="drag-handle"><GripVertical size={14} /></div>
						<div class="lesson-icon">
							<lesson.icon size={16} />
						</div>
						<span class="lesson-title">{lesson.title}</span>
						<div class="lesson-type-badge">{lesson.type}</div>
					</a>
				{/each}
				
				<button class="add-lesson-btn">
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
