<script lang="ts">
	import { onMount } from 'svelte';

	export let videoData: {
		title: string;
		description: string;
		src?: string;
		poster?: string;
		durationStr?: string;
	};

	let videoElement: HTMLVideoElement;
	let isPlaying = false;
	let progress = 0;
	let currentTime = 0;
	let duration = 0;
	let volume = 1;
	let isMuted = false;
	let showControls = true;
	let controlsTimeout: ReturnType<typeof setTimeout>;

	function togglePlay() {
		if (videoElement.paused) {
			videoElement.play();
		} else {
			videoElement.pause();
		}
	}

	function handleTimeUpdate() {
		currentTime = videoElement.currentTime;
		if (duration > 0) {
			progress = (currentTime / duration) * 100;
		}
	}

	function handleLoadedMetadata() {
		duration = videoElement.duration;
	}

	function handleSeek(e: MouseEvent) {
		const track = e.currentTarget as HTMLElement;
		const rect = track.getBoundingClientRect();
		const pct = (e.clientX - rect.left) / rect.width;
		videoElement.currentTime = pct * duration;
	}

	function formatTime(seconds: number) {
		if (isNaN(seconds)) return "0:00";
		const m = Math.floor(seconds / 60);
		const s = Math.floor(seconds % 60);
		return `${m}:${s.toString().padStart(2, '0')}`;
	}

	function handleMouseMove() {
		showControls = true;
		clearTimeout(controlsTimeout);
		if (isPlaying) {
			controlsTimeout = setTimeout(() => {
				showControls = false;
			}, 2500);
		}
	}

	function handleMouseLeave() {
		if (isPlaying) {
			showControls = false;
		}
	}

</script>

