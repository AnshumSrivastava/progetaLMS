<script lang="ts">
	import { Download, BookOpen, ArrowRight } from 'lucide-svelte';

	let { resource }: { resource: any } = $props();

	const format = (resource.metadata?.format || resource.metadata?.fileType || 'PDF').toUpperCase();
	const pages = resource.metadata?.pages ? `${resource.metadata.pages} pages` : 'Guide';
	const targetUrl = $derived(`/catalog/${resource.slug || resource.id}`);
</script>

<a href={targetUrl} class="dark-resource-card group">
	<div class="res-icon-box">
		<BookOpen size={18} class="text-slate-300" />
	</div>

	<div class="res-content">
		<h3 class="res-title">{resource.title}</h3>
		<div class="res-meta-row">
			<span class="res-meta-text">{format} • {pages}</span>
		</div>
	</div>

	<div class="res-download-btn" aria-label="Download or view resource">
		<Download size={14} />
	</div>
</a>

<style>
	.dark-resource-card {
		border-radius: var(--radius-md);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 16px;
		display: flex;
		align-items: flex-start;
		gap: 12px;
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.dark-resource-card:hover {
		border-color: var(--color-border-strong);
		background: var(--color-surface-elevated);
		transform: translateY(-2px);
	}

	.res-icon-box {
		width: 36px;
		height: 36px;
		border-radius: var(--radius-sm);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--color-text-secondary);
	}

	.res-content {
		flex: 1;
		min-width: 0;
	}

	.res-title {
		font-size: 0.85rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.35;
		margin-bottom: 6px;
	}

	.res-meta-text {
		font-size: 0.72rem;
		color: var(--color-text-secondary);
	}

	.res-download-btn {
		color: var(--color-text-secondary);
		padding: 4px;
		transition: color 0.15s ease;
	}

	.dark-resource-card:hover .res-download-btn {
		color: var(--color-text);
	}
</style>
