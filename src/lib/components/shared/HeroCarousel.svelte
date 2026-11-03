<script lang="ts">
	import { onDestroy, onMount } from 'svelte';
	import { ChevronLeft, ChevronRight, ArrowRight, Calendar, Clock, MapPin, Sparkles } from 'lucide-svelte';

	export interface CarouselMeta {
		icon?: any;
		text: string;
	}

	export interface SideCardData {
		title: string;
		date?: string;
		venue?: string;
		imageUrl?: string;
		ctaText?: string;
		ctaLink?: string;
		onClick?: () => void;
	}

	export interface CarouselSlide {
		id: string;
		title: string;
		badge?: string;
		badgeColor?: string; // 'rose' | 'amber' | 'emerald' | 'sky' | 'purple'
		category?: string;
		description?: string;
		imageUrl?: string;
		meta?: CarouselMeta[];
		ctaText?: string;
		ctaLink?: string;
		onClickCta?: () => void;
		sideCard?: SideCardData;
	}

	let {
		slides = [],
		autoPlayInterval = 6500
	}: {
		slides: CarouselSlide[];
		autoPlayInterval?: number;
	} = $props();

	let currentIndex = $state(0);
	let isPaused = $state(false);
	let timer: any = null;
	let touchStartX = 0;
	let touchEndX = 0;

	const count = $derived(slides.length);
	const currentSlide = $derived(slides[currentIndex] || slides[0]);

	function nextSlide() {
		if (count <= 1) return;
		currentIndex = (currentIndex + 1) % count;
	}

	function prevSlide() {
		if (count <= 1) return;
		currentIndex = (currentIndex - 1 + count) % count;
	}

	function goToSlide(index: number) {
		currentIndex = index;
	}

	function handleTouchStart(e: TouchEvent) {
		touchStartX = e.changedTouches[0].screenX;
	}

	function handleTouchEnd(e: TouchEvent) {
		touchEndX = e.changedTouches[0].screenX;
		if (touchStartX - touchEndX > 50) {
			nextSlide();
		} else if (touchEndX - touchStartX > 50) {
			prevSlide();
		}
	}

	function startTimer() {
		stopTimer();
		if (autoPlayInterval > 0 && count > 1) {
			timer = setInterval(() => {
				if (!isPaused) {
					nextSlide();
				}
			}, autoPlayInterval);
		}
	}

	function stopTimer() {
		if (timer) {
			clearInterval(timer);
			timer = null;
		}
	}

	$effect(() => {
		if (count > 1) {
			startTimer();
		}
		return () => stopTimer();
	});

	function handleKeyDown(e: KeyboardEvent) {
		if (e.key === 'ArrowLeft') prevSlide();
		if (e.key === 'ArrowRight') nextSlide();
	}
</script>

