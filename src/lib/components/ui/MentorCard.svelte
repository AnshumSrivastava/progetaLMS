<script lang="ts">
	import { Calendar, ArrowRight } from 'lucide-svelte';

	let { mentor }: { mentor: any } = $props();

	const initials = $derived(
		mentor.name
			? mentor.name
					.split(' ')
					.filter(Boolean)
					.map((n: string) => n[0])
					.join('')
					.slice(0, 2)
					.toUpperCase()
			: 'ME'
	);

	const specialties = $derived(mentor.specialties || ['Cloud Security', 'DevSecOps']);
	const targetUrl = $derived(`/mentoring/${mentor.handle || mentor.id}`);
</script>

<article class="dark-mentor-card group">
	<!-- Header -->
	<div class="mentor-header">
		<div class="mentor-avatar">
			{#if mentor.avatarUrl}
				<img src={mentor.avatarUrl} alt={mentor.name} class="avatar-img" />
			{:else}
				<span class="avatar-text">{initials}</span>
			{/if}
		</div>

		<div>
			<h3 class="mentor-name">
				<a href={targetUrl} class="name-link">
					{mentor.name}
				</a>
			</h3>
			<p class="mentor-role">{mentor.headline || 'Cloud Security Architect'}</p>
		</div>
	</div>

	<!-- Tags -->
	<div class="mentor-tags-row">
		{#each specialties.slice(0, 3) as tag}
			<span class="mentor-tag-pill">{tag}</span>
		{/each}
	</div>

	<!-- Services -->
	<p class="mentor-services">
		{mentor.bio || mentor.headline || 'Architecture reviews • Career guidance • Hands-on technical mentoring.'}
	</p>

	<!-- Footer Row -->
	<div class="mentor-bottom-row">
		<div class="session-pill">
			<Calendar size={13} class="text-slate-400" />
			<span>1-on-1 Sessions</span>
		</div>

		<a href={targetUrl} class="btn-book">
			<span>Book Session</span>
		</a>
	</div>
</article>

<style>
	.dark-mentor-card {
		border-radius: var(--radius-lg);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		padding: 22px;
		display: flex;
		flex-direction: column;
		gap: 14px;
		transition: transform 0.2s ease, border-color 0.2s ease, box-shadow 0.2s ease;
	}

	.dark-mentor-card:hover {
		transform: translateY(-3px);
		border-color: var(--color-border-strong);
		box-shadow: var(--shadow-lg);
	}

	.mentor-header {
		display: flex;
		align-items: center;
		gap: 12px;
	}

	.mentor-avatar {
		width: 44px;
		height: 44px;
		border-radius: var(--radius-full);
		background: var(--color-surface-elevated);
		border: 1px solid var(--color-border);
		color: var(--color-text);
		display: flex;
		align-items: center;
		justify-content: center;
		overflow: hidden;
		flex-shrink: 0;
	}

	.avatar-img {
		width: 100%;
		height: 100%;
		object-fit: cover;
	}

	.avatar-text {
		font-weight: 700;
		font-size: 0.95rem;
		color: var(--color-text);
	}

	.mentor-name {
		font-size: 0.98rem;
		font-weight: 700;
		color: var(--color-text);
	}

	.name-link {
		color: var(--color-text);
		text-decoration: none;
		transition: color 0.15s ease;
	}

	.name-link:hover {
		color: var(--lp-accent);
	}

	.mentor-role {
		font-size: 0.78rem;
		color: var(--color-text-secondary);
	}

	.mentor-tags-row {
		display: flex;
		align-items: center;
		gap: 6px;
		flex-wrap: wrap;
	}

	.mentor-tag-pill {
		padding: 3px 8px;
		border-radius: var(--radius-xs);
		font-size: 0.68rem;
		font-weight: 500;
		background: var(--color-surface-subtle);
		color: var(--color-text-secondary);
		border: 1px solid var(--color-border);
	}

	.mentor-services {
		font-size: 0.78rem;
		color: var(--color-text-secondary);
		line-height: 1.45;
		display: -webkit-box;
		-webkit-line-clamp: 2;
		-webkit-box-orient: vertical;
		overflow: hidden;
	}

	.mentor-bottom-row {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: 12px;
		border-top: 1px solid var(--color-border-subtle);
		margin-top: auto;
	}

	.session-pill {
		display: flex;
		align-items: center;
		gap: 6px;
		font-size: 0.75rem;
		color: var(--color-text-secondary);
	}

	.btn-book {
		display: inline-flex;
		align-items: center;
		padding: 7px 14px;
		border-radius: var(--radius-full);
		font-size: 0.78rem;
		font-weight: 700;
		background: var(--color-text);
		color: var(--color-bg);
		text-decoration: none;
		transition: all 0.15s ease;
	}

	.btn-book:hover {
		opacity: 0.9;
		transform: translateY(-1px);
	}
</style>
