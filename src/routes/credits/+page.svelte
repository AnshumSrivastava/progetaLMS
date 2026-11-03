<script lang="ts">
	import type { PageData } from './$types';
	import { goto, invalidateAll } from '$app/navigation';
	import {
		Wallet,
		Coins,
		Sparkles,
		ShieldCheck,
		ArrowRight,
		Loader2,
		CheckCircle2,
		History,
		Zap
	} from 'lucide-svelte';

	let { data }: { data: PageData } = $props();

	let purchasingPackageId = $state<string | null>(null);
	let errorMessage = $state('');
	let successBanner = $state(false);

	async function handleBuyCredits(pkgId: string) {
		if (!data.user) {
			goto(`/sign-in?returnTo=/credits`);
			return;
		}

		errorMessage = '';
		purchasingPackageId = pkgId;

		try {
			const res = await fetch('/api/credits/purchase', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ packageId: pkgId })
			});

			const result = await res.json();

			if (!res.ok) {
				errorMessage = result.error || 'Failed to initialize purchase';
				purchasingPackageId = null;
				return;
			}

			if (result.isMockMode) {
				successBanner = true;
				purchasingPackageId = null;
				await invalidateAll();
				return;
			}

			if (result.paymentSessionId && typeof window !== 'undefined') {
				// @ts-ignore
				const CashfreeGlobal = (window as any).Cashfree;
				if (typeof CashfreeGlobal === 'function') {
					const cashfree = CashfreeGlobal({ mode: 'production' });
					cashfree.checkout({
						paymentSessionId: result.paymentSessionId,
						redirectTarget: '_self'
					});
				} else {
					window.location.href = `https://payments.cashfree.com/forms/${result.paymentSessionId}`;
				}
			}
		} catch (err: any) {
			errorMessage = err.message || 'Payment error';
			purchasingPackageId = null;
		}
	}
</script>

<svelte:head>
	<title>Credits Wallet &bull; Progeta</title>
	<meta name="description" content="Purchase Progeta credits to book workshops and sessions instantly." />
	<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</svelte:head>

