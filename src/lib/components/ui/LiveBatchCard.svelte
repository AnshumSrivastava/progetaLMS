<script lang="ts">
	import { Calendar, Users, Video, Clock, ArrowRight } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const category = $derived(course.metadata?.category || 'CYBERSECURITY');
	const level = $derived(course.metadata?.level || 'Intermediate');
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '4-8 Weeks');
	const seats = $derived(course.metadata?.seats || course.max_students || '25 Seats');
	const startDate = $derived(course.metadata?.startDate || course.start_date || 'Upcoming Batch');
	const free = $derived(!course.pricePaise || course.pricePaise === 0);
	const priceFormatted = $derived(free ? 'Free' : `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`);
	const targetUrl = $derived(`/catalog/${course.slug || course.id}`);
	const thumbnail = $derived(course.thumbnail || '/thumbnails/practical-cybersecurity.jpg');
</script>

<article class="dark-live-card group">
	<!-- Visual Banner -->
	<div class="card-visual-wrap">
		<img
			src={thumbnail}
			alt={course.title}
			class="card-img"
			loading="lazy"
		/>
		<div class="card-gradient"></div>

		<div class="card-top-badges">
			<span class="live-pill">
				<span class="pulsing-green-dot"></span>
				<span>LIVE BATCH</span>
			</span>
			<span class="category-pill">{category}</span>
		</div>
	</div>

	<!-- Card Body -->
	<div class="card-body">
		<div class="level-indicator">
			<span>{level}</span>
		</div>

		<h3 class="card-title">
			<a href={targetUrl} class="title-link">
				{course.title}
			</a>
		</h3>

		<p class="card-desc">
			{course.description || 'Interactive live cohort with live practitioner sessions, real-world capstone projects, and peer discussions.'}
		</p>

		<!-- Schedule & Seats Row -->
		<div class="meta-row">
			<div class="meta-item">
				<Calendar size={13} class="text-slate-400" />
				<span>{startDate}</span>
			</div>
			<div class="meta-item">
				<Users size={13} class="text-slate-400" />
				<span>{seats}</span>
			</div>
		</div>

		<!-- Footer CTA -->
		<div class="card-footer">
			<div class="price-box">
				<span class="price-label">Tuition</span>
				<span class="price-value">{priceFormatted}</span>
			</div>

			<a href={targetUrl} class="btn-enroll">
				<span>View Batch</span>
				<ArrowRight size={13} />
			</a>
		</div>
	</div>
</article>

<style>
	.dark-live-card {
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		overflow: hidden;
		display: flex;
		flex-direction: column;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.dark-live-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-lg);
	}

	.card-visual-wrap {
		position: relative;
		width: 100%;
		height: 170px;
		background: var(--color-bg);
		overflow: hidden;
	}

	.card-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
		opacity: 0.85;
		transition: transform 0.3s ease;
	}

	.dark-live-card:hover .card-img {
		transform: scale(1.04);
	}

	.card-gradient {
		position: absolute;
		inset: 0;
		background: linear-gradient(180deg, rgba(8, 11, 17, 0.1) 0%, var(--color-surface) 100%);
	}

	.card-top-badges {
		position: absolute;
		top: 12px;
		left: 12px;
		right: 12px;
		display: flex;
		align-items: center;
		justify-content: space-between;
		z-index: 2;
	}

	.live-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 3px 8px;
		border-radius: var(--radius-full);
		font-size: 0.65rem;
		font-weight: 800;
		background: var(--color-success-bg);
		border: 1px solid var(--color-success-border);
		color: var(--color-success);
		letter-spacing: 0.05em;
	}

	.pulsing-green-dot {
		width: 5px;
		height: 5px;
		border-radius: var(--radius-full);
		background: var(--color-success);
		box-shadow: 0 0 6px var(--color-success);
	}

	.category-pill {
		padding: 3px 8px;
		border-radius: var(--radius-xs);
		font-size: 0.65rem;
		font-weight: 700;
		background: var(--color-surface-subtle);
		border: 1px solid var(--color-border);
		color: var(--color-text-secondary);
		letter-spacing: 0.04em;
	}

	.card-body {
		padding: 20px;
		display: flex;
		flex-direction: column;
		flex: 1;
		justify-content: space-between;
	}

	.level-indicator {
		font-size: 0.68rem;
		font-weight: 600;
		color: var(--color-text-muted);
		margin-bottom: 6px;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.card-title {
		font-size: 1.05rem;
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
		margin-bottom: 16px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.meta-row {
		display: flex;
		align-items: center;
		gap: 16px;
		padding-bottom: 14px;
		border-bottom: 1px solid var(--color-border-subtle);
		margin-bottom: 14px;
	}

	.meta-item {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.74rem;
		color: var(--color-text-secondary);
	}

	.card-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		margin-top: auto;
	}

	.price-box {
		display: flex;
		flex-direction: column;
	}

	.price-label {
		font-size: 0.65rem;
		color: var(--color-text-muted);
		text-transform: uppercase;
	}

	.price-value {
		font-size: 1.05rem;
		font-weight: 800;
		color: var(--color-text);
	}

	.btn-enroll {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 16px;
		border-radius: var(--radius-full);
		font-size: 0.78rem;
		font-weight: 700;
		background: var(--color-text);
		color: var(--color-bg);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-enroll:hover {
		opacity: 0.9;
		transform: translateX(2px);
	}
</style>
