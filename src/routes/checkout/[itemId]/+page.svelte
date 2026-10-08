<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { page } from '$app/stores';
	import { goto } from '$app/navigation';
	import { enhance } from '$app/forms';
	import { addToast } from '$lib/stores/toast';
	import { ArrowRight, ArrowLeft, Tag, Check, ShieldCheck, Lock, Mail, KeyRound, RefreshCw, AlertCircle, Video, Clock } from 'lucide-svelte';
	import VerifiedBadge from '$lib/components/ui/VerifiedBadge.svelte';
	import type { PageData, ActionData } from './$types';

	let { data, form }: { data: PageData, form: ActionData } = $props();

	let item = $derived(data.asset);
	let couponCode = $state('');
	
	let discountAmount = $state(0);
	let discountApplied = $state(false);

	let isCheckingOut = $state(false);
	
	let basePricePaise = $derived(data.cohort && data.cohort.pricePaise !== null && data.cohort.pricePaise !== undefined ? data.cohort.pricePaise : (item?.pricePaise ?? 0));
	let total = $derived(Math.max(0, (basePricePaise / 100) - discountAmount));

	// Form values
	let firstName = $state(data.user?.name ? data.user.name.split(' ')[0] : '');
	let lastName = $state(data.user?.name ? data.user.name.split(' ').slice(1).join(' ') : '');
	let email = $state(data.user?.email || '');

	// Email Verification State
	// If user is logged in, their initial email is verified
	let isEmailVerified = $state(!!data.user?.email);
	let verifiedEmail = $state(data.user?.email ? data.user.email.toLowerCase() : '');

	// OTP panel state
	let showOtpPanel = $state(false);
	let otpValue = $state('');
	let otpSending = $state(false);
	let otpVerifying = $state(false);
	let otpMessage = $state('');
	let otpError = $state('');
	let otpAccountExists = $state(false);
	let resendCountdown = $state(0);
	let resendTimer: any = null;

	// When user types a different email, reset verification status
	function handleEmailChange() {
		const currentEmail = email.trim().toLowerCase();
		if (currentEmail !== verifiedEmail) {
			isEmailVerified = false;
		} else if (verifiedEmail !== '') {
			isEmailVerified = true;
		}
	}

	function startResendCooldown() {
		resendCountdown = 45;
		clearInterval(resendTimer);
		resendTimer = setInterval(() => {
			if (resendCountdown > 0) {
				resendCountdown--;
			} else {
				clearInterval(resendTimer);
			}
		}, 1000);
	}

	// Send OTP to email
	async function sendVerificationOtp() {
		const targetEmail = email.trim().toLowerCase();
		if (!targetEmail) {
			addToast('Please enter an email address first.', 'error');
			return;
		}

		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		if (!emailRegex.test(targetEmail)) {
			addToast('Please enter a valid email address.', 'error');
			return;
		}

		otpSending = true;
		otpError = '';
		try {
			const res = await fetch('/api/checkout/verify-email/send-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: targetEmail,
					firstName: firstName.trim(),
					lastName: lastName.trim()
				})
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				otpError = result.message || 'Failed to send verification code.';
				addToast(otpError, 'error');
			} else {
				otpMessage = result.message;
				otpAccountExists = result.exists;
				showOtpPanel = true;
				otpValue = '';
				startResendCooldown();
				addToast('Verification code sent! Check your inbox.', 'info');
			}
		} catch (err: any) {
			otpError = 'Failed to reach verification service. Try again.';
			addToast(otpError, 'error');
		} finally {
			otpSending = false;
		}
	}

	// Verify OTP code
	async function confirmOtpAndProceed(formElement?: HTMLFormElement) {
		const targetEmail = email.trim().toLowerCase();
		const trimmedOtp = otpValue.trim();

		if (trimmedOtp.length !== 6) {
			otpError = 'Please enter the full 6-digit code.';
			return;
		}

		otpVerifying = true;
		otpError = '';

		try {
			const res = await fetch('/api/checkout/verify-email/verify-otp', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({
					email: targetEmail,
					otp: trimmedOtp,
					firstName: firstName.trim(),
					lastName: lastName.trim()
				})
			});

			const result = await res.json();
			if (!res.ok || !result.success) {
				otpError = result.error || 'Invalid or expired code.';
				addToast(otpError, 'error');
			} else {
				isEmailVerified = true;
				verifiedEmail = targetEmail;
				showOtpPanel = false;
				addToast(result.isNewUser ? 'Email verified & student profile created!' : 'Email verified successfully!', 'success');

				// Submit the checkout form immediately now that email is verified
				const checkoutForm = formElement || document.querySelector('form.checkout-form') as HTMLFormElement;
				if (checkoutForm) {
					isCheckingOut = true;
					checkoutForm.requestSubmit();
				}
			}
		} catch (err: any) {
			otpError = 'Verification failed. Please try again.';
			addToast(otpError, 'error');
		} finally {
			otpVerifying = false;
		}
	}

	// Handle button click
	function handlePayClick(e: MouseEvent) {
		const targetEmail = email.trim().toLowerCase();
		if (!targetEmail) {
			addToast('Please enter an email address.', 'error');
			e.preventDefault();
			return;
		}

		// Strictly enforce requirement:
		// "If user doesn't exist don't let the payment happen, first verify mail then payment, if exist check and verify then let the payment pass through"
		if (!isEmailVerified || targetEmail !== verifiedEmail) {
			e.preventDefault();
			sendVerificationOtp();
		}
	}

	$effect(() => {
		if (form?.couponValid) {
			discountApplied = true;
			if (form.couponType === 'percent') {
				discountAmount = (basePricePaise / 100) * (form.couponValue / 100);
			} else {
				discountAmount = form.couponValue / 100;
			}
		} else if (form?.couponError) {
			discountApplied = false;
			discountAmount = 0;
			addToast(form.couponError, 'error');
		}

		if (form?.success) {
			if (form.isFree || form.isMockMode) {
				addToast('Enrollment Successful! Access is active in your dashboard.', 'success');
				goto('/dashboard');
			} else if (form.paymentSessionId) {
				// Initialize Cashfree
				if (form.paymentSessionId === 'mock_session_id_no_keys_provided') {
					addToast('[Mock Mode] Gateway mock mode active. Redirecting to dashboard...', 'info');
					goto('/dashboard');
				} else {
					try {
						// @ts-ignore
						const cashfree = window.Cashfree({
							mode: data.cashfreeEnv
						});
						cashfree.checkout({
							paymentSessionId: form.paymentSessionId,
							redirectTarget: '_self'
						});
					} catch (err) {
						addToast('Failed to initialize payment gateway. Please try again.', 'error');
						console.error(err);
					}
				}
			}
		} else if (form?.checkoutError) {
			addToast('Checkout error: ' + form.checkoutError, 'error');
		}
	});
