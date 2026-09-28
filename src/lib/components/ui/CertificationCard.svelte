<script lang="ts">
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import { ArrowRight, Award, ShieldCheck, CheckCircle2 } from 'lucide-svelte';

	let { cert }: { cert: any } = $props();

	const level = (cert.metadata?.level || 'Intermediate').toUpperCase();
	const questions = cert.metadata?.questions || 20;
	const duration = cert.metadata?.duration || '45 Mins';
	const passingScore = cert.metadata?.passingScore || '75%';
	const isVerified = cert.metadata?.verified ?? true;
	const isProctored = cert.metadata?.isProctored !== false;
	const free = !cert.pricePaise || cert.pricePaise === 0;
	const priceFormatted = free ? 'Free' : `₹${(cert.pricePaise / 100).toLocaleString('en-IN')}`;
</script>

<article class="workly-card cert-card">
	<!-- Top Row: Price / Credit Chip & Verified Badge -->
	<div class="card-top-row">
		<div class="credit-chip">
			<span class="coin-icon"></span>
			<span class="credit-text">{priceFormatted}</span>
		</div>
		<div class="flex items-center gap-1.5">
			{#if isProctored}
				<span class="proctored-badge">Proctored</span>
			{/if}
			{#if isVerified}
				<VerifiedBadge size={14} />
			{/if}
		</div>
	</div>

	<!-- Title -->
	<h3 class="card-heading">
		<a href={`/certifications/${cert.id}`} class="heading-link">
			{cert.title}
		</a>
	</h3>

	<!-- Category Pill Tag -->
	<div class="tag-row">
		<span class="workly-pill tag-purple">
			Certification Exam
		</span>
		<span class="level-text">{level}</span>
	</div>

	<!-- Description -->
	<p class="card-summary">
		{cert.description || 'Verified examination. Passing candidates receive a permanent, cryptographic credential.'}
	</p>

	<!-- Specification Grid (Image 2 Matrix Inspiration) -->
	<div class="spec-matrix">
		<div class="spec-cell">
			<span class="spec-key">QUESTIONS</span>
			<span class="spec-val">{questions} Qs</span>
		</div>
		<div class="spec-cell">
			<span class="spec-key">DURATION</span>
			<span class="spec-val">{duration}</span>
		</div>
		<div class="spec-cell">
			<span class="spec-key">PASSING</span>
			<span class="spec-val">{passingScore}</span>
		</div>
	</div>

	<!-- Bottom Row -->
	<div class="card-bottom-row">
		<div class="attempts-meta">
			<Award size={15} class="award-icon" />
			<span>Permanent Credential</span>
		</div>

		<div class="footer-actions">
			<a href={`/checkout/${cert.id}`} class="btn-enroll">
				<span>Take Exam</span>
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

	.proctored-badge {
		font-size: 0.6875rem;
		font-weight: 700;
		color: #2563eb;
		background: rgba(37, 99, 235, 0.08);
		border: 1px solid rgba(37, 99, 235, 0.2);
		padding: 2px 7px;
		border-radius: 4px;
		text-transform: uppercase;
		letter-spacing: 0.03em;
	}

	:global([data-theme="dark"]) .proctored-badge {
		background: rgba(37, 99, 235, 0.2);
		color: #93c5fd;
		border-color: rgba(37, 99, 235, 0.35);
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
		letter-spacing: 0.01em;
	}

	.tag-purple {
		background: #faf5ff;
		color: #7c3aed;
		border: 1px solid #ede9fe;
	}
	:global([data-theme="dark"]) .tag-purple {
		background: rgba(124, 58, 237, 0.15);
		color: #c4b5fd;
		border-color: rgba(124, 58, 237, 0.3);
	}

	.level-text {
		font-size: 0.72rem;
		font-weight: 500;
		color: var(--text-muted, #94a3b8);
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

	/* Matrix Spec Strip */
	.spec-matrix {
		display: grid;
		grid-template-columns: repeat(3, 1fr);
		background: var(--bg-subtle, #f8fafc);
		border: 1px solid var(--border);
		border-radius: 8px;
		padding: 10px 12px;
		margin-bottom: 18px;
		gap: 8px;
	}

	.spec-cell {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.spec-key {
		font-size: 0.625rem;
		font-weight: 700;
		color: var(--text-muted, #94a3b8);
		letter-spacing: 0.04em;
	}

	.spec-val {
		font-size: 0.8125rem;
		font-weight: 600;
		color: var(--text-primary, #0f172a);
	}

	.card-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 14px;
		border-top: 1px solid var(--border);
		margin-top: auto;
	}

	.attempts-meta {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary, #64748b);
	}

	.award-icon {
		color: #f59e0b;
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
