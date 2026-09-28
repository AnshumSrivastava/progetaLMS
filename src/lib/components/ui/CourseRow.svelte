<script lang="ts">
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import { ArrowRight } from 'lucide-svelte';

	let {
		course,
		index = 0
	}: {
		course: any;
		index?: number;
	} = $props();

	const level = $derived((course.metadata?.level || 'Beginner').toUpperCase());
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '8 hours');
	const isVerified = $derived(course.metadata?.verified ?? true);
	const instructor = $derived(course.metadata?.instructorName || course.metadata?.author || 'Launchpad Faculty');
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`);
	const indexPadded = $derived(String(index + 1).padStart(2, '0'));
</script>

<a href={`/catalog/${course.id}`} class="course-editorial-row group block">
	<div class="row-inner">
		<!-- Index + Technical Track Tag -->
		<div class="row-num-col">
			<span class="row-idx">{indexPadded}</span>
		</div>

		<!-- Title & Description Column -->
		<div class="row-title-col">
			<div class="flex items-center gap-2 mb-1">
				<span class="meta-mono text-[10px]">{level}</span>
				{#if isVerified}
					<span class="text-[var(--color-border-strong)]">·</span>
					<VerifiedBadge size="small" />
				{/if}
			</div>
			<h3 class="row-title group-hover:text-[var(--color-text)] transition-colors">
				{course.title}
			</h3>
			<p class="row-desc">
				{course.description || 'Hands-on curriculum with guided lab environments and assessment checkpoints.'}
			</p>
		</div>

		<!-- Metadata Column (Pacing & Faculty) -->
		<div class="row-meta-col">
			<span class="meta-item-top">{duration}</span>
			<span class="meta-item-sub">{instructor}</span>
		</div>

		<!-- Price & Action Indicator -->
		<div class="row-action-col">
			<span class="row-price">{priceFormatted}</span>
			<span class="row-arrow group-hover:translate-x-1 transition-transform">
				<ArrowRight size={15} />
			</span>
		</div>
	</div>
</a>

<style>
	.course-editorial-row {
		border-top: 1px solid var(--color-border);
		padding: 24px 0;
		text-decoration: none;
		transition: background-color var(--t-fast);
	}

	.course-editorial-row:last-of-type {
		border-bottom: 1px solid var(--color-border);
	}

	.course-editorial-row:hover {
		background: rgba(0, 0, 0, 0.015);
	}

	.row-inner {
		display: grid;
		grid-template-columns: 48px 1fr 180px 140px;
		align-items: baseline;
		gap: 24px;
	}

	.row-num-col {
		font-family: var(--font-mono);
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--color-text-muted);
	}

	.row-title-col {
		min-width: 0;
	}

	.row-title {
		font-size: 1.15rem;
		font-weight: 600;
		color: var(--color-text);
		letter-spacing: -0.015em;
		line-height: 1.3;
		margin-bottom: 4px;
	}

	.row-desc {
		font-size: 0.875rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
		max-width: 580px;
	}

	.row-meta-col {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.meta-item-top {
		font-size: 0.875rem;
		font-weight: 500;
		color: var(--color-text);
	}

	.meta-item-sub {
		font-size: 0.78125rem;
		color: var(--color-text-muted);
	}

	.row-action-col {
		display: flex;
		align-items: center;
		justify-content: flex-end;
		gap: 14px;
	}

	.row-price {
		font-family: var(--font-sans);
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--color-text);
		letter-spacing: -0.01em;
	}

	.row-arrow {
		color: var(--color-text-secondary);
		display: flex;
		align-items: center;
	}

	@media (max-width: 840px) {
		.row-inner {
			grid-template-columns: 36px 1fr auto;
			gap: 16px;
		}
		.row-meta-col {
			display: none;
		}
		.row-desc {
			white-space: normal;
			display: -webkit-box;
			-webkit-line-clamp: 2;
			-webkit-box-orient: vertical;
		}
	}

	@media (max-width: 600px) {
		.row-inner {
			grid-template-columns: 1fr;
			gap: 12px;
		}
		.row-num-col {
			display: none;
		}
		.row-action-col {
			justify-content: space-between;
			padding-top: 8px;
			border-top: 1px dashed var(--color-border-subtle);
		}
	}
</style>
