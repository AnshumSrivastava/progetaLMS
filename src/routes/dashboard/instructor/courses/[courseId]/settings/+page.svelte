<script lang="ts">
	import { Save, Image as ImageIcon, DollarSign, Globe, Lock } from 'lucide-svelte';
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import FileUpload from '$lib/components/ui/FileUpload.svelte';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let courseTitle = $state(data.course.title);
	let courseDesc = $state(data.course.description || '');
	let thumbnailUrl = $state(data.course.thumbnail || '');
	let pricingType = $state(data.course.pricePaise === 0 ? 'free' : 'paid');
	let price = $state(data.course.pricePaise > 0 ? (data.course.pricePaise / 100).toString() : '');
	let accessType = $state(data.course.visibility);
	
	let isSaving = $state(false);
</script>

<svelte:head>
	<title>Course Settings</title>
</svelte:head>

<div class="workspace-header">
	<div>
		<h1>Settings & Pricing</h1>
		<p>Configure course details, monetization, and visibility.</p>
	</div>
</div>

<form method="POST" action="?/save" class="settings-layout" use:enhance={() => { isSaving = true; return async ({ update }) => { isSaving = false; update(); }; }}>
	{#if form?.success}
		<div style="padding: 12px; background: rgba(16,185,129,0.1); color: #10b981; border-radius: 8px;">Settings saved successfully.</div>
	{:else if form?.error}
		<div style="padding: 12px; background: rgba(239,68,68,0.1); color: #ef4444; border-radius: 8px;">{form.error}</div>
	{/if}
	
	<!-- Basic Info -->
	<section class="settings-section">
		<h2>Basic Information</h2>
		<div class="form-group">
			<label>Course Title</label>
			<input type="text" name="title" bind:value={courseTitle} class="input-field" required />
		</div>
		<div class="form-group">
			<label>Description</label>
			<textarea name="description" bind:value={courseDesc} class="textarea-field" rows="3"></textarea>
		</div>
		<div class="form-group">
			<label>Thumbnail Image</label>
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
			<input type="hidden" name="thumbnail" value={thumbnailUrl} />
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
					<span>Course is available at no cost.</span>
				</div>
			</label>
			<label class="radio-card" class:selected={pricingType === 'paid'}>
				<input type="radio" bind:group={pricingType} value="paid" />
				<div class="radio-content">
					<strong>One-time Purchase</strong>
					<span>Students pay once for lifetime access.</span>
				</div>
			</label>
			<input type="hidden" name="pricingType" value={pricingType} />
			<input type="hidden" name="accessType" value={accessType} />
		</div>

		{#if pricingType === 'paid'}
			<div class="form-group mt-4">
				<label>Price (₹ INR)</label>
				<div class="input-with-icon">
					<DollarSign size={16} class="icon" />
					<input type="number" name="price" bind:value={price} placeholder="0.00" min="0" step="0.01" class="input-field pl-9" />
				</div>
			</div>
		{/if}
	</section>

	<!-- Access Control -->
	<section class="settings-section">
		<h2>Access & Visibility</h2>
		<div class="radio-group">
			<label class="radio-card" class:selected={accessType === 'public'}>
				<input type="radio" bind:group={accessType} value="public" />
				<div class="radio-content">
					<div class="flex-row">
						<Globe size={18} class="text-accent" />
						<strong>Public Catalog</strong>
					</div>
					<span>Anyone can discover and enroll in this course.</span>
				</div>
			</label>
			<label class="radio-card" class:selected={accessType === 'private'}>
				<input type="radio" bind:group={accessType} value="private" />
				<div class="radio-content">
					<div class="flex-row">
						<Lock size={18} class="text-muted" />
						<strong>Private (Invite Only)</strong>
					</div>
					<span>Hidden from catalog. You must manually allot access to students.</span>
				</div>
			</label>
		</div>
	</section>

	<div style="display: flex; justify-content: flex-end; padding-top: 1rem; border-top: 1px solid var(--border);">
		<button type="submit" disabled={isSaving} style="display: flex; align-items: center; gap: 8px; padding: 10px 20px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 8px; font-weight: 500; cursor: pointer; opacity: {isSaving ? 0.7 : 1};">
			<Save size={18} /> {isSaving ? 'Saving...' : 'Save Settings'}
		</button>
	</div>
</form>

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
		max-width: 700px;
	}

	.settings-section h2 {
		font-size: 1.1rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 1.5rem;
		padding-bottom: 0.5rem;
		border-bottom: 1px solid var(--border);
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
		border-color: var(--accent);
		box-shadow: 0 0 0 2px var(--accent-muted);
	}

	.image-upload {
		background: var(--bg-subtle);
		border: 2px dashed var(--border-strong);
		border-radius: 8px;
		padding: 2.5rem 1rem;
		text-align: center;
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
		cursor: pointer;
		transition: border-color 0.2s;
	}
	.image-upload:hover {
		border-color: var(--accent);
	}
	.image-upload p {
		font-weight: 500;
		color: var(--text-primary);
	}
	.image-upload span {
		font-size: 0.8rem;
		color: var(--text-muted);
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
		border-radius: 8px;
		cursor: pointer;
		transition: all 0.2s;
	}
	.radio-card:hover {
		border-color: var(--border-strong);
	}
	.radio-card.selected {
		border-color: var(--accent);
		background: var(--accent-muted);
	}
	.radio-card input[type="radio"] {
		margin-top: 4px;
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

	.mt-4 {
		margin-top: 1rem;
	}
	.text-muted {
		color: var(--text-muted);
	}
	.text-accent {
		color: var(--accent);
	}
</style>
