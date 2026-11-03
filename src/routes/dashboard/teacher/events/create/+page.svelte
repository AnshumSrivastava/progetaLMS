<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';
	import { ArrowLeft, Loader2, Calendar, MapPin, Sparkles, AlertCircle } from 'lucide-svelte';

	let { form }: { form: ActionData } = $props();

	let eventType = $state<'free' | 'paid'>('free');
	let venueType = $state<'online' | 'offline' | 'hybrid'>('online');
	let isSubmitting = $state(false);
</script>

<div class="p-6 sm:p-8 max-w-4xl mx-auto space-y-6">
	
	<!-- Top Bar -->
	<div class="flex items-center gap-3 border-b border-[var(--border)] pb-6">
		<a
			href="/dashboard/teacher/events"
			class="p-2 rounded-xl text-[var(--text-muted)] hover:text-white hover:bg-[var(--color-surface-elevated)] transition"
		>
			<ArrowLeft size={16} />
		</a>
		<div>
			<h1 class="text-xl sm:text-2xl font-black tracking-tight text-[var(--text-primary)]">Create Session / Masterclass</h1>
			<p class="text-xs text-[var(--text-secondary)]">Set up session details, schedule, pricing, and joining instructions.</p>
		</div>
	</div>

	{#if form?.error}
		<div class="p-4 bg-rose-950/40 border border-rose-500/30 text-rose-300 rounded-2xl text-xs flex items-center gap-2 font-medium">
			<AlertCircle size={15} />
			<span>{form.error}</span>
		</div>
	{/if}

	<form
		method="POST"
		use:enhance={() => {
			isSubmitting = true;
			return async ({ update }) => {
				await update();
				isSubmitting = false;
			};
		}}
		class="space-y-6"
	>
		<!-- Section 1: Basics -->
		<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
			<h2 class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">1. Session Details</h2>

			<div>
				<label for="title" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Session Title <span class="text-rose-400">*</span>
				</label>
				<input
					id="title"
					name="title"
					type="text"
					required
					placeholder="e.g. Masterclass: Hands-On Cloud Penetration Testing"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				/>
			</div>

			<div>
				<label for="shortDescription" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Short Description (Card Summary)
				</label>
				<input
					id="shortDescription"
					name="shortDescription"
					type="text"
					maxlength="160"
					placeholder="Brief overview shown on session cards (max 160 characters)"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				/>
			</div>

			<div>
				<label for="description" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Full Description / Agenda
				</label>
				<textarea
					id="description"
					name="description"
					rows="5"
					placeholder="Detailed breakdown of syllabus, prerequisites, and what students will learn..."
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				></textarea>
			</div>

			<div>
				<label for="coverImageUrl" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Cover Image URL
				</label>
				<input
					id="coverImageUrl"
					name="coverImageUrl"
					type="url"
					placeholder="https://images.unsplash.com/... or storage URL"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				/>
			</div>
		</div>

		<!-- Section 2: Timing -->
		<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
			<h2 class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">2. Schedule & Deadlines</h2>

			<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
				<div>
					<label for="startAt" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
						Start Date & Time <span class="text-rose-400">*</span>
					</label>
					<input
						id="startAt"
						name="startAt"
						type="datetime-local"
						required
						class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
					/>
				</div>

				<div>
					<label for="endAt" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
						End Date & Time <span class="text-rose-400">*</span>
					</label>
					<input
						id="endAt"
						name="endAt"
						type="datetime-local"
						required
						class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
					/>
				</div>
			</div>

			<div>
				<label for="registrationDeadline" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Registration Cutoff Deadline
				</label>
				<input
					id="registrationDeadline"
					name="registrationDeadline"
					type="datetime-local"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				/>
				<p class="text-[11px] text-[var(--text-muted)] mt-1 font-mono">If left blank, cutoff defaults to the session start time.</p>
			</div>
		</div>

		<!-- Section 3: Pricing & Capacity -->
		<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
			<h2 class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">3. Ticket Type & Pricing</h2>

			<div class="flex items-center gap-4">
				<label class="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
					<input
						type="radio"
						name="eventType"
						value="free"
						bind:group={eventType}
						class="text-white focus:ring-white bg-[var(--color-surface-subtle)] border-[var(--border)]"
					/>
					<span>Free Event</span>
				</label>
				<label class="flex items-center gap-2 text-xs font-semibold text-[var(--text-primary)] cursor-pointer">
					<input
						type="radio"
						name="eventType"
						value="paid"
						bind:group={eventType}
						class="text-white focus:ring-white bg-[var(--color-surface-subtle)] border-[var(--border)]"
					/>
					<span>Paid Ticket</span>
				</label>
			</div>

			{#if eventType === 'paid'}
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
					<div>
						<label for="priceRupees" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
							Ticket Price (INR ₹) <span class="text-rose-400">*</span>
						</label>
						<input
							id="priceRupees"
							name="priceRupees"
							type="number"
							min="1"
							step="1"
							placeholder="e.g. 499"
							class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)] font-mono"
						/>
					</div>

					<div>
						<label for="priceCredits" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
							Credit Price (Optional Alternative)
						</label>
						<input
							id="priceCredits"
							name="priceCredits"
							type="number"
							min="1"
							placeholder="e.g. 5"
							class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)] font-mono"
						/>
						<p class="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Students can spend this amount of credits to book instantly.</p>
					</div>
				</div>
			{/if}

			<div>
				<label for="maxAttendees" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Maximum Attendee Capacity
				</label>
				<input
					id="maxAttendees"
					name="maxAttendees"
					type="number"
					min="1"
					placeholder="Leave blank for unlimited attendees"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)] font-mono"
				/>
			</div>
		</div>

		<!-- Section 4: Venue & Delivery -->
		<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] shadow-xl space-y-4">
			<h2 class="text-xs font-mono font-bold uppercase tracking-wider text-[var(--text-muted)]">4. Format & Delivery</h2>

			<div>
				<label for="venueType" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					Venue Format
				</label>
				<select
					id="venueType"
					name="venueType"
					bind:value={venueType}
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
				>
					<option value="online">Online (Zoom / Google Meet)</option>
					<option value="offline">In-Person / Physical Venue</option>
					<option value="hybrid">Hybrid (Both)</option>
				</select>
			</div>

			{#if venueType === 'online' || venueType === 'hybrid'}
				<div>
					<label for="link" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
						Private Meeting Link (Zoom / Meet)
					</label>
					<input
						id="link"
						name="link"
						type="url"
						placeholder="https://meet.google.com/abc-defg-hij"
						class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)] font-mono"
					/>
					<p class="text-[11px] text-[var(--text-muted)] mt-1 font-mono">This link is masked and only shown to confirmed attendees.</p>
				</div>
			{/if}

			{#if venueType === 'offline' || venueType === 'hybrid'}
				<div>
					<label for="address" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
						Physical Address / Classroom Details
					</label>
					<textarea
						id="address"
						name="address"
						rows="2"
						placeholder="Building, room number, campus address..."
						class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)]"
					></textarea>
				</div>
			{/if}

			<div>
				<label for="whatsappGroupUrl" class="block text-xs font-semibold text-[var(--text-primary)] mb-1">
					WhatsApp Group Link (Community)
				</label>
				<input
					id="whatsappGroupUrl"
					name="whatsappGroupUrl"
					type="url"
					placeholder="https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i"
					class="w-full px-3.5 py-2 text-xs bg-[var(--color-surface-subtle)] border border-[var(--border)] rounded-xl focus:outline-none focus:border-white text-[var(--text-primary)] font-mono"
				/>
				<p class="text-[11px] text-[var(--text-muted)] mt-1 font-mono">Sent in confirmation emails and presented to students post-booking.</p>
			</div>
		</div>

		<!-- Submit Bar -->
		<div class="flex items-center justify-end gap-3 pt-4 border-t border-[var(--border)]">
			<button
				type="submit"
				name="status"
				value="draft"
				disabled={isSubmitting}
				class="px-4 py-2.5 rounded-xl text-xs font-semibold border border-[var(--border)] hover:border-[var(--border-strong)] bg-[var(--color-surface-elevated)] text-[var(--text-primary)] transition disabled:opacity-50"
			>
				Save as Draft
			</button>

			<button
				type="submit"
				name="status"
				value="published"
				disabled={isSubmitting}
				class="px-6 py-2.5 rounded-xl text-xs font-bold text-[var(--color-background)] bg-[var(--text-primary)] hover:opacity-90 transition disabled:opacity-50 flex items-center gap-2 shadow-lg"
			>
				{#if isSubmitting}
					<Loader2 size={14} class="animate-spin" />
					Saving...
				{:else}
					Save & Publish Session &rarr;
				{/if}
			</button>
		</div>

	</form>

</div>
