<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';
	import LaunchpadLogo from '$lib/components/ui/LaunchpadLogo.svelte';

	// Steps: 'email' | 'password' | 'otp' | 'loading'
	type Step = 'email' | 'password' | 'otp' | 'loading';

	let step     = $state<Step>('email');
	let email    = $state('');
	let password = $state('');
	let otp      = $state('');
	let isMfa    = $state(false);
	let error    = $state('');
	let sending  = $state(false);
	let resendCountdown = $state(0);

	// Parallax effect for the left side graphic
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

	async function handleGoogleSignIn() {
		step = 'loading';
		await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
	}

	// ── Step 1: Submit Email and determine next step ──────────────────────────
	async function handleContinueEmail() {
		const trimmedEmail = email.trim().toLowerCase();
		if (!trimmedEmail || !trimmedEmail.includes('@') || !trimmedEmail.includes('.')) {
			error = 'Please enter a valid email address.';
			return;
		}

		sending = true;
		error = '';

		try {
			// Query user login preference
			const prefRes = await fetch('/api/auth/preference', {
				method: 'POST',
				body: JSON.stringify({ email: trimmedEmail }),
				headers: { 'Content-Type': 'application/json' }
			});
			const prefData = await prefRes.json();
			const preference = prefData?.preference || 'otp';

			if (preference === 'password') {
				// User only has password enabled
				isMfa = false;
				step = 'password';
			} else if (preference === 'mfa') {
				// User has both password and OTP enabled (MFA)
				// Ask for password first; DO NOT send OTP yet!
				isMfa = true;
				step = 'password';
			} else {
				// Default / OTP enabled / New user
				isMfa = false;
				await authClient.emailOtp.sendVerificationOtp({
					email: trimmedEmail,
					type: 'sign-in'
				});
				resendCountdown = 30;
				step = 'otp';
			}
		} catch (e: any) {
			error = e.message || 'Failed to check account. Please try again.';
		} finally {
			sending = false;
		}
	}

	// ── Step 2: Validate Password ─────────────────────────────────────────────
	async function handlePasswordSubmit() {
		if (!password) {
			error = 'Please enter your password.';
			return;
		}

		sending = true;
		error = '';

		try {
			const res = await authClient.signIn.email({
				email: email.trim().toLowerCase(),
				password
			});

			if (res.error) {
				// Prompt user on incorrect password and NEVER send OTP
				error = res.error.message || 'Incorrect password. Please try again.';
				sending = false;
				return;
			}

			// If MFA is enabled, password validated! Now send OTP for Step 2
			if (isMfa) {
				await authClient.emailOtp.sendVerificationOtp({
					email: email.trim().toLowerCase(),
					type: 'sign-in'
				});
				resendCountdown = 30;
				password = '';
				step = 'otp';
				return;
			}

			// Direct password login success
			await invalidateAll();
			goto('/dashboard');
		} catch (e: any) {
			error = e.message || 'Failed to verify password. Please try again.';
		} finally {
			sending = false;
		}
	}

	// ── Step 3: Verify OTP ───────────────────────────────────────────────────
	async function handleVerifyOTP() {
		if (!otp || otp.length < 6) {
			error = 'Enter the 6-digit code from your email.';
			return;
		}

		sending = true;
		error = '';

		try {
			const result = await authClient.signIn.emailOtp({
				email: email.trim().toLowerCase(),
				otp
			});

			if (result.error) {
				error = result.error.message || 'Invalid or expired code. Please try again.';
				sending = false;
				return;
			}

			// If MFA flow, mark session as MFA verified
			if (isMfa) {
				await fetch('/api/auth/mfa/verify', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' }
				});
			}

			await invalidateAll();
			goto('/dashboard');
		} catch (e: any) {
			error = e.message || 'Something went wrong. Please try again.';
		} finally {
			sending = false;
		}
	}

	async function handleResendOTP() {
		if (resendCountdown > 0 || sending) return;
		sending = true;
		error = '';

		try {
			await authClient.emailOtp.sendVerificationOtp({
				email: email.trim().toLowerCase(),
				type: 'sign-in'
			});
			resendCountdown = 30;
		} catch (e: any) {
			error = e.message || 'Failed to resend code.';
		} finally {
			sending = false;
		}
	}

	function handleOTPInput(e: Event) {
		const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
		otp = val;
		if (val.length === 6) {
			handleVerifyOTP();
		}
	}

	function handleBackToEmail() {
		step = 'email';
		password = '';
		otp = '';
		error = '';
		isMfa = false;
	}
