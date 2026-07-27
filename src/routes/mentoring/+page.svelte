<script lang="ts">
	import { Calendar, Clock } from 'lucide-svelte';

	const mentors = [
		{
			id: 1,
			name: 'Arjun Sharma',
			role: 'Staff Engineer, Fintech',
			expertise: ['System Design', 'Distributed Systems', 'Go'],
			rate: '₹1,200 / 30 min',
			available: 'Next slot: Monday',
		},
		{
			id: 2,
			name: 'Priya Nair',
			role: 'Product Manager, SaaS',
			expertise: ['Product Strategy', 'User Research', 'Roadmapping'],
			rate: '₹1,000 / 30 min',
			available: 'Next slot: Tuesday',
		},
		{
			id: 3,
			name: 'Rohan Mehta',
			role: 'Senior Frontend Engineer',
			expertise: ['React', 'Performance', 'Accessibility'],
			rate: '₹900 / 30 min',
			available: 'Next slot: Today',
		},
	];
</script>

<svelte:head>
	<title>Mentoring — Launchpad</title>
	<meta name="description" content="Book 1-on-1 sessions with industry experts." />
</svelte:head>

<!-- Header -->
<div style="padding: 56px 0 40px; border-bottom: 1px solid var(--border);">
	<div class="container">
		<p style="font-size: 0.75rem; font-weight: 500; color: var(--text-muted); letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 12px;">Mentoring</p>
		<h1 style="font-size: clamp(1.75rem, 3vw, 2.5rem); margin-bottom: 12px;">Learn From Practitioners</h1>
		<p style="max-width: 480px;">Book focused 30 or 60-minute sessions with engineers and leaders actively working in the field.</p>
	</div>
</div>

<!-- Mentor list -->
<div style="padding: 48px 0 80px;">
	<div class="container" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 1px; background: var(--border);">
		{#each mentors as mentor}
			<div
				style="background: var(--bg); padding: 28px; display: flex; flex-direction: column; gap: 16px; cursor: pointer; transition: background var(--t-fast);"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
				role="article"
			>
				<!-- Avatar placeholder -->
				<div style="width: 40px; height: 40px; border-radius: 9999px; background: var(--bg-elevated); border: 1px solid var(--border); display: flex; align-items: center; justify-content: center;">
					<span style="font-size: 0.75rem; font-weight: 600; color: var(--text-secondary);">
						{mentor.name.split(' ').map(n => n[0]).join('')}
					</span>
				</div>

				<div>
					<h3 style="font-size: 0.9375rem; margin-bottom: 4px;">{mentor.name}</h3>
					<p style="font-size: 0.8125rem; color: var(--text-muted);">{mentor.role}</p>
				</div>

				<!-- Tags -->
				<div style="display: flex; flex-wrap: wrap; gap: 6px;">
					{#each mentor.expertise as tag}
						<span class="chip">{tag}</span>
					{/each}
				</div>

				<div style="display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--border);">
					<div>
						<p style="font-size: 0.75rem; color: var(--text-muted); margin-bottom: 2px; display: flex; align-items: center; gap: 4px;">
							<Calendar size={11} /> {mentor.available}
						</p>
						<p style="font-size: 0.875rem; font-weight: 600; color: var(--text-primary);">{mentor.rate}</p>
					</div>
					<button
						style="padding: 8px 16px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px; font-size: 0.8125rem; font-weight: 500; cursor: pointer; font-family: inherit; transition: opacity var(--t-fast);"
						onmouseenter={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.85'}
						onmouseleave={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
					>
						Book session
					</button>
				</div>
			</div>
		{/each}
	</div>
</div>