<div class="video-lesson-wrap">
	<div class="player-container" 
		 on:mousemove={handleMouseMove} 
		 on:mouseleave={handleMouseLeave}
		 class:hide-controls={!showControls && isPlaying}
	>
		<!-- svelte-ignore a11y-media-has-caption -->
		<video
			bind:this={videoElement}
			src={videoData.src || "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4"}
			poster={videoData.poster}
			on:play={() => isPlaying = true}
			on:pause={() => isPlaying = false}
			on:timeupdate={handleTimeUpdate}
			on:loadedmetadata={handleLoadedMetadata}
			on:click={togglePlay}
			class="video-el"
		></video>

		<!-- Custom Overlay Controls -->
		<div class="controls-overlay">
			
			<!-- Center Play/Pause -->
			<div class="center-controls" class:active={!isPlaying}>
				<button class="big-play-btn" on:click={togglePlay}>
					{#if isPlaying}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
					{:else}
						<svg width="32" height="32" viewBox="0 0 24 24" fill="currentColor"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
					{/if}
				</button>
			</div>

			<!-- Bottom Control Bar -->
			<div class="bottom-bar">
				<!-- Progress Track -->
				<div class="progress-container" on:click={handleSeek}>
					<div class="progress-track">
						<div class="progress-fill" style="width: {progress}%"></div>
					</div>
				</div>

				<div class="controls-row">
					<div class="controls-left">
						<button class="control-btn" on:click={togglePlay}>
							{#if isPlaying}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect></svg>
							{:else}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="5 3 19 12 5 21 5 3"></polygon></svg>
							{/if}
						</button>
						<div class="time-display">
							{formatTime(currentTime)} / {videoData.durationStr || formatTime(duration)}
						</div>
					</div>
					<div class="controls-right">
						<!-- Volume toggle placeholder -->
						<button class="control-btn" on:click={() => { isMuted = !isMuted; videoElement.muted = isMuted; }}>
							{#if isMuted}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><line x1="23" y1="9" x2="17" y2="15"></line><line x1="17" y1="9" x2="23" y2="15"></line></svg>
							{:else}
								<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"></path></svg>
							{/if}
						</button>
					</div>
				</div>
			</div>
		</div>
	</div>

	<!-- Video Meta -->
	<div class="video-meta">
		<h1 class="video-title">{videoData.title}</h1>
		<div class="video-desc">
			{videoData.description}
		</div>
		
		<div class="video-tabs">
			<button class="tab active">Overview</button>
			<button class="tab">Transcript</button>
			<button class="tab">Resources (2)</button>
		</div>

		<div class="video-content-panel">
			<p>In this lesson, we will cover the core concepts behind the threat landscape, exploring modern vectors such as phishing, ransomware, and social engineering. Understanding these concepts is critical before moving on to network defense strategies.</p>
		</div>
	</div>
</div>

<style>
	.video-lesson-wrap {
		width: 100%;
		max-width: 1100px;
		margin: 0 auto;
		padding: 2rem;
		animation: fadeUp 0.4s cubic-bezier(0.22, 1, 0.36, 1) both;
	}

	@keyframes fadeUp {
		from { opacity: 0; transform: translateY(16px); }
		to   { opacity: 1; transform: translateY(0); }
	}

	/* Player Container */
	.player-container {
		position: relative;
		width: 100%;
		background: #000;
		border-radius: 12px;
		overflow: hidden;
		aspect-ratio: 16 / 9;
		margin-bottom: 24px;
		box-shadow: 0 12px 32px rgba(0, 0, 0, 0.15);
		border: 1px solid var(--border-strong);
	}

	.video-el {
		width: 100%;
		height: 100%;
		object-fit: cover;
		display: block;
		cursor: pointer;
	}

	/* Controls Overlay */
	.controls-overlay {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		background: linear-gradient(to top, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0) 40%);
		transition: opacity 0.3s ease;
		pointer-events: none;
	}

	.hide-controls .controls-overlay {
		opacity: 0;
	}

	.center-controls {
		position: absolute;
		inset: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		pointer-events: none;
	}

	.center-controls.active {
		background: rgba(0,0,0,0.3);
	}

	.big-play-btn {
		width: 72px;
		height: 72px;
		border-radius: 50%;
		background: var(--accent);
		color: #fff;
		border: none;
		display: flex;
		align-items: center;
		justify-content: center;
		cursor: pointer;
		pointer-events: auto;
		transition: transform 0.2s, background 0.2s;
		opacity: 0;
		transform: scale(0.8);
	}

	.center-controls.active .big-play-btn {
		opacity: 1;
		transform: scale(1);
	}
	
	.big-play-btn:hover {
		transform: scale(1.05) !important;
		background: var(--accent-hover);
	}

	.bottom-bar {
		padding: 16px 20px;
		pointer-events: auto;
	}

	/* Progress */
	.progress-container {
		width: 100%;
		height: 12px;
		display: flex;
		align-items: center;
		cursor: pointer;
		margin-bottom: 12px;
	}
	.progress-track {
		width: 100%;
		height: 4px;
		background: rgba(255, 255, 255, 0.3);
		border-radius: 9999px;
		transition: height 0.15s;
		position: relative;
	}
	.progress-container:hover .progress-track {
		height: 6px;
	}
	.progress-fill {
		height: 100%;
		background: var(--accent);
		border-radius: 9999px;
		position: relative;
	}
	.progress-fill::after {
		content: '';
		position: absolute;
		right: -6px;
		top: 50%;
		transform: translateY(-50%) scale(0);
		width: 12px;
		height: 12px;
		background: #fff;
		border-radius: 50%;
		transition: transform 0.15s;
	}
	.progress-container:hover .progress-fill::after {
		transform: translateY(-50%) scale(1);
	}

	/* Controls Row */
	.controls-row {
		display: flex;
		justify-content: space-between;
		align-items: center;
	}
	.controls-left, .controls-right {
		display: flex;
		align-items: center;
		gap: 16px;
	}

	.control-btn {
		all: unset;
		color: #fff;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		opacity: 0.85;
		transition: opacity 0.2s, transform 0.1s;
	}
	.control-btn:hover {
		opacity: 1;
	}
	.control-btn:active {
		transform: scale(0.9);
	}

	.time-display {
		color: #fff;
		font-size: 0.85rem;
		font-variant-numeric: tabular-nums;
		font-family: 'JetBrains Mono', monospace;
	}

	/* Meta Section */
	.video-meta {
		padding: 0 8px;
	}

	.video-title {
		font-size: clamp(1.5rem, 2.5vw, 2rem);
		font-weight: 700;
		color: var(--text-primary);
		margin-bottom: 8px;
		letter-spacing: -0.01em;
	}

	.video-desc {
		font-size: 1.05rem;
		color: var(--text-secondary);
		line-height: 1.6;
		margin-bottom: 32px;
	}

	.video-tabs {
		display: flex;
		gap: 24px;
		border-bottom: 1px solid var(--border);
		margin-bottom: 24px;
	}

	.tab {
		all: unset;
		padding: 12px 0;
		font-size: 0.95rem;
		font-weight: 600;
		color: var(--text-muted);
		cursor: pointer;
		position: relative;
		transition: color 0.2s;
	}
	.tab:hover {
		color: var(--text-primary);
	}
	.tab.active {
		color: var(--text-primary);
	}
	.tab.active::after {
		content: '';
		position: absolute;
		bottom: -1px;
		left: 0;
		right: 0;
		height: 2px;
		background: var(--accent);
	}

	.video-content-panel {
		color: var(--text-secondary);
		font-size: 1.05rem;
		line-height: 1.7;
	}

	@media (max-width: 768px) {
		.video-lesson-wrap {
			padding: 1.5rem 1rem;
		}
		.player-container {
			border-radius: 8px;
		}
		.video-tabs {
			gap: 16px;
		}
		.tab {
			font-size: 0.9rem;
		}
	}
</style>
