<script lang="ts">
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { ShieldCheck, Tag, ArrowRight, CreditCard, CheckCircle2 } from 'lucide-svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	const item = data.asset;
	let couponCode = $state('');
	
	let discountAmount = $state(0);
	let discountApplied = $state(false);

	let isCheckingOut = $state(false);
	
	let total = $derived((item.pricePaise / 100) - discountAmount);

	$effect(() => {
		if (form?.couponValid) {
			discountApplied = true;
			if (form.couponType === 'percent') {
				discountAmount = (item.pricePaise / 100) * (form.couponValue / 100);
			} else {
				discountAmount = form.couponValue / 100;
			}
		} else if (form?.couponError) {
			discountApplied = false;
			discountAmount = 0;
			alert(form.couponError);
		}

		if (form?.success) {
			if (form.isFree || form.isMockMode) {
				alert('Payment Successful! Your new resource is now available in your dashboard.');
				goto('/dashboard');
			} else if (form.paymentSessionId) {
				// Initialize Cashfree
				if (form.paymentSessionId === 'mock_session_id_no_keys_provided') {
					alert('[Mock Mode] Your .env is missing Cashfree keys! Bypassing actual payment gateway UI and returning you to dashboard. Wait for Webhook to mock processing.');
					goto('/dashboard');
				} else {
					// @ts-ignore
					const cashfree = window.Cashfree({
						mode: 'sandbox' // or production based on your environment
					});
					cashfree.checkout({
						paymentSessionId: form.paymentSessionId,
						redirectTarget: '_self' // Redirects the entire page to Cashfree
					});
				}
			}
		} else if (form?.checkoutError) {
			alert('Checkout error: ' + form.checkoutError);
		}
	});
</script>

<svelte:head>
	<title>Checkout — Launchpad</title>
	<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</svelte:head>

