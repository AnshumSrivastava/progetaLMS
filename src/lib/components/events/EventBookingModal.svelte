<script lang="ts">
	import { X, Loader2, CheckCircle, AlertCircle, Coins, CreditCard, Sparkles, User, Mail, Phone } from 'lucide-svelte';
	import { goto } from '$app/navigation';

	interface Props {
		isOpen: boolean;
		event: {
			id: string;
			title: string;
			slug: string;
			pricePaise: number;
			priceCredits: number | null;
			startAt: string;
			venueType: string;
			whatsappGroupUrl?: string | null;
		};
		userCredits: number;
		currentUser?: { id: string; name?: string | null; email?: string | null } | null;
		selectedTierId?: 'attendee' | 'certified' | 'all_access';
		onClose: () => void;
		onSuccess: (result: any) => void;
	}

	let {
		isOpen,
		event,
		userCredits = 0,
		currentUser = null,
		selectedTierId = 'certified',
		onClose,
		onSuccess
	}: Props = $props();

	let activeTier = $state<'attendee' | 'certified' | 'all_access'>(selectedTierId);

	// Sync when prop changes
	$effect(() => {
		if (selectedTierId) {
			activeTier = selectedTierId;
		}
	});

	// Attendee contact info (for guests or updating)
	let attendeeName = $state(currentUser?.name || '');
	let attendeeEmail = $state(currentUser?.email || '');
	let attendeePhone = $state('');

	const tiers = [
		{
			id: 'attendee' as const,
			price: 99,
			label: 'Normal Attendee',
			perks: 'Live Session + Tool List'
		},
		{
			id: 'certified' as const,
			price: 299,
			label: 'Certified Pass',
			badge: 'Recommended',
			perks: 'Everything above + Certificate'
		},
		{
			id: 'all_access' as const,
			price: 499,
			label: 'All-Access Pass',
			badge: 'Complete VIP',
			perks: 'Everything above + Defense Playbook'
		}
	];

	const activeTierObj = $derived(
		tiers.find((t) => t.id === activeTier) || tiers[1]
	);

	const currentPrice = $derived(activeTierObj.price);

	let selectedMethod = $state<'free' | 'credit' | 'cashfree'>(
		event.pricePaise === 0
			? 'free'
			: event.priceCredits && userCredits >= event.priceCredits
			? 'credit'
			: 'cashfree'
	);

	let isSubmitting = $state(false);
	let errorMessage = $state('');
	let isCompleted = $state(false);
	let bookingResult = $state<any>(null);

	const whatsappUrl = event.whatsappGroupUrl || 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i';

	async function handleRegister() {
		errorMessage = '';

		// Validate guest details
		if (!currentUser) {
			if (!attendeeName.trim()) {
				errorMessage = 'Please enter your full name.';
				return;
			}
			const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
			if (!attendeeEmail.trim() || !emailPattern.test(attendeeEmail.trim())) {
				errorMessage = 'Please enter a valid email address.';
				return;
			}
		}

		isSubmitting = true;

		try {
			const res = await fetch(`/api/events/${event.id}/register`, {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					paymentMethod: selectedMethod,
					ticketTierId: activeTier,
					name: attendeeName.trim(),
					email: attendeeEmail.trim().toLowerCase(),
					phone: attendeePhone.trim()
				})
			});

			const data = await res.json();

			if (!res.ok) {
				errorMessage = data.message || data.error || 'Failed to complete registration';
				isSubmitting = false;
				return;
			}

			// If Cashfree payment is required
			if (data.requiresPayment && data.paymentSessionId) {
				if (data.isMockMode) {
					// In test/mock mode: instant confirmed
					isCompleted = true;
					bookingResult = data;
					isSubmitting = false;
					onSuccess(data);
					return;
				}

				// Live Cashfree Checkout
				if (typeof window !== 'undefined') {
					// @ts-ignore
					const CashfreeGlobal = (window as any).Cashfree;
					if (typeof CashfreeGlobal === 'function') {
						const cashfree = CashfreeGlobal({ mode: 'production' });
						cashfree.checkout({
							paymentSessionId: data.paymentSessionId,
							redirectTarget: '_self'
						});
					} else {
						window.location.href = `https://payments.cashfree.com/forms/${data.paymentSessionId}`;
					}
				}
				return;
			}

			// Free or Credit booking confirmed
			isCompleted = true;
			bookingResult = data;
			isSubmitting = false;
			onSuccess(data);
		} catch (err: any) {
			errorMessage = err.message || 'Network error while registering';
			isSubmitting = false;
		}
	}
</script>

