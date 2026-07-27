<script lang="ts">
	import Button from '$lib/components/ui/Button.svelte';
	import { ArrowRight, BookOpen, FileBadge2, Users } from 'lucide-svelte';

	const features = [
		{
			icon: BookOpen,
			title: 'Digital Assets',
			desc: 'Purchase and permanently own PDFs, guides, templates, and premium resources. No subscriptions, no expiring access.',
		},
		{
			icon: FileBadge2,
			title: 'Certifications',
			desc: 'Pass rigorous assessments to earn verifiable certificates. Prove your expertise with a permanent public link.',
		},
		{
			icon: Users,
			title: 'Expert Mentorship',
			desc: 'Book 1-on-1 sessions with industry professionals. Get code reviews, guidance, and accountability.',
		},
	];
</script>

<svelte:head>
	<title>Launchpad — Own Your Learning</title>
	<meta name="description" content="A modern platform for owning digital learning assets, earning verifiable certifications, and accessing expert mentorship." />
</svelte:head>

<!-- Hero -->
<section style="padding: 96px 0 80px; border-bottom: 1px solid var(--border);">
	<div class="container">
		<div style="max-width: 640px;" class="animate-fade-up">
			<div class="chip" style="margin-bottom: 32px;">
				Currently in early access
			</div>

			<h1 style="margin-bottom: 20px;">
				Own Your<br>Learning Journey
			</h1>

			<p style="font-size: 1.0625rem; max-width: 480px; margin-bottom: 36px;">
				Move beyond video subscriptions. Collect digital assets, earn verifiable certifications, and learn from experts — permanently.
			</p>

			<div style="display: flex; gap: 10px; flex-wrap: wrap;">
				<Button variant="primary" size="lg">
					<a href="/catalog" style="color: inherit; display: flex; align-items: center; gap: 6px;">
						Browse catalog <ArrowRight size={15} />
					</a>
				</Button>
				<Button variant="secondary" size="lg">
					<a href="/certifications" style="color: inherit;">
						View certifications
					</a>
				</Button>
			</div>
		</div>
	</div>
</section>

<!-- Features -->
<section style="padding: 80px 0;">
	<div class="container">
		<div style="margin-bottom: 48px;" class="animate-fade-up">
			<p style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">
				What we offer
			</p>
			<h2 style="max-width: 400px;">Three pillars of lasting knowledge</h2>
		</div>

		<div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 1px; background: var(--border);">
			{#each features as feat, i}
				<div
					class="animate-fade-up delay-{(i + 1) * 100}"
					style="background: var(--bg); padding: 32px; transition: background var(--t-fast);"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
					role="presentation"
				>
					<svelte:component
						this={feat.icon}
						size={20}
						style="color: var(--text-secondary); margin-bottom: 20px;"
					/>
					<h3 style="margin-bottom: 10px; font-size: 1rem;">{feat.title}</h3>
					<p style="font-size: 0.875rem; line-height: 1.65;">{feat.desc}</p>
				</div>
			{/each}
		</div>
	</div>
</section>

<!-- CTA strip -->
<section style="padding: 80px 0; border-top: 1px solid var(--border);">
	<div class="container">
		<div style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 24px;" class="animate-fade-up">
			<div>
				<h2 style="font-size: clamp(1.25rem, 2.5vw, 1.75rem); margin-bottom: 8px;">Ready to start?</h2>
				<p style="font-size: 0.9375rem;">No credit card required. Start for free.</p>
			</div>
			<Button variant="primary" size="lg">Create account</Button>
		</div>
	</div>
</section>