{#if slides && slides.length > 0}
	<section
		class="relative rounded-3xl overflow-hidden border border-[#e4e4e7] bg-white shadow-sm mb-10 select-none group"
		onmouseenter={() => (isPaused = true)}
		onmouseleave={() => (isPaused = false)}
		ontouchstart={handleTouchStart}
		ontouchend={handleTouchEnd}
		aria-label="Featured Showcase Carousel"
		tabindex="0"
		onkeydown={handleKeyDown}
	>
		<!-- Slides Track -->
		<div
			class="flex transition-transform duration-700 ease-out"
			style="transform: translateX(-{currentIndex * 100}%);"
		>
			{#each slides as slide, idx (slide.id)}
				<div class="min-w-full w-full flex-shrink-0 relative">
					<div class="relative min-h-[380px] sm:min-h-[420px] lg:min-h-[460px] flex flex-col justify-center p-6 sm:p-10 lg:p-12 bg-gradient-to-br from-white via-zinc-50/60 to-white">
						
						<!-- Two Column Layout: Left Details + Right Companion Card -->
						<div class="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
							
							<!-- Left Column (Featured Banner Info) -->
							<div class="lg:col-span-7 xl:col-span-8 max-w-2xl">
								<!-- Badge Strip -->
								<div class="flex flex-wrap items-center gap-2 mb-3 sm:mb-4">
									{#if slide.badge}
										<span class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-rose-50 text-rose-800 border border-rose-200/80">
											<span class="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span>
											{slide.badge}
										</span>
									{/if}
									{#if slide.category}
										<span class="px-2.5 py-1 rounded-full text-[11px] font-semibold bg-zinc-100 text-zinc-700 border border-zinc-200 uppercase font-mono">
											{slide.category}
										</span>
									{/if}
								</div>

								<!-- Slide Title -->
								<h2 class="text-2xl sm:text-4xl lg:text-[2.65rem] font-black text-zinc-950 tracking-tight leading-[1.14] mb-3">
									{slide.title}
								</h2>

								<!-- Slide Description -->
								{#if slide.description}
									<p class="text-xs sm:text-sm md:text-[0.9375rem] text-zinc-600 line-clamp-2 max-w-xl mb-6 leading-relaxed">
										{slide.description}
									</p>
								{/if}

								<!-- Meta Chips -->
								<div class="flex flex-wrap items-center gap-2.5 text-xs text-zinc-700 mb-6">
									{#if slide.meta}
										{#each slide.meta as m}
											<div class="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200/80 font-medium">
												{#if m.icon}
													<m.icon size={14} class="text-rose-600 shrink-0" />
												{/if}
												<span>{m.text}</span>
											</div>
										{/each}
									{/if}
								</div>

								<!-- Action CTA -->
								<div class="flex items-center gap-3">
									{#if slide.ctaLink}
										<a
											href={slide.ctaLink}
											class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-950 text-white hover:bg-zinc-800 transition shadow-sm active:scale-95"
										>
											<span>{slide.ctaText || 'Explore Now'}</span>
											<ArrowRight size={14} />
										</a>
									{:else if slide.onClickCta}
										<button
											type="button"
											onclick={slide.onClickCta}
											class="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs sm:text-sm font-bold bg-zinc-950 text-white hover:bg-zinc-800 transition shadow-sm active:scale-95"
										>
											<span>{slide.ctaText || 'Register Now'}</span>
											<ArrowRight size={14} />
										</button>
									{/if}
								</div>
							</div>

							<!-- Right Column: Companion Preview Card (Desktop) -->
							{#if slide.sideCard}
								<div class="hidden lg:block lg:col-span-5 xl:col-span-4 justify-self-end w-full max-w-sm">
									<div class="bg-white border border-zinc-200 p-4 sm:p-5 rounded-2xl shadow-lg text-zinc-950">
										{#if slide.sideCard.imageUrl}
											<div class="w-full h-40 rounded-xl overflow-hidden mb-3.5 border border-zinc-100 bg-zinc-50">
												<img
													src={slide.sideCard.imageUrl}
													alt={slide.sideCard.title}
													class="w-full h-full object-cover"
												/>
											</div>
										{/if}

										<h3 class="text-sm font-bold text-zinc-950 line-clamp-2 mb-1.5 leading-snug">
											{slide.sideCard.title}
										</h3>

										{#if slide.sideCard.date}
											<div class="flex items-center gap-1.5 text-xs text-zinc-600 mb-1">
												<Calendar size={13} class="text-rose-600 shrink-0" />
												<span>{slide.sideCard.date}</span>
											</div>
										{/if}

										{#if slide.sideCard.venue}
											<div class="flex items-center gap-1.5 text-xs text-zinc-500 mb-4 font-mono">
												<MapPin size={13} class="text-zinc-400 shrink-0" />
												<span>{slide.sideCard.venue}</span>
											</div>
										{/if}

										{#if slide.sideCard.ctaLink}
											<a
												href={slide.sideCard.ctaLink}
												class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition shadow-sm"
											>
												<span>{slide.sideCard.ctaText || 'View Details'}</span>
												<ArrowRight size={12} />
											</a>
										{:else if slide.sideCard.onClick}
											<button
												type="button"
												onclick={slide.sideCard.onClick}
												class="w-full inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 transition shadow-sm"
											>
												<span>{slide.sideCard.ctaText || 'View Details'}</span>
												<ArrowRight size={12} />
											</button>
										{/if}
									</div>
								</div>
							{/if}

						</div>
					</div>
				</div>
			{/each}
		</div>

		<!-- Left & Right Arrow Controls (Visible when more than 1 slide) -->
		{#if count > 1}
			<button
				type="button"
				onclick={prevSlide}
				aria-label="Previous slide"
				class="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95"
			>
				<ChevronLeft size={19} />
			</button>

			<button
				type="button"
				onclick={nextSlide}
				aria-label="Next slide"
				class="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/90 hover:bg-white text-zinc-900 border border-zinc-200 flex items-center justify-center transition shadow-md hover:scale-105 active:scale-95"
			>
				<ChevronRight size={19} />
			</button>

			<!-- Bottom Dots Indicator -->
			<div class="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/90 backdrop-blur-md border border-zinc-200 shadow-xs">
				{#each slides as _, idx}
					<button
						type="button"
						onclick={() => goToSlide(idx)}
						aria-label={`Go to slide ${idx + 1}`}
						class="transition-all duration-300 rounded-full {currentIndex === idx ? 'w-6 h-1.5 bg-zinc-950' : 'w-1.5 h-1.5 bg-zinc-300 hover:bg-zinc-500'}"
					></button>
				{/each}
			</div>
		{/if}
	</section>
{/if}