</script>

<svelte:head>
	<title>Sign in — {APP_NAME}</title>
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
				<h1 class="animate-fade-up">Master new skills. <br/> Empower your future.</h1>
				<p class="animate-fade-up delay-100">Join a premium learning community designed to help you achieve verifiable, cryptographic credentials.</p>
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

	<!-- Right Side: Auth Form -->
	<div class="auth-form-container">
		<div class="auth-form-wrapper">
			<!-- Header -->
			<div class="form-header">
				{#if step === 'loading'}
					<h1>Signing you in</h1>
					<p>Please wait while we redirect you...</p>
				{:else if step === 'password'}
					{#if isMfa}
						<div class="badge-step">Step 1 of 2: Password</div>
						<h1>Enter your password</h1>
						<p>Signing in as <strong>{email}</strong></p>
					{:else}
						<h1>Welcome back</h1>
						<p>Enter the password for <strong>{email}</strong></p>
					{/if}
				{:else if step === 'otp'}
					{#if isMfa}
						<div class="badge-step">Step 2 of 2: Verification</div>
						<h1>Check your email</h1>
						<p>We sent a 6-digit MFA security code to <strong>{email}</strong></p>
					{:else}
						<h1>Check your email</h1>
						<p>We sent a 6-digit sign-in code to <strong>{email}</strong></p>
					{/if}
				{:else}
					<h1>Welcome back</h1>
					<p>Sign in to your account or create a new one instantly.</p>
				{/if}
			</div>

			<!-- Form Card -->
			<div class="auth-card">
				{#if step === 'loading'}
					<div class="loading-state">
						<div class="spinner"></div>
						<p>Redirecting securely...</p>
					</div>

				{:else if step === 'password'}
					<!-- Password Entry -->
					<div class="slide-in">
						<div class="input-group">
							<label for="pwd-input">Password</label>
							<input
								id="pwd-input"
								type="password"
								placeholder="••••••••"
								bind:value={password}
								onkeydown={(e) => e.key === 'Enter' && handlePasswordSubmit()}
								class="standard-input"
								autofocus
							/>
						</div>

						{#if error}
							<p class="error-msg">{error}</p>
						{/if}

						<button onclick={handlePasswordSubmit} disabled={sending || !password} class="btn-primary">
							{sending ? 'Verifying...' : isMfa ? 'Continue to verification' : 'Sign in'}
						</button>

						<button onclick={handleBackToEmail} class="btn-text">
							Use a different email
						</button>
					</div>

				{:else if step === 'otp'}
					<!-- OTP Entry -->
					<div class="slide-in">
						<div class="input-group">
							<label for="otp-input">Verification code</label>
							<input
								id="otp-input"
								type="text"
								inputmode="numeric"
								autocomplete="one-time-code"
								placeholder="000000"
								value={otp}
								oninput={handleOTPInput}
								onkeydown={(e) => e.key === 'Enter' && handleVerifyOTP()}
								class="otp-input"
								autofocus
							/>
						</div>

						{#if error}
							<p class="error-msg">{error}</p>
						{/if}

						<button onclick={handleVerifyOTP} disabled={sending || otp.length < 6} class="btn-primary">
							{sending ? 'Verifying...' : 'Verify and sign in'}
						</button>

						<div class="resend-container">
							{#if resendCountdown > 0}
								<span class="resend-timer">Resend code in {resendCountdown}s</span>
							{:else}
								<button onclick={handleResendOTP} disabled={sending} class="btn-resend">
									Resend code
								</button>
							{/if}
						</div>

						<button onclick={handleBackToEmail} class="btn-text">
							Use a different email
						</button>
					</div>

				{:else}
					<!-- Initial Step: Email + Google + Explore -->
					<div class="slide-in">
						<button onclick={handleGoogleSignIn} class="btn-google">
							<svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
								<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
								<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
								<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
								<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
							</svg>
							Continue with Google
						</button>

						<div class="divider">
							<span>or sign in with email</span>
						</div>

						<!-- Email only -->
						<div class="input-group">
							<label for="email-input">Email address</label>
							<input
								id="email-input"
								type="email"
								placeholder="you@example.com"
								bind:value={email}
								onkeydown={(e) => e.key === 'Enter' && handleContinueEmail()}
								class="standard-input"
								autofocus
							/>
						</div>

						{#if error}
							<p class="error-msg">{error}</p>
						{/if}

						<button onclick={handleContinueEmail} disabled={sending} class="btn-primary" style="margin-top: 8px;">
							{sending ? 'Checking...' : 'Continue'}
						</button>

						<!-- Explore Button (Lets users wander around without logging in) -->
						<a href="/catalog" class="btn-explore">
							<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
								<circle cx="12" cy="12" r="10"/>
								<polygon points="16.24 7.76 14.12 14.12 7.76 16.24 9.88 9.88 16.24 7.76"/>
							</svg>
							<span>Explore</span>
						</a>
					</div>
				{/if}
			</div>

			<p class="terms-text">
				By continuing, you agree to our <a href="/terms">Terms of Service</a> and <a href="/privacy">Privacy Policy</a>.
			</p>
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

	/* Glowing Orbs for the left graphic */
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

	/* Decorative Glass Card */
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

	/* Right Side Form Container */
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

	.badge-step {
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

	/* Form Elements */
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

	.standard-input {
		width: 100%;
		height: 44px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		padding: 0 14px;
		font-size: 0.9375rem;
		color: var(--text-primary);
		font-family: inherit;
		outline: none;
		transition: all 0.2s ease;
	}

	.standard-input:focus {
		border-color: var(--primary, #2563eb);
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
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

	/* Buttons */
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

	.btn-explore {
		width: 100%;
		height: 44px;
		background: transparent;
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		font-family: inherit;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 8px;
		text-decoration: none;
		margin-top: 10px;
		transition: all 0.2s ease;
	}

	.btn-explore:hover {
		background: var(--bg-subtle);
		border-color: var(--text-primary);
	}

	.btn-google {
		width: 100%;
		height: 44px;
		background: var(--bg);
		border: 1px solid var(--border-strong);
		border-radius: 8px;
		font-size: 0.9375rem;
		font-weight: 500;
		color: var(--text-primary);
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		transition: background 0.2s ease;
	}

	.btn-google:hover {
		background: var(--bg-subtle);
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
		margin-top: 8px;
	}

	.btn-text:hover {
		color: var(--text-primary);
	}

	.resend-container {
		text-align: center;
		margin-top: 12px;
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

	/* Divider */
	.divider {
		position: relative;
		text-align: center;
		margin: 24px 0;
	}

	.divider::before {
		content: '';
		position: absolute;
		top: 50%;
		left: 0;
		right: 0;
		height: 1px;
		background: var(--border);
	}

	.divider span {
		position: relative;
		background: var(--bg-elevated, #ffffff);
		padding: 0 12px;
		font-size: 0.8125rem;
		color: var(--text-muted);
	}

	.error-msg {
		font-size: 0.875rem;
		color: #ef4444;
		margin-bottom: 16px;
	}

	.terms-text {
		margin-top: 24px;
		font-size: 0.8125rem;
		color: var(--text-muted);
		text-align: center;
		line-height: 1.6;
	}

	.terms-text a {
		color: var(--text-secondary);
		text-decoration: underline;
		text-decoration-color: transparent;
		transition: text-decoration-color 0.2s ease;
	}

	.terms-text a:hover {
		text-decoration-color: var(--text-secondary);
	}

	/* Animations */
	.slide-in {
		animation: slideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
	}

	@keyframes slideUp {
		0% { opacity: 0; transform: translateY(10px); }
		100% { opacity: 1; transform: translateY(0); }
	}

	.loading-state {
		display: flex;
		flex-direction: column;
		align-items: center;
		gap: 16px;
		padding: 40px 0;
		color: var(--text-secondary);
		font-size: 0.9375rem;
	}

	.spinner {
		width: 24px;
		height: 24px;
		border: 2px solid var(--border-strong);
		border-top-color: var(--primary, #2563eb);
		border-radius: 50%;
		animation: spin 0.8s linear infinite;
	}

	@keyframes spin {
		to { transform: rotate(360deg); }
	}
</style>
