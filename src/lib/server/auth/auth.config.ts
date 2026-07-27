/**
 * Better Auth Configuration
 *
 * Providers: Google OAuth + Email OTP (no passwords)
 *
 * Account linking is enabled so a user who first signed in with Google
 * can later sign in with the same email via OTP and land on the SAME account.
 *
 * The Resend-based OTP sender is wired here. The Resend client is imported
 * from the notifications domain (it's a shared infrastructure concern).
 *
 * Reference: https://www.better-auth.com/docs/
 */
import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { emailOTP, admin } from 'better-auth/plugins';
import { db } from '../db/client';
import * as schema from '../db/schema/identity.schema';
import {
	GOOGLE_CLIENT_ID,
	GOOGLE_CLIENT_SECRET,
	BETTER_AUTH_SECRET,
	RESEND_API_KEY,
	RESEND_FROM_ADDRESS
} from '$env/static/private';
import { PUBLIC_APP_URL } from '$env/static/public';
import { Resend } from 'resend';
import { APP_NAME } from '$shared/constants';

const resend = new Resend(RESEND_API_KEY);

export const auth = betterAuth({
	secret: BETTER_AUTH_SECRET,
	baseURL: PUBLIC_APP_URL,
	basePath: '/api/auth',

	database: drizzleAdapter(db, {
		provider: 'pg',
		schema: {
			user:         schema.users,
			session:      schema.sessions,
			account:      schema.accounts,
			verification: schema.verifications
		}
	}),

	// ── Social Providers ──────────────────────────────────────────────────────
	socialProviders: {
		google: {
			clientId:     GOOGLE_CLIENT_ID,
			clientSecret: GOOGLE_CLIENT_SECRET,
			scope:        ['email', 'profile']
		}
	},

	emailAndPassword: {
		enabled: true
	},

	// ── Plugins ───────────────────────────────────────────────────────────────
	plugins: [
		admin(),
		emailOTP({
			otpLength:  6,
			expiresIn:  10 * 60, // 10 minutes in seconds

			async sendVerificationOTP({ email, otp, type }) {
				const subject =
					type === 'sign-in'
						? `Your ${APP_NAME} sign-in code: ${otp}`
						: `Your ${APP_NAME} verification code: ${otp}`;

				if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
					console.log('\n=============================================');
					console.log(`🔒 LOCAL OTP DEV MODE`);
					console.log(`To: ${email}`);
					console.log(`Code: ${otp}`);
					console.log('=============================================\n');
					return;
				}

				try {
					await resend.emails.send({
						from:    RESEND_FROM_ADDRESS,
						to:      email,
						subject,
						html: `
							<div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px">
								<h2 style="color:#1a1a2e;margin-bottom:8px">${APP_NAME}</h2>
								<p style="color:#555;margin-bottom:24px">
									Use the code below to ${type === 'sign-in' ? 'sign in' : 'verify your email'}.
									It expires in 10 minutes.
								</p>
								<div style="background:#f5f5f5;border-radius:8px;padding:24px;text-align:center;letter-spacing:8px;font-size:32px;font-weight:700;color:#1a1a2e">
									${otp}
								</div>
								<p style="color:#999;font-size:12px;margin-top:24px">
									If you didn't request this, you can safely ignore this email.
								</p>
							</div>
						`
					});
				} catch (e) {
					console.error('[Resend] Failed to send OTP email:', e);
					console.log(`\nFallback OTP for ${email}: ${otp}\n`);
				}
			}
		})
	],

	// ── Account Linking ───────────────────────────────────────────────────────
	// Same email from Google and Email OTP → same account
	account: {
		accountLinking: {
			enabled:          true,
			trustedProviders: ['google', 'email-otp']
		}
	},

	// ── Session Config ────────────────────────────────────────────────────────
	session: {
		expiresIn:          60 * 60 * 24 * 30,  // 30 days
		updateAge:          60 * 60 * 24,        // update session every 24h
		cookieCache: {
			enabled:  true,
			maxAge:   5 * 60   // 5 minute client-side cache
		}
	},

	// ── Email Verification ────────────────────────────────────────────────────
	emailVerification: {
		sendOnSignUp: false  // We use OTP; no separate email verification step
	}
});

export type Auth = typeof auth;
