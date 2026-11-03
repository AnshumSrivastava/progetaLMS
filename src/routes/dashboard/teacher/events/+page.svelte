<script lang="ts">
	import type { PageData } from './$types';
	import { Calendar, Plus, Users, ArrowUpRight, Eye } from 'lucide-svelte';

	let { data }: { data: PageData } = $props();
</script>

<div class="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
	
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
		<div>
			<h1 class="text-2xl font-black tracking-tight text-[var(--text-primary)]">Events & Masterclasses</h1>
			<p class="text-xs text-[var(--text-secondary)] mt-1">
				Manage your scheduled workshops, attendee rosters, and post-event downloadable resources.
			</p>
		</div>

		<div class="flex items-center gap-3">
			<a
				href="/dashboard/teacher/events/create"
				class="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-background)] bg-[var(--text-primary)] hover:opacity-90 transition shadow-sm"
			>
				<Plus size={15} />
				<span>Create Session</span>
			</a>
		</div>
	</div>

	<!-- Events Table -->
	{#if data.events.length === 0}
		<div class="py-16 text-center border border-dashed border-[var(--border)] rounded-2xl bg-[var(--color-surface)] p-8">
			<Calendar size={36} class="mx-auto text-[var(--text-muted)] mb-3" />
			<h3 class="text-base font-bold text-[var(--text-primary)]">No sessions created yet</h3>
			<p class="text-xs text-[var(--text-secondary)] mt-1 max-w-sm mx-auto">
				Launch your first 1-day live session, ticketed workshop, or webinar with automated resource unlocking.
			</p>
			<a
				href="/dashboard/teacher/events/create"
				class="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-background)] bg-[var(--text-primary)] hover:opacity-90 transition"
			>
				<Plus size={14} />
				<span>Create Your First Session</span>
			</a>
		</div>

	{:else}
		<div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
			<div class="overflow-x-auto">
				<table class="w-full text-left text-xs">
					<thead>
						<tr class="border-b border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--text-muted)] font-mono text-[11px]">
							<th class="py-3 px-4">Session Title</th>
							<th class="py-3 px-4">Date & Time</th>
							<th class="py-3 px-4">Status</th>
							<th class="py-3 px-4">Registrations</th>
							<th class="py-3 px-4">Revenue</th>
							<th class="py-3 px-4 text-right">Actions</th>
						</tr>
					</thead>
					<tbody class="divide-y divide-[var(--border-subtle)]">
						{#each data.events as evt}
							<tr class="hover:bg-[var(--color-surface-elevated)] transition">
								<td class="py-3.5 px-4 font-semibold text-[var(--text-primary)]">
									<a href={`/dashboard/teacher/events/${evt.id}`} class="hover:underline">
										{evt.title}
									</a>
									<div class="text-[10px] text-[var(--text-muted)] font-mono uppercase tracking-wider mt-0.5">
										{evt.venueType} &bull; {evt.eventType}
									</div>
								</td>
								<td class="py-3.5 px-4 text-[var(--text-secondary)]">
									{new Date(evt.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
									<div class="text-[10px] text-[var(--text-muted)] font-mono">
										{new Date(evt.startAt).toLocaleTimeString('en-US', { timeStyle: 'short' })}
									</div>
								</td>
								<td class="py-3.5 px-4">
									<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider {evt.status === 'published' ? 'bg-emerald-950/60 border border-emerald-500/30 text-emerald-400' : evt.status === 'draft' ? 'border border-[var(--border)] text-[var(--text-muted)]' : 'bg-[var(--color-surface-subtle)] text-[var(--text-muted)]'}">
										{evt.status}
									</span>
								</td>
								<td class="py-3.5 px-4 text-[var(--text-primary)] font-mono">
									<strong>{evt.stats.confirmedCount}</strong>
									{#if evt.maxAttendees}
										<span class="text-[var(--text-muted)]"> / {evt.maxAttendees}</span>
									{/if}
								</td>
								<td class="py-3.5 px-4 text-[var(--text-primary)] font-mono">
									{#if evt.eventType === 'free'}
										<span class="text-[var(--text-muted)]">Free</span>
									{:else}
										<div>₹{(evt.stats.totalRevenuePaise / 100).toFixed(0)}</div>
										{#if evt.stats.creditsUsed > 0}
											<div class="text-[10px] text-[var(--text-muted)]">{evt.stats.creditsUsed} cr</div>
										{/if}
									{/if}
								</td>
								<td class="py-3.5 px-4 text-right">
									<div class="flex items-center justify-end gap-2">
										<a
											href={`/events/${evt.slug}`}
											target="_blank"
											rel="noopener noreferrer"
											class="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-white hover:bg-[var(--color-surface-subtle)] transition"
											title="View Public Page"
										>
											<ArrowUpRight size={14} />
										</a>
										<a
											href={`/dashboard/teacher/events/${evt.id}`}
											class="px-3 py-1 rounded-lg text-xs font-semibold border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--color-surface-elevated)] text-[var(--text-primary)] transition"
										>
											Manage
										</a>
									</div>
								</td>
							</tr>
						{/each}
					</tbody>
				</table>
			</div>
		</div>
	{/if}

</div>