{#if isOpen}
	<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
		<div class="relative w-full max-w-lg bg-[#ffffff] text-[#09090b] rounded-2xl border border-zinc-200 shadow-2xl p-6 sm:p-7 max-h-[92vh] overflow-y-auto">
			
			<button
				type="button"
				onclick={onClose}
				class="absolute top-4 right-4 text-zinc-400 hover:text-zinc-950 p-1.5 rounded-lg hover:bg-zinc-100 transition"
				aria-label="Close modal"
			>
				<X size={18} />
			</button>

			{#if isCompleted}
				<div class="text-center py-4">
					<div class="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto mb-4 border border-emerald-200">
						<CheckCircle size={24} />
					</div>

					<h3 class="text-xl font-black text-zinc-950 tracking-tight">Seat Reserved Successfully!</h3>
					<p class="text-xs text-zinc-600 mt-1.5 leading-relaxed max-w-xs mx-auto">
						Your pass for <strong>{event.title}</strong> is confirmed. A receipt and calendar invite have been dispatched.
					</p>

					<div class="mt-6 p-4 rounded-xl bg-zinc-50 border border-zinc-200 text-left space-y-2.5">
						<div class="text-[11px] font-mono font-bold uppercase tracking-wider text-red-600">
							Next Step &bull; Community Access
						</div>
						<p class="text-xs text-zinc-700 leading-relaxed">
							Join the private session WhatsApp group where livestream links, toolkits, and updates are posted.
						</p>
						<div class="pt-2">
							<a
								href={whatsappUrl}
								target="_blank"
								rel="noopener noreferrer"
								class="inline-flex items-center justify-center w-full px-4 py-3 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl transition shadow-md shadow-emerald-600/20 gap-2"
							>
								<span>Join Official WhatsApp Group</span>
								<span>&rarr;</span>
							</a>
						</div>
					</div>

					<div class="mt-5 flex gap-2">
						<button
							type="button"
							onclick={onClose}
							class="w-full py-2.5 text-xs font-semibold text-zinc-600 hover:text-zinc-950 border border-zinc-200 rounded-xl transition hover:bg-zinc-50"
						>
							Done
						</button>
						<button
							type="button"
							onclick={() => { onClose(); goto(`/events/${event.slug}/resources`); }}
							class="w-full py-2.5 text-xs font-bold text-white bg-zinc-950 hover:bg-zinc-800 rounded-xl transition"
						>
							View Resources
						</button>
					</div>
				</div>

			{:else}
				<div class="mb-5">
					<span class="text-[11px] font-mono font-bold uppercase tracking-wider text-red-600">
						Reserve Your Seat
					</span>
					<h2 class="text-xl font-black tracking-tight text-zinc-950 mt-0.5">{event.title}</h2>
					<p class="text-xs font-mono text-zinc-500 mt-1">
						{new Date(event.startAt).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}
						&bull; 8:00 PM (IST) &bull; Live Interactive
					</p>
				</div>

				{#if errorMessage}
					<div class="mb-4 flex items-start gap-2.5 p-3 text-xs text-red-600 bg-red-50 border border-red-200 rounded-xl">
						<AlertCircle size={15} class="shrink-0 mt-0.5" />
						<span>{errorMessage}</span>
					</div>
				{/if}

				<!-- Ticket Tier Selection -->
				<div class="mb-5 space-y-2">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-500">
							Select Ticket Tier
						</span>
						<span class="text-[11px] font-mono text-zinc-400">
							Choose one
						</span>
					</div>

					<div class="grid grid-cols-1 gap-2">
						{#each tiers as tier}
							<button
								type="button"
								onclick={() => (activeTier = tier.id)}
								class="w-full text-left p-3.5 rounded-xl border transition flex items-center justify-between {activeTier === tier.id ? 'border-red-600 bg-red-50/40 ring-1 ring-red-600 shadow-sm' : 'border-zinc-200 hover:border-zinc-300 bg-white'}"
							>
								<div class="min-w-0 pr-2">
									<div class="flex items-center gap-2">
										<span class="text-xs font-bold text-zinc-950">{tier.label}</span>
										{#if tier.badge}
											<span class="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold uppercase {tier.id === 'certified' ? 'bg-red-600 text-white' : 'bg-zinc-950 text-white'}">
												{tier.badge}
											</span>
										{/if}
									</div>
									<p class="text-[11px] text-zinc-500 truncate mt-0.5">{tier.perks}</p>
								</div>
								<span class="text-base font-mono font-black text-zinc-950 shrink-0">
									₹{tier.price}
								</span>
							</button>
						{/each}
					</div>
				</div>

				<!-- Attendee Details -->
				<div class="mb-5 p-4 rounded-xl border border-zinc-200 bg-zinc-50/60 space-y-3">
					<div class="flex items-center justify-between">
						<span class="text-[11px] font-mono font-bold uppercase tracking-wider text-zinc-600">
							Attendee Information
						</span>
						{#if currentUser}
							<span class="text-[10px] font-mono text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
								Signed In
							</span>
						{/if}
					</div>

					{#if currentUser}
						<div class="text-xs text-zinc-700 space-y-1">
							<p><strong>Name:</strong> {currentUser.name || 'Student'}</p>
							<p><strong>Email:</strong> {currentUser.email}</p>
						</div>
						<div>
							<label for="attendee-phone" class="text-[11px] font-mono text-zinc-500 block mb-1">
								WhatsApp Phone (for session access):
							</label>
							<input
								id="attendee-phone"
								type="tel"
								bind:value={attendeePhone}
								placeholder="+91 98765 43210"
								class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
							/>
						</div>
					{:else}
						<div class="space-y-2.5">
							<div>
								<label for="guest-name" class="text-[11px] font-mono text-zinc-500 block mb-1">
									Full Name *
								</label>
								<input
									id="guest-name"
									type="text"
									bind:value={attendeeName}
									placeholder="e.g. Alex Sharma"
									class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
								/>
							</div>

							<div>
								<label for="guest-email" class="text-[11px] font-mono text-zinc-500 block mb-1">
									Email Address * (for pass & calendar invite)
								</label>
								<input
									id="guest-email"
									type="email"
									bind:value={attendeeEmail}
									placeholder="you@example.com"
									class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
								/>
							</div>

							<div>
								<label for="guest-phone" class="text-[11px] font-mono text-zinc-500 block mb-1">
									WhatsApp Mobile Number (for group invite link)
								</label>
								<input
									id="guest-phone"
									type="tel"
									bind:value={attendeePhone}
									placeholder="+91 98765 43210"
									class="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 bg-white text-zinc-950 focus:outline-none focus:ring-1 focus:ring-zinc-950"
								/>
							</div>
						</div>
					{/if}
				</div>

				<!-- Payment Selection -->
				<div class="space-y-2.5 mb-6">
					{#if event.pricePaise === 0}
						<div class="p-3.5 border-2 border-zinc-950 rounded-xl bg-zinc-50">
							<div class="flex items-center justify-between">
								<span class="text-xs font-bold text-zinc-950">Free Ticket</span>
								<span class="text-xs font-extrabold text-zinc-950">₹0</span>
							</div>
						</div>
					{:else}
						<!-- Option 1: Credit Payment (if enabled and user is logged in) -->
						{#if currentUser && event.priceCredits !== null && event.priceCredits !== undefined && event.priceCredits > 0}
							{@const canAfford = userCredits >= event.priceCredits}
							<button
								type="button"
								onclick={() => { if (canAfford) selectedMethod = 'credit'; }}
								class="w-full text-left p-3 border rounded-xl transition {selectedMethod === 'credit' ? 'border-zinc-950 bg-zinc-50 ring-1 ring-zinc-950' : 'border-zinc-200 hover:border-zinc-300'} {!canAfford ? 'opacity-60 cursor-not-allowed' : ''}"
							>
								<div class="flex items-center justify-between">
									<div class="flex items-center gap-2">
										<Coins size={15} class="text-zinc-950" />
										<span class="text-xs font-bold text-zinc-950">Use Platform Credits</span>
									</div>
									<span class="text-xs font-mono font-bold text-zinc-950">{event.priceCredits} Credits</span>
								</div>
								<div class="mt-1 flex items-center justify-between text-[11px] text-zinc-500">
									<span>Your balance: <strong>{userCredits} Credits</strong></span>
									{#if !canAfford}
										<a href="/credits" class="text-zinc-950 font-semibold hover:underline">Buy Credits &rarr;</a>
									{/if}
								</div>
							</button>
						{/if}

						<!-- Option 2: Cashfree Payment -->
						<button
							type="button"
							onclick={() => (selectedMethod = 'cashfree')}
							class="w-full text-left p-3.5 border rounded-xl transition {selectedMethod === 'cashfree' ? 'border-red-600 bg-red-50/30 ring-1 ring-red-600' : 'border-zinc-200 hover:border-zinc-300'}"
						>
							<div class="flex items-center justify-between">
								<div class="flex items-center gap-2">
									<CreditCard size={15} class="text-red-600" />
									<span class="text-xs font-bold text-zinc-950">UPI / QR / Cards / Netbanking</span>
								</div>
								<span class="text-sm font-mono font-bold text-zinc-950">₹{currentPrice}</span>
							</div>
							<p class="text-[11px] text-zinc-500 mt-1">Instant confirmation via Cashfree payment gateway.</p>
						</button>
					{/if}
				</div>

				<!-- Actions -->
				<div class="space-y-2">
					<button
						type="button"
						onclick={handleRegister}
						disabled={isSubmitting}
						class="w-full py-4 px-6 text-xs font-bold uppercase tracking-wider text-white bg-red-600 hover:bg-red-500 rounded-xl transition shadow-xl shadow-red-600/30 active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
					>
						{#if isSubmitting}
							<Loader2 size={15} class="animate-spin" />
							<span>Processing Reservation...</span>
						{:else if event.pricePaise === 0}
							<span>Confirm Free Seat &rarr;</span>
						{:else if selectedMethod === 'credit'}
							<span>Confirm & Spend {event.priceCredits} Credits &rarr;</span>
						{:else}
							<span>Reserve Seat &bull; Pay ₹{currentPrice} &rarr;</span>
						{/if}
					</button>

					<button
						type="button"
						onclick={onClose}
						disabled={isSubmitting}
						class="w-full py-2 text-xs font-mono text-zinc-400 hover:text-zinc-950 transition"
					>
						Cancel
					</button>
				</div>
			{/if}

		</div>
	</div>
{/if}
