<script lang="ts">
	export let slides: { title: string; subtitle?: string; content?: string; image?: string; type?: 'standard' | 'statement' | 'divider' }[] = [];
	
	let currentSlide = 0;

	function nextSlide() {
		if (currentSlide < slides.length - 1) {
			currentSlide++;
		}
	}

	function prevSlide() {
		if (currentSlide > 0) {
			currentSlide--;
		}
	}

	function handleKeydown(e: KeyboardEvent) {
		if (e.key === 'ArrowRight' || e.key === ' ') nextSlide();
		if (e.key === 'ArrowLeft') prevSlide();
	}
</script>

<svelte:window on:keydown={handleKeydown} />

<div class="deck-container">
	<!-- Subtle Grid Background -->
	<div class="grain"></div>
	
	<!-- Top Progress Bar -->
	<div class="progress-track">
		<div class="progress-fill" style="width: {((currentSlide) / (slides.length - 1)) * 100}%"></div>
	</div>

	<!-- Slides -->
	<div class="deck">
		{#each slides as slide, i}
			<div class="slide" class:active={i === currentSlide} class:prev={i < currentSlide}>
				<div class="slide-inner {slide.type === 'statement' ? 'statement-layout' : ''}">
					
					<!-- Eyebrow/Section Tag -->
					<div class="eyebrow">
						<span>SECTION 0{i+1}</span>
					</div>

					<!-- Animated Title -->
					<h1 class="slide-title reveal">
						<span>{slide.title}</span>
					</h1>
					
					{#if slide.subtitle}
						<p class="slide-sub animate-rise" style="animation-delay: 0.15s;">{slide.subtitle}</p>
					{/if}

					<!-- Content Grid -->
					{#if slide.content || slide.image}
						<div class="slide-content-grid animate-rise" style="animation-delay: 0.3s;">
							{#if slide.content}
								<div class="slide-text">
									{@html slide.content}
								</div>
							{/if}
							{#if slide.image}
								<div class="slide-image">
									<div class="img-placeholder">{slide.image}</div>
								</div>
							{/if}
						</div>
					{/if}

				</div>
			</div>
		{/each}
	</div>

	<!-- Bottom Navigation Controls -->
	<div class="chrome-bottom">
		<div class="counter">
			<b>{String(currentSlide + 1).padStart(2, '0')}</b> / {String(slides.length).padStart(2, '0')}
		</div>
		<div class="nav-btns">
			<button class="nav-btn" on:click={prevSlide} disabled={currentSlide === 0} title="Previous (←)">←</button>
			<button class="nav-btn" on:click={nextSlide} disabled={currentSlide === slides.length - 1} title="Next (→)">→</button>
		</div>
	</div>
</div>

<style>
	/* Presentation — fully theme-aware via CSS variables */
	.deck-container {
		position: relative;
		width: 100%;
		height: 100%;
		background: var(--bg-subtle);
		color: var(--text-primary);
		overflow: hidden;
		font-family: 'Outfit', 'Inter', system-ui, sans-serif;
		transition: background 0.25s ease, color 0.25s ease;
	}

	/* Subtle grid texture */
	.grain {
		position: absolute;
		inset: 0;
		pointer-events: none;
		z-index: 1;
		opacity: 0.5;
		background-image:
			linear-gradient(var(--border) 1px, transparent 1px),
			linear-gradient(90deg, var(--border) 1px, transparent 1px);
		background-size: 64px 64px;
		mask-image: radial-gradient(circle at 50% 40%, black, transparent 75%);
		-webkit-mask-image: radial-gradient(circle at 50% 40%, black, transparent 75%);
	}

	/* Progress Bar */
	.progress-track {
		position: absolute;
		top: 0;
		left: 0;
		right: 0;
		height: 3px;
		background: var(--border);
		z-index: 21;
	}
	.progress-fill {
		height: 100%;
		background: var(--accent);
		width: 0%;
		transition: width 0.5s cubic-bezier(0.65, 0, 0.35, 1);
	}

	/* Deck and Slides */
	.deck {
		position: relative;
		height: 100%;
		width: 100%;
		z-index: 2;
	}
	.slide {
		position: absolute;
		inset: 0;
		display: flex;
		flex-direction: column;
		justify-content: center;
		padding: 40px 8vw;
		opacity: 0;
		visibility: hidden;
		transform: translateY(20px) scale(0.99);
		transition: opacity 0.5s cubic-bezier(0.22, 0.61, 0.36, 1), transform 0.55s cubic-bezier(0.22, 0.61, 0.36, 1);
		text-align: left;
	}
	.slide.active {
		opacity: 1;
		visibility: visible;
		transform: translateY(0) scale(1);
		z-index: 5;
	}
	.slide.prev {
		transform: translateY(-14px) scale(0.99);
	}

	.slide-inner {
		max-width: 1100px;
		width: 100%;
		margin: 0 auto;
	}

	/* Typography */
	.eyebrow {
		font-family: 'JetBrains Mono', monospace;
		font-size: 13px;
		letter-spacing: 0.18em;
		text-transform: uppercase;
		color: var(--text-muted);
		margin: 0 0 20px 0;
		display: flex;
		align-items: center;
		gap: 12px;
	}
	.eyebrow::before {
		content: '';
		width: 24px;
		height: 1px;
		background: var(--text-muted);
		display: inline-block;
	}

	h1.slide-title {
		font-family: 'Outfit', 'Inter', sans-serif;
		font-weight: 700;
		font-size: clamp(32px, 4.5vw, 64px);
		line-height: 1.1;
		letter-spacing: -0.02em;
		margin: 0 0 16px 0;
		color: var(--text-primary);
	}

	.slide-sub {
		font-size: clamp(16px, 1.6vw, 22px);
		color: var(--text-secondary);
		font-weight: 400;
		margin: 16px 0 0 0;
		max-width: 800px;
		line-height: 1.6;
	}

	/* Content Grid */
	.slide-content-grid {
		display: flex;
		gap: 40px;
		margin-top: 40px;
		opacity: 0;
	}
	.slide-text {
		flex: 1;
		font-size: 1.125rem;
		line-height: 1.8;
		color: var(--text-secondary);
	}
	:global(.slide-text p) { margin-bottom: 1em; color: var(--text-secondary); }
	:global(.slide-text ul) { list-style: none; padding: 0; margin-top: 20px; display: flex; flex-direction: column; }
	:global(.slide-text li) {
		font-size: clamp(16px, 1.8vw, 20px);
		padding: 14px 0;
		border-bottom: 1px solid var(--border);
		display: flex;
		align-items: baseline;
		gap: 16px;
		color: var(--text-primary);
	}
	:global(.slide-text li:first-child) { border-top: 1px solid var(--border); }
	:global(.slide-text li::before) {
		content: '>';
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		color: var(--accent);
		font-weight: bold;
	}

	.slide-image {
		flex: 1;
		background: var(--bg-elevated);
		border-radius: 12px;
		border: 1px solid var(--border-strong);
		min-height: 300px;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.img-placeholder {
		font-family: 'JetBrains Mono', monospace;
		font-size: 14px;
		color: var(--text-muted);
		text-transform: uppercase;
		letter-spacing: 0.1em;
	}

	/* Reveal Animation — mask uses CSS var */
	.reveal {
		position: relative;
		display: inline-block;
		overflow: hidden;
	}
	.reveal > span { display: inline-block; }
	.reveal::after {
		content: '';
		position: absolute;
		inset: 0;
		background: var(--text-primary);
		transform-origin: right;
		transform: scaleX(1);
	}
	.slide.active .reveal::after {
		transition: transform 0.55s cubic-bezier(0.65, 0, 0.35, 1);
		transition-delay: 0.1s;
		transform: scaleX(0);
	}

	.slide.active .animate-rise {
		animation: riseIn 0.5s cubic-bezier(0.22, 0.61, 0.36, 1) forwards;
	}
	@keyframes riseIn {
		to { opacity: 1; transform: translateY(0); }
	}

	/* Statement Layout */
	.statement-layout {
		display: flex;
		flex-direction: column;
		align-items: center;
		text-align: center;
	}
	.statement-layout h1.slide-title {
		font-size: clamp(34px, 5.5vw, 72px);
		max-width: 1000px;
	}
	.statement-layout .eyebrow { justify-content: center; }
	.statement-layout .eyebrow::before { display: none; }
	.statement-layout .slide-sub { text-align: center; margin-left: auto; margin-right: auto; }

	/* Chrome Bottom Nav */
	.chrome-bottom {
		position: absolute;
		bottom: 0;
		left: 0;
		right: 0;
		z-index: 20;
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding: 24px 40px;
		font-family: 'JetBrains Mono', monospace;
	}
	.counter {
		font-size: 13px;
		color: var(--text-muted);
		letter-spacing: 0.06em;
	}
	.counter b {
		color: var(--text-primary);
		font-weight: 600;
	}
	.nav-btns {
		display: flex;
		gap: 12px;
	}
	.nav-btn {
		all: unset;
		cursor: pointer;
		width: 44px;
		height: 44px;
		border-radius: 50%;
		border: 1px solid var(--border-strong);
		display: flex;
		align-items: center;
		justify-content: center;
		color: var(--text-secondary);
		transition: background 0.2s, color 0.2s, border-color 0.2s;
		background: var(--bg-elevated);
		font-size: 16px;
	}
	.nav-btn:hover:not(:disabled) {
		color: var(--bg);
		background: var(--text-primary);
		border-color: var(--text-primary);
	}
	.nav-btn:disabled {
		opacity: 0.2;
		pointer-events: none;
	}
</style>
