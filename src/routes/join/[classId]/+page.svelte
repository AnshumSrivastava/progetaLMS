<script lang="ts">
	import { APP_NAME } from '$lib/shared/constants';
	import { page } from '$app/stores';
	import { Users2, CheckCircle2, ArrowLeft } from 'lucide-svelte';
	import { signIn } from '$lib/auth-client';
	import { addToast } from '$lib/stores/toast';
	import type { PageData, ActionData } from './$types';
	let { data, form } = $props<{ data: PageData, form: ActionData }>();
	
	let classId = $page.params.classId;
	
	// Form state
	let fullName = $state('');
	let emailAddress = $state('');
	let otp = $state('');
	let phoneNumber = $state('');
	let organization = $state('');
	let qualification = $state('');
	
	// Flow state
	let step = $state<'initial' | 'otp_verification' | 'profile_details' | 'success'>('initial');
	let authProvider = $state('');
	let isAuthenticating = $state(false);

	const classDetails = {
		name: data.cohort.name,
		course: data.cohort.courseTitle,
		instructor: data.cohort.instructorName
	};

	async function requestOTP(e: Event) {
		e.preventDefault();
		if (emailAddress) {
			isAuthenticating = true;
			try {
				await signIn.emailOTP({ email: emailAddress });
				step = 'otp_verification';
			} catch (err) {
				console.error(err);
				addToast('Failed to send OTP.', 'error');
			} finally {
				isAuthenticating = false;
			}
		}
	}

	async function verifyOTP(e: Event) {
		e.preventDefault();
		if (emailAddress && otp) {
			isAuthenticating = true;
			try {
				const res = await signIn.emailOTP({ email: emailAddress, otp });
				if (res.error) throw res.error;
				
				// Assuming they don't have a profile yet for this flow
				authProvider = 'Email Verification';
				step = 'profile_details';
			} catch (err) {
				console.error(err);
				addToast('Invalid OTP code.', 'error');
			} finally {
				isAuthenticating = false;
			}
		}
	}

	async function submitProfile(e: Event) {
		e.preventDefault();
		if (fullName && phoneNumber && organization && qualification) {
			isAuthenticating = true;
			try {
				const response = await fetch('?/enroll', {
					method: 'POST',
					body: new FormData(e.target as HTMLFormElement)
				});
				if (response.ok) {
					step = 'success';
				} else {
					addToast('Failed to enroll', 'error');
				}
			} catch (err) {
				console.error(err);
				addToast('Enrollment failed', 'error');
			} finally {
				isAuthenticating = false;
			}
		}
	}

	function socialLogin(provider: string) {
		isAuthenticating = true;
		if (provider === 'Google') {
			signIn.social({
				provider: 'google',
				callbackURL: '/dashboard'
			});
			// Note: OAuth will redirect away. The profile completion for OAuth usually
			// happens upon return to the callbackURL if data is missing, 
			// or we can handle it here if it's a popup flow.
			// For this demo, we'll just mock the transition:
			setTimeout(() => {
				authProvider = 'Google';
				emailAddress = 'jane@gmail.com';
				fullName = 'Jane Doe';
				step = 'profile_details';
				isAuthenticating = false;
			}, 1000);
		}
	}
</script>

<svelte:head>
	<title>Join {classDetails.name} — {APP_NAME}</title>
</svelte:head>

