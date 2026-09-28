<script lang="ts">
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import { Download, FileText, ArrowRight, User, CheckCircle2 } from 'lucide-svelte';

	let { resource }: { resource: any } = $props();

	const isFree = !resource.pricePaise || resource.pricePaise === 0;
	const priceFormatted = isFree ? 'Free' : `₹${(resource.pricePaise / 100).toLocaleString('en-IN')}`;
	const format = (resource.metadata?.format || 'PDF').toUpperCase();
	const pages = resource.metadata?.pages ? `${resource.metadata.pages} Pages` : null;
	const sizeMb = resource.metadata?.sizeMb ? `${resource.metadata.sizeMb} MB` : null;
	const isMentorShared = resource.source === 'mentor';
	const providerName = resource.ownerName || 'Launchpad Team';
	const providerRole = isMentorShared ? 'Verified Mentor' : 'Launchpad Official';

	// Category pill tint
	const tagVariant = () => {
		if (format.includes('PDF')) return 'tag-blue';
		if (format.includes('MARKDOWN') || format.includes('MD')) return 'tag-green';
		return 'tag-purple';
	};
</script>

<article class="workly-card resource-card">
	<!-- Top Row: Price Chip & Source Badge -->
	<div class="card-top-row">
		<div class="credit-chip" class:free-chip={isFree}>
			<span class="coin-icon" class:free-icon={isFree}></span>
			<span class="credit-text" class:free-text={isFree}>{priceFormatted}</span>
		</div>
		<div class="flex items-center gap-1.5">
			{#if isMentorShared}
				<span class="mentor-badge">Mentor Shared</span>
			{:else}
				<span class="official-badge">Official</span>
			{/if}
			<VerifiedBadge size={14} />
		</div>
	</div>

	<!-- Title -->
	<h3 class="card-heading">
		<a href={`/catalog/${resource.id}`} class="heading-link">
			{resource.title}
		</a>
	</h3>

	<!-- Format & Category Pills -->
	<div class="tag-row">
		<span class="workly-pill {tagVariant()}">
			{format} Guide
		</span>
		{#if resource.metadata?.category}
			<span class="category-sub">{resource.metadata.category}</span>
		{/if}
	</div>

	<!-- Description -->
	<p class="card-summary">
		{resource.description || 'Verified reference material and digital tools for immediate hands-on technical application.'}
	</p>

	<!-- Provider Row (Who shared it) -->
	<div class="provider-row">
		<div class="mini-avatar">
			{#if resource.ownerAvatar}
				<img src={resource.ownerAvatar} alt={providerName} class="avatar-img" />
			{:else}
				<span>{providerName.slice(0, 2).toUpperCase()}</span>
			{/if}
		</div>
		<div class="provider-info">
			<span class="provider-name">{providerName}</span>
			<span class="provider-role">{providerRole}</span>
		</div>
	</div>

	<!-- Bottom Row: Specs & Download Button -->
	<div class="card-bottom-row">
		<div class="file-meta">
			<FileText size={15} class="meta-icon" />
			<span>{[pages, sizeMb].filter(Boolean).join(' · ') || 'Digital Resource'}</span>
		</div>

		<div class="footer-actions">
			{#if isFree || resource.alreadyOwned}
				<a href={`/api/resources/${resource.id}/download`} download class="btn-download">
					<Download size={13} />
					<span>Download</span>
				</a>
			{:else}
				<a href={`/checkout/${resource.id}`} class="btn-get">
					<span>Get Resource</span>
					<ArrowRight size={13} />
				</a>
			{/if}
		</div>
	</div>
</article>

<style>
	.workly-card {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 24px;
		display: flex;
		flex-direction: column;
		height: 100%;
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
		position: relative;
		overflow: hidden;
		box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04), 0 1px 2px rgba(0, 0, 0, 0.02);
	}

	.workly-card:hover {
		transform: translateY(-3px);
		border-color: rgba(99, 102, 241, 0.3);
		box-shadow: 0 14px 28px -6px rgba(0, 0, 0, 0.08), 0 8px 12px -4px rgba(0, 0, 0, 0.04);
	}

	.card-top-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-bottom: 14px;
	}

	.credit-chip {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(245, 158, 11, 0.1);
		border: 1px solid rgba(245, 158, 11, 0.2);
		padding: 3px 10px;
		border-radius: 9999px;
	}

	.credit-chip.free-chip {
		background: rgba(16, 185, 129, 0.1);
		border-color: rgba(16, 185, 129, 0.2);
	}

	.coin-icon {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #f59e0b;
	}

	.coin-icon.free-icon {
		background: #10b981;
	}

	.credit-text {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #b45309;
	}

	.credit-text.free-text {
		color: #059669;
	}

	:global([data-theme="dark"]) .credit-text.free-text {
		color: #34d399;
	}

	.official-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #6366f1;
		background: rgba(99, 102, 241, 0.08);
		border: 1px solid rgba(99, 102, 241, 0.2);
		padding: 2px 7px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.mentor-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #059669;
		background: rgba(16, 185, 129, 0.08);
		border: 1px solid rgba(16, 185, 129, 0.2);
		padding: 2px 7px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	.card-heading {
		font-size: 1.15rem;
		font-weight: 700;
		line-height: 1.35;
		margin-bottom: 10px;
		letter-spacing: -0.02em;
	}

	.heading-link {
		color: var(--text-primary, #0f172a);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.heading-link:hover {
		color: var(--primary, #6366f1);
	}

	.tag-row {
		display: flex;
		align-items: center;
		gap: 8px;
		margin-bottom: 12px;
	}

	.workly-pill {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 3px 9px;
		border-radius: 6px;
		display: inline-block;
	}

	.tag-blue {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #dbeafe;
	}

	.tag-green {
		background: #f0fdf4;
		color: #16a34a;
		border: 1px solid #dcfce7;
	}

	.tag-purple {
		background: #faf5ff;
		color: #7c3aed;
		border: 1px solid #ede9fe;
	}

	.category-sub {
		font-size: 0.72rem;
		color: var(--text-muted);
		font-weight: 500;
	}

	.card-summary {
		font-size: 0.875rem;
		color: var(--text-secondary, #64748b);
		line-height: 1.55;
		margin-bottom: 16px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
		flex-grow: 1;
	}

	.provider-row {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 10px 12px;
		background: var(--bg-subtle, #f8fafc);
		border: 1px solid var(--border);
		border-radius: 8px;
		margin-bottom: 16px;
	}

	.mini-avatar {
		width: 30px;
		height: 30px;
		border-radius: 50%;
		background: var(--bg, #ffffff);
		border: 1px solid var(--border);
		color: var(--text-primary);
		font-size: 0.6875rem;
		font-weight: 700;
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.provider-info {
		display: flex;
		flex-direction: column;
		line-height: 1.25;
	}

	.provider-name {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.provider-role {
		font-size: 0.6875rem;
		color: var(--text-muted);
	}

	.card-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.file-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #64748b);
	}

	.meta-icon {
		color: var(--text-muted);
	}

	.btn-download {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		background: #10b981;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	.btn-download:hover {
		background: #059669;
		transform: scale(1.02);
	}

	.btn-get {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 7px 14px;
		border-radius: 8px;
		background: #6366f1;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		transition: background 0.15s ease, transform 0.1s ease;
	}

	.btn-get:hover {
		background: #4f46e5;
		transform: scale(1.02);
	}
</style>