<div class="min-h-screen bg-[var(--color-background)] text-[var(--text-primary)] py-12 px-4 sm:px-6 lg:px-8">
	<div class="max-w-5xl mx-auto space-y-10">

		<!-- Header -->
		<div class="text-center max-w-2xl mx-auto space-y-3">
			<div class="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-[var(--color-surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] uppercase tracking-wider">
				<Wallet size={13} class="text-amber-500" />
				<span>Credits Wallet</span>
			</div>
			<h1 class="text-3xl sm:text-4xl lg:text-5xl font-black tracking-tight text-[var(--text-primary)]">
				1-Click Session Booking
			</h1>
			<p class="text-xs sm:text-sm text-[var(--text-secondary)] leading-relaxed">
				Top up credits once and register for any live workshop, masterclass, or downloadable asset with single-click convenience.
			</p>
		</div>

		{#if successBanner}
			<div class="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-center space-y-1">
				<div class="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700">
					<CheckCircle2 size={16} />
					<span>Credits successfully deposited to your wallet!</span>
				</div>
				<p class="text-xs text-[var(--text-secondary)]">You can now book any session instantly.</p>
			</div>
		{/if}

		{#if errorMessage}
			<div class="p-4 bg-rose-50 border border-rose-200 text-rose-700 rounded-2xl text-xs text-center font-medium">
				{errorMessage}
			</div>
		{/if}

		<!-- Balance Card (if authenticated) -->
		{#if data.user}
			<div class="bg-[var(--color-surface)] p-6 sm:p-8 rounded-2xl border border-[var(--border)] flex flex-col sm:flex-row sm:items-center justify-between gap-6 shadow-md">
				<div class="flex items-center gap-4">
					<div class="w-14 h-14 rounded-2xl bg-[var(--color-surface-subtle)] border border-[var(--border)] text-[var(--text-primary)] flex items-center justify-center shrink-0">
						<Wallet size={26} class="text-amber-500" />
					</div>
					<div>
						<div class="text-xs text-[var(--text-muted)] font-mono uppercase tracking-wider">Your Balance</div>
						<div class="text-3xl font-black text-[var(--text-primary)] mt-0.5">{data.balance.balance} Credits</div>
						<div class="text-xs text-[var(--text-muted)] mt-1 font-mono">
							Earned: {data.balance.lifetimeEarned} &bull; Spent: {data.balance.lifetimeSpent}
						</div>
					</div>
				</div>

				<div>
					<a
						href="/events"
						class="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] transition w-full sm:w-auto shadow-sm"
					>
						<span>Explore Sessions</span>
						<ArrowRight size={14} />
					</a>
				</div>
			</div>
		{/if}

		<!-- Packages Grid -->
		<div>
			<h2 class="text-xs font-bold uppercase tracking-widest text-[var(--text-muted)] mb-5 text-center font-mono">
				Select a Credit Bundle
			</h2>
			<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
				{#each data.packages as pkg, idx}
					{@const totalCredits = pkg.credits + (pkg.bonusCredits || 0)}
					{@const isFeatured = idx === 1}
					<div class="bg-[var(--color-surface)] rounded-2xl border transition-all p-6 flex flex-col justify-between {isFeatured ? 'border-[var(--color-accent-red)] shadow-xl relative ring-2 ring-[var(--color-accent-red)]/10' : 'border-[var(--border)] hover:border-[var(--border-strong)] hover:shadow-sm'}">
						<div>
							{#if isFeatured}
								<span class="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-[var(--color-accent-red)] text-white mb-3 shadow-sm">
									Most Popular
								</span>
							{/if}

							<h3 class="text-base font-bold text-[var(--text-primary)]">{pkg.name}</h3>
							
							<div class="mt-4 flex items-baseline gap-1.5">
								<span class="text-4xl font-black text-[var(--text-primary)] font-mono">{totalCredits}</span>
								<span class="text-xs font-semibold text-[var(--text-muted)]">Credits</span>
							</div>

							{#if pkg.bonusCredits > 0}
								<div class="text-xs text-emerald-600 font-semibold mt-2 flex items-center gap-1">
									<Zap size={13} />
									<span>+{pkg.bonusCredits} Free Bonus Credits</span>
								</div>
							{/if}

							<div class="mt-6 pt-4 border-t border-[var(--border-subtle)] flex items-center justify-between text-xs">
								<span class="text-[var(--text-muted)]">Total Price:</span>
								<strong class="text-lg font-black text-[var(--text-primary)] font-mono">₹{(pkg.pricePaise / 100).toFixed(0)}</strong>
							</div>
						</div>

						<div class="mt-6">
							<button
								type="button"
								onclick={() => handleBuyCredits(pkg.id)}
								disabled={purchasingPackageId === pkg.id}
								class="w-full py-3 px-4 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 {isFeatured ? 'bg-[var(--color-accent-red)] text-white hover:bg-[var(--color-accent-red-hover)] shadow-sm' : 'bg-[var(--color-surface-subtle)] text-[var(--text-primary)] hover:bg-[var(--color-surface-elevated)] border border-[var(--border)]'}"
							>
								{#if purchasingPackageId === pkg.id}
									<Loader2 size={14} class="animate-spin" />
									<span>Processing...</span>
								{:else}
									<span>Get Bundle</span>
									<ArrowRight size={13} />
								{/if}
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>

		<!-- Transaction History (if user has any) -->
		{#if data.user && data.transactions.length > 0}
			<div class="bg-[var(--color-surface)] p-6 rounded-2xl border border-[var(--border)] space-y-4 shadow-xl">
				<div class="flex items-center gap-2">
					<History size={16} class="text-[var(--text-muted)]" />
					<h3 class="text-sm font-bold text-[var(--text-primary)]">Recent Credit Activity</h3>
				</div>

				<div class="overflow-x-auto">
					<table class="w-full text-left text-xs">
						<thead>
							<tr class="border-b border-[var(--border-subtle)] text-[var(--text-muted)] font-mono text-[11px]">
								<th class="py-2.5 px-3">Date</th>
								<th class="py-2.5 px-3">Type</th>
								<th class="py-2.5 px-3">Description</th>
								<th class="py-2.5 px-3 text-right">Amount</th>
								<th class="py-2.5 px-3 text-right">Balance</th>
							</tr>
						</thead>
						<tbody class="divide-y divide-[var(--border-subtle)]">
							{#each data.transactions as tx}
								<tr class="hover:bg-[var(--color-surface-subtle)] transition">
									<td class="py-3 px-3 text-[var(--text-muted)] font-mono">
										{new Date(tx.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
									</td>
									<td class="py-3 px-3 capitalize font-semibold text-[var(--text-primary)]">{tx.type}</td>
									<td class="py-3 px-3 text-[var(--text-secondary)] max-w-xs truncate">{tx.description}</td>
									<td class="py-3 px-3 text-right font-mono font-bold {tx.amount > 0 ? 'text-emerald-400' : 'text-rose-400'}">
										{tx.amount > 0 ? `+${tx.amount}` : tx.amount}
									</td>
									<td class="py-3 px-3 text-right text-[var(--text-muted)] font-mono">{tx.balanceAfter}</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			</div>
		{/if}

	</div>
</div>
