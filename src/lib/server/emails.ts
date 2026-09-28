import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { APP_NAME } from '$lib/shared/constants';

// Use env.RESEND_API_KEY if available, fallback to process.env (for direct script execution)
const apiKey = env.RESEND_API_KEY || process.env.RESEND_API_KEY;
const resend = new Resend(apiKey);

const fromEmail = `noreply@progeta.in`;

export const emailService = {
	async sendWelcomeEmail(to: string, name: string) {
		if (!apiKey) {
			console.warn('RESEND_API_KEY not found. Skipping welcome email to', to);
			return;
		}
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Welcome to ${APP_NAME}!`,
				html: `<h1>Welcome, ${name}!</h1><p>We are excited to have you on board.</p>`
			});
		} catch (error) {
			console.error('Error sending welcome email:', error);
		}
	},

	async sendEnrollmentEmail(to: string, userName: string, courseName: string) {
		if (!apiKey) {
			console.warn('RESEND_API_KEY not found. Skipping enrollment email to', to);
			return;
		}
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `You have successfully enrolled in ${courseName}`,
				html: `<h1>Hi ${userName},</h1><p>You are now enrolled in <strong>${courseName}</strong>. Happy learning!</p>`
			});
		} catch (error) {
			console.error('Error sending enrollment email:', error);
		}
	},

	async sendCertificationEmail(to: string, userName: string, certName: string, score: number) {
		if (!apiKey) {
			console.warn('RESEND_API_KEY not found. Skipping certification email to', to);
			return;
		}
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Congratulations on passing ${certName}!`,
				html: `<h1>Congratulations, ${userName}!</h1><p>You passed the <strong>${certName}</strong> exam with a score of ${score}%.</p><p>Check your dashboard to view your certificate.</p>`
			});
		} catch (error) {
			console.error('Error sending certification email:', error);
		}
	},

	async sendBookingConfirmation(opts: {
		studentEmail: string;
		studentName: string;
		instructorEmail: string;
		instructorName: string;
		startsAt: Date;
		durationMins: number;
		meetingUrl: string;
		notes?: string;
	}) {
		if (!apiKey) {
			console.log('Local dev: skipping booking confirmation email to', opts.studentEmail, opts.instructorEmail);
			return;
		}
		const timeFormatted = new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'full',
			timeStyle: 'short',
			timeZone: 'Asia/Kolkata'
		}).format(opts.startsAt);

		// Email to student
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: opts.studentEmail,
				subject: `Mentoring Session Confirmed with ${opts.instructorName}`,
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #111;">
						<p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px;">Mentoring Confirmation</p>
						<h2 style="font-size: 20px; margin: 0 0 16px;">Your 1-on-1 Session is Confirmed</h2>
						<p style="font-size: 14px; line-height: 1.5; color: #333;">Hi ${opts.studentName}, your mentoring session with <strong>${opts.instructorName}</strong> has been scheduled.</p>
						<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 24px 0;">
							<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Date & Time:</span><br><strong style="font-size: 14px;">${timeFormatted} (IST)</strong></div>
							<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Duration:</span><br><strong style="font-size: 14px;">${opts.durationMins} minutes</strong></div>
							<div><span style="font-size: 12px; color: #666;">Meeting Link:</span><br><a href="${opts.meetingUrl}" style="color: #0066cc; font-size: 14px; word-break: break-all;">${opts.meetingUrl}</a></div>
						</div>
						<p style="font-size: 13px; color: #666;">A direct reminder with the join link will also be sent 5 minutes before your session begins.</p>
					</div>
				`
			});
		} catch (err) {
			console.error('Error sending student confirmation email:', err);
		}

		// Email to instructor
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: opts.instructorEmail,
				subject: `New Mentoring Booking from ${opts.studentName}`,
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #111;">
						<p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #666; margin-bottom: 8px;">New Booking</p>
						<h2 style="font-size: 20px; margin: 0 0 16px;">New Mentoring Session Scheduled</h2>
						<p style="font-size: 14px; line-height: 1.5; color: #333;">Hi ${opts.instructorName}, <strong>${opts.studentName}</strong> has booked a session with you.</p>
						<div style="background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 8px; padding: 20px; margin: 24px 0;">
							<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Student:</span><br><strong style="font-size: 14px;">${opts.studentName} (${opts.studentEmail})</strong></div>
							<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Date & Time:</span><br><strong style="font-size: 14px;">${timeFormatted} (IST)</strong></div>
							<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Duration:</span><br><strong style="font-size: 14px;">${opts.durationMins} minutes</strong></div>
							${opts.notes ? `<div style="margin-bottom: 12px;"><span style="font-size: 12px; color: #666;">Student Agenda / Notes:</span><br><p style="font-size: 13px; color: #222; margin: 4px 0;">${opts.notes}</p></div>` : ''}
							<div><span style="font-size: 12px; color: #666;">Meeting Link:</span><br><a href="${opts.meetingUrl}" style="color: #0066cc; font-size: 14px; word-break: break-all;">${opts.meetingUrl}</a></div>
						</div>
					</div>
				`
			});
		} catch (err) {
			console.error('Error sending instructor confirmation email:', err);
		}
	},

	async sendSessionReminder(opts: {
		recipientEmail: string;
		recipientName: string;
		otherPartyName: string;
		startsAt: Date;
		durationMins: number;
		meetingUrl: string;
		isInstructor?: boolean;
	}) {
		if (!apiKey) {
			console.log('Local dev: skipping reminder email to', opts.recipientEmail);
			return;
		}
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: opts.recipientEmail,
				subject: `Starting in 5 minutes: Mentoring Session with ${opts.otherPartyName}`,
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #111;">
						<p style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.1em; color: #16a34a; font-weight: 600; margin-bottom: 8px;">Starting in 5 Minutes</p>
						<h2 style="font-size: 20px; margin: 0 0 16px;">Your 1-on-1 Session is Starting Soon</h2>
						<p style="font-size: 14px; line-height: 1.5; color: #333;">Hi ${opts.recipientName}, your ${opts.durationMins}-minute session with <strong>${opts.otherPartyName}</strong> is ready to join.</p>
						<div style="margin: 28px 0; text-align: center;">
							<a href="${opts.meetingUrl}" style="display: inline-block; padding: 14px 28px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">Join Video Meeting</a>
						</div>
						<p style="font-size: 12px; color: #666; text-align: center;">Or copy and paste this link in your browser:<br><a href="${opts.meetingUrl}" style="color: #0066cc;">${opts.meetingUrl}</a></p>
					</div>
				`
			});
		} catch (err) {
			console.error('Error sending session reminder email:', err);
		}
	},

	async sendStudentCancellationNotice(opts: {
		instructorEmail: string;
		instructorName: string;
		studentName: string;
		startsAt: Date;
		durationMins: number;
	}) {
		if (!apiKey) return;
		const timeFormatted = new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'full',
			timeStyle: 'short',
			timeZone: 'Asia/Kolkata'
		}).format(opts.startsAt);

		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: opts.instructorEmail,
				subject: `Session Cancelled by ${opts.studentName}`,
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #111;">
						<h2 style="font-size: 20px; margin: 0 0 16px;">Mentoring Session Cancelled</h2>
						<p style="font-size: 14px; color: #333;">Hi ${opts.instructorName}, the session scheduled with <strong>${opts.studentName}</strong> on <strong>${timeFormatted}</strong> has been cancelled by the student.</p>
					</div>
				`
			});
		} catch (err) {
			console.error('Error sending cancellation email to instructor:', err);
		}
	},

	async sendWindowCancellationNotice(opts: {
		studentEmail: string;
		studentName: string;
		instructorName: string;
		date: string;
		windowStart: string;
		windowEnd: string;
		reason?: string;
	}) {
		if (!apiKey) return;
		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: opts.studentEmail,
				subject: `Mentoring Availability Update: Session Cancelled`,
				html: `
					<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 560px; margin: 0 auto; padding: 32px; color: #111;">
						<h2 style="font-size: 20px; margin: 0 0 16px;">Session Cancelled</h2>
						<p style="font-size: 14px; color: #333;">Hi ${opts.studentName}, your upcoming session on <strong>${opts.date}</strong> with <strong>${opts.instructorName}</strong> has been cancelled.</p>
						${opts.reason ? `<p style="font-size: 13px; color: #555; background: #f8f9fa; padding: 12px; border-radius: 6px; border-left: 3px solid #666;">Reason: ${opts.reason}</p>` : ''}
						<p style="font-size: 13px; color: #666;">Please check the mentoring calendar to reschedule with another time slot.</p>
					</div>
				`
			});
		} catch (err) {
			console.error('Error sending window cancellation email:', err);
		}
	},

	async sendCheckoutOtp(to: string, otp: string, userName?: string) {
		console.log('\n=============================================');
		console.log(`🔒 CHECKOUT VERIFICATION CODE`);
		console.log(`To: ${to}`);
		console.log(`Code: ${otp}`);
		console.log('=============================================\n');

		if (!apiKey || apiKey.startsWith('re_123456')) {
			return;
		}

		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Your ${APP_NAME} Checkout Verification Code: ${otp}`,
				html: `
					<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px; background: #ffffff; color: #1a1a2e; border: 1px solid #eee; border-radius: 12px;">
						<h2 style="font-size: 20px; font-weight: 700; margin-bottom: 8px;">${APP_NAME}</h2>
						<p style="color: #555; font-size: 14px; margin-bottom: 24px;">
							Hi ${userName || 'Learner'}, enter this verification code to confirm your email and proceed to enrollment:
						</p>
						<div style="background: #f4f4f6; border-radius: 8px; padding: 20px; text-align: center; letter-spacing: 8px; font-size: 32px; font-weight: 700; color: #111;">
							${otp}
						</div>
						<p style="color: #888; font-size: 12px; margin-top: 24px; line-height: 1.5;">
							This code will expire in 10 minutes. If you did not initiate this checkout, please ignore this email.
						</p>
					</div>
				`
			});
		} catch (error) {
			console.error('Error sending checkout OTP email:', error);
		}
	},

	async sendEnrollmentWithMagicLink(to: string, userName: string, courseTitle: string, magicUrl: string) {
		console.log('\n=============================================');
		console.log(`✨ ENROLLMENT MAGIC LOGIN LINK`);
		console.log(`To: ${to}`);
		console.log(`Course: ${courseTitle}`);
		console.log(`Link: ${magicUrl}`);
		console.log('=============================================\n');

		if (!apiKey || apiKey.startsWith('re_123456')) {
			return;
		}

		try {
			await resend.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `You're enrolled in ${courseTitle}! Access your course now`,
				html: `
					<div style="font-family: system-ui, -apple-system, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px 32px; background: #ffffff; color: #1a1a2e; border: 1px solid #eee; border-radius: 12px;">
						<div style="font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #4f46e5; margin-bottom: 8px;">
							Enrollment Confirmed
						</div>
						<h2 style="font-size: 22px; font-weight: 700; line-height: 1.3; margin-top: 0; margin-bottom: 16px;">
							Welcome to ${courseTitle}
						</h2>
						<p style="color: #4b5563; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
							Hi ${userName || 'Learner'}, your payment has been confirmed and your course access is unlocked. Click the button below to sign in instantly as a Student and begin learning:
						</p>
						<div style="text-align: center; margin: 32px 0;">
							<a href="${magicUrl}" style="display: inline-block; background: #111827; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 600; padding: 14px 28px; border-radius: 8px; letter-spacing: -0.01em;">
								Access Your Dashboard & Course →
							</a>
						</div>
						<p style="color: #9ca3af; font-size: 12px; line-height: 1.6; border-top: 1px solid #f3f4f6; padding-top: 20px;">
							This direct login link expires in 24 hours. You can also sign in anytime using your email address (<strong>${to}</strong>) via OTP, Gmail, or your account password.
						</p>
					</div>
				`
			});
		} catch (error) {
			console.error('Error sending enrollment magic link email:', error);
		}
	}
};
