<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { authClient } from '$lib/auth.client';
	import { goto, invalidateAll } from '$app/navigation';

	// State machine: 'idle' | 'email' | 'otp' | 'loading' | 'error'
	type Step = 'idle' | 'email' | 'otp' | 'loading' | 'error';

	let step    = $state<Step>('idle');
	let email   = $state('');
	let password= $state('');
	let otp     = $state('');
	let error   = $state('');
	let sending = $state(false);

	async function handleGoogleSignIn() {
		step = 'loading';
		await authClient.signIn.social({ provider: 'google', callbackURL: '/dashboard' });
	}

	async function handleSendOTP() {
		if (!email || !email.includes('@')) {
			error = 'Enter a valid email address.';
			return;
		}
		sending = true;
		error   = '';
		try {
			if (password) {
				const res = await authClient.signIn.email({ email, password });
				if (res.error) {
					error = res.error.message || 'Invalid credentials.';
					sending = false;
					return;
				}
				await invalidateAll();
				goto('/dashboard');
				return;
			}

			await authClient.emailOtp.sendVerificationOtp({
				email,
				type: 'sign-in'
			});
			step = 'otp';
		} catch (e) {
			error = 'Failed to send code. Try again.';
		} finally {
			sending = false;
		}
	}

	async function handleVerifyOTP() {
		if (!otp || otp.length < 6) {
			error = 'Enter the 6-digit code from your email.';
			return;
		}
		sending = true;
		error   = '';
		try {
			const result = await authClient.signIn.emailOtp({ email, otp });
			if (result.error) {
				error = 'Invalid or expired code. Try again.';
			} else {
				await invalidateAll();
				goto('/dashboard');
			}
		} catch (e) {
			error = 'Something went wrong. Please try again.';
		} finally {
			sending = false;
		}
	}

	function handleOTPInput(e: Event) {
		const val = (e.target as HTMLInputElement).value.replace(/\D/g, '').slice(0, 6);
		otp = val;
	}
</script>

<svelte:head>
	<title>Sign in — {APP_NAME}</title>
</svelte:head>

