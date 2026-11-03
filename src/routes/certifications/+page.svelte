<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { Search, X, Award, ShieldCheck, Check } from 'lucide-svelte';
	import CertificationCard from '$lib/components/ui/CertificationCard.svelte';
	import FilterPills from '$lib/components/shared/FilterPills.svelte';

	let { data } = $props();

	let searchQuery = $state('');
	let selectedLevel = $state<string>('All');
	let onlyProctored = $state(false);

	const levelOptions = [
		{ value: 'All', label: 'All Difficulties' },
		{ value: 'Beginner', label: 'Beginner' },
		{ value: 'Intermediate', label: 'Intermediate' },
		{ value: 'Advanced', label: 'Advanced' }
	];

	const filtered = $derived(() => {
		let list = data.certs || [];

		if (searchQuery.trim()) {
			const q = searchQuery.toLowerCase();
			list = list.filter((c: any) =>
				c.title.toLowerCase().includes(q) ||
				(c.description || '').toLowerCase().includes(q) ||
				(c.metadata?.tags || []).some((t: string) => t.toLowerCase().includes(q))
			);
		}

		if (selectedLevel && selectedLevel !== 'All') {
			list = list.filter(
				(c: any) =>
					(c.metadata?.level || 'Intermediate').toLowerCase() ===
					selectedLevel.toLowerCase()
			);
		}

		if (onlyProctored) {
			list = list.filter((c: any) => c.metadata?.isProctored !== false);
		}

		return list;
	});

	function clearAll() {
		searchQuery = '';
		selectedLevel = 'All';
		onlyProctored = false;
	}
</script>

<svelte:head>
	<title>Certifications &bull; Progeta</title>
	<meta
		name="description"
		content="Rigorous, timed certification exams with permanent cryptographic proof of mastery."
	/>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] text-[var(--text-primary)] pb-24">
	<div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 sm:pt-12">

		<!-- Page Header (Identical design system to Sessions) -->
		<div class="mb-8 border-b border-[var(--border-subtle)] pb-8">
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-[var(--color-surface-elevated)] border border-[var(--border)] text-white mb-3">
				<Award size={13} class="text-rose-400" />
				<span>Standards & Assessments</span>
			</div>

			<div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
				<div>
					<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)]">
						Verifiable Certifications
					</h1>
					<p class="text-xs sm:text-sm text-[var(--text-secondary)] mt-2 max-w-2xl">
						Rigorous practitioner-reviewed examinations yielding permanent, verifiable proof of skill mastery.
					</p>
				</div>

				<!-- Search Input -->
				<div class="relative w-full md:w-80">
					<Search size={15} class="absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
					<input
						bind:value={searchQuery}
						type="text"
						placeholder="Search certification exams..."
						class="w-full pl-10 pr-4 py-2.5 bg-[var(--color-surface)] border border-[var(--border)] rounded-xl text-xs text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:border-[var(--border-strong)] transition"
					/>
				</div>
			</div>

			<!-- Filter Bar -->
			<div class="mt-6 flex flex-wrap items-center justify-between gap-4">
				<div class="flex flex-wrap items-center gap-3">
					<FilterPills
						options={levelOptions}
						selected={selectedLevel}
						onSelect={(lvl) => (selectedLevel = lvl)}
					/>

					<button
						type="button"
						class="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition {onlyProctored ? 'bg-[var(--text-primary)] text-[var(--color-background)] border-white' : 'bg-[var(--color-surface)] border-[var(--border)] text-[var(--text-secondary)] hover:text-white'}"
						onclick={() => (onlyProctored = !onlyProctored)}
					>
						<span class="w-2 h-2 rounded-full {onlyProctored ? 'bg-black' : 'bg-[var(--text-muted)]'}"></span>
						<span>Proctored Only</span>
					</button>
				</div>

				<span class="text-xs font-mono text-[var(--text-muted)] shrink-0 hidden sm:inline">
					{filtered().length} {filtered().length === 1 ? 'certification' : 'certifications'}
				</span>
			</div>
		</div>

		<!-- Grid -->
		{#if filtered().length === 0}
			<div class="text-center py-20 px-6 rounded-2xl bg-[var(--color-surface)] border border-dashed border-[var(--border)]">
				<Award size={44} class="mx-auto text-[var(--text-muted)] mb-3 opacity-60" />
				<h3 class="text-base font-bold text-[var(--text-primary)]">No certifications found</h3>
				<p class="text-xs text-[var(--text-muted)] mt-1.5 max-w-sm mx-auto">
					No exams match your selected filters. Try resetting search criteria.
				</p>
				<button
					type="button"
					onclick={clearAll}
					class="mt-5 px-4 py-2 text-xs font-bold bg-[var(--text-primary)] text-[var(--color-background)] rounded-lg hover:opacity-90 transition"
				>
					Reset Filters
				</button>
			</div>
		{:else}
			<div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
				{#each filtered() as cert (cert.id)}
					<CertificationCard {cert} />
				{/each}
			</div>
		{/if}

	</div>
</div>
