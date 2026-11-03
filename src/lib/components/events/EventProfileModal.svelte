<script lang="ts">
	import { X, Loader2, AlertCircle, CheckCircle2 } from 'lucide-svelte';

	interface Props {
		isOpen: boolean;
		onClose: () => void;
		onComplete: (profile: any) => void;
	}

	let { isOpen, onClose, onComplete }: Props = $props();

	let phone = $state('');
	let organization = $state('');
	let jobTitle = $state('');
	let experienceLevel = $state<'student' | 'fresher' | '1-3yrs' | '3-5yrs' | '5+yrs'>('student');
	let city = $state('');
	let state = $state('');
	let linkedinUrl = $state('');
	let githubUrl = $state('');
	let dietaryPreference = $state('');
	let emergencyContact = $state('');

	let isSubmitting = $state(false);
	let errorMessage = $state('');

	async function handleSubmit(e: SubmitEvent) {
		e.preventDefault();
		errorMessage = '';
		isSubmitting = true;

		try {
			const res = await fetch('/api/user/event-profile', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					phone: phone.trim(),
					organization: organization.trim(),
					jobTitle: jobTitle.trim(),
					experienceLevel,
					city: city.trim(),
					state: state.trim(),
					linkedinUrl: linkedinUrl.trim() || undefined,
					githubUrl: githubUrl.trim() || undefined,
					dietaryPreference: dietaryPreference.trim() || undefined,
					emergencyContact: emergencyContact.trim() || undefined
				})
			});

			const data = await res.json();

			if (!res.ok) {
				if (data.issues && Array.isArray(data.issues)) {
					errorMessage = data.issues.map((i: any) => i.message).join('. ');
				} else {
					errorMessage = data.message || data.error || 'Failed to save profile';
				}
				isSubmitting = false;
				return;
			}

			isSubmitting = false;
			onComplete(data.profile);
		} catch (err: any) {
			errorMessage = err.message || 'Network error while saving profile';
			isSubmitting = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
		<div class="relative w-full max-w-lg bg-[#ffffff] text-[#09090b] rounded-xl border border-[#e4e4e7] shadow-2xl p-6 sm:p-8 max-h-[90vh] overflow-y-auto">
			
			<button
				type="button"
				onclick={onClose}
				class="absolute top-4 right-4 text-[#71717a] hover:text-[#09090b] p-1.5 rounded-md hover:bg-[#f4f4f5] transition"
				aria-label="Close modal"
			>
				<X size={18} />
			</button>

			<div class="mb-6">
				<div class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-[#09090b] text-[#ffffff] uppercase tracking-wider mb-2">
					One-Time Setup
				</div>
				<h2 class="text-xl font-bold tracking-tight text-[#09090b]">Complete Your Attendee Profile</h2>
				<p class="text-sm text-[#71717a] mt-1 leading-relaxed">
					Please provide your details before your first session registration. You'll only need to answer this once.
				</p>
			</div>

			{#if errorMessage}
				<div class="mb-5 flex items-start gap-2.5 p-3.5 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg">
					<AlertCircle size={16} class="shrink-0 mt-0.5" />
					<span>{errorMessage}</span>
				</div>
			{/if}

			<form onsubmit={handleSubmit} class="space-y-4">
				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="prof_phone" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							Mobile / WhatsApp Number <span class="text-red-500">*</span>
						</label>
						<input
							id="prof_phone"
							type="tel"
							required
							placeholder="9876543210"
							bind:value={phone}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						/>
					</div>

					<div>
						<label for="prof_exp" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							Experience Level <span class="text-red-500">*</span>
						</label>
						<select
							id="prof_exp"
							bind:value={experienceLevel}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						>
							<option value="student">Student / College</option>
							<option value="fresher">Fresher (0-1 yrs)</option>
							<option value="1-3yrs">Early Career (1-3 yrs)</option>
							<option value="3-5yrs">Mid-Level (3-5 yrs)</option>
							<option value="5+yrs">Senior / Lead (5+ yrs)</option>
						</select>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="prof_org" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							College / Organization <span class="text-red-500">*</span>
						</label>
						<input
							id="prof_org"
							type="text"
							required
							placeholder="e.g. IIT Bombay / Infosys"
							bind:value={organization}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						/>
					</div>

					<div>
						<label for="prof_role" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							Role / Department <span class="text-red-500">*</span>
						</label>
						<input
							id="prof_role"
							type="text"
							required
							placeholder="e.g. B.Tech CSE / Security Intern"
							bind:value={jobTitle}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						/>
					</div>
				</div>

				<div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div>
						<label for="prof_city" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							City <span class="text-red-500">*</span>
						</label>
						<input
							id="prof_city"
							type="text"
							required
							placeholder="e.g. Bengaluru"
							bind:value={city}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						/>
					</div>

					<div>
						<label for="prof_state" class="block text-xs font-semibold text-[#09090b] mb-1.5">
							State <span class="text-red-500">*</span>
						</label>
						<input
							id="prof_state"
							type="text"
							required
							placeholder="e.g. Karnataka"
							bind:value={state}
							class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
						/>
					</div>
				</div>

				<div class="pt-2">
					<label for="prof_linkedin" class="block text-xs font-semibold text-[#09090b] mb-1.5">
						LinkedIn Profile URL <span class="text-[#71717a] font-normal">(Optional)</span>
					</label>
					<input
						id="prof_linkedin"
						type="url"
						placeholder="https://linkedin.com/in/username"
						bind:value={linkedinUrl}
						class="w-full px-3 py-2 text-sm bg-white border border-[#e4e4e7] rounded-lg focus:outline-none focus:ring-1 focus:ring-black focus:border-black text-[#09090b]"
					/>
				</div>

				<div class="pt-4 flex items-center justify-end gap-3 border-t border-[#f4f4f5]">
					<button
						type="button"
						onclick={onClose}
						disabled={isSubmitting}
						class="px-4 py-2 text-xs font-semibold text-[#52525b] hover:text-[#09090b] transition disabled:opacity-50"
					>
						Cancel
					</button>

					<button
						type="submit"
						disabled={isSubmitting}
						class="px-5 py-2.5 text-xs font-bold text-white bg-[#09090b] hover:bg-[#27272a] rounded-lg transition disabled:opacity-50 flex items-center gap-2"
					>
						{#if isSubmitting}
							<Loader2 size={14} class="animate-spin" />
							Saving Profile...
						{:else}
							Save & Continue &rarr;
						{/if}
					</button>
				</div>
			</form>
		</div>
	</div>
{/if}

