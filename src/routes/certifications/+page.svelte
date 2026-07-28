<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { CheckCircle2 } from 'lucide-svelte';

	let { data } = $props();

	const levelColor: Record<string, string> = {
		Beginner:     'rgba(16, 185, 129, 0.12)',
		Intermediate: 'rgba(245, 158, 11, 0.12)',
		Advanced:     'rgba(94, 106, 210, 0.12)',
	};
	const levelText: Record<string, string> = {
		Beginner:     '#10b981',
		Intermediate: '#f59e0b',
		Advanced:     '#5e6ad2',
	};
</script>

<svelte:head>
	<title>Certifications — {APP_NAME}</title>
	<meta name="description" content="Earn verifiable certifications by passing rigorous assessments." />
</svelte:head>

<!-- Header -->
<div style="padding: 56px 0 40px; border-bottom: 1px solid var(--border);">
	<div class="container">
		<p style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Certifications</p>
		<h1 style="font-size: clamp(1.75rem, 3vw, 2.5rem); margin-bottom: 12px;">Prove Your Skills</h1>
		<p style="max-width: 480px;">Pass a rigorous, timed assessment and receive a permanent, verifiable certificate linked to your profile.</p>
	</div>
</div>

<!-- How it works — 3-step strip -->
<div style="border-bottom: 1px solid var(--border);">
	<div class="container" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 1px; background: var(--border);">
		{#each ['Choose a certification', 'Pass the assessment', 'Own your certificate'] as step, i}
			<div style="background: var(--bg); padding: 28px 24px; display: flex; gap: 16px; align-items: flex-start;">
				<span style="font-size: 0.75rem; font-weight: 600; color: var(--text-muted); min-width: 20px; margin-top: 2px;">{String(i + 1).padStart(2, '0')}</span>
				<p style="font-size: 0.875rem; font-weight: 500; color: var(--text-primary);">{step}</p>
			</div>
		{/each}
	</div>
</div>

<!-- Cert list -->
<div style="padding: 48px 0 80px;">
	<div class="container" style="display: flex; flex-direction: column; gap: 1px; background: var(--border);">
		{#each data.certs as cert}
			<div
				style="background: var(--bg); padding: 28px 32px; display: flex; flex-wrap: wrap; gap: 20px; align-items: center; transition: background var(--t-fast); cursor: pointer;"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
				role="article"
			>
				<CheckCircle2 size={20} style="color: var(--text-muted); flex-shrink: 0;" />

				<div style="flex: 1; min-width: 220px;">
					<div style="display: flex; align-items: center; gap: 10px; margin-bottom: 6px;">
						<h3 style="font-size: 0.9375rem;">{cert.title}</h3>
						<span
							style="font-size: 0.6875rem; font-weight: 500; padding: 2px 8px; border-radius: 9999px;
							       background: {levelColor[cert.metadata?.level || 'Intermediate'] || levelColor.Intermediate}; color: {levelText[cert.metadata?.level || 'Intermediate'] || levelText.Intermediate};"
						>
							{cert.metadata?.level || 'Intermediate'}
						</span>
					</div>
					<p style="font-size: 0.8125rem;">{cert.description}</p>
				</div>

				<div style="display: flex; gap: 24px; flex-shrink: 0;">
					<div style="text-align: right;">
						<p style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 2px;">Questions</p>
						<p style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">{cert.metadata?.questions || 0}</p>
					</div>
					<div style="text-align: right;">
						<p style="font-size: 0.6875rem; color: var(--text-muted); margin-bottom: 2px;">Duration</p>
						<p style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">{cert.metadata?.duration || '60 min'}</p>
					</div>
					<a
						href={`/certifications/${cert.id}`}
						style="display: inline-block; padding: 8px 20px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; cursor: pointer; text-decoration: none; font-family: inherit; transition: opacity var(--t-fast); white-space: nowrap;"
						onmouseenter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
						onmouseleave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
					>
						View Details
					</a>
				</div>
			</div>
		{/each}
	</div>
</div>
