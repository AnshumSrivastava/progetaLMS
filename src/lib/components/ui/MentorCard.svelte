<script lang="ts">
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import { ArrowRight, Calendar, Star, User } from 'lucide-svelte';

	let { mentor }: { mentor: any } = $props();

	const isVerified = $derived(mentor.isVerified ?? true);
	const experience = $derived(mentor.yearsExp || mentor.experienceYears ? `${mentor.yearsExp || mentor.experienceYears}+ yrs exp` : 'Practitioner');
	const basePricePaise = $derived(mentor.lowestPricePaise ?? mentor.startingPricePaise ?? (mentor.pricing && mentor.pricing[0]?.pricePaise) ?? 80000);
	const priceFormatted = $derived(`₹${(basePricePaise / 100).toLocaleString('en-IN')}`);
	const specialties = $derived((mentor.specialties || []).slice(0, 3));
	const targetUrl = $derived(mentor.profileUrl || `/mentoring/${mentor.handle || mentor.id}`);
</script>

<article class="workly-card mentor-card">
	<!-- Top Row: Price / Credit Chip & Verified Badge -->
	<div class="card-top-row">
		<div class="credit-chip">
			<span class="coin-icon"></span>
			<span class="credit-text">{priceFormatted}</span>
			<span class="credit-sub">/ 30m</span>
		</div>
		{#if isVerified}
			<VerifiedBadge size={14} />
		{/if}
	</div>

	<!-- Name & Avatar Row -->
	<div class="mentor-info-row">
		<div class="mentor-avatar-box">
			{#if mentor.avatarUrl}
				<img src={mentor.avatarUrl} alt={mentor.name} class="avatar-img" />
			{:else}
				<span class="avatar-fallback">{mentor.name ? mentor.name.slice(0, 2).toUpperCase() : 'ME'}</span>
			{/if}
		</div>
		<div>
			<h3 class="card-heading">
				<a href={targetUrl} class="heading-link">
					{mentor.name}
				</a>
			</h3>
			<span class="experience-sub">{experience}</span>
		</div>
	</div>

	<!-- Specialty Pills -->
	<div class="tag-row">
		{#each specialties as tag}
			<span class="workly-pill tag-blue">
				{tag}
			</span>
		{/each}
	</div>

	<!-- Headline / Short Bio -->
	<p class="card-summary">
		{mentor.headline || mentor.bio || 'Vetted practitioner offering technical mentoring, architecture review, and code guidance.'}
	</p>

	<!-- Bottom Row -->
	<div class="card-bottom-row">
		<div class="availability-meta">
			<Calendar size={15} class="cal-icon" />
			<span>1-on-1 Sessions</span>
		</div>

		<div class="footer-actions">
			<a href={targetUrl} class="btn-enroll">
				<span>Book Session</span>
				<ArrowRight size={13} />
			</a>
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

	.coin-icon {
		width: 8px;
		height: 8px;
		border-radius: 50%;
		background: #f59e0b;
		box-shadow: 0 0 0 2px rgba(245, 158, 11, 0.25);
	}

	.credit-text {
		font-size: 0.8125rem;
		font-weight: 700;
		color: #b45309;
		letter-spacing: -0.01em;
	}

	:global([data-theme="dark"]) .credit-text {
		color: #fbbf24;
	}

	.credit-sub {
		font-size: 0.6875rem;
		color: var(--text-muted, #94a3b8);
	}

	.mentor-info-row {
		display: flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 12px;
	}

	.mentor-avatar-box {
		width: 44px;
		height: 44px;
		border-radius: 50%;
		overflow: hidden;
		background: var(--bg-subtle, #f1f5f9);
		border: 2px solid var(--border);
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-fallback {
		font-size: 0.875rem;
		font-weight: 700;
		color: var(--text-primary);
	}

	.card-heading {
		font-size: 1.125rem;
		font-weight: 700;
		line-height: 1.3;
		margin-bottom: 2px;
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

	.experience-sub {
		font-size: 0.75rem;
		font-weight: 500;
		color: var(--text-muted, #94a3b8);
	}

	.tag-row {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 6px;
		margin-bottom: 12px;
	}

	.workly-pill {
		font-size: 0.72rem;
		font-weight: 600;
		padding: 3px 9px;
		border-radius: 6px;
		display: inline-block;
		letter-spacing: 0.01em;
	}

	.tag-blue {
		background: #eff6ff;
		color: #2563eb;
		border: 1px solid #dbeafe;
	}
	:global([data-theme="dark"]) .tag-blue {
		background: rgba(37, 99, 235, 0.15);
		color: #93c5fd;
		border-color: rgba(37, 99, 235, 0.3);
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

	.card-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.availability-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #64748b);
	}

	.cal-icon {
		color: #6366f1;
	}

	.btn-enroll {
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

	.btn-enroll:hover {
		background: #4f46e5;
		transform: scale(1.02);
	}
</style>
