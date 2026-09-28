<script lang="ts">
	import { Save, Image as ImageIcon, DollarSign, Globe, Lock, Users, UserPlus, Trash2, Calendar, BookOpen, ShieldCheck } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let courseTitle = $state(data.course.title);
	let courseDesc = $state(data.course.description || '');
	let thumbnailUrl = $state(data.course.thumbnail || '');
	let isSelfPacedEnabled = $state((data.course as any).isSelfPacedEnabled ?? true);
	let isLiveBatchesEnabled = $state((data.course as any).isLiveBatchesEnabled ?? false);
	let pricingType = $state(data.course.pricePaise === 0 ? 'free' : 'paid');
	let price = $state(data.course.pricePaise > 0 ? (data.course.pricePaise / 100).toString() : '');
	let currency = $state(data.course.currency || 'INR');
	let accessType = $state(data.course.visibility);
	
	let newCollabEmail = $state('');
	let newCollabRole = $state<'co_instructor' | 'teaching_assistant'>('co_instructor');

	let isSaving = $state(false);
	let isAddingCollab = $state(false);
</script>

<svelte:head>
	<title>Course Settings & Mentors</title>
</svelte:head>

<div class="workspace-header">
	<div>
		<h1>Settings & Course Administration</h1>
		<p>Configure course format, monetization, and collaborating instructors.</p>
	</div>
</div>

