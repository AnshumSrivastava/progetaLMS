<script lang="ts">
	import { page } from '$app/stores';
	import { LayoutDashboard, Compass, CalendarRange, User } from 'lucide-svelte';

	const tabs = [
		{ href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
		{ href: '/catalog', icon: Compass, label: 'Catalog' },
		{ href: '/certifications', icon: CalendarRange, label: 'Certs' },
		{ href: '/settings', icon: User, label: 'Profile' }
	];
</script>

<div class="mobile-tab-bar">
	{#each tabs as tab}
		{@const isActive = $page.url.pathname.startsWith(tab.href)}
		<a href={tab.href} class="tab-item" class:active={isActive}>
			<tab.icon size={22} class="tab-icon" />
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
			height: 64px;
			background: var(--glass-bg);
			backdrop-filter: blur(16px);
			-webkit-backdrop-filter: blur(16px);
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
			gap: 4px;
			flex: 1;
			text-decoration: none;
			color: var(--text-muted);
			transition: color 0.2s;
			height: 100%;
		}

		.tab-item.active {
			color: var(--accent);
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
