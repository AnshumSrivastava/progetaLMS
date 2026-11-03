<script lang="ts">
	import { enhance } from '$app/forms';
	import type { PageData, ActionData } from './$types';
	import {
		ArrowLeft,
		ArrowUpRight,
		Download,
		Plus,
		Trash2,
		CheckCircle2,
		Users,
		FileText,
		Loader2,
		Sparkles,
		Send
	} from 'lucide-svelte';

	let { data, form }: { data: PageData; form: ActionData } = $props();

	let activeTab = $state<'attendees' | 'resources' | 'overview'>('attendees');
	let isReleasing = $state(false);
	let isAddingResource = $state(false);

	function exportAttendeesCsv() {
		const headers = [
			'Name',
			'Email',
			'Phone',
			'Organization',
			'Role',
			'Payment Method',
			'Amount Paid (INR)',
			'Credits Used',
			'Registered At',
			'Attended'
		];
		const rows = data.attendees.map((a) => [
			`"${(a.name || '').replace(/"/g, '""')}"`,
			`"${(a.email || '').replace(/"/g, '""')}"`,
			`"${(a.phone || '').replace(/"/g, '""')}"`,
			`"${(a.organization || '').replace(/"/g, '""')}"`,
			`"${(a.jobTitle || '').replace(/"/g, '""')}"`,
			`"${a.paymentMethod}"`,
			(a.amountPaidPaise / 100).toFixed(2),
			a.creditsUsed,
			`"${new Date(a.registeredAt).toISOString()}"`,
			a.attendedAt ? 'YES' : 'NO'
		]);

		const csvContent =
			'data:text/csv;charset=utf-8,' +
			[headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
		const encodedUri = encodeURI(csvContent);
		const link = document.createElement('a');
		link.setAttribute('href', encodedUri);
		link.setAttribute('download', `attendees-${data.event.slug}.csv`);
		document.body.appendChild(link);
		link.click();
		document.body.removeChild(link);
	}
</script>

<div class="p-6 sm:p-8 max-w-6xl mx-auto space-y-6">
	
	<!-- Top Bar -->
	<div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border)] pb-6">
		<div class="flex items-center gap-3">
			<a
				href="/dashboard/teacher/events"
				class="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--color-surface-elevated)] transition"
			>
				<ArrowLeft size={16} />
			</a>
			<div>
				<div class="flex items-center gap-2">
					<h1 class="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">{data.event.title}</h1>
					<span class="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-950/60 border border-emerald-500/30 text-emerald-400">
						{data.event.status}
					</span>
				</div>
				<p class="text-xs text-[var(--text-muted)] font-mono mt-0.5">
					{new Date(data.event.startAt).toLocaleDateString('en-US', { dateStyle: 'full' })} &bull; {data.event.venueType.toUpperCase()}
				</p>
			</div>
		</div>

		<div class="flex items-center gap-2.5">
			<a
				href={`/events/${data.event.slug}`}
				target="_blank"
				rel="noopener noreferrer"
				class="px-3.5 py-2 rounded-xl text-xs font-bold border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--color-surface-elevated)] text-[var(--text-primary)] transition flex items-center gap-1.5"
			>
				<span>View Public</span>
				<ArrowUpRight size={13} />
			</a>

			{#if !data.event.isResourcesReleased}
				<form
					method="POST"
					action="?/releaseResources"
					use:enhance={() => {
						isReleasing = true;
						return async ({ update }) => {
							await update();
							isReleasing = false;
						};
					}}
				>
					<button
						type="submit"
						disabled={isReleasing}
						onclick={(e) => {
							if (
								!confirm(
									'This will immediately release all resources and notify all confirmed attendees via email. Proceed?'
								)
							) {
								e.preventDefault();
							}
						}}
						class="px-4 py-2 rounded-xl text-xs font-bold bg-[var(--color-accent-red)] hover:opacity-90 text-white transition disabled:opacity-50 flex items-center gap-1.5 shadow-md"
					>
						{#if isReleasing}
							<Loader2 size={13} class="animate-spin" />
							Releasing...
						{:else}
							<Send size={13} />
							<span>Release Resources</span>
						{/if}
					</button>
				</form>
			{:else}
				<span class="px-3.5 py-2 rounded-xl text-xs font-bold border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 flex items-center gap-1.5">
					<CheckCircle2 size={13} />
					<span>Resources Released</span>
				</span>
			{/if}
		</div>
	</div>

	{#if form?.message}
		<div class="p-3.5 bg-emerald-950/40 border border-emerald-500/30 text-emerald-400 rounded-xl text-xs flex items-center gap-2">
			<CheckCircle2 size={15} />
			<span>{form.message}</span>
		</div>
	{/if}

	<!-- Tabs Header -->
	<div class="flex items-center gap-2 border-b border-[var(--border)] text-xs">
		<button
			type="button"
			onclick={() => (activeTab = 'attendees')}
			class="px-4 py-2.5 font-bold transition border-b-2 {activeTab === 'attendees' ? 'border-white text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'}"
		>
			Attendees ({data.attendees.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'resources')}
			class="px-4 py-2.5 font-bold transition border-b-2 {activeTab === 'resources' ? 'border-white text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'}"
		>
			Resources ({data.resources.length})
		</button>
		<button
			type="button"
			onclick={() => (activeTab = 'overview')}
			class="px-4 py-2.5 font-bold transition border-b-2 {activeTab === 'overview' ? 'border-white text-white' : 'border-transparent text-[var(--text-muted)] hover:text-white'}"
		>
			Session Details
		</button>
	</div>

	<!-- TAB 1: ATTENDEES -->
	{#if activeTab === 'attendees'}
		<div class="space-y-4">
			<div class="flex items-center justify-between">
				<div class="text-xs text-[var(--text-muted)]">
					Total Confirmed Registrations: <strong class="text-white font-mono">{data.attendees.filter((a) => a.status === 'confirmed').length}</strong>
				</div>

				<button
					type="button"
					onclick={exportAttendeesCsv}
					disabled={data.attendees.length === 0}
					class="px-3.5 py-1.5 rounded-xl text-xs font-semibold border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--color-surface-elevated)] text-[var(--text-primary)] transition flex items-center gap-1.5 disabled:opacity-50"
				>
					<Download size={13} />
					<span>Export CSV</span>
				</button>
			</div>

			{#if data.attendees.length === 0}
				<div class="py-12 text-center bg-[var(--color-surface)] rounded-2xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
					No registrations recorded yet.
				</div>
			{:else}
				<div class="bg-[var(--color-surface)] rounded-2xl border border-[var(--border)] shadow-xl overflow-hidden">
					<div class="overflow-x-auto">
						<table class="w-full text-left text-xs">
							<thead>
								<tr class="border-b border-[var(--border)] bg-[var(--color-surface-subtle)] text-[var(--text-muted)] font-mono text-[11px]">
									<th class="py-3 px-4">Student</th>
									<th class="py-3 px-4">Contact</th>
									<th class="py-3 px-4">Organization / Role</th>
									<th class="py-3 px-4">Payment</th>
									<th class="py-3 px-4">Registered</th>
									<th class="py-3 px-4 text-right">Attendance</th>
								</tr>
							</thead>
							<tbody class="divide-y divide-[var(--border-subtle)]">
								{#each data.attendees as att}
									<tr class="hover:bg-[var(--color-surface-elevated)] transition">
										<td class="py-3 px-4 font-semibold text-[var(--text-primary)]">
											{att.name || 'Unnamed Student'}
											<div class="text-[11px] text-[var(--text-muted)] font-normal">{att.email}</div>
										</td>
										<td class="py-3 px-4 text-[var(--text-secondary)] font-mono">
											{att.phone || '—'}
										</td>
										<td class="py-3 px-4 text-[var(--text-secondary)]">
											<div>{att.organization || '—'}</div>
											{#if att.jobTitle}
												<div class="text-[10px] text-[var(--text-muted)]">{att.jobTitle}</div>
											{/if}
										</td>
										<td class="py-3 px-4 font-mono">
											{#if att.paymentMethod === 'free'}
												<span class="text-[var(--text-muted)]">Free</span>
											{:else if att.paymentMethod === 'credit'}
												<span class="font-semibold text-amber-400">{att.creditsUsed} Credits</span>
											{:else}
												<span class="font-semibold text-white">₹{(att.amountPaidPaise / 100).toFixed(0)}</span>
											{/if}
										</td>
										<td class="py-3 px-4 text-[var(--text-muted)] font-mono">
											{new Date(att.registeredAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
										</td>
										<td class="py-3 px-4 text-right">
											{#if att.attendedAt}
												<span class="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-400">
													<CheckCircle2 size={13} /> Present
												</span>
											{:else}
												<form method="POST" action="?/checkinAttendee" use:enhance class="inline-block">
													<input type="hidden" name="registrationId" value={att.registrationId} />
													<button
														type="submit"
														class="px-2.5 py-1 text-[11px] font-semibold border border-[var(--border)] hover:border-white rounded-lg transition"
													>
														Check In
													</button>
												</form>
											{/if}
										</td>
									</tr>
								{/each}
							</tbody>
						</table>
					</div>
				</div>
			{/if}
		</div>

	<!-- TAB 2: RESOURCES -->
	{:else if activeTab === 'resources'}
		<div class="space-y-6">
			<!-- Add Resource Form -->
			<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
				<h3 class="text-sm font-bold text-[var(--text-primary)]">Add Session Resource</h3>
				<form method="POST" action="?/addResource" use:enhance class="space-y-3">
					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="sm:col-span-2">
							<input
								name="title"
								type="text"
								required
								placeholder="Resource Title (e.g. Session Slides PDF, Solution Code Zip)"
								class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
							/>
						</div>
						<div>
							<select
								name="type"
								class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
							>
								<option value="link">External Link (Google Drive / GitHub)</option>
								<option value="file">Storage Key / File Key</option>
								<option value="video">Video Recording Link (YouTube / Loom)</option>
							</select>
						</div>
					</div>

					<div class="grid grid-cols-1 sm:grid-cols-3 gap-3">
						<div class="sm:col-span-2">
							<input
								name="urlOrKey"
								type="text"
								required
								placeholder="Target URL or storage key (e.g. https://github.com/... or events/123/slides.pdf)"
								class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
							/>
						</div>
						<div class="flex items-center gap-2">
							<label class="flex items-center gap-2 text-xs text-[var(--text-secondary)] cursor-pointer">
								<input type="checkbox" name="isPreEvent" class="rounded text-white focus:ring-white bg-[var(--color-surface-subtle)] border-[var(--border)]" />
								<span>Available Before Session</span>
							</label>
						</div>
					</div>

					<div class="flex justify-end pt-1">
						<button
							type="submit"
							class="px-4 py-2 rounded-xl text-xs font-bold text-[var(--color-background)] bg-[var(--text-primary)] hover:opacity-90 transition flex items-center gap-1.5"
						>
							<Plus size={14} />
							<span>Add Resource</span>
						</button>
					</div>
				</form>
			</div>

			<!-- Resource List -->
			<div class="space-y-3">
				{#each data.resources as res}
					<div class="bg-[var(--color-surface)] p-4 rounded-2xl border border-[var(--border)] flex items-center justify-between gap-4">
						<div class="flex items-center gap-3">
							<div class="p-2.5 bg-[var(--color-surface-elevated)] rounded-xl text-white border border-[var(--border)]">
								<FileText size={16} />
							</div>
							<div>
								<div class="flex items-center gap-2">
									<h4 class="text-xs font-bold text-[var(--text-primary)]">{res.title}</h4>
									<span class="px-2 py-0.5 rounded text-[10px] uppercase font-mono font-semibold bg-[var(--color-surface-subtle)] text-[var(--text-muted)]">
										{res.type}
									</span>
									{#if res.isPreEvent}
										<span class="px-2 py-0.5 rounded text-[10px] font-semibold bg-rose-950/60 border border-rose-500/30 text-rose-300">
											Pre-Event
										</span>
									{/if}
								</div>
								<div class="text-[11px] text-[var(--text-muted)] font-mono truncate max-w-md mt-0.5">{res.urlOrKey}</div>
							</div>
						</div>

						<form method="POST" action="?/deleteResource" use:enhance>
							<input type="hidden" name="resourceId" value={res.id} />
							<button
								type="submit"
								onclick={(e) => {
									if (!confirm('Delete this resource?')) e.preventDefault();
								}}
								class="p-2 rounded-lg text-[var(--text-muted)] hover:text-rose-400 transition"
								title="Delete resource"
							>
								<Trash2 size={15} />
							</button>
						</form>
					</div>
				{:else}
					<div class="py-10 text-center bg-[var(--color-surface)] rounded-2xl border border-dashed border-[var(--border)] text-xs text-[var(--text-muted)]">
						No resources attached yet. Add slides, worksheets, or links above.
					</div>
				{/each}
			</div>

		</div>

	<!-- TAB 3: OVERVIEW -->
	{:else if activeTab === 'overview'}
		<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 text-xs">
			<h3 class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">Session Metadata</h3>
			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 text-[var(--text-secondary)]">
				<div>
					<span class="text-[var(--text-muted)] block">Meeting / Joining Link</span>
					<span class="font-mono text-white break-all">{data.event.link || 'Not provided'}</span>
				</div>
				<div>
					<span class="text-[var(--text-muted)] block">Community WhatsApp Group</span>
					<span class="font-mono text-white break-all">{data.event.whatsappGroupUrl || 'Not configured'}</span>
				</div>
				<div>
					<span class="text-[var(--text-muted)] block">Price</span>
					<span class="font-bold text-white font-mono">{data.event.pricePaise === 0 ? 'Free' : `₹${data.event.pricePaise / 100}`}</span>
				</div>
				<div>
					<span class="text-[var(--text-muted)] block">Credits Price</span>
					<span class="font-bold text-white font-mono">{data.event.priceCredits ? `${data.event.priceCredits} Credits` : 'Disabled'}</span>
				</div>
			</div>
		</div>
	{/if}

</div>
