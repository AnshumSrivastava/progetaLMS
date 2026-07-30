<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { page } from '$app/stores';
	import { CheckCircle2, AlertTriangle, ShieldCheck, Clock, BookOpen, GraduationCap } from 'lucide-svelte';

	let { data } = $props();
</script>

<svelte:head>
	<title>{data.cert.title} — {APP_NAME} Certifications</title>
</svelte:head>

<div class="cert-page">
	<div class="cert-header">
		<div class="container">
			<a href="/certifications" class="back-link">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
				Back to Certifications
			</a>
			<div class="badge">{data.cert.metadata?.level || 'Advanced'}</div>
			<h1>{data.cert.title}</h1>
			<p class="desc">{data.cert.description}</p>
			
			<div class="meta-stats">
				<div class="stat"><Clock size={18} /> {data.cert.metadata?.duration || 120} min</div>
				<div class="stat"><BookOpen size={18} /> {data.cert.metadata?.questions || 80} Questions</div>
				{#if data.cert.metadata?.isProctored !== false}
					<div class="stat"><ShieldCheck size={18} /> Proctored</div>
				{/if}
			</div>
		</div>
	</div>

	<div class="container content-grid">
		<div class="main-column">
			{#if data.cert.metadata?.syllabus && data.cert.metadata.syllabus.length > 0}
				<section class="info-section">
					<h2>Exam Syllabus</h2>
					<ul class="syllabus-list">
						{#each data.cert.metadata.syllabus as topic}
							<li><CheckCircle2 size={18} class="icon-check" /> {topic}</li>
						{/each}
					</ul>
				</section>
			{/if}

			{#if data.cert.metadata?.rules && data.cert.metadata.rules.length > 0}
				<section class="info-section rules-section">
					<h2><AlertTriangle size={20} class="icon-warn" /> Exam Rules & Conditions</h2>
					{#if data.cert.metadata?.isProctored !== false}
						<p class="rules-intro">This is a strictly proctored exam. Please read the following conditions carefully before purchasing.</p>
					{/if}
					<ul class="rules-list">
						{#each data.cert.metadata.rules as rule}
							<li>{rule}</li>
						{/each}
					</ul>
				</section>
			{/if}
		</div>

		<div class="sidebar">
			<div class="purchase-card">
				<h3>Purchase Exam</h3>
				<div class="price-row">
					<span class="price">{data.cert.pricePaise === 0 ? 'Free' : `₹${(data.cert.pricePaise / 100).toFixed(2)}`}</span>
					<span class="passing-score">Passing Score: <strong>{data.cert.metadata?.passingScore || '75%'}</strong></span>
				</div>
				<p class="card-note">Includes one exam attempt and a verifiable digital certificate upon passing.</p>
				
				<a href={`/checkout/${data.cert.id}`} class="buy-btn">Buy Exam</a>
				
				<div class="guarantee">
					<ShieldCheck size={16} /> 100% Secure Checkout
				</div>
			</div>
		</div>
	</div>
</div>

<style>
	.cert-page {
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg);
	}
	.container {
		max-width: 1100px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.cert-header {
		background: var(--bg-subtle);
		border-bottom: 1px solid var(--border);
		padding: 3rem 0;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 2rem;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--text-primary);
	}
	.badge {
		display: inline-block;
		background: var(--accent-muted);
		color: var(--accent);
		padding: 4px 12px;
		border-radius: 999px;
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: 1rem;
	}
	.cert-header h1 {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		margin-bottom: 1rem;
		letter-spacing: -0.02em;
	}
	.desc {
		font-size: 1.1rem;
		color: var(--text-secondary);
		max-width: 700px;
		line-height: 1.6;
		margin-bottom: 2rem;
	}
	.meta-stats {
		display: flex;
		gap: 24px;
		align-items: center;
		flex-wrap: wrap;
	}
	.stat {
		display: flex;
		align-items: center;
		gap: 8px;
		color: var(--text-primary);
		font-weight: 500;
		font-size: 0.95rem;
	}

	.content-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 4rem;
		padding-top: 4rem;
		padding-bottom: 6rem;
	}

	.info-section {
		margin-bottom: 3.5rem;
	}
	.info-section h2 {
		font-size: 1.5rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
		display: flex;
		align-items: center;
		gap: 10px;
	}

	.syllabus-list {
		list-style: none;
		padding: 0;
		display: flex;
		flex-direction: column;
		gap: 16px;
	}
	.syllabus-list li {
		display: flex;
		align-items: flex-start;
		gap: 12px;
		font-size: 1.05rem;
		color: var(--text-secondary);
	}
	.icon-check {
		color: #10b981;
		flex-shrink: 0;
		margin-top: 2px;
	}

	.rules-section {
		background: rgba(245, 158, 11, 0.05);
		border: 1px solid rgba(245, 158, 11, 0.2);
		border-radius: 12px;
		padding: 2rem;
	}
	.icon-warn {
		color: #f59e0b;
	}
	.rules-intro {
		color: var(--text-secondary);
		margin-bottom: 1.5rem;
		font-size: 0.95rem;
	}
	.rules-list {
		padding-left: 20px;
		color: var(--text-secondary);
		font-size: 0.95rem;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}

	/* Sidebar Purchase Card */
	.purchase-card {
		background: var(--bg);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: var(--shadow-xl);
		border: 1px solid var(--border-subtle);
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
	}
	.purchase-card h3 {
		font-size: 1.2rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}
	.price-row {
		display: flex;
		align-items: flex-end;
		justify-content: space-between;
		margin-bottom: 1rem;
		border-bottom: 1px solid var(--border);
		padding-bottom: 1rem;
	}
	.price {
		font-size: 2.5rem;
		font-weight: 800;
		color: var(--text-primary);
		line-height: 1;
	}
	.passing-score {
		font-size: 0.85rem;
		color: var(--text-muted);
	}
	.passing-score strong {
		color: var(--text-primary);
	}
	.card-note {
		font-size: 0.85rem;
		color: var(--text-secondary);
		line-height: 1.5;
		margin-bottom: 2rem;
	}
	.buy-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 100%;
		padding: 14px;
		background: var(--accent-gradient);
		color: #fff;
		text-decoration: none;
		border-radius: 8px;
		font-weight: 700;
		font-size: 1.05rem;
		transition: opacity 0.2s, transform 0.2s, box-shadow 0.2s;
		box-shadow: var(--shadow-md);
		margin-bottom: 1rem;
	}
	.buy-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}
	.guarantee {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		color: var(--text-muted);
		font-size: 0.8rem;
		font-weight: 500;
	}

	@media (max-width: 900px) {
		.content-grid {
			grid-template-columns: 1fr;
			gap: 2rem;
		}
		.purchase-card {
			position: static;
		}
	}
</style>
