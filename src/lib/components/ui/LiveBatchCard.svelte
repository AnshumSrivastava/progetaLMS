<script lang="ts">
	import { Calendar, Users, Video, Clock, ArrowRight, ShieldCheck } from 'lucide-svelte';

	let { course }: { course: any } = $props();

	const category = $derived(course.metadata?.category || 'LIVE CLASSROOM COHORT');
	const level = $derived((course.metadata?.level || 'Intermediate').toUpperCase());
	const duration = $derived(course.metadata?.duration || course.metadata?.hours || '4-8 Weeks');
	const priceFormatted = $derived(
		!course.pricePaise || course.pricePaise === 0
			? 'Free'
			: `₹${(course.pricePaise / 100).toLocaleString('en-IN')}`
	);

	const topicHighlight = $derived(
		course.metadata?.topic ||
		course.metadata?.subtitle ||
		(course.title.includes('&') ? course.title.split('&')[1].trim() : course.title.split(':')[1]?.trim() || 'Interactive Live Bootcamp')
	);
</script>

<article class="live-cohort-card">
	<!-- Left Accent Visual Bar -->
	<div class="cohort-visual-strip">
		<div class="live-pill">
			<span class="live-pulsing-dot"></span>
			<span>LIVE COHORT</span>
		</div>
		<div class="cohort-meta-icon">
			<Video size={24} class="text-emerald-400" />
		</div>
		<span class="seat-badge">LIMITED SEATS</span>
	</div>

	<!-- Main Content Section -->
	<div class="cohort-details">
		<div class="cohort-header-row">
			<span class="cohort-kicker">{category}</span>
			<span class="cohort-level">{level}</span>
		</div>

		<h3 class="cohort-title">
			<a href={`/catalog/${course.id}`} class="title-link">
				{course.title}
			</a>
		</h3>

		<p class="cohort-desc">
			{course.description || 'Live instructor-led classes on Google Meet/Zoom, dedicated peer cohorts on WhatsApp, and mentored hands-on exercises.'}
		</p>

		<!-- Feature highlights -->
		<div class="cohort-perks">
			<div class="perk-pill">
				<Calendar size={13} class="text-emerald-500" />
				<span>Weekend & Evening Batches</span>
			</div>
			<div class="perk-pill">
				<Video size={13} class="text-emerald-500" />
				<span>Live Interactive Q&A</span>
			</div>
			<div class="perk-pill">
				<Clock size={13} class="text-emerald-500" />
				<span>{duration}</span>
			</div>
		</div>

		<!-- Footer with Pricing and Action -->
		<div class="cohort-footer">
			<div class="price-container">
				<span class="price-caption">Cohort Tuition</span>
				<div class="price-value">{priceFormatted}</div>
			</div>

			<a href={`/catalog/${course.id}`} class="btn-enroll-cohort">
				<span>Explore Live Batches</span>
				<ArrowRight size={14} />
			</a>
		</div>
	</div>
</article>

