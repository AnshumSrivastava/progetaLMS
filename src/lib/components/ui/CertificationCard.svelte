<script lang="ts">
	import { ArrowRight, Shield, BookOpen, Clock, CheckCircle2 } from 'lucide-svelte';

	let { cert }: { cert: any } = $props();

	const level = $derived(cert.metadata?.level || 'Intermediate');
	const questions = $derived(cert.metadata?.questions || 20);
	const duration = $derived(cert.metadata?.duration || '60 min');
	const passingScore = $derived(cert.metadata?.passingScore || '75% Passing');
	const targetUrl = $derived(`/certifications/${cert.slug || cert.id}`);
</script>

<article class="dark-cert-card group">
	<div class="cert-header">
		<div class="cert-icon-container">
			<Shield size={22} class="text-sky-400" />
		</div>

		<div class="flex-1">
			<h3 class="cert-title">
				<a href={targetUrl} class="title-link">
					{cert.title}
				</a>
			</h3>
			<span class="cert-level-badge level-{level.toLowerCase()}">
				{level}
			</span>
		</div>
	</div>

	<p class="cert-desc">
		{cert.description || 'Rigorous hands-on examination covering industry domains with verifiable credential.'}
	</p>

	<!-- Specification Stats -->
	<div class="cert-stats-row">
		<span class="stat-item">
			<BookOpen size={13} class="text-slate-400" />
			<span>{questions} Questions</span>
		</span>
		<span class="stat-sep">•</span>
		<span class="stat-item">
			<Clock size={13} class="text-slate-400" />
			<span>{duration}</span>
		</span>
		<span class="stat-sep">•</span>
		<span class="stat-item text-emerald-400">
			<CheckCircle2 size={13} class="text-emerald-400" />
			<span>{passingScore}</span>
		</span>
	</div>

	<!-- Action Button -->
	<div class="cert-action-box">
		<a href={targetUrl} class="btn-take-exam">
			<span>Take Exam</span>
			<ArrowRight size={13} />
		</a>
	</div>
</article>

<style>
	.dark-cert-card {
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 22px;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
		gap: 16px;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.dark-cert-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-lg);
	}

	.cert-header {
		display: flex;
		align-items: flex-start;
		gap: 14px;
	}

	.cert-icon-container {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-md);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		color: var(--lp-accent);
	}

	.cert-title {
		font-size: 0.98rem;
		font-weight: 700;
		color: var(--color-text);
		line-height: 1.35;
		margin-bottom: 6px;
	}

	.title-link {
		color: var(--color-text);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.title-link:hover {
		color: var(--lp-accent);
	}

	.cert-level-badge {
		font-size: 0.65rem;
		font-weight: 700;
		padding: 2px 7px;
		border-radius: var(--radius-xs);
		background: var(--color-surface-elevated);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
		letter-spacing: 0.05em;
		text-transform: uppercase;
	}

	.cert-level-badge.level-intermediate { color: var(--color-info); }
	.cert-level-badge.level-advanced { color: var(--color-warning); }
	.cert-level-badge.level-beginner { color: var(--color-success); }

	.cert-desc {
		font-size: 0.8rem;
		color: var(--color-text-secondary);
		line-height: 1.5;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.cert-stats-row {
		display: flex;
		align-items: center;
		gap: 8px;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
		padding-bottom: 4px;
	}

	.stat-item {
		display: flex;
		align-items: center;
		gap: 5px;
	}

	.stat-sep {
		color: var(--color-border-strong);
	}

	.btn-take-exam {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		width: 100%;
		padding: 9px 16px;
		border-radius: var(--radius-full);
		font-size: 0.82rem;
		font-weight: 700;
		background: var(--color-text);
		color: var(--color-bg);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-take-exam:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>