<div class="split-layout">
	<!-- Left Side: Professional Branding -->
	<div class="brand-panel">
		<div class="brand-content">
			<div class="logo">
				<div class="logo-icon-wrap"><Users2 size={24} /></div>
				Launchpad
			</div>
			
			<div class="hero-text">
				<div class="badge">Instructor Invitation</div>
				<h1>Join {classDetails.name}</h1>
				<p class="desc">You have been invited to master <strong>{classDetails.course}</strong>. Please complete your registration to access the curriculum and join your peers.</p>
			</div>
			
			<div class="course-meta">
				<div class="meta-item">
					<span class="meta-label">Course</span>
					<span class="meta-value">{classDetails.course}</span>
				</div>
				<div class="meta-item">
					<span class="meta-label">Instructor</span>
					<span class="meta-value">{classDetails.instructor}</span>
				</div>
			</div>
		</div>
		
		<div class="brand-footer">
			<p>© 2026 Launchpad LMS. All rights reserved.</p>
		</div>
	</div>

	<!-- Right Side: Comprehensive Form -->
	<div class="form-panel">
		<div class="form-container">
			{#if step === 'success'}
				<div class="success-state fade-in">
					<div class="success-icon-large">
						<CheckCircle2 size={48} />
					</div>
					<h2>Registration Complete</h2>
					<p>You are officially enrolled in <strong>{classDetails.name}</strong>.</p>
					
					<div class="next-steps">
						<h3>What's Next?</h3>
						<ul>
							<li>Check your email for your welcome package.</li>
							<li>Log in to access your dashboard.</li>
						</ul>
					</div>
					<a href="/dashboard" class="return-link">Go to Dashboard</a>
				</div>
			
			{:else if step === 'otp_verification'}
				<div class="form-header fade-in">
					<button class="back-btn" onclick={() => step = 'initial'}>
						<ArrowLeft size={16} /> Back
					</button>
					<h2>Verify your email</h2>
					<p>We sent a 6-digit verification code to <strong>{emailAddress}</strong>.</p>
				</div>

				<form class="join-form fade-in" onsubmit={verifyOTP}>
					<div class="input-group">
						<label for="otp">Verification Code *</label>
						<input type="text" id="otp" placeholder="123456" bind:value={otp} required pattern="\d{6}" maxlength="6" autocomplete="one-time-code" style="letter-spacing: 0.2em; font-size: 1.2rem; text-align: center;" />
					</div>

					<button type="submit" class="submit-btn" disabled={!otp || isAuthenticating}>
						{isAuthenticating ? 'Verifying...' : 'Verify Email'}
					</button>
				</form>

			{:else if step === 'profile_details'}
				<div class="form-header fade-in">
					<h2>Complete your profile</h2>
					<p>Please provide a few more details to finish enrolling in <strong>{classDetails.course}</strong>.</p>
				</div>

				<form class="join-form fade-in" onsubmit={submitProfile}>
					<div class="input-group">
						<label for="fullName">Full Name *</label>
						<input type="text" id="fullName" placeholder="Jane Doe" bind:value={fullName} required autocomplete="name" />
					</div>

					<div class="input-group">
						<label for="emailAddress">Email Address</label>
						<input type="email" id="emailAddress" bind:value={emailAddress} disabled />
						<span class="help-text">Verified via {authProvider}</span>
					</div>

					<!-- Row: Phone & Organization -->
					<div class="form-row">
						<div class="input-group">
							<label for="phoneNumber">Phone Number *</label>
							<input type="tel" id="phoneNumber" placeholder="+1 (555) 000-0000" bind:value={phoneNumber} required autocomplete="tel" />
						</div>
						<div class="input-group">
							<label for="organization">College / Organization *</label>
							<input type="text" id="organization" placeholder="University of Technology" bind:value={organization} required autocomplete="organization" />
						</div>
					</div>

					<!-- Qualifications -->
					<div class="input-group">
						<label for="qualification">Current Qualifications *</label>
						<select id="qualification" bind:value={qualification} required>
							<option value="">Select qualification level...</option>
							<option value="High School">High School Diploma</option>
							<option value="Bachelors">Bachelor's Degree</option>
							<option value="Masters">Master's Degree</option>
							<option value="Doctorate">Doctorate (PhD)</option>
							<option value="Other">Other / Professional Certification</option>
						</select>
					</div>

					<button type="submit" class="submit-btn" disabled={!fullName || !phoneNumber || !organization || !qualification || isAuthenticating}>
						{isAuthenticating ? 'Saving...' : 'Complete Enrollment'}
					</button>
				</form>
				
			{:else}
				<div class="form-header fade-in">
					<h2>Create your account</h2>
					<p>Please provide your details to complete your enrollment.</p>
				</div>

				<div class="social-logins fade-in">
					<button type="button" class="social-btn" onclick={() => socialLogin('Google')} disabled={isAuthenticating}>
						<svg class="social-svg" viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
							<path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
							<path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
							<path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
							<path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
						</svg>
						Continue with Google
					</button>
				</div>

				<div class="divider fade-in">
					<span>or continue with email</span>
				</div>

				<form class="join-form fade-in" onsubmit={requestOTP}>
					<div class="input-group">
						<label for="emailAddress">Work Email *</label>
						<input type="email" id="emailAddress" placeholder="jane@company.com" bind:value={emailAddress} required autocomplete="email" />
					</div>

					<button type="submit" class="submit-btn" disabled={!emailAddress || isAuthenticating}>
						{isAuthenticating ? 'Sending Code...' : 'Continue with Email'}
					</button>
				</form>
				
				<p class="terms fade-in">
					By enrolling, you agree to our <a href="#">Terms of Service</a> and <a href="#">Privacy Policy</a>.
				</p>
			{/if}
		</div>
	</div>
</div>

<style>
	:global(body) {
		margin: 0;
		padding: 0;
		background: #ffffff;
		font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
	}

	.split-layout {
		display: flex;
		min-height: 100vh;
		width: 100%;
	}

	/* --- LEFT SIDE: PROFESSIONAL BRANDING --- */
	.brand-panel {
		flex: 1;
		background: #0f172a; /* Solid Slate 900 - No gradients, no blobs */
		color: #f8fafc;
		padding: 4rem 5rem;
		display: flex;
		flex-direction: column;
		justify-content: space-between;
	}

	.brand-content {
		position: relative;
	}
	
	.logo {
		display: flex;
		align-items: center;
		gap: 12px;
		font-size: 1.5rem;
		font-weight: 700;
		letter-spacing: -0.01em;
	}
	.logo-icon-wrap {
		width: 40px;
		height: 40px;
		background: #1e293b;
		border: 1px solid #334155;
		border-radius: 8px;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.hero-text {
		margin-top: 6rem;
		max-width: 500px;
	}
	.badge {
		display: inline-block;
		background: rgba(255, 255, 255, 0.05);
		border: 1px solid rgba(255, 255, 255, 0.1);
		padding: 6px 14px;
		border-radius: 4px; /* Professional square edges */
		font-size: 0.85rem;
		font-weight: 600;
		color: #94a3b8;
		margin-bottom: 1.5rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.hero-text h1 {
		font-size: 2.5rem;
		font-weight: 700;
		line-height: 1.2;
		margin-bottom: 1.25rem;
		color: #ffffff;
	}
	.hero-text .desc {
		font-size: 1.1rem;
		color: #94a3b8;
		line-height: 1.6;
	}
	.hero-text .desc strong {
		color: #f8fafc;
		font-weight: 600;
	}

	.course-meta {
		margin-top: 3rem;
		display: flex;
		flex-direction: column;
		gap: 1.5rem;
		border-top: 1px solid #1e293b;
		padding-top: 2rem;
	}
	.meta-item {
		display: flex;
		flex-direction: column;
		gap: 4px;
	}
	.meta-label {
		font-size: 0.85rem;
		color: #64748b;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		font-weight: 600;
	}
	.meta-value {
		font-size: 1.05rem;
		color: #e2e8f0;
		font-weight: 500;
	}

	.brand-footer {
		font-size: 0.85rem;
		color: #64748b;
	}


	/* --- RIGHT SIDE: FORM --- */
	.form-panel {
		flex: 1.2;
		display: flex;
		align-items: center;
		justify-content: center;
		background: #ffffff;
		padding: 2rem;
		border-left: 1px solid #e2e8f0;
	}

	.form-container {
		width: 100%;
		max-width: 540px; /* Wider to accommodate two columns */
	}

	.form-header {
		margin-bottom: 2.5rem;
	}
	.form-header h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
		letter-spacing: -0.01em;
		margin-bottom: 8px;
	}
	.form-header p {
		font-size: 0.95rem;
		color: #64748b;
		line-height: 1.5;
	}

	.social-logins {
		margin-bottom: 1.5rem;
	}
	.social-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		gap: 12px;
		width: 100%;
		padding: 12px;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px;
		font-size: 0.95rem;
		font-weight: 600;
		color: #334155;
		cursor: pointer;
		transition: all 0.2s;
	}
	.social-btn:hover {
		background: #f8fafc;
		border-color: #94a3b8;
	}

	.divider {
		display: flex;
		align-items: center;
		text-align: center;
		margin: 1.5rem 0;
		color: #94a3b8;
		font-size: 0.85rem;
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.divider::before,
	.divider::after {
		content: '';
		flex: 1;
		border-bottom: 1px solid #e2e8f0;
	}
	.divider span {
		padding: 0 10px;
	}

	/* Form Layout */
	.form-row {
		display: flex;
		gap: 1rem;
		margin-bottom: 1.25rem;
	}
	.form-row .input-group {
		flex: 1;
		margin-bottom: 0; /* Override default */
	}

	.input-group {
		margin-bottom: 1.25rem;
	}
	.input-group label {
		display: block;
		font-size: 0.85rem;
		font-weight: 600;
		color: #334155;
		margin-bottom: 6px;
	}
	.input-group input, .input-group select {
		width: 100%;
		padding: 12px 14px;
		background: #ffffff;
		border: 1px solid #cbd5e1;
		border-radius: 6px; /* Professional slight rounding */
		font-size: 0.95rem;
		color: #0f172a;
		transition: all 0.2s;
		box-sizing: border-box;
		font-family: inherit;
	}
	.input-group select {
		appearance: none;
		background-image: url("data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3E%3Cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='m6 8 4 4 4-4'/%3E%3C/svg%3E");
		background-position: right 0.5rem center;
		background-repeat: no-repeat;
		background-size: 1.5em 1.5em;
		padding-right: 2.5rem;
	}
	.input-group input:focus, .input-group select:focus {
		outline: none;
		border-color: #2563eb; /* Corporate Blue */
		box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.1);
	}

	.submit-btn {
		width: 100%;
		padding: 14px;
		background: #0f172a;
		color: #ffffff;
		border: none;
		border-radius: 6px;
		font-size: 1rem;
		font-weight: 600;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-top: 1.5rem;
		transition: background 0.2s;
	}
	.submit-btn:hover:not(:disabled) {
		background: #1e293b;
	}
	.submit-btn:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.terms {
		margin-top: 1.5rem;
		text-align: center;
		font-size: 0.85rem;
		color: #64748b;
	}
	.terms a {
		color: #334155;
		font-weight: 600;
		text-decoration: underline;
	}

	.back-btn {
		display: inline-flex;
		align-items: center;
		gap: 6px;
		background: none;
		border: none;
		color: #64748b;
		font-size: 0.9rem;
		font-weight: 600;
		cursor: pointer;
		padding: 0;
		margin-bottom: 1.5rem;
		transition: color 0.2s;
	}
	.back-btn:hover {
		color: #0f172a;
	}

	.help-text {
		display: block;
		font-size: 0.8rem;
		color: #16a34a;
		margin-top: 6px;
		font-weight: 500;
	}

	.input-group input:disabled {
		background: #f8fafc;
		color: #64748b;
		cursor: not-allowed;
	}

	/* Success State */
	.success-state {
		text-align: left;
	}
	.success-icon-large {
		width: 56px;
		height: 56px;
		background: #f0fdf4;
		color: #16a34a;
		border-radius: 50%;
		display: flex;
		align-items: center;
		justify-content: center;
		margin-bottom: 1.5rem;
		border: 1px solid #bbf7d0;
	}
	.success-state h2 {
		font-size: 1.75rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 8px;
	}
	.success-state p {
		font-size: 1rem;
		color: #475569;
		line-height: 1.5;
	}
	.next-steps {
		margin-top: 2rem;
		background: #f8fafc;
		padding: 1.5rem;
		border-radius: 6px;
		border: 1px solid #e2e8f0;
	}
	.next-steps h3 {
		font-size: 0.95rem;
		font-weight: 700;
		color: #0f172a;
		margin-bottom: 12px;
	}
	.next-steps ul {
		margin: 0;
		padding-left: 1.2rem;
		color: #475569;
		font-size: 0.95rem;
		line-height: 1.6;
	}
	.next-steps li {
		margin-bottom: 6px;
	}
	.return-link {
		display: inline-block;
		margin-top: 1.5rem;
		font-size: 0.95rem;
		font-weight: 600;
		color: #2563eb;
		text-decoration: none;
	}

	/* Animations */
	.fade-in {
		animation: fadeIn 0.4s ease-out forwards;
		opacity: 0;
		transform: translateY(5px);
	}
	.fade-in:nth-child(1) { animation-delay: 0.05s; }
	.fade-in:nth-child(2) { animation-delay: 0.1s; }
	.fade-in:nth-child(3) { animation-delay: 0.15s; }
	.fade-in:nth-child(4) { animation-delay: 0.2s; }
	.fade-in:nth-child(5) { animation-delay: 0.25s; }

	@keyframes fadeIn {
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}

	@media (max-width: 900px) {
		.brand-panel {
			display: none;
		}
		.form-row {
			flex-direction: column;
			gap: 0;
		}
		.form-row .input-group {
			margin-bottom: 1.25rem;
		}
	}
</style>