<form method="POST" action="?/save" class="settings-layout" use:enhance={() => { isSaving = true; return async ({ update }) => { isSaving = false; update(); }; }}>
	{#if form?.success}
		<div class="alert-success">Settings saved successfully.</div>
	{:else if form?.error}
		<div class="alert-danger">{form.error}</div>
	{/if}
	
	<!-- ── Course Delivery Format (Strictly Mutually Exclusive) ───────────── -->
	<section class="settings-section">
		<h2>Course Delivery Format</h2>
		<p class="section-desc">Choose whether this learning experience is an On-Demand Self-Paced course or a Live Classroom Cohort. They are handled and displayed in distinct catalog sections.</p>

		<div class="radio-group">
			<!-- Self-Paced Radio Option -->
			<label class="radio-card" class:selected={!isLiveBatchesEnabled}>
				<input type="radio" name="formatOption" value="self_paced" checked={!isLiveBatchesEnabled} onchange={() => { isLiveBatchesEnabled = false; isSelfPacedEnabled = true; }} />
				<div class="radio-content">
					<div class="flex-row">
						<BookOpen size={18} class="text-indigo-400" />
						<strong>Self-Paced (On-Demand)</strong>
					</div>
					<span>Immediate access, no batches, self-guided lessons directly in the platform web reader. Default pricing: ₹5,999.</span>
				</div>
			</label>

			<!-- Live Batch Radio Option -->
			<label class="radio-card" class:selected={isLiveBatchesEnabled}>
				<input type="radio" name="formatOption" value="live_batch" checked={isLiveBatchesEnabled} onchange={() => { isLiveBatchesEnabled = true; isSelfPacedEnabled = false; }} />
				<div class="radio-content">
					<div class="flex-row">
						<Calendar size={18} class="text-emerald-500" />
						<strong>Live Classroom (Cohort Batches)</strong>
					</div>
					<span>Timed cohorts with strict seat caps. Live classes on Google Meet/Zoom, cohort chat on WhatsApp/Teams, and scheduled sessions. Default pricing: ₹16,999.</span>
				</div>
			</label>
		</div>

		<input type="hidden" name="deliveryFormat" value={isLiveBatchesEnabled ? 'live_batch' : 'self_paced'} />
		<input type="hidden" name="isSelfPacedEnabled" value={!isLiveBatchesEnabled ? 'on' : 'off'} />
		<input type="hidden" name="isLiveBatchesEnabled" value={isLiveBatchesEnabled ? 'on' : 'off'} />
	</section>

	<!-- Basic Info -->
	<section class="settings-section">
		<h2>Basic Information</h2>
		<div class="form-group">
			<label for="course-title-input">Course Title</label>
			<input id="course-title-input" type="text" name="title" bind:value={courseTitle} class="input-field" required />
		</div>
		<div class="form-group">
			<label for="course-desc-input">Description</label>
			<textarea id="course-desc-input" name="description" bind:value={courseDesc} class="textarea-field" rows="3"></textarea>
		</div>
		<div class="form-group">
			<label for="course-thumb-input">Thumbnail Image</label>
			{#if thumbnailUrl}
				<div style="margin-bottom: 12px; border-radius: 8px; overflow: hidden; border: 1px solid var(--border);">
					<img src={thumbnailUrl} alt="Thumbnail preview" style="width: 100%; height: auto; max-height: 200px; object-fit: cover;" />
				</div>
			{/if}
			<FileUpload 
				accept="image/jpeg, image/png, image/webp"
				maxSizeMb={5}
				label="Upload Course Thumbnail"
				description="1280x720 recommended (JPG, PNG, WebP)"
				onUploadSuccess={(url) => { thumbnailUrl = url; }}
			/>
			<input id="course-thumb-input" type="hidden" name="thumbnail" value={thumbnailUrl} />
		</div>
	</section>

	<!-- Pricing -->
	<section class="settings-section">
		<h2>Pricing Strategy</h2>
		<div class="radio-group">
			<label class="radio-card" class:selected={pricingType === 'free'}>
				<input type="radio" bind:group={pricingType} value="free" />
				<div class="radio-content">
					<strong>Free</strong>
					<span>Available to all students at no cost.</span>
				</div>
			</label>
			<label class="radio-card" class:selected={pricingType === 'paid'}>
				<input type="radio" bind:group={pricingType} value="paid" />
				<div class="radio-content">
					<strong>One-time Enrollment Fee</strong>
					<span>Students pay once for enrollment (and seat reservation in their chosen batch).</span>
				</div>
			</label>
			<input type="hidden" name="pricingType" value={pricingType} />
			<input type="hidden" name="accessType" value={accessType} />
		</div>

		{#if pricingType === 'paid'}
			<div class="form-group mt-4">
				<label for="course-price-input">Price</label>
				<div style="display: flex; gap: 8px;">
					<select name="currency" class="input-field" style="width: 100px; padding-left: 12px;" bind:value={currency}>
						<option value="INR">INR</option>
						<option value="USD">USD</option>
					</select>
					<div class="input-with-icon" style="flex: 1; width: auto;">
						<DollarSign size={16} class="icon" />
						<input id="course-price-input" type="number" name="price" bind:value={price} placeholder="0.00" min="0" step="0.01" class="input-field pl-9" />
					</div>
				</div>
			</div>
		{/if}
	</section>

	<!-- Access Control -->
	<section class="settings-section">
		<h2>Visibility</h2>
		<div class="radio-group">
			<label class="radio-card" class:selected={accessType === 'public'}>
				<input type="radio" bind:group={accessType} value="public" />
				<div class="radio-content">
					<div class="flex-row">
						<Globe size={18} class="text-accent" />
						<strong>Public Catalog</strong>
					</div>
					<span>Listed in Explore and Courses catalog.</span>
				</div>
			</label>
			<label class="radio-card" class:selected={accessType === 'private'}>
				<input type="radio" bind:group={accessType} value="private" />
				<div class="radio-content">
					<div class="flex-row">
						<Lock size={18} class="text-muted" />
						<strong>Private (Invite Only)</strong>
					</div>
					<span>Direct link only. Hidden from public listings.</span>
				</div>
			</label>
		</div>
	</section>

	<div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border);">
		<button type="submit" disabled={isSaving} class="btn-primary">
			<Save size={18} /> {isSaving ? 'Saving...' : 'Save Course Settings'}
		</button>
	</div>
</form>

<!-- ── Course Collaborators Section (Course Admin Feature) ──────── -->
<section class="settings-section mt-10">
	<div class="section-title-row">
		<div>
			<h2>Course Instructors & Collaborators</h2>
			<p class="section-desc">Manage teachers and mentors authorized to handle batches, post recordings, and manage rosters.</p>
		</div>

		{#if data.isCourseAdmin}
			<span class="badge-course-admin">
				<ShieldCheck size={14} />
				<span>You are Course Admin</span>
			</span>
		{:else}
			<span class="badge-collaborator">
				<Users size={14} />
				<span>You are Co-Instructor</span>
			</span>
		{/if}
	</div>

	{#if form?.collaboratorSuccess}
		<div class="alert-success mb-4">{form.message}</div>
	{:else if form?.collaboratorError}
		<div class="alert-danger mb-4">{form.collaboratorError}</div>
	{/if}

	<!-- Collaborators Table / Roster -->
	{#if data.collaborators && data.collaborators.length > 0}
		<div class="collaborator-list">
			{#each data.collaborators as collab}
				<div class="collab-item">
					<div class="collab-avatar">
						{#if collab.avatarUrl}
							<img src={collab.avatarUrl} alt={collab.name || 'Mentor'} class="avatar-img" />
						{:else}
							<span>{collab.name ? collab.name.slice(0, 2).toUpperCase() : 'ME'}</span>
						{/if}
					</div>

					<div class="collab-meta">
						<strong class="collab-name">{collab.name || 'Instructor'}</strong>
						<span class="collab-email">{collab.email}</span>
						<span class="collab-role-tag">{collab.role === 'co_instructor' ? 'Co-Instructor' : 'Teaching Assistant'}</span>
					</div>

					{#if data.isCourseAdmin}
						<form method="POST" action="?/removeCollaborator" use:enhance>
							<input type="hidden" name="collaboratorUserId" value={collab.userId} />
							<button type="submit" class="btn-remove-collab" title="Remove instructor">
								<Trash2 size={16} />
							</button>
						</form>
					{/if}
				</div>
			{/each}
		</div>
	{:else}
		<p class="no-collab-text">No additional instructors added yet. Only the Course Admin currently has access.</p>
	{/if}

	<!-- Add Collaborator Form (Only for Course Admin) -->
	{#if data.isCourseAdmin}
		<div class="add-collab-box">
			<h3>Add Mentor to this Course</h3>
			<p class="box-desc">Enter the registered email of the teacher or mentor you want to collaborate with.</p>

			<form method="POST" action="?/addCollaborator" class="add-collab-form" use:enhance={() => { isAddingCollab = true; return async ({ update }) => { isAddingCollab = false; update(); }; }}>
				<input
					type="email"
					name="emailOrId"
					placeholder="mentor@email.com"
					bind:value={newCollabEmail}
					class="input-field flex-1"
					required
				/>
				<select name="role" class="input-field" style="width: 170px;" bind:value={newCollabRole}>
					<option value="co_instructor">Co-Instructor</option>
					<option value="teaching_assistant">Teaching Assistant</option>
				</select>
				<button type="submit" disabled={isAddingCollab} class="btn-add-mentor">
					<UserPlus size={16} />
					<span>{isAddingCollab ? 'Adding...' : 'Add Mentor'}</span>
				</button>
			</form>
		</div>
	{/if}
</section>

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

	.settings-layout {
		display: flex;
		flex-direction: column;
		gap: 2.5rem;
		max-width: 760px;
	}

	.settings-section {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 14px;
		padding: 24px;
	}

	.settings-section h2 {
		font-size: 1.15rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 4px;
	}

	.section-desc {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-bottom: 18px;
	}

	.form-group {
		margin-bottom: 1.5rem;
	}
	.form-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.input-field, .textarea-field {
		width: 100%;
		padding: 10px 12px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		color: var(--text-primary);
		font-size: 0.95rem;
		font-family: inherit;
	}
	.input-field:focus, .textarea-field:focus {
		outline: none;
		border-color: #6366f1;
		box-shadow: 0 0 0 2px rgba(99, 102, 241, 0.15);
	}

	.radio-group {
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.radio-card {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		padding: 16px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 10px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.radio-card:hover {
		border-color: var(--border-strong);
	}
	.radio-card.selected {
		border-color: #6366f1;
		background: rgba(99, 102, 241, 0.05);
	}
	.radio-card input[type="radio"] {
		margin-top: 4px;
		accent-color: #6366f1;
	}
	.radio-content {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.radio-content strong {
		color: var(--text-primary);
		font-size: 0.95rem;
	}
	.radio-content span {
		color: var(--text-muted);
		font-size: 0.85rem;
		line-height: 1.45;
	}
	.flex-row {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.input-with-icon {
		position: relative;
		width: 150px;
	}
	.input-with-icon .icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}
	.input-field.pl-9 {
		padding-left: 2.25rem;
	}

	.mt-4 { margin-top: 1rem; }
	.mt-10 { margin-top: 2.5rem; }
	.mb-4 { margin-bottom: 1rem; }

	.btn-primary {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		padding: 10px 22px;
		background: #201948;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.9rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}
	.btn-primary:hover {
		background: #151030;
	}

	.alert-success {
		padding: 12px 16px;
		background: rgba(16, 185, 129, 0.1);
		color: #059669;
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	.alert-danger {
		padding: 12px 16px;
		background: rgba(239, 68, 68, 0.1);
		color: #dc2626;
		border: 1px solid rgba(239, 68, 68, 0.25);
		border-radius: 8px;
		font-size: 0.875rem;
		font-weight: 500;
	}

	/* Collaborators Section */
	.section-title-row {
		display: flex;
		align-items: flex-start;
		justify-content: space-between;
		gap: 16px;
		margin-bottom: 18px;
	}

	.badge-course-admin {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 9999px;
		background: rgba(99, 102, 241, 0.1);
		border: 1px solid rgba(99, 102, 241, 0.25);
		color: #6366f1;
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.badge-collaborator {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 4px 10px;
		border-radius: 9999px;
		background: rgba(16, 185, 129, 0.1);
		border: 1px solid rgba(16, 185, 129, 0.25);
		color: #059669;
		font-size: 0.75rem;
		font-weight: 700;
		white-space: nowrap;
	}

	.collaborator-list {
		display: flex;
		flex-direction: column;
		gap: 10px;
		margin-bottom: 24px;
	}

	.collab-item {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 12px 16px;
		background: var(--bg-subtle, #f8fafc);
		border: 1px solid var(--border);
		border-radius: 10px;
	}

	.collab-avatar {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		background: var(--bg);
		border: 1px solid var(--border);
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: 0.8125rem;
		font-weight: 700;
		color: var(--text-primary);
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.collab-meta {
		display: flex;
		align-items: center;
		gap: 14px;
		flex: 1;
		margin-left: 14px;
	}

	.collab-name {
		font-size: 0.9rem;
		color: var(--text-primary);
	}

	.collab-email {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.collab-role-tag {
		font-size: 0.6875rem;
		font-weight: 600;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.08);
		padding: 2px 8px;
		border-radius: 4px;
		text-transform: uppercase;
	}

	.btn-remove-collab {
		background: none;
		border: none;
		color: var(--text-muted);
		cursor: pointer;
		padding: 6px;
		border-radius: 6px;
		transition: color 0.15s ease, background 0.15s ease;
	}

	.btn-remove-collab:hover {
		color: #ef4444;
		background: rgba(239, 68, 68, 0.08);
	}

	.no-collab-text {
		font-size: 0.875rem;
		color: var(--text-muted);
		font-style: italic;
		margin-bottom: 20px;
	}

	.add-collab-box {
		padding: 18px;
		background: var(--bg-subtle, #f8fafc);
		border: 1px dashed var(--border);
		border-radius: 10px;
	}

	.add-collab-box h3 {
		font-size: 0.95rem;
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 2px;
	}

	.box-desc {
		font-size: 0.8125rem;
		color: var(--text-muted);
		margin-bottom: 14px;
	}

	.add-collab-form {
		display: flex;
		gap: 10px;
		align-items: center;
		flex-wrap: wrap;
	}

	.btn-add-mentor {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 10px 18px;
		background: #6366f1;
		color: #ffffff;
		border: none;
		border-radius: 8px;
		font-weight: 600;
		font-size: 0.85rem;
		cursor: pointer;
		transition: background 0.15s ease;
	}

	.btn-add-mentor:hover {
		background: #4f46e5;
	}
</style>
