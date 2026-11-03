<script lang="ts">
	import type { PageData } from './$types';
	import {
		ArrowLeft,
		Download,
		ExternalLink,
		Video,
		FileText,
		Lock,
		CheckCircle2,
		ShieldCheck
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
	const event = data.event;
</script>

<svelte:head>
	<title>{event.title} &bull; Resources &bull; Progeta</title>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] text-[var(--text-primary)] py-10 px-4 sm:px-6 lg:px-8">
	<div class="max-w-4xl mx-auto space-y-6">
		
		<!-- Back to Event -->
		<a
			href={`/events/${event.slug}`}
			class="inline-flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition font-mono"
		>
			<ArrowLeft size={14} />
			<span>Back to Session Overview</span>
		</a>

		<!-- Header -->
		<div class="bg-[var(--color-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border)] shadow-xl space-y-3 relative overflow-hidden">
			<div class="flex flex-wrap items-center gap-2">
				<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold bg-rose-50 border border-rose-200 text-rose-700 dark:bg-rose-500/10 dark:border-rose-500/20 dark:text-rose-400 uppercase tracking-wider font-mono">
					Launchpad &bull; Progeta Technologies
				</div>
				<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-[var(--color-surface-subtle)] border border-[var(--border)] text-[var(--text-secondary)] font-mono">
					Session Resources Hub
				</div>
			</div>
			<h1 class="text-2xl sm:text-3xl font-black tracking-tight text-[var(--text-primary)]">
				{event.title}
			</h1>
			<p class="text-xs sm:text-sm text-[var(--text-secondary)]">
				Official session resources, verified slide decks, defensive playbooks, and assets presented by <strong>Launchpad</strong> & <strong>Progeta Technologies</strong>.
			</p>
		</div>

		<!-- Unauthorized State -->
		{#if !data.isAuthorized}
			<div class="bg-[var(--color-surface)] p-8 sm:p-12 rounded-2xl border border-[var(--border)] text-center space-y-4 shadow-xl">
				<div class="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 dark:bg-amber-950/40 dark:border-amber-500/30 flex items-center justify-center mx-auto text-amber-600 dark:text-amber-400">
					<Lock size={22} />
				</div>
				<h3 class="text-lg font-bold text-[var(--text-primary)]">Registration Required</h3>
				<p class="text-xs text-[var(--text-secondary)] max-w-md mx-auto">
					Session materials are reserved exclusively for registered attendees who signed up for this session.
				</p>
				<a
					href={`/events/${event.slug}`}
					class="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition shadow-sm"
				>
					<span>Register for Session</span>
				</a>
			</div>

		{:else if data.resources.length === 0}
			<div class="bg-[var(--color-surface)] p-8 sm:p-12 rounded-2xl border border-dashed border-[var(--border)] text-center space-y-2">
				<FileText size={32} class="mx-auto text-[var(--text-muted)] opacity-60" />
				<h3 class="text-sm font-bold text-[var(--text-primary)]">No Resources Uploaded Yet</h3>
				<p class="text-xs text-[var(--text-muted)]">The instructor has not added files to this session yet.</p>
			</div>

		{:else}
			<!-- Resources List -->
			<div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--border)] divide-y divide-[var(--border-subtle)] overflow-hidden shadow-xl">
				{#each data.resources as res}
					<div class="p-5 flex items-center justify-between gap-4 hover:bg-[var(--color-surface-elevated)] transition">
						<div class="flex items-center gap-3.5 min-w-0">
							<div class="w-10 h-10 rounded-xl bg-[var(--color-surface-subtle)] border border-[var(--border)] flex items-center justify-center shrink-0">
								{#if res.resourceType === 'recording'}
									<Video size={18} class="text-rose-400" />
								{:else if res.resourceType === 'link'}
									<ExternalLink size={18} class="text-sky-400" />
								{:else}
									<FileText size={18} class="text-emerald-400" />
								{/if}
							</div>
							<div class="min-w-0">
								<h3 class="text-sm font-bold text-[var(--text-primary)] truncate">{res.title}</h3>
								<div class="flex items-center gap-2 text-[11px] text-[var(--text-muted)] font-mono mt-0.5">
									<span class="capitalize">{res.resourceType}</span>
									{#if res.fileSizePaise}
										<span>&bull; {(res.fileSizePaise / (1024 * 1024)).toFixed(1)} MB</span>
									{/if}
								</div>
							</div>
						</div>

						<div>
							{#if res.resourceType === 'link' && res.externalUrl}
								<a
									href={res.externalUrl}
									target="_blank"
									rel="noopener noreferrer"
									class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-[var(--text-primary)] bg-[var(--color-surface-elevated)] border border-[var(--border)] hover:border-[var(--border-strong)] transition"
								>
									<span>Open Link</span>
									<ExternalLink size={12} />
								</a>
							{:else}
								<a
									href={`/api/resource/${res.id}`}
									class="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition shadow-sm"
								>
									<Download size={13} />
									<span>Download</span>
								</a>
							{/if}
						</div>
					</div>
				{/each}
			</div>

			<div class="p-4 rounded-xl bg-[var(--color-surface)] border border-[var(--border-subtle)] flex items-center gap-2 text-xs text-[var(--text-muted)]">
				<ShieldCheck size={16} class="text-emerald-400 shrink-0" />
				<span>Download links are authenticated and cryptographically signed with 1-hour validity for security.</span>
			</div>
		{/if}

	</div>
</div>
