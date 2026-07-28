<script lang="ts">
	import { UploadCloud, CheckCircle2, AlertCircle, Loader2 } from 'lucide-svelte';
	import { addToast } from '$lib/stores/toast';

	interface Props {
		onUploadSuccess?: (url: string) => void;
		accept?: string;
		maxSizeMb?: number;
		label?: string;
		description?: string;
	}

	let {
		onUploadSuccess,
		accept = 'image/*',
		maxSizeMb = 5,
		label = 'Upload File',
		description = 'Drag and drop or click to browse'
	}: Props = $props();

	let fileInput: HTMLInputElement;
	let isDragging = $state(false);
	let isUploading = $state(false);
	let uploadProgress = $state(0);
	let error = $state<string | null>(null);
	let uploadedUrl = $state<string | null>(null);

	function handleDragEnter(e: DragEvent) {
		e.preventDefault();
		isDragging = true;
	}

	function handleDragLeave(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragging = false;
		
		if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
			handleFileSelect(e.dataTransfer.files[0]);
		}
	}

	function handleInputChange(e: Event) {
		const target = e.target as HTMLInputElement;
		if (target.files && target.files.length > 0) {
			handleFileSelect(target.files[0]);
		}
	}

	async function handleFileSelect(file: File) {
		error = null;
		uploadedUrl = null;

		// Validation
		if (file.size > maxSizeMb * 1024 * 1024) {
			error = `File is too large. Max size is ${maxSizeMb}MB.`;
			return;
		}

		isUploading = true;
		uploadProgress = 10;

		try {
			// 1. Get signed URL
			const res = await fetch('/api/upload', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					filename: file.name,
					contentType: file.type
				})
			});

			if (!res.ok) {
				const data = await res.json();
				throw new Error(data.error || 'Failed to get upload URL');
			}

			const { uploadUrl, publicUrl } = await res.json();
			uploadProgress = 50;

			// 2. Upload directly to R2
			const uploadRes = await fetch(uploadUrl, {
				method: 'PUT',
				body: file,
				headers: {
					'Content-Type': file.type
				}
			});

			if (!uploadRes.ok) {
				throw new Error('Failed to upload file to storage');
			}

			uploadProgress = 100;
			uploadedUrl = publicUrl;
			addToast('File uploaded successfully', 'success');
			
			if (onUploadSuccess) {
				onUploadSuccess(publicUrl);
			}
		} catch (err: any) {
			console.error(err);
			error = err.message || 'An unknown error occurred';
			addToast(error as string, 'error');
		} finally {
			isUploading = false;
			// Reset input
			if (fileInput) fileInput.value = '';
		}
	}
</script>

<!-- svelte-ignore a11y_no_static_element_interactions -->
<!-- svelte-ignore a11y_click_events_have_key_events -->
<div 
	class="upload-area" 
	class:is-dragging={isDragging}
	class:is-uploading={isUploading}
	class:has-success={!!uploadedUrl}
	ondragenter={handleDragEnter}
	ondragover={handleDragEnter}
	ondragleave={handleDragLeave}
	ondrop={handleDrop}
	onclick={() => !isUploading && fileInput.click()}
>
	<input 
		type="file" 
		bind:this={fileInput}
		{accept}
		style="display: none;"
		onchange={handleInputChange}
		disabled={isUploading}
	/>

	<div class="upload-content">
		{#if isUploading}
			<Loader2 size={32} class="animate-spin text-accent" />
			<div class="status-text">Uploading... {uploadProgress}%</div>
			<div class="progress-bar-container">
				<div class="progress-fill" style="width: {uploadProgress}%"></div>
			</div>
		{:else if uploadedUrl}
			<CheckCircle2 size={32} class="text-success" />
			<div class="status-text">Upload Complete!</div>
			<div class="sub-text">Click to upload a different file</div>
		{:else if error}
			<AlertCircle size={32} class="text-error" />
			<div class="status-text error-text">{error}</div>
			<div class="sub-text">Click to try again</div>
		{:else}
			<UploadCloud size={32} class="text-muted" />
			<div class="status-text">{label}</div>
			<div class="sub-text">{description}</div>
			<div class="sub-text-small">Max size: {maxSizeMb}MB</div>
		{/if}
	</div>
</div>

<style>
	.upload-area {
		border: 2px dashed var(--border-strong);
		border-radius: 8px;
		padding: 2.5rem 1rem;
		text-align: center;
		background: var(--bg-subtle);
		cursor: pointer;
		transition: all 0.2s ease;
		position: relative;
		overflow: hidden;
	}

	.upload-area:hover:not(.is-uploading) {
		border-color: var(--accent);
		background: var(--bg);
	}

	.upload-area.is-dragging {
		border-color: var(--accent);
		background: var(--accent-muted);
	}

	.upload-area.is-uploading {
		cursor: not-allowed;
		border-style: solid;
		border-color: var(--border);
	}

	.upload-area.has-success {
		border-color: #10b981;
		border-style: solid;
	}

	.upload-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 8px;
	}

	.status-text {
		font-weight: 500;
		color: var(--text-primary);
		margin-top: 8px;
	}

	.sub-text {
		font-size: 0.9rem;
		color: var(--text-muted);
	}

	.sub-text-small {
		font-size: 0.8rem;
		color: var(--text-muted);
		opacity: 0.7;
		margin-top: 4px;
	}

	.error-text {
		color: #ef4444;
	}

	.text-accent { color: var(--accent); }
	.text-success { color: #10b981; }
	.text-error { color: #ef4444; }
	.text-muted { color: var(--text-muted); }

	.animate-spin {
		animation: spin 1s linear infinite;
	}

	@keyframes spin {
		from { transform: rotate(0deg); }
		to { transform: rotate(360deg); }
	}

	.progress-bar-container {
		width: 100%;
		max-width: 200px;
		height: 6px;
		background: var(--border);
		border-radius: 4px;
		margin-top: 12px;
		overflow: hidden;
	}

	.progress-fill {
		height: 100%;
		background: var(--accent);
		transition: width 0.3s ease;
	}
</style>