</script>

<svelte:head>
	<title>Checkout — {APP_NAME}</title>
	<script src="https://sdk.cashfree.com/js/v3/cashfree.js"></script>
</svelte:head>

<div class="checkout-page">
	<div class="container-custom py-10">
		
		<!-- Cancel / Back Link -->
		<a href="/catalog" class="back-link">
			<ArrowLeft size={14} /> Cancel & return to marketplace
		</a>

		<div class="max-w-[820px] mx-auto mt-6">
			<!-- Header -->
			<div class="mb-8">
				<span class="meta-mono">SECURE CHECKOUT</span>
				<h1 class="text-[1.85rem] font-bold text-[var(--text-primary)] tracking-tight mt-1">
					Complete Enrollment
				</h1>
				<p class="text-[13px] text-[var(--text-secondary)] mt-1">
					Access is delivered directly to your verified email upon completion.
				</p>
			</div>

			<!-- Grid: Left Form Details + Right Order Summary -->
			<div class="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
				
				<!-- Left Column: Form -->
				<div class="md:col-span-7">
					<form
						method="POST"
						action="?/checkout"
						use:enhance={() => {
							isCheckingOut = true;
							return async ({ update }) => {
								isCheckingOut = false;
								update();
							};
						}}
						class="checkout-form"
					>
						<input type="hidden" name="couponCode" value={form?.couponValid ? form.couponCode : ''} />

						{#if data.alreadyOwned}
							<div class="p-3 bg-[var(--lp-accent-subtle)] border border-[var(--lp-accent-border)] rounded-[var(--radius-sm)] text-[13px] text-[var(--lp-accent)] font-medium mb-5">
								You already own this offering. <a href="/dashboard" class="underline font-bold">Go to My Learning</a>
							</div>
						{/if}

						<!-- Billing Details Block -->
						<div class="form-block">
							<div class="flex items-center justify-between mb-3">
								<h3 class="block-title !mb-0">Learner Details</h3>
								{#if isEmailVerified}
									<span class="status-badge verified">
										<Check size={12} strokeWidth={3} /> Email Verified
									</span>
								{:else}
									<span class="status-badge unverified">
										Verification Required
									</span>
								{/if}
							</div>
							
							<div class="grid grid-cols-2 gap-3 mb-3">
								<div>
									<label for="firstName" class="form-label">First Name</label>
									<input
										id="firstName"
										type="text"
										name="firstName"
										placeholder="Jane"
										bind:value={firstName}
										required
										class="form-input"
									/>
								</div>
								<div>
									<label for="lastName" class="form-label">Last Name</label>
									<input
										id="lastName"
										type="text"
										name="lastName"
										placeholder="Doe"
										bind:value={lastName}
										required
										class="form-input"
									/>
								</div>
							</div>

							<div>
								<div class="flex items-center justify-between mb-1">
									<label for="email" class="form-label !mb-0">Email Address (Credential Delivery)</label>
									{#if !isEmailVerified && email.trim()}
										<button
											type="button"
											onclick={sendVerificationOtp}
											disabled={otpSending}
											class="text-[11px] font-semibold text-[var(--lp-accent)] hover:underline flex items-center gap-1"
										>
											{#if otpSending}
												<RefreshCw size={11} class="animate-spin" /> Sending Code...
											{:else}
												Verify Email Now
											{/if}
										</button>
									{/if}
								</div>
								<div class="relative">
									<input
										id="email"
										type="email"
										name="email"
										placeholder="learner@example.com"
										bind:value={email}
										oninput={handleEmailChange}
										required
										class="form-input {isEmailVerified ? 'border-green-600/50' : ''}"
									/>
									{#if isEmailVerified}
										<div class="absolute right-2.5 top-1/2 -translate-y-1/2 text-green-600 flex items-center gap-1 text-[11px] font-semibold">
											<Check size={14} strokeWidth={3} />
										</div>
									{/if}
								</div>
								<p class="text-[11px] text-[var(--text-muted)] mt-1.5 leading-relaxed">
									A one-click login link will be emailed to this address once payment completes.
								</p>
							</div>

							<!-- OTP Verification Panel (Inline) -->
							{#if showOtpPanel}
								<div class="otp-verification-card mt-4 p-4 rounded-lg bg-[var(--bg-subtle)] border border-[var(--border)]">
									<div class="flex items-start gap-2.5 mb-2.5">
										<Mail size={16} class="text-[var(--lp-accent)] mt-0.5" />
										<div>
											<div class="text-[13px] font-semibold text-[var(--text-primary)]">
												{otpAccountExists ? 'Verify Existing Account Email' : 'Verify Email & Create Account'}
											</div>
											<p class="text-[12px] text-[var(--text-secondary)] mt-0.5 leading-snug">
												{otpMessage || `Enter the 6-digit verification code sent to ${email}.`}
											</p>
										</div>
									</div>

									{#if otpError}
										<div class="p-2 mb-3 rounded bg-red-500/10 border border-red-500/20 text-red-500 text-[12px] flex items-center gap-1.5">
											<AlertCircle size={14} />
											<span>{otpError}</span>
										</div>
									{/if}

									<div class="flex items-center gap-2 mt-3">
										<input
											type="text"
											maxlength="6"
											placeholder="123456"
											bind:value={otpValue}
											class="otp-digit-input"
											onkeydown={(e) => {
												if (e.key === 'Enter') {
													e.preventDefault();
													confirmOtpAndProceed();
												}
											}}
										/>
										<button
											type="button"
											onclick={() => confirmOtpAndProceed()}
											disabled={otpVerifying || otpValue.trim().length !== 6}
											class="btn-verify-otp"
										>
											{#if otpVerifying}
												<RefreshCw size={13} class="animate-spin" /> Verifying...
											{:else}
												Confirm & Pay
											{/if}
										</button>
									</div>

									<div class="flex items-center justify-between text-[11px] mt-3 pt-2.5 border-t border-[var(--border-subtle)]">
										<button
											type="button"
											onclick={sendVerificationOtp}
											disabled={otpSending || resendCountdown > 0}
											class="text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors disabled:opacity-50"
										>
											{#if resendCountdown > 0}
												Resend code in {resendCountdown}s
											{:else}
												Didn't receive code? Resend
											{/if}
										</button>
										<button
											type="button"
											onclick={() => showOtpPanel = false}
											class="text-[var(--text-muted)] hover:text-[var(--text-primary)]"
										>
											Change Email
										</button>
									</div>
								</div>
							{/if}
						</div>

						<!-- Payment Method Info -->
						<div class="form-block">
							<h3 class="block-title">Payment Method</h3>
							<div class="payment-info-box">
								<div class="flex items-center gap-2 text-[13px] font-semibold text-[var(--text-primary)]">
									<Lock size={14} class="text-[var(--lp-accent)]" />
									<span>Cashfree Encrypted Gateway</span>
								</div>
								<p class="text-[12px] text-[var(--text-secondary)] mt-1.5 leading-relaxed">
									Cards, UPI, Netbanking, and Wallets are processed via secure 256-bit bank-grade encryption.
								</p>
							</div>
						</div>

						<!-- Submit Button -->
						<button
							type="submit"
							onclick={handlePayClick}
							class="btn-pay-now"
							disabled={isCheckingOut || data.alreadyOwned || otpSending || otpVerifying}
						>
							{#if isCheckingOut}
								<RefreshCw size={15} class="animate-spin" />
								<span>Initializing Gateway...</span>
							{:else if !isEmailVerified}
								<span>Verify Email & Pay ₹{total.toFixed(2)}</span>
								<ArrowRight size={15} />
							{:else}
								<span>Pay ₹{total.toFixed(2)}</span>
								<ArrowRight size={15} />
							{/if}
						</button>

						<p class="text-center text-[11px] text-[var(--text-muted)] mt-3">
							By proceeding, you agree to the Launchpad <a href="/terms" class="underline">Terms</a> and <a href="/refunds" class="underline">Refund Policy</a>.
						</p>
					</form>
				</div>

				<!-- Right Column: Order Summary -->
				<div class="md:col-span-5">
					<div class="summary-card">
						<h3 class="summary-title">Order Summary</h3>

						<!-- Product Item -->
						<div class="item-summary-box">
							<div class="flex items-center justify-between">
								<span class="meta-mono text-[10px]">{data.cohort ? 'LIVE CLASSROOM BATCH' : (item?.type || 'COURSE')}</span>
								{#if data.cohort}
									<span class="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
										Live Batch
									</span>
								{/if}
							</div>
							<h4 class="text-[0.9375rem] font-semibold text-[var(--text-primary)] mt-1 leading-snug">
								{item?.title || 'Selected Offering'}
							</h4>

							{#if data.cohort}
								<div class="mt-3 p-2.5 rounded bg-[var(--bg-subtle)] border border-[var(--border-subtle)] text-[12px]">
									<div class="font-semibold text-[var(--text-primary)] flex items-center gap-1.5">
										<span class="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
										<span>Batch: {data.cohort.name}</span>
									</div>
									{#if data.cohort.scheduleText}
										<div class="text-[var(--text-secondary)] mt-1 font-mono text-[11px]">
											{data.cohort.scheduleText}
										</div>
									{/if}
									{#if data.cohort.startDate}
										<div class="text-[11px] text-[var(--text-muted)] mt-1 flex items-center gap-1">
											<Clock size={11} />
											<span>Starts {new Date(data.cohort.startDate).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
										</div>
									{/if}
								</div>
							{/if}

							<div class="text-[1.1rem] font-bold text-[var(--text-primary)] mt-3">
								₹{basePricePaise === 0 ? '0.00' : (basePricePaise / 100).toFixed(2)}
							</div>
						</div>

						<!-- Coupon Input -->
						<div class="py-4 border-b border-[var(--border-subtle)]">
							{#if discountApplied}
								<div class="flex items-center gap-1.5 text-[12px] font-semibold text-[var(--lp-accent)] bg-[var(--lp-accent-subtle)] p-2 rounded-[var(--radius-sm)] border border-[var(--lp-accent-border)]">
									<Check size={13} strokeWidth={2.5} />
									<span>Coupon '{form?.couponCode}' Applied</span>
								</div>
							{:else}
								<form method="POST" action="?/validateCoupon" use:enhance class="flex items-center gap-2">
									<div class="coupon-field-wrap">
										<Tag size={13} class="text-[var(--text-muted)]" />
										<input
											type="text"
											name="couponCode"
											placeholder="Coupon code"
											bind:value={couponCode}
											class="coupon-input"
										/>
									</div>
									<button type="submit" class="btn-apply-coupon">
										Apply
									</button>
								</form>
							{/if}
						</div>

						<!-- Calculation Rows -->
						<div class="pt-4 space-y-2 text-[13px]">
							<div class="flex justify-between text-[var(--text-secondary)]">
								<span>Subtotal</span>
								<span>₹{(basePricePaise / 100).toFixed(2)}</span>
							</div>
							{#if discountApplied}
								<div class="flex justify-between text-[var(--lp-accent)] font-medium">
									<span>Discount</span>
									<span>-₹{discountAmount.toFixed(2)}</span>
								</div>
							{/if}
							<div class="flex justify-between text-[1rem] font-bold text-[var(--text-primary)] pt-3 border-t border-[var(--border)]">
								<span>Total Due</span>
								<span>₹{total.toFixed(2)}</span>
							</div>
						</div>

						<!-- Benefit notes -->
						<div class="mt-6 pt-4 border-t border-[var(--border-subtle)] space-y-2 text-[12px] text-[var(--text-secondary)]">
							{#if data.cohort}
								<div class="flex items-center gap-2">
									<Video size={14} class="text-indigo-400" />
									<span>Live classes on Google Meet / Zoom</span>
								</div>
								<div class="flex items-center gap-2">
									<Clock size={14} class="text-amber-400" />
									<span>3 months post-completion recording access</span>
								</div>
							{:else}
								<div class="flex items-center gap-2">
									<ShieldCheck size={14} class="text-green-600" />
									<span>Instant course access via email link</span>
								</div>
							{/if}
							<div class="flex items-center gap-2">
								<Lock size={14} class="text-blue-600" />
								<span>Safe 256-bit encrypted transaction</span>
							</div>
						</div>
					</div>
				</div>

			</div>
		</div>

	</div>
</div>

<style>
	.checkout-page {
		min-height: 100vh;
		background: var(--bg);
	}

	.back-link {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		text-decoration: none;
		transition: color var(--t-fast);
	}

	.back-link:hover {
		color: var(--text-primary);
	}

	.form-block {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 20px;
		margin-bottom: 18px;
	}

	.block-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 14px;
	}

	.status-badge {
		font-size: 0.6875rem;
		font-weight: 600;
		padding: 3px 8px;
		border-radius: 9999px;
		display: inline-flex;
		align-items: center;
		gap: 4px;
	}

	.status-badge.verified {
		background: rgba(34, 197, 94, 0.12);
		color: #16a34a;
		border: 1px solid rgba(34, 197, 94, 0.25);
	}

	.status-badge.unverified {
		background: rgba(234, 179, 8, 0.12);
		color: #ca8a04;
		border: 1px solid rgba(234, 179, 8, 0.25);
	}

	.form-label {
		display: block;
		font-size: 0.75rem;
		font-weight: 600;
		color: var(--text-secondary);
		margin-bottom: 4px;
	}

	.form-input {
		width: 100%;
		height: 38px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0 10px;
		font-size: 0.875rem;
		color: var(--text-primary);
		outline: none;
		transition: border-color var(--t-fast);
	}

	.form-input:focus {
		border-color: var(--text-primary);
	}

	/* OTP Box */
	.otp-verification-card {
		box-shadow: 0 2px 6px rgba(0, 0, 0, 0.03);
	}

	.otp-digit-input {
		flex: 1;
		height: 40px;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-family: var(--font-mono);
		font-size: 1.15rem;
		font-weight: 700;
		letter-spacing: 0.35em;
		text-align: center;
		color: var(--text-primary);
		outline: none;
	}

	.otp-digit-input:focus {
		border-color: var(--lp-accent);
	}

	.btn-verify-otp {
		height: 40px;
		padding: 0 16px;
		background: var(--text-primary);
		color: var(--surface);
		font-size: 0.8125rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		display: inline-flex;
		align-items: center;
		gap: 6px;
		white-space: nowrap;
		transition: opacity var(--t-fast);
	}

	.btn-verify-otp:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.payment-info-box {
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		padding: 12px;
	}

	.btn-pay-now {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		height: 44px;
		background: var(--text-primary);
		color: var(--surface);
		font-size: 0.9375rem;
		font-weight: 600;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		transition: opacity var(--t-fast);
	}

	.btn-pay-now:hover:not(:disabled) {
		opacity: 0.9;
	}

	.btn-pay-now:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	/* Summary Card */
	.summary-card {
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-md);
		padding: 22px;
		box-shadow: 0 2px 8px rgba(0, 0, 0, 0.02);
	}

	.summary-title {
		font-size: 0.9375rem;
		font-weight: 600;
		color: var(--text-primary);
		margin-bottom: 14px;
	}

	.item-summary-box {
		background: var(--bg-subtle);
		border: 1px solid var(--border-subtle);
		border-radius: var(--radius-sm);
		padding: 14px;
		margin-bottom: 14px;
	}

	.coupon-field-wrap {
		flex: 1;
		display: flex;
		align-items: center;
		background: var(--bg);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		padding: 0 8px;
		gap: 6px;
	}

	.coupon-input {
		width: 100%;
		height: 34px;
		border: none;
		background: transparent;
		font-size: 0.8125rem;
		color: var(--text-primary);
		outline: none;
		font-family: var(--font-mono);
	}

	.btn-apply-coupon {
		padding: 0 12px;
		height: 34px;
		background: var(--surface);
		border: 1px solid var(--border);
		border-radius: var(--radius-sm);
		font-size: 0.78rem;
		font-weight: 600;
		color: var(--text-primary);
		cursor: pointer;
		transition: all var(--t-fast);
	}

	.btn-apply-coupon:hover {
		border-color: var(--border-strong);
		background: var(--bg-subtle);
	}
</style>
