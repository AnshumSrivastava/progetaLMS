<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';
	import LaunchpadLogo from '$lib/components/ui/LaunchpadLogo.svelte';

	let { data } = $props();

	let email = $derived(data.email || '');
	let otp = $state('');
	let error = $state('');
	let verifying = $state(false);
	let resending = $state(false);
	let resendCountdown = $state(30);

	// Parallax effect for left graphic
	let mouseX = $state(0);
	let mouseY = $state(0);

	function handleMouseMove(e: MouseEvent) {
		mouseX = (e.clientX / window.innerWidth - 0.5) * 20;
		mouseY = (e.clientY / window.innerHeight - 0.5) * 20;
	}

	$effect(() => {
		if (resendCountdown > 0) {
			const timer = setTimeout(() => {
				resendCountdown--;
			}, 1000);
			return () => clearTimeout(timer);
		}
	});

	function handleOTPInput(e: Event) {
		const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
		otp = val;
		if (val.length === 6) {
			handleVerify();
		}
	}

	async function handleVerify() {
		if (!otp || otp.length < 6) {
			error = 'Please enter the 6-digit verification code.';
			return;
		}

		verifying = true;
		error = '';

		try {
			// Verify OTP
			const result = await authClient.signIn.emailOtp({
				email,
				otp
			});

			if (result.error) {
				error = result.error.message || 'Invalid or expired code. Please try again.';
				verifying = false;
				return;
			}

			// Mark MFA session token
			const verifyRes = await fetch('/api/auth/mfa/verify', {
				method: 'POST',
				headers: { 'Content-Type': 'application/json' }
			});

			if (!verifyRes.ok) {
				error = 'Failed to verify multi-factor authentication. Please try again.';
				verifying = false;
				return;
			}

			await invalidateAll();
			goto('/dashboard');
		} catch (e: any) {
			error = e.message || 'Something went wrong. Please try again.';
			verifying = false;
		}
	}

	async function handleResend() {
		if (resendCountdown > 0 || resending) return;
		resending = true;
		error = '';

		try {
			await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'sign-in'
			});
			resendCountdown = 30;
		} catch (e: any) {
			error = e.message || 'Failed to resend code.';
		} finally {
			resending = false;
		}
	}

	async function handleSignOut() {
		await authClient.signOut();
		goto('/sign-in');
	}
</script>

<svelte:head>
	<title>Two-Factor Verification — {APP_NAME}</title>
</svelte:head>

<svelte:window onmousemove={handleMouseMove} />

