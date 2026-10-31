<script lang="ts">
	import { ArrowRight, Clock, BookOpen, Layers } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const category = $derived(course.metadata?.category || (course.deliveryFormat === 'live_batch' ? 'LIVE BATCH' : 'SELF-PACED'));
	const level = $derived(course.metadata?.level || 'Intermediate');
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '8 Hours');
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`);
	const targetUrl = $derived(`/catalog/${course.slug || course.id}`);
	const thumbnail = $derived(course.thumbnail || '/thumbnails/course-pentest.jpg');
</script>

<article class="dark-course-card group">
	<!-- Thumbnail Header -->
	<a href={targetUrl} class="thumb-wrap" tabindex="-1">
		<img
			src={thumbnail}
			alt={course.title}
			class="thumb-img"
			loading="lazy"
		/>
		<div class="thumb-gradient"></div>

		<div class="thumb-top-badges">
			<span class="category-badge">{category}</span>
			<span class="level-badge level-{level.toLowerCase()}">{level}</span>
		</div>
	</a>

	<!-- Content Body -->
	<div class="card-body">
		<h3 class="card-title">
			<a href={targetUrl} class="title-link">
				{course.title}
			</a>
		</h3>

		{#if course.description}
			<p class="card-desc">
				{course.description}
			</p>
		{/if}

		<!-- Bottom Row -->
		<div class="card-footer">
			<div class="meta-info">
				<span class="meta-item">
					<Clock size={12} class="text-slate-400" />
					<span>{duration}</span>
				</span>
				<span class="meta-sep">•</span>
				<span class="price-tag" class:price-free={free}>
					{priceFormatted}
				</span>
			</div>

			<a href={targetUrl} class="circle-action-btn" aria-label={`View ${course.title}`}>
				<ArrowRight size={13} />
			</a>
		</div>
	</div>
</article>

<style>
	.dark-course-card {
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.dark-course-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-lg);
	}

	.thumb-wrap {
		position: relative;
		width: 100%;
		height: 160px;
		background: var(--color-bg);
		overflow: hidden;
		display: block;
	}

	.thumb-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.85;
		transition: transform 0.3s ease;
	}

	.dark-course-card:hover .thumb-img {
		transform: scale(1.04);
	}

	.thumb-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(8, 11, 17, 0.1) 0%, var(--color-surface) 100%);
	}

	.thumb-top-badges {
		position: absolute;
		top: 12px;
		left: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 2;
	}

	.category-badge {
		padding: 3px 8px;
		border-radius: var(--radius-xs);
		font-size: 0.65rem;
		font-weight: 700;
		background: var(--color-surface-subtle);
		color: var(--lp-accent);
		border: 1px solid var(--lp-accent-border);
		backdrop-filter: blur(6px);
		letter-spacing: 0.04em;
		text-transform: uppercase;
	}

	.level-badge {
		padding: 3px 8px;
		border-radius: var(--radius-xs);
		font-size: 0.65rem;
		font-weight: 700;
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		text-transform: capitalize;
	}

	.level-badge.level-beginner { color: var(--color-success); border-color: var(--color-success-border); }
	.level-badge.level-intermediate { color: var(--color-info); border-color: rgba(56, 189, 248, 0.3); }
	.level-badge.level-advanced { color: var(--color-warning); border-color: rgba(245, 158, 11, 0.3); }

	.card-body {
		padding: 18px;
		display: flex;
		flex-direction: column;
		flex: 1;
		justify-content: space-between;
	}

	.card-title {
		font-size: 1rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.35;
		margin-bottom: 8px;
	}

	.title-link {
		color: var(--color-text);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.title-link:hover {
		color: var(--lp-accent);
	}

	.card-desc {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		margin-bottom: 14px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
		padding-top: 14px;
		border-top: 1px solid var(--color-border-subtle);
	}

	.meta-info {
		display: flex;
		align-items: center;
		gap: 8px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 5px;
		font-size: 0.74rem;
		color: var(--color-text-secondary);
	}

	.meta-sep {
		color: var(--color-border-strong);
		font-size: 0.7rem;
	}

	.price-tag {
		font-size: 0.82rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.price-free {
		color: var(--color-success);
	}

	.circle-action-btn {
		width: 32px;
		height: 32px;
		border-radius: var(--radius-full);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--color-text-secondary);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.dark-course-card:hover .circle-action-btn {
		background: var(--color-text);
		color: var(--color-bg);
		transform: translateX(2px);
	}
</style>
