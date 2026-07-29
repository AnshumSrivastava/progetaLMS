<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { BookOpen, Search, Filter, MoreHorizontal, Edit, Tag, Power } from 'lucide-svelte';
	import type { PageData } from './$types';
	import { enhance } from '$app/forms';
	import { invalidateAll } from '$app/navigation';

	let { data } = $props<{ data: PageData }>();

	let showCreateModal = $state(false);
	let showPriceModal = $state(false);
	let selectedCourseId = $state('');
	let selectedCoursePrice = $state(0);
	let selectedCourseCurrency = $state('INR');
	let isSubmitting = $state(false);
</script>

<svelte:head>
	<title>Courses — {APP_NAME} Instructor</title>
</svelte:head>

<div class="page-content">
	<header class="page-header">
		<div>
			<h1 class="page-title">Courses</h1>
			<p class="page-subtitle">Manage your curriculum, edit pricing, and publish content.</p>
		</div>
		<button class="create-btn" onclick={() => showCreateModal = true}>
			New Course
		</button>
	</header>

	{#if showCreateModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showCreateModal = false; }}>
			<form class="modal-content" method="POST" action="?/createCourse" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					await invalidateAll();
					isSubmitting = false;
					showCreateModal = false;
				};
			}}>
				<h3>Create New Course</h3>
				<p>Enter a title to start drafting your new curriculum.</p>
				<input type="text" name="title" class="modal-input" placeholder="e.g. Advanced Cybersecurity" required />
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showCreateModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Creating...' : 'Create'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	{#if showPriceModal}
		<div class="modal-overlay" onclick={(e) => { if (e.target === e.currentTarget) showPriceModal = false; }}>
			<form class="modal-content" method="POST" action="?/updatePrice" use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					await update();
					isSubmitting = false;
					showPriceModal = false;
				};
			}}>
				<h3>Edit Course Price</h3>
				<p>Set the price for this course. Minimum is 0.</p>
				<input type="hidden" name="courseId" value={selectedCourseId} />
				<div style="display: flex; gap: 8px; margin-bottom: 1.5rem;">
					<select name="currency" class="modal-input" style="width: 100px; margin-bottom: 0;" bind:value={selectedCourseCurrency}>
						<option value="INR">INR</option>
						<option value="USD">USD</option>
						<option value="EUR">EUR</option>
						<option value="GBP">GBP</option>
					</select>
					<input type="number" name="price" class="modal-input" style="flex: 1; margin-bottom: 0;" placeholder="e.g. 1500" min="0" step="0.01" required bind:value={selectedCoursePrice} />
				</div>
				<div class="modal-actions">
					<button type="button" class="action-btn" onclick={() => showPriceModal = false}>Cancel</button>
					<button type="submit" class="create-btn" disabled={isSubmitting}>
						{isSubmitting ? 'Updating...' : 'Update Price'}
					</button>
				</div>
			</form>
		</div>
	{/if}

	<div class="table-container">
		<!-- Table Toolbar -->
		<div class="table-toolbar">
			<div class="search-box">
				<Search size={16} class="search-icon" />
				<input type="text" placeholder="Search courses..." />
			</div>
			<button class="filter-btn">
				<Filter size={16} /> Filter
			</button>
		</div>

		<!-- Course Table -->
		<table class="course-table">
			<thead>
				<tr>
					<th>Course Name</th>
					<th>Status</th>
					<th>Price</th>
					<th>Students</th>
					<th>Rating</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{#each data.courses as course}
					<tr>
						<td class="col-title">
							<div class="course-title-cell">
								<div class="course-icon"><BookOpen size={16} /></div>
								{course.title}
							</div>
						</td>
						<td>
							<span class="status-badge" class:published={course.status === 'Published'} class:draft={course.status === 'Draft'}>
								{course.status}
							</span>
						</td>
						<td class="col-price">
							<span class="price-val">{course.price}</span>
						</td>
						<td>{course.students}</td>
						<td>{course.rating > 0 ? `★ ${course.rating}` : '-'}</td>
						<td class="col-actions">
							<a href={`/dashboard/teacher/courses/${course.id}/curriculum`} class="action-btn" title="Edit Content" style="display: inline-flex; align-items: center; justify-content: center;"><Edit size={16} /></a>
							<button class="action-btn" title="Edit Price" onclick={() => {
								selectedCourseId = course.id;
								selectedCourseCurrency = course.rawCurrency;
								selectedCoursePrice = course.rawPrice;
								showPriceModal = true;
							}}><Tag size={16} /></button>
							<form method="POST" action="?/togglePublish" use:enhance style="display: inline;">
								<input type="hidden" name="courseId" value={course.id} />
								<button class="action-btn" title={course.status === 'Published' ? 'Unpublish' : 'Publish'}>
									<Power size={16} />
								</button>
							</form>
							<button class="action-btn" title="More Options"><MoreHorizontal size={16} /></button>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>
</div>

<style>
	.page-content {
		padding: 2.5rem;
		width: 100%;
		max-width: 1200px;
		margin: 0 auto;
	}

	.page-header {
		display: flex;
		justify-content: space-between;
		align-items: flex-end;
		margin-bottom: 2.5rem;
	}
	.page-title {
		font-size: 1.75rem;
		font-weight: 700;
		color: var(--text-primary);
		letter-spacing: -0.02em;
		margin-bottom: 4px;
	}
	.page-subtitle {
		font-size: 0.95rem;
		color: var(--text-muted);
	}

	.create-btn {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 10px 18px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		transition: opacity 0.2s;
	}
	.create-btn:hover {
		opacity: 0.9;
	}

	/* Table */
	.table-container {
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 12px;
		overflow: hidden;
	}

	.table-toolbar {
		display: flex;
		justify-content: space-between;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
	}
	.search-box {
		position: relative;
		width: 300px;
	}
	.search-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}
	.search-box input {
		width: 100%;
		padding: 8px 12px 8px 36px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 6px;
		color: var(--text-primary);
		font-size: 0.85rem;
	}
	.search-box input:focus {
		outline: none;
		border-color: var(--border-strong);
	}

	.filter-btn {
		display: flex;
		align-items: center;
		gap: 6px;
		background: transparent;
		border: 1px solid var(--border);
		color: var(--text-secondary);
		padding: 8px 14px;
		border-radius: 6px;
		font-size: 0.85rem;
		cursor: pointer;
	}
	.filter-btn:hover {
		background: var(--bg-elevated);
		color: var(--text-primary);
	}

	.course-table {
		width: 100%;
		border-collapse: collapse;
		text-align: left;
	}

	.course-table th {
		font-size: 0.8rem;
		font-weight: 600;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		padding: 1rem 1.5rem;
		border-bottom: 1px solid var(--border);
		background: var(--bg-elevated);
	}

	.course-table td {
		padding: 1.25rem 1.5rem;
		border-bottom: 1px solid var(--border);
		font-size: 0.9rem;
		color: var(--text-secondary);
		vertical-align: middle;
	}
	.course-table tr:last-child td {
		border-bottom: none;
	}
	.course-table tr:hover td {
		background: var(--bg-elevated);
	}

	.course-title-cell {
		display: flex;
		align-items: center;
		gap: 12px;
		font-weight: 500;
		color: var(--text-primary);
	}
	.course-icon {
		width: 36px;
		height: 36px;
		border-radius: 6px;
		background: var(--bg);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--accent);
	}

	.status-badge {
		display: inline-block;
		padding: 4px 8px;
		border-radius: 4px;
		font-size: 0.75rem;
		font-weight: 600;
		background: var(--bg);
		border: 1px solid var(--border);
		color: var(--text-muted);
	}
	.status-badge.published {
		background: var(--accent-muted);
		color: var(--accent);
		border-color: transparent;
	}
	.status-badge.draft {
		background: rgba(245, 158, 11, 0.1);
		color: #f59e0b;
		border-color: transparent;
	}

	.price-val {
		font-weight: 600;
		color: var(--text-primary);
	}

	.col-actions {
		display: flex;
		gap: 4px;
		justify-content: flex-end;
	}
	.action-btn {
		background: transparent;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		transition: all 0.2s;
	}
	.action-btn:hover {
		background: var(--border);
		color: var(--text-primary);
	}

	/* Modal */
	.modal-overlay {
		position: fixed;
		top: 0; left: 0; right: 0; bottom: 0;
		background: rgba(0,0,0,0.5);
		display: flex;
		align-items: center;
		justify-content: center;
		z-index: 100;
		padding: 20px;
	}
	.modal-content {
		background: var(--bg);
		padding: 2rem;
		border-radius: 12px;
		width: 100%;
		max-width: 500px;
		box-shadow: var(--shadow-md);
	}
	.modal-content h3 {
		font-size: 1.25rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
	}
	.modal-content p {
		font-size: 0.95rem;
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
	}
	.modal-input {
		width: 100%;
		padding: 12px;
		background: var(--bg-subtle);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 1rem;
		margin-bottom: 1.5rem;
	}
	.modal-input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.modal-actions {
		display: flex;
		justify-content: flex-end;
		gap: 12px;
	}
</style>