<style>
	.live-cohort-card {
		display: grid;
		grid-template-columns: 140px 1fr;
		background: var(--bg-elevated, #ffffff);
		border: 1px solid rgba(16, 185, 129, 0.25);
		border-radius: 18px;
		overflow: hidden;
		box-shadow: 0 4px 20px -4px rgba(16, 185, 129, 0.08), 0 2px 6px -1px rgba(0, 0, 0, 0.03);
		transition: transform 0.2s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.2s ease, border-color 0.2s ease;
		min-height: 200px;
		width: 100%;
		position: relative;
	}

	.live-cohort-card:hover {
		transform: translateY(-3px);
		border-color: rgba(16, 185, 129, 0.5);
		box-shadow: 0 16px 32px -6px rgba(16, 185, 129, 0.16), 0 6px 12px -2px rgba(0, 0, 0, 0.05);
	}

	:global([data-theme="dark"]) .live-cohort-card {
		background: #10141e;
		border-color: rgba(16, 185, 129, 0.2);
	}

	:global([data-theme="dark"]) .live-cohort-card:hover {
		border-color: rgba(52, 211, 153, 0.4);
		box-shadow: 0 16px 32px -6px rgba(0, 0, 0, 0.6);
	}

	/* Left Visual Strip */
	.cohort-visual-strip {
		background: linear-gradient(135deg, #064e3b 0%, #065f46 100%);
		padding: 20px 14px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		align-items: center;
		text-align: center;
		color: #ffffff;
	}

	.live-pill {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: rgba(0, 0, 0, 0.35);
		border: 1px solid rgba(52, 211, 153, 0.3);
		padding: 3px 8px;
		border-radius: 9999px;
		font-size: 0.625rem;
		font-weight: 800;
		letter-spacing: 0.06em;
		color: #34d399;
	}

	.live-pulsing-dot {
		width: 6px;
		height: 6px;
		background: #10b981;
		border-radius: 9999px;
		box-shadow: 0 0 6px #34d399;
		animation: pulse-dot 1.5s infinite;
	}

	@keyframes pulse-dot {
		0%, 100% { opacity: 1; transform: scale(1); }
		50% { opacity: 0.4; transform: scale(0.8); }
	}

	.cohort-meta-icon {
		background: rgba(255, 255, 255, 0.1);
		border-radius: 12px;
		padding: 10px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.seat-badge {
		font-size: 0.58rem;
		font-weight: 700;
		letter-spacing: 0.05em;
		color: #a7f3d0;
		text-transform: uppercase;
	}

	/* Main Details */
	.cohort-details {
		padding: 20px 24px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.cohort-header-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		margin-bottom: 8px;
	}

	.cohort-kicker {
		font-size: 0.6875rem;
		font-weight: 700;
		letter-spacing: 0.08em;
		color: #059669;
		text-transform: uppercase;
	}

	:global([data-theme="dark"]) .cohort-kicker {
		color: #34d399;
	}

	.cohort-level {
		font-size: 0.6875rem;
		font-weight: 600;
		color: var(--text-muted, #94a3b8);
	}

	.cohort-title {
		font-size: clamp(1.2rem, 1.8vw, 1.45rem);
		font-weight: 700;
		line-height: 1.3;
		letter-spacing: -0.02em;
		margin-bottom: 6px;
	}

	.title-link {
		color: var(--text-primary, #0f172a);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.title-link:hover {
		color: #059669;
	}

	:global([data-theme="dark"]) .title-link:hover {
		color: #34d399;
	}

	.cohort-desc {
		font-size: 0.8125rem;
		color: var(--text-secondary, #64748b);
		line-height: 1.5;
		margin-bottom: 14px;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.cohort-perks {
		display: flex;
		flex-wrap: wrap;
		gap: 8px;
		margin-bottom: 16px;
	}

	.perk-pill {
		display: inline-flex;
		align-items: center;
		gap: 5px;
		font-size: 0.72rem;
		font-weight: 600;
		color: var(--text-secondary, #475569);
		background: var(--bg-subtle, #f1f5f9);
		padding: 3px 8px;
		border-radius: 6px;
		border: 1px solid var(--border);
	}

	:global([data-theme="dark"]) .perk-pill {
		background: #161d2b;
		color: #cbd5e1;
	}

	/* Footer */
	.cohort-footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: 12px;
		padding-top: 12px;
		border-top: 1px dashed var(--border);
		margin-top: auto;
	}

	.price-container {
		display: flex;
		flex-direction: column;
	}

	.price-caption {
		font-size: 0.65rem;
		text-transform: uppercase;
		font-weight: 600;
		color: var(--text-muted);
		letter-spacing: 0.05em;
	}

	.price-value {
		font-size: 1.2rem;
		font-weight: 800;
		color: #059669;
		letter-spacing: -0.02em;
	}

	:global([data-theme="dark"]) .price-value {
		color: #34d399;
	}

	.btn-enroll-cohort {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		padding: 8px 20px;
		border-radius: 9999px;
		background: #059669;
		color: #ffffff;
		font-size: 0.8125rem;
		font-weight: 600;
		text-decoration: none;
		box-shadow: 0 4px 12px -2px rgba(5, 150, 105, 0.35);
		transition: all 0.15s ease;
	}

	.btn-enroll-cohort:hover {
		background: #047857;
		transform: scale(1.02);
		box-shadow: 0 6px 16px -2px rgba(5, 150, 105, 0.45);
	}

	@media (max-width: 639px) {
		.live-cohort-card {
			grid-template-columns: 1fr;
		}

		.cohort-visual-strip {
			flex-direction: row;
			justify-content: space-between;
			padding: 12px 18px;
		}
	}
</style>
