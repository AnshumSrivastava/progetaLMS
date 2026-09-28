<script lang="ts">
	import { page } from '$app/stores';
	import { BookOpen, Video, Award, Users, LayoutDashboard } from 'lucide-svelte';

	const tabs = [
		{ href: '/catalog', icon: BookOpen, label: 'Explore' },
		{ href: '/live-classes', icon: Video, label: 'Live' },
		{ href: '/courses', icon: BookOpen, label: 'Courses' },
		{ href: '/certifications', icon: Award, label: 'Certs' },
		{ href: '/mentoring', icon: Users, label: 'Mentoring' },
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' }
	];
</script>

<div class="mobile-tab-bar">
	{#each tabs as tab}
		{@const isActive =
		tab.href === '/courses'
				? $page.url.pathname === '/courses'
				: tab.href === '/catalog'
				? $page.url.pathname === '/catalog'
				: tab.href === '/live-classes'
				? $page.url.pathname === '/live-classes'
				: $page.url.pathname.startsWith(tab.href)}
		<a href={tab.href} class="tab-item" class:active={isActive}>
			<tab.icon size={19} class="tab-icon" />
			<span class="tab-label">{tab.label}</span>
		</a>
	{/each}
</div>

<style>
	.mobile-tab-bar {
		display: none;
	}

	@media (max-width: 768px) {
		.mobile-tab-bar {
			display: flex;
			position: fixed;
			bottom: 0;
			left: 0;
			right: 0;
			height: 58px;
			background: var(--bg);
			border-top: 1px solid var(--border);
			z-index: 100;
			justify-content: space-around;
			align-items: center;
			padding-bottom: env(safe-area-inset-bottom);
		}

		.tab-item {
			display: flex;
			flex-direction: column;
			align-items: center;
			justify-content: center;
			gap: 3px;
			flex: 1;
			text-decoration: none;
			color: var(--text-muted);
			transition: color 0.15s ease;
			height: 100%;
		}

		.tab-item.active {
			color: var(--color-text);
		}

		.tab-label {
			font-size: 0.65rem;
			font-weight: 600;
			letter-spacing: 0.02em;
		}

		.tab-icon {
			transition: transform 0.2s cubic-bezier(0.4, 0, 0.2, 1);
		}

		.tab-item.active .tab-icon {
			transform: scale(1.1);
		}
	}
</style>
