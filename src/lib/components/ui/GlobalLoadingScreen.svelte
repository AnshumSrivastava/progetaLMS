<script lang="ts">
	import LaunchpadLogo from './LaunchpadLogo.svelte';

	let { text = 'Loading' }: { text?: string } = $props();
</script>

<!-- Top Progress Indicator Strip directly below navbar -->
<div class="top-nav-progress-bar">
	<div class="progress-bar-fill"></div>
</div>

<!-- Center Content Loading Canvas (Navbar and Footer stay fully visible) -->
<div class="loading-canvas">
	<div class="loading-box">
		<div class="launchpad-pulse-mark">
			<LaunchpadLogo class="w-10 h-10 text-white" />
		</div>
		<span class="meta-mono text-[11px] text-slate-400 tracking-widest uppercase">
			{text}
		</span>
	</div>
</div>

<style>
	.top-nav-progress-bar {
		position: fixed;
		top: var(--nav-h, 68px);
		left: 0;
		right: 0;
		height: 2px;
		background: rgba(255, 255, 255, 0.08);
		z-index: 45;
		overflow: hidden;
	}

	.progress-bar-fill {
		height: 100%;
		width: 40%;
		background: linear-gradient(90deg, #38bdf8, #818cf8, #38bdf8);
		animation: nav-progress 1.2s infinite ease-in-out;
		border-radius: 999px;
	}

	@keyframes nav-progress {
		0% {
			transform: translateX(-100%);
		}
		100% {
			transform: translateX(350%);
		}
	}

	.loading-canvas {
		position: fixed;
		top: var(--nav-h, 68px);
		bottom: 0;
		left: 0;
		right: 0;
		background: rgba(8, 11, 17, 0.85);
		backdrop-filter: blur(8px);
		-webkit-backdrop-filter: blur(8px);
		z-index: 35;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 24px;
		transition: opacity 0.2s ease;
	}

	.loading-box {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
	}

	.launchpad-pulse-mark {
		animation: mark-fade-pulse 1.6s ease-in-out infinite;
	}

	@keyframes mark-fade-pulse {
		0%, 100% {
			opacity: 0.35;
			transform: scale(0.96);
		}
		50% {
			opacity: 1;
			transform: scale(1.04);
		}
	}
</style>