<div class="auth-layout">
	<!-- Left Side: Brand Graphic -->
	<div class="auth-graphic" style="--mx: {mouseX}px; --my: {mouseY}px;">
		<div class="graphic-content">
			<a href="/catalog" class="logo-wrapper" title="Explore Launchpad">
				<div class="logo-box">
					<LaunchpadLogo class="w-6 h-6 text-white" />
				</div>
				<span class="logo-text">{APP_NAME}</span>
			</a>
			
			<div class="hero-text">
				<h1 class="animate-fade-up">Extra layer <br/> of security.</h1>
				<p class="animate-fade-up delay-100">Your account is secured with multi-factor authentication. Confirm your identity to proceed.</p>
			</div>
			
			<!-- Abstract 3D-like glowing elements -->
			<div class="glow-orb orb-1"></div>
			<div class="glow-orb orb-2"></div>
			<div class="glass-card decorative-card">
				<div class="skeleton-line" style="width: 60%"></div>
				<div class="skeleton-line" style="width: 80%"></div>
				<div class="skeleton-line" style="width: 40%"></div>
			</div>
		</div>
	</div>

	<!-- Right Side: MFA Form -->
	<div class="auth-form-container">
		<div class="auth-form-wrapper">
			<!-- Header -->
			<div class="form-header">
				<div class="badge-mfa">Two-Factor Authentication</div>
				<h1>Check your email</h1>
				<p>We've sent a 6-digit verification code to <strong>{email}</strong></p>
			</div>

			<!-- Form Card -->
			<div class="auth-card">
				<div class="input-group slide-in">
					<label for="mfa-otp-input">Verification code</label>
					<input
						id="mfa-otp-input"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="000000"
						value={otp}
						oninput={handleOTPInput}
						onkeydown={(e) => e.key === 'Enter' && handleVerify()}
						class="otp-input"
						autofocus
					/>
				</div>

				{#if error}
					<p class="error-msg">{error}</p>
				{/if}

				<button onclick={handleVerify} disabled={verifying || otp.length < 6} class="btn-primary">
					{verifying ? 'Verifying...' : 'Verify and continue'}
				</button>

				<div class="resend-container">
					{#if resendCountdown > 0}
						<span class="resend-timer">Resend code in {resendCountdown}s</span>
					{:else}
						<button onclick={handleResend} disabled={resending} class="btn-resend">
							{resending ? 'Sending...' : 'Resend code'}
						</button>
					{/if}
				</div>

				<button onclick={handleSignOut} class="btn-text">
					Sign in with a different account
				</button>
			</div>
		</div>
	</div>
</div>

<style>
	/* Layout Core */
	.auth-layout {
		display: flex;
		min-height: 100vh;
		width: 100%;
		background: var(--bg);
	}

	/* Left Side Immersive Graphic */
	.auth-graphic {
		flex: 1.2;
		background: radial-gradient(120% 120% at 50% -20%, #1e1b4b 0%, #0f172a 100%);
		position: relative;
		overflow: hidden;
		display: flex;
		align-items: center;
		padding: 60px;
		color: white;
	}

	.graphic-content {
		position: relative;
		z-index: 10;
		max-width: 500px;
		transform: translate(var(--mx), var(--my));
		transition: transform 0.1s ease-out;
	}

	.logo-wrapper {
		display: inline-flex;
		align-items: center;
		gap: 12px;
		margin-bottom: 60px;
		text-decoration: none;
		color: white;
	}

	.logo-box {
		width: 38px;
		height: 38px;
		border-radius: 8px;
		background: rgba(255, 255, 255, 0.1);
		border: 1px solid rgba(255, 255, 255, 0.2);
		display: flex;
		align-items: center;
		justify-content: center;
		backdrop-filter: blur(8px);
	}

	.logo-box :global(svg) {
		width: 22px;
		height: 22px;
		color: white;
	}

	.logo-text {
		font-size: 1.25rem;
		font-weight: 700;
		letter-spacing: -0.02em;
		color: white;
	}

	.hero-text h1 {
		font-size: clamp(2.5rem, 4vw, 3.5rem);
		line-height: 1.1;
		font-weight: 700;
		margin-bottom: 24px;
		letter-spacing: -0.03em;
		background: linear-gradient(135deg, #ffffff 0%, #94a3b8 100%);
		-webkit-background-clip: text;
		-webkit-text-fill-color: transparent;
	}

	.hero-text p {
		font-size: 1.125rem;
		line-height: 1.6;
		color: #cbd5e1;
		font-weight: 400;
	}

	.glow-orb {
		position: absolute;
		border-radius: 50%;
		filter: blur(80px);
		z-index: 0;
	}
	.orb-1 {
		width: 400px;
		height: 400px;
		background: rgba(56, 189, 248, 0.2);
		top: -100px;
		left: -100px;
	}
	.orb-2 {
		width: 300px;
		height: 300px;
		background: rgba(99, 102, 241, 0.2);
		bottom: 10%;
		right: 10%;
	}

	.glass-card {
		position: absolute;
		bottom: -150px;
		right: -100px;
		width: 300px;
		padding: 24px;
		background: rgba(255, 255, 255, 0.03);
		backdrop-filter: blur(24px);
		border: 1px solid rgba(255, 255, 255, 0.1);
		border-radius: 20px;
		transform: rotate(-5deg) scale(1.1);
		box-shadow: 0 25px 50px -12px rgba(0,0,0,0.5);
	}

	.skeleton-line {
		height: 12px;
		background: rgba(255, 255, 255, 0.1);
		border-radius: 6px;
		margin-bottom: 16px;
	}

	@media (max-width: 900px) {
		.auth-graphic { display: none; }
	}

	/* Right Side */
	.auth-form-container {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		padding: 40px 24px;
	}

	.auth-form-wrapper {
		width: 100%;
		max-width: 380px;
	}

	.badge-mfa {
		display: inline-block;
		font-size: 0.75rem;
		font-weight: 600;
		color: #2563eb;
		background: rgba(37, 99, 235, 0.1);
		padding: 4px 10px;
		border-radius: 9999px;
		margin-bottom: 12px;
	}

	.form-header {
		margin-bottom: 32px;
	}

	.form-header h1 {
		font-size: 1.75rem;
		font-weight: 700;
		margin-bottom: 8px;
		letter-spacing: -0.02em;
		color: var(--text-primary);
	}

	.form-header p {
		font-size: 0.9375rem;
		color: var(--text-secondary);
	}
	
	.form-header p strong {
		color: var(--text-primary);
	}

	.auth-card {
		background: var(--bg-elevated, #ffffff);
		border: 1px solid var(--border);
		border-radius: 16px;
		padding: 32px;
		box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -2px rgba(0, 0, 0, 0.05);
	}

	.input-group {
		margin-bottom: 16px;
	}

	.input-group label {
		display: block;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--text-secondary);
		margin-bottom: 8px;
	}

	.otp-input {
		width: 100%;
		height: 52px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		font-size: 1.5rem;
		color: var(--text-primary);
		font-family: 'JetBrains Mono', monospace;
		letter-spacing: 0.2em;
		text-align: center;
		outline: none;
		transition: all 0.2s ease;
	}

	.otp-input:focus {
		border-color: var(--primary, #2563eb);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.btn-primary {
		width: 100%;
		height: 44px;
		background: var(--text-primary, #0f172a);
		color: var(--bg, #ffffff);
		border: none;
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 600;
		cursor: pointer;
		font-family: inherit;
		transition: transform 0.1s ease, opacity 0.2s ease;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.btn-primary:not(:disabled):active {
		transform: scale(0.98);
	}

	.btn-primary:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}

	.resend-container {
		text-align: center;
		margin-top: 16px;
	}

	.resend-timer {
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.btn-resend {
		background: none;
		border: none;
		font-size: 0.8125rem;
		font-weight: 500;
		color: var(--primary, #2563eb);
		cursor: pointer;
		padding: 0;
	}

	.btn-resend:hover {
		text-decoration: underline;
	}

	.btn-text {
		width: 100%;
		height: 40px;
		background: none;
		border: none;
		font-size: 0.875rem;
		color: var(--text-secondary);
		cursor: pointer;
		font-family: inherit;
		transition: color 0.2s ease;
		margin-top: 12px;
	}

	.btn-text:hover {
		color: var(--text-primary);
	}

	.error-msg {
		font-size: 0.875rem;
		color: #ef4444;
		margin-bottom: 16px;
	}

	.slide-in {
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes slideUp {
		0% { opacity: 0; transform: translateY(10px); }
		100% { opacity: 1; transform: translateY(0); }
	}
</style>