<div style="min-height: calc(100vh - var(--nav-h)); display: flex; align-items: center; justify-content: center; padding: 40px 24px;">
	<div style="width: 100%; max-width: 380px;">

		<!-- Logo + heading -->
		<div style="margin-bottom: 40px;">
			<a href="/" style="display: flex; align-items: center; gap: 8px; width: fit-content; margin-bottom: 32px; opacity: 0.7; transition: opacity 120ms ease;"
				onmouseenter={(e) => (e.currentTarget as HTMLElement).style.opacity = '1'}
				onmouseleave={(e) => (e.currentTarget as HTMLElement).style.opacity = '0.7'}
			>
				<svg width="18" height="18" viewBox="0 0 18 18" fill="none">
					<rect width="18" height="18" rx="4" fill="var(--text-primary)" fill-opacity="0.9"/>
					<path d="M5 13L9 5l4 8" stroke="var(--bg)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
				</svg>
				<span style="font-size: 0.9375rem; font-weight: 600; color: var(--text-primary);">Launchpad</span>
			</a>

			{#if step === 'otp'}
				<h1 style="font-size: 1.5rem; margin-bottom: 8px;">Check your email</h1>
				<p style="font-size: 0.875rem;">We sent a 6-digit code to <strong style="color: var(--text-primary);">{email}</strong></p>
			{:else}
				<h1 style="font-size: 1.5rem; margin-bottom: 8px;">Sign in to Launchpad</h1>
				<p style="font-size: 0.875rem;">No password needed. Use email or Google.</p>
			{/if}
		</div>

		<!-- Card -->
		<div style="background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 10px; padding: 28px; display: flex; flex-direction: column; gap: 16px;">

			{#if step === 'loading'}
				<div style="text-align: center; padding: 24px 0; color: var(--text-secondary); font-size: 0.875rem;">
					Redirecting...
				</div>

			{:else if step === 'otp'}
				<!-- OTP entry -->
				<div>
					<label for="otp-input" style="display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.03em;">
						Verification code
					</label>
					<input
						id="otp-input"
						type="text"
						inputmode="numeric"
						autocomplete="one-time-code"
						placeholder="000000"
						value={otp}
						oninput={handleOTPInput}
						style="width: 100%; height: 44px; background: var(--bg); border: 1px solid var(--border-strong); border-radius: 6px;
						       padding: 0 14px; font-size: 1.25rem; color: var(--text-primary); font-family: 'JetBrains Mono', monospace;
						       letter-spacing: 0.2em; text-align: center; outline: none; transition: border-color 120ms ease;"
						onfocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent)'}
						onblur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border-strong)'}
					/>
				</div>

				{#if error}
					<p style="font-size: 0.8125rem; color: #ef4444;">{error}</p>
				{/if}

				<button
					onclick={handleVerifyOTP}
					disabled={sending || otp.length < 6}
					style="width: 100%; height: 40px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px;
					       font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit;
					       transition: opacity 120ms ease; opacity: {sending || otp.length < 6 ? '0.5' : '1'};"
				>
					{sending ? 'Verifying...' : 'Verify and sign in'}
				</button>

				<button
					onclick={() => { step = 'email'; otp = ''; error = ''; }}
					style="width: 100%; height: 36px; background: none; border: none; font-size: 0.8125rem;
					       color: var(--text-secondary); cursor: pointer; font-family: inherit; transition: color 120ms ease;"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)'}
				>
					Use a different email
				</button>

			{:else}
				<!-- Google sign-in -->
				<button
					onclick={handleGoogleSignIn}
					style="width: 100%; height: 40px; background: var(--bg); border: 1px solid var(--border-strong); border-radius: 6px;
					       font-size: 0.875rem; font-weight: 450; color: var(--text-primary); cursor: pointer; font-family: inherit;
					       display: flex; align-items: center; justify-content: center; gap: 10px; transition: background 120ms ease;"
					onmouseenter={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg-subtle)'}
					onmouseleave={(e) => (e.currentTarget as HTMLElement).style.background = 'var(--bg)'}
				>
					<!-- Google SVG icon -->
					<svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
						<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
						<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
						<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
						<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
					</svg>
					Continue with Google
				</button>

				<!-- Divider -->
				<div style="display: flex; align-items: center; gap: 12px;">
					<div style="flex: 1; height: 1px; background: var(--border);"></div>
					<span style="font-size: 0.75rem; color: var(--text-muted);">or</span>
					<div style="flex: 1; height: 1px; background: var(--border);"></div>
				</div>

				<!-- Email OTP -->
				<div>
					<label for="email-input" style="display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.03em;">
						Email address
					</label>
					<input
						id="email-input"
						type="email"
						placeholder="you@example.com"
						bind:value={email}
						onkeydown={(e) => e.key === 'Enter' && handleSendOTP()}
						style="width: 100%; height: 40px; background: var(--bg); border: 1px solid var(--border-strong); border-radius: 6px;
						       padding: 0 12px; font-size: 0.875rem; color: var(--text-primary); font-family: inherit;
						       outline: none; transition: border-color 120ms ease; margin-bottom: 16px;"
						onfocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent)'}
						onblur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border-strong)'}
					/>

					<label for="password-input" style="display: block; font-size: 0.75rem; font-weight: 500; color: var(--text-secondary); margin-bottom: 8px; letter-spacing: 0.03em;">
						Password (optional for magic link)
					</label>
					<input
						id="password-input"
						type="password"
						placeholder="••••••••"
						bind:value={password}
						onkeydown={(e) => e.key === 'Enter' && handleSendOTP()}
						style="width: 100%; height: 40px; background: var(--bg); border: 1px solid var(--border-strong); border-radius: 6px;
						       padding: 0 12px; font-size: 0.875rem; color: var(--text-primary); font-family: inherit;
						       outline: none; transition: border-color 120ms ease;"
						onfocus={(e) => (e.target as HTMLElement).style.borderColor = 'var(--accent)'}
						onblur={(e) => (e.target as HTMLElement).style.borderColor = 'var(--border-strong)'}
					/>
				</div>

				{#if error}
					<p style="font-size: 0.8125rem; color: #ef4444;">{error}</p>
				{/if}

				<button
					onclick={handleSendOTP}
					disabled={sending}
					style="width: 100%; height: 40px; background: var(--text-primary); color: var(--bg); border: none; border-radius: 6px;
					       font-size: 0.875rem; font-weight: 500; cursor: pointer; font-family: inherit;
					       transition: opacity 120ms ease; opacity: {sending ? '0.6' : '1'};"
				>
					{sending ? 'Signing in...' : password ? 'Sign in with Password' : 'Continue with email'}
				</button>
			{/if}
		</div>

		<p style="margin-top: 20px; font-size: 0.75rem; color: var(--text-muted); text-align: center; line-height: 1.6;">
			By continuing, you agree to our
			<a href="/terms" style="color: var(--text-secondary);">Terms of Service</a>
			and
			<a href="/privacy" style="color: var(--text-secondary);">Privacy Policy</a>.
		</p>
	</div>
</div>