<div class="checkout-page">
	<div class="container">
		
		<div class="checkout-header">
			<a href="/catalog" class="back-link">
				<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 12H5"/><path d="M12 19l-7-7 7-7"/></svg>
				Cancel Purchase
			</a>
			<h1>Secure Checkout</h1>
		</div>

		<div class="checkout-grid">
			
			<!-- Left: Payment/Billing Details -->
			<div class="payment-column">
				<form method="POST" action="?/checkout" use:enhance={() => { isCheckingOut = true; return async ({ update }) => { isCheckingOut = false; update(); }; }}>
					<input type="hidden" name="couponCode" value={form?.couponValid ? form.couponCode : ''} />
					<div class="form-section">
						<h2>Billing Information</h2>
						{#if data.alreadyOwned}
							<div class="success-banner mb-4" style="background: rgba(16, 185, 129, 0.1); color: #10b981; padding: 12px; border-radius: 8px;">
								You already own this resource! <a href="/dashboard" style="color: inherit; text-decoration: underline;">Go to Dashboard</a>
							</div>
						{/if}
						<div class="input-grid">
							<div class="input-group">
								<label>First Name</label>
								<input type="text" name="firstName" placeholder="Jane" required />
							</div>
							<div class="input-group">
								<label>Last Name</label>
								<input type="text" name="lastName" placeholder="Doe" required />
							</div>
							<div class="input-group full-width">
								<label>Email Address</label>
								<input type="email" name="email" placeholder="jane@example.com" required />
							</div>
						</div>
					</div>

					<div class="form-section">
						<h2>Payment Method</h2>
						<div class="payment-card-mock">
							<div class="mock-header">
								<CreditCard size={20} />
								<span>Pay securely with Cashfree</span>
							</div>
							<p style="font-size: 0.9rem; color: var(--text-muted); line-height: 1.5;">
								You will be securely redirected to the Cashfree payment gateway to complete your purchase using Cards, UPI, Netbanking, or Wallets.
							</p>
						</div>
					</div>

					<button type="submit" class="complete-btn" disabled={isCheckingOut || data.alreadyOwned}>
						{isCheckingOut ? 'Initializing...' : 'Proceed to Payment'}
						<ArrowRight size={18} />
					</button>
				</form>
				<p class="secure-note">
					<ShieldCheck size={14} /> Payments are secure and encrypted.
				</p>
			</div>

			<!-- Right: Order Summary -->
			<div class="summary-column">
				<div class="summary-card">
					<h2>Order Summary</h2>
					
					<div class="order-item">
						<div class="item-details">
							<span class="item-type">{item.type}</span>
							<h4>{item.title}</h4>
						</div>
						<div class="item-price">₹{item.pricePaise === 0 ? '0.00' : (item.pricePaise / 100).toFixed(2)}</div>
					</div>

					<div class="coupon-section">
						{#if discountApplied}
							<div class="coupon-success">
								<CheckCircle2 size={16} /> Coupon '{form?.couponCode}' applied!
							</div>
						{:else}
							<form method="POST" action="?/validateCoupon" use:enhance class="coupon-input-group">
								<Tag size={16} class="tag-icon" />
								<input 
									type="text" 
									name="couponCode"
									placeholder="Coupon Code" 
									bind:value={couponCode} 
								/>
								<button type="submit">Apply</button>
							</form>
						{/if}
					</div>

					<div class="totals-section">
						<div class="total-row">
							<span>Subtotal</span>
							<span>₹{(item.pricePaise / 100).toFixed(2)}</span>
						</div>
						{#if discountApplied}
							<div class="total-row discount">
								<span>Discount</span>
								<span>-₹{discountAmount.toFixed(2)}</span>
							</div>
						{/if}
						<div class="total-row final-total">
							<span>Total Due</span>
							<span>₹{total.toFixed(2)}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

	</div>
</div>

<style>
	.checkout-page {
		min-height: calc(100vh - var(--nav-h));
		background: var(--bg-subtle);
		padding-bottom: 6rem;
	}
	.container {
		max-width: 1000px;
		margin: 0 auto;
		padding: 0 1.5rem;
	}

	.checkout-header {
		padding: 3rem 0 2rem;
	}
	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 8px;
		color: var(--text-secondary);
		text-decoration: none;
		font-size: 0.9rem;
		font-weight: 500;
		margin-bottom: 1.5rem;
		transition: color 0.2s;
	}
	.back-link:hover {
		color: var(--text-primary);
	}
	.checkout-header h1 {
		font-size: 2rem;
		font-weight: 800;
		color: var(--text-primary);
		letter-spacing: -0.02em;
	}

	.checkout-grid {
		display: grid;
		grid-template-columns: 1fr 380px;
		gap: 4rem;
	}

	/* Left Column: Payment */
	.form-section {
		margin-bottom: 3rem;
	}
	.form-section h2 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
	}

	.input-grid {
		display: grid;
		grid-template-columns: 1fr 1fr;
		gap: 1.25rem;
	}
	.input-group {
		display: flex;
		flex-direction: column;
		gap: 6px;
	}
	.input-group.full-width {
		grid-column: 1 / -1;
	}
	.input-group label {
		font-size: 0.85rem;
		font-weight: 600;
		color: var(--text-secondary);
	}
	.input-group input {
		padding: 12px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 8px;
		font-size: 0.95rem;
		color: var(--text-primary);
		transition: border-color 0.2s;
	}
	.input-group input:focus {
		outline: none;
		border-color: var(--accent);
	}

	.payment-card-mock {
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: 12px;
		padding: 1.5rem;
	}
	.mock-header {
		display: flex;
		align-items: center;
		gap: 10px;
		margin-bottom: 1.5rem;
		font-weight: 600;
		color: var(--text-primary);
	}

	.complete-btn {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 10px;
		padding: 16px;
		background: var(--accent-gradient);
		color: white;
		border: none;
		border-radius: 8px;
		font-size: 1.1rem;
		font-weight: 700;
		cursor: pointer;
		transition: transform 0.2s, box-shadow 0.2s;
		box-shadow: var(--shadow-md);
		margin-bottom: 1rem;
	}
	.complete-btn:hover {
		transform: translateY(-2px);
		box-shadow: var(--shadow-lg);
	}

	.secure-note {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 6px;
		font-size: 0.8rem;
		color: var(--text-muted);
	}

	/* Right Column: Order Summary */
	.summary-card {
		background: var(--bg);
		border-radius: 16px;
		padding: 2rem;
		box-shadow: var(--shadow-xl);
		position: sticky;
		top: calc(var(--nav-h) + 2rem);
	}
	.summary-card h2 {
		font-size: 1.25rem;
		font-weight: 700;
		margin-bottom: 1.5rem;
		color: var(--text-primary);
		padding-bottom: 1rem;
		border-bottom: 1px solid var(--border-subtle);
	}

	.order-item {
		display: flex;
		justify-content: space-between;
		align-items: flex-start;
		margin-bottom: 2rem;
	}
	.item-type {
		font-size: 0.75rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		color: var(--accent);
		margin-bottom: 4px;
		display: block;
	}
	.item-details h4 {
		font-size: 1.05rem;
		font-weight: 600;
		color: var(--text-primary);
		line-height: 1.4;
	}
	.item-price {
		font-weight: 600;
		color: var(--text-primary);
	}

	.coupon-section {
		margin-bottom: 2rem;
	}
	.coupon-input-group {
		display: flex;
		position: relative;
	}
	.tag-icon {
		position: absolute;
		left: 12px;
		top: 50%;
		transform: translateY(-50%);
		color: var(--text-muted);
	}
	.coupon-input-group input {
		flex: 1;
		padding: 10px 10px 10px 36px;
		background: var(--bg-subtle);
		border: 1px solid var(--border);
		border-radius: 8px 0 0 8px;
		font-size: 0.9rem;
	}
	.coupon-input-group input:focus {
		outline: none;
		border-color: var(--accent);
	}
	.coupon-input-group button {
		background: var(--text-primary);
		color: var(--bg);
		border: none;
		padding: 0 16px;
		border-radius: 0 8px 8px 0;
		font-weight: 600;
		cursor: pointer;
	}
	.coupon-success {
		display: flex;
		align-items: center;
		gap: 8px;
		color: #10b981;
		background: rgba(16, 185, 129, 0.1);
		padding: 10px 12px;
		border-radius: 8px;
		font-size: 0.9rem;
		font-weight: 500;
	}

	.totals-section {
		border-top: 1px solid var(--border-subtle);
		padding-top: 1.5rem;
		display: flex;
		flex-direction: column;
		gap: 12px;
	}
	.total-row {
		display: flex;
		justify-content: space-between;
		color: var(--text-secondary);
		font-size: 0.95rem;
	}
	.total-row.discount {
		color: #10b981;
	}
	.total-row.final-total {
		margin-top: 8px;
		padding-top: 16px;
		border-top: 1px dashed var(--border);
		color: var(--text-primary);
		font-size: 1.5rem;
		font-weight: 800;
	}

	@media (max-width: 900px) {
		.checkout-grid {
			grid-template-columns: 1fr;
			gap: 3rem;
			display: flex;
			flex-direction: column-reverse;
		}
		.summary-card {
			position: static;
		}
	}
</style>
