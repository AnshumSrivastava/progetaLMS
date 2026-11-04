import { Resend } from 'resend';
import { env } from '$env/dynamic/private';
import { RESEND_API_KEY as STATIC_RESEND_API_KEY } from '$env/static/private';
import { APP_NAME } from '$lib/shared/constants';

const fromEmail = `noreply@progeta.in`;

function getResendClient(): { client: Resend; key: string } | null {
	const key = env.RESEND_API_KEY || STATIC_RESEND_API_KEY || process.env.RESEND_API_KEY;
	if (!key || key.startsWith('re_123456')) return null;
	try {
		return { client: new Resend(key), key };
	} catch (e) {
		console.warn('[emailService] Resend initialization failed:', e);
		return null;
	}
}

export const emailService = {
	async sendWelcomeEmail(to: string, name: string) {
		const resend = getResendClient();
		if (!resend) {
			console.warn('RESEND_API_KEY not configured. Skipping welcome email to', to);
			return;
		}
		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Welcome to ${APP_NAME}!`,
				html: `<h1>Welcome, ${name}!</h1><p>We are excited to have you on board.</p>`
			});
		} catch (error) {
			console.error('Error sending welcome email:', error);
		}
	},

	async sendEnrollmentEmail(to: string, userName: string, courseName: string, whatsappUrl: string = 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i') {
		const resend = getResendClient();
		if (!resend) {
			console.warn('RESEND_API_KEY not configured. Skipping enrollment email to', to);
			return;
		}
		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Enrollment Confirmed: ${courseName} — Join the WhatsApp Group`,
				html: `
					<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px 32px; background: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 12px;">
						<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #16a34a; margin-bottom: 8px;">
							✓ Enrollment Confirmed
						</div>
						<h1 style="font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 16px; color: #09090b;">
							Welcome to ${courseName}
						</h1>
						<p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
							Hi ${userName || 'Learner'},
						</p>
						<p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
							Your enrollment in <strong>${courseName}</strong> is confirmed! All batch schedules, live class links, study materials, announcements, and session recordings will be shared directly in our official WhatsApp group.
						</p>

						<div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0;">
							<div style="font-size: 14px; font-weight: 600; color: #18181b; margin-bottom: 6px;">
								Official Batch Community
							</div>
							<p style="font-size: 13px; color: #71717a; margin: 0 0 20px; line-height: 1.5;">
								The group will be where all the details and live session links will be shared. Please join now:
							</p>
							<a href="${whatsappUrl}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 8px; letter-spacing: -0.01em;">
								👉 Join Official WhatsApp Group →
							</a>
						</div>

						<p style="font-size: 12px; color: #71717a; line-height: 1.6; margin-bottom: 20px;">
							If the button doesn't open directly, copy and paste this link in your browser:<br>
							<a href="${whatsappUrl}" style="color: #0284c7; word-break: break-all;">${whatsappUrl}</a>
						</p>

						<div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 24px;">
							<p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 0;">
								You are receiving this confirmation because you enrolled with <strong>${to}</strong> on ${APP_NAME}.
							</p>
						</div>
					</div>
				`
			});
		} catch (error) {
			console.error('Error sending enrollment email:', error);
		}
	},

	async sendCertificationEmail(to: string, userName: string, certName: string, score: number) {
		const resend = getResendClient();
		if (!resend) {
			console.warn('RESEND_API_KEY not configured. Skipping certification email to', to);
			return;
		}
		try {
			await resend.client.emails.send({
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
		const resend = getResendClient();
		if (!resend) {
			console.log('RESEND_API_KEY not configured: skipping booking confirmation email');
			return;
		}
		const timeFormatted = new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'full',
			timeStyle: 'short',
			timeZone: 'Asia/Kolkata'
		}).format(opts.startsAt);

		// Email to student
		try {
			await resend.client.emails.send({
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
			await resend.client.emails.send({
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
		const resend = getResendClient();
		if (!resend) return;
		try {
			await resend.client.emails.send({
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
		const resend = getResendClient();
		if (!resend) return;
		const timeFormatted = new Intl.DateTimeFormat('en-IN', {
			dateStyle: 'full',
			timeStyle: 'short',
			timeZone: 'Asia/Kolkata'
		}).format(opts.startsAt);

		try {
			await resend.client.emails.send({
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
		const resend = getResendClient();
		if (!resend) return;
		try {
			await resend.client.emails.send({
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

		const resend = getResendClient();
		if (!resend) {
			return;
		}

		try {
			await resend.client.emails.send({
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

	async sendEnrollmentWithMagicLink(to: string, userName: string, courseTitle: string, magicUrl: string, whatsappUrl: string = 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i') {
		console.log('\n=============================================');
		console.log(`✨ ENROLLMENT CONFIRMATION & WHATSAPP GROUP`);
		console.log(`To: ${to}`);
		console.log(`Course: ${courseTitle}`);
		console.log(`WhatsApp Link: ${whatsappUrl}`);
		console.log('=============================================\n');

		const resend = getResendClient();
		if (!resend) {
			return;
		}

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to,
				subject: `Enrollment Confirmed: ${courseTitle} — Join the WhatsApp Group`,
				html: `
					<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 520px; margin: 0 auto; padding: 36px 32px; background: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 12px;">
						<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #16a34a; margin-bottom: 8px;">
							✓ Enrollment Confirmed
						</div>
						<h1 style="font-size: 22px; font-weight: 700; line-height: 1.3; margin: 0 0 16px; color: #09090b;">
							Welcome to ${courseTitle}
						</h1>
						<p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin-bottom: 16px;">
							Hi ${userName || 'Learner'},
						</p>
						<p style="color: #3f3f46; font-size: 15px; line-height: 1.6; margin-bottom: 24px;">
							Your enrollment in <strong>${courseTitle}</strong> is confirmed! All batch schedules, live class links, study materials, announcements, and session recordings will be shared directly in our official WhatsApp group.
						</p>

						<div style="background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 10px; padding: 24px; text-align: center; margin: 28px 0;">
							<div style="font-size: 14px; font-weight: 600; color: #18181b; margin-bottom: 6px;">
								Official Batch Community
							</div>
							<p style="font-size: 13px; color: #71717a; margin: 0 0 20px; line-height: 1.5;">
								The group will be where all the details and live session links will be shared. Please join now:
							</p>
							<a href="${whatsappUrl}" style="display: inline-block; background: #25D366; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 28px; border-radius: 8px; letter-spacing: -0.01em;">
								👉 Join Official WhatsApp Group →
							</a>
						</div>

						<p style="font-size: 12px; color: #71717a; line-height: 1.6; margin-bottom: 20px;">
							If the button doesn't open directly, copy and paste this link in your browser:<br>
							<a href="${whatsappUrl}" style="color: #0284c7; word-break: break-all;">${whatsappUrl}</a>
						</p>

						<div style="border-top: 1px solid #f4f4f5; padding-top: 20px; margin-top: 24px;">
							<p style="color: #a1a1aa; font-size: 12px; line-height: 1.6; margin: 0;">
								You are receiving this confirmation because you enrolled with <strong>${to}</strong> on ${APP_NAME}.
							</p>
						</div>
					</div>
				`
			});
		} catch (error) {
			console.error('Error sending enrollment magic link email:', error);
		}
	},

	async sendDailySalesDigest(opts: {
		dateStr: string;
		totalStudents: number;
		totalOrders: number;
		totalRevenuePaise: number;
		sales: Array<{
			userName: string;
			userEmail: string;
			courseTitle: string;
			amountPaise: number;
			status: string;
			timeFormatted: string;
			orderId: string;
		}>;
	}) {
		const targetEmail = 'progetatechnologies@gmail.com';
		const resend = getResendClient();
		if (!resend) {
			console.warn('[emailService] Resend not configured. Skipping daily sales digest.');
			return { success: false, error: 'Resend not configured' };
		}

		const totalRupees = (opts.totalRevenuePaise / 100).toLocaleString('en-IN');
		const subject = `📊 Daily Sales Digest [${opts.dateStr}] — ${opts.totalStudents} Student(s) | ₹${totalRupees}`;

		const rowsHtml = opts.sales.map((sale, idx) => `
			<tr style="border-bottom: 1px solid #e4e4e7; ${idx % 2 === 1 ? 'background-color: #fafafa;' : ''}">
				<td style="padding: 12px 14px; font-weight: 600; color: #18181b; font-size: 13px;">
					${sale.userName}
					<div style="font-size: 11px; font-weight: normal; color: #71717a;">${sale.userEmail}</div>
				</td>
				<td style="padding: 12px 14px; color: #27272a; font-size: 13px;">
					${sale.courseTitle}
				</td>
				<td style="padding: 12px 14px; font-weight: 700; color: #18181b; font-size: 13px; text-align: right;">
					₹${(sale.amountPaise / 100).toLocaleString('en-IN')}
				</td>
				<td style="padding: 12px 14px; font-size: 12px; color: #71717a; text-align: right; white-space: nowrap;">
					${sale.timeFormatted}
				</td>
			</tr>
		`).join('');

		const html = `
			<div style="font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 680px; margin: 0 auto; padding: 36px 32px; background: #ffffff; color: #18181b; border: 1px solid #e4e4e7; border-radius: 12px;">
				<div style="border-bottom: 1px solid #e4e4e7; padding-bottom: 16px; margin-bottom: 24px;">
					<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; color: #71717a; margin-bottom: 4px;">
						Automated Daily Digest (10:00 PM IST)
					</div>
					<h1 style="font-size: 22px; font-weight: 800; margin: 0; color: #09090b;">
						Daily Sales & Enrollments
					</h1>
					<div style="font-size: 13px; color: #71717a; margin-top: 4px;">
						Reporting Cycle: ${opts.dateStr}
					</div>
				</div>

				<!-- Metric Summary Cards -->
				<div style="margin: 20px 0 28px 0;">
					<table style="width: 100%; border-collapse: separate; border-spacing: 12px 0;">
						<tr>
							<td style="width: 33.3%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; text-align: center;">
								<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 600;">Students Enrolled</div>
								<div style="font-size: 24px; font-weight: 800; color: #09090b; margin-top: 4px;">${opts.totalStudents}</div>
							</td>
							<td style="width: 33.3%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; text-align: center;">
								<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 600;">Total Orders</div>
								<div style="font-size: 24px; font-weight: 800; color: #09090b; margin-top: 4px;">${opts.totalOrders}</div>
							</td>
							<td style="width: 33.3%; background: #f4f4f5; border: 1px solid #e4e4e7; border-radius: 8px; padding: 16px; text-align: center;">
								<div style="font-size: 11px; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; font-weight: 600;">Total Revenue</div>
								<div style="font-size: 24px; font-weight: 800; color: #09090b; margin-top: 4px;">₹${totalRupees}</div>
							</td>
						</tr>
					</table>
				</div>

				<!-- Sales Table -->
				<div style="border: 1px solid #e4e4e7; border-radius: 8px; overflow: hidden; margin-bottom: 28px;">
					<table style="width: 100%; border-collapse: collapse; text-align: left;">
						<thead>
							<tr style="background: #f4f4f5; border-bottom: 1px solid #e4e4e7;">
								<th style="padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b;">Student</th>
								<th style="padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b;">Course / Product</th>
								<th style="padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b; text-align: right;">Amount Paid</th>
								<th style="padding: 12px 14px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #52525b; text-align: right;">Time (IST)</th>
							</tr>
						</thead>
						<tbody>
							${rowsHtml}
						</tbody>
					</table>
				</div>

				<div style="border-top: 1px solid #f4f4f5; padding-top: 16px; font-size: 12px; color: #a1a1aa; line-height: 1.5;">
					This email is automatically generated every day at 10:00 PM IST by Progeta LMS. If no sales occur during a 24-hour cycle, this email is automatically suppressed.
				</div>
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} Reports <${fromEmail}>`,
				to: targetEmail,
				subject,
				html
			});
			console.log(`[DailyReportService] Daily sales digest sent successfully to ${targetEmail}`);
			return { success: true, count: opts.totalOrders };
		} catch (error) {
			console.error('[DailyReportService] Error sending daily sales digest:', error);
			return { success: false, error };
		}
	},

	async sendEventRegistrationConfirmation(params: {
		to: string;
		userName: string;
		eventTitle: string;
		eventSlug: string;
		eventDate: string;
		eventTime: string;
		venueType: 'online' | 'offline' | 'hybrid';
		venueDisplay: string;
		paymentMethod: 'free' | 'paid' | 'credit';
		amountPaid?: string;
		creditsUsed?: number;
		whatsappGroupUrl?: string;
		registrationId: string;
		ticketTierName?: string;
		ticketTierId?: string;
	}) {
		const resend = getResendClient();
		if (!resend) {
			console.warn('[emailService] Resend not configured. Skipping event registration email to', params.to);
			return;
		}

		const whatsappUrl = params.whatsappGroupUrl || 'https://chat.whatsapp.com/FaTkNU1448QIbVc2lfzQ7i';

		const paymentDetails =
			params.paymentMethod === 'free'
				? 'Free'
				: params.paymentMethod === 'credit'
				? `${params.creditsUsed || 0} Credits`
				: params.amountPaid || 'Paid';

		// Resolve tier details & deliverables
		const tierKey = (params.ticketTierId || '').toLowerCase();
		let tierName = params.ticketTierName || 'Normal Attendee Pass';
		let tierBadge = 'CONFIRMED PASS';
		let tierBadgeColor = '#52525b';
		let tierPerks = [
			'Live Interactive Masterclass Stream & Exploitation Demos',
			'Active Q&A with Lead Cybersecurity Researcher',
			'Curated OSINT Investigation Tool List & Cheatsheet',
			'Official Community WhatsApp & Discord Access'
		];

		if (tierKey === 'all_access' || tierName.toLowerCase().includes('all-access') || tierName.toLowerCase().includes('vip')) {
			tierName = 'All-Access VIP Pass';
			tierBadge = 'BEST VALUE &bull; VIP';
			tierBadgeColor = '#09090b';
			tierPerks = [
				'Everything in ₹299 Certified Pass',
				'Official Progeta Certificate of Completion (with verification hash)',
				'The 45-Page Enterprise Social Engineering Defense Playbook',
				'Hardening Implementation Matrix & Verification Checklists',
				'Executive Security Awareness Presentation Deck (Keynote/PPTX)',
				'Official Community WhatsApp Group & Priority Q&A'
			];
		} else if (tierKey === 'certified' || tierName.toLowerCase().includes('certif')) {
			tierName = 'Certified Pass';
			tierBadge = 'RECOMMENDED &bull; CERTIFIED';
			tierBadgeColor = '#dc2626';
			tierPerks = [
				'Everything in ₹99 Normal Attendee Pass',
				'Curated OSINT Investigation Tool List & Cheatsheet',
				'Official Progeta Certificate of Completion',
				'Cryptographic Verification Hash for LinkedIn & CV',
				'Priority Live Q&A Question Placement'
			];
		}

		const perksHtml = tierPerks.map(p => `
			<li style="margin-bottom: 8px; display: flex; align-items: flex-start; gap: 8px; font-size: 13px; color: #27272a; line-height: 1.5;">
				<span style="color: #16a34a; font-weight: bold; font-size: 14px; margin-right: 4px;">✓</span>
				<span>${p}</span>
			</li>
		`).join('');

		const html = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 620px; margin: 0 auto; padding: 32px 24px; color: #18181b; background: #ffffff;">
				<!-- Brand Header -->
				<div style="margin-bottom: 28px; padding-bottom: 18px; border-bottom: 1px solid #e4e4e7; display: flex; align-items: center; justify-content: space-between;">
					<div>
						<span style="font-size: 15px; font-weight: 900; letter-spacing: -0.02em; color: #09090b; text-transform: uppercase;">PROGETA</span>
						<span style="font-size: 11px; font-family: monospace; color: #dc2626; font-weight: 700; margin-left: 8px; text-transform: uppercase;">&bull; LIVE MASTERCLASS SERIES</span>
					</div>
					<div style="font-size: 11px; font-family: monospace; color: #71717a;">
						TICKET CONFIRMATION
					</div>
				</div>

				<!-- Main Headline -->
				<h1 style="font-size: 24px; font-weight: 800; color: #09090b; margin: 0 0 10px 0; letter-spacing: -0.02em; line-height: 1.25;">
					Your seat is reserved! We're looking forward to meeting you.
				</h1>
				<p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 24px 0;">
					Hi <strong>${params.userName}</strong>, your registration for <strong>${params.eventTitle}</strong> is confirmed. Our team and lead instructor Anmol Madan are looking forward to hosting you for this intensive live session.
				</p>

				<!-- Confirmed Ticket Tier Card -->
				<div style="background: #ffffff; border: 2px solid ${tierBadgeColor}; border-radius: 12px; padding: 22px; margin-bottom: 24px; box-shadow: 0 4px 14px rgba(0,0,0,0.04);">
					<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 14px; border-bottom: 1px solid #f4f4f5; padding-bottom: 12px;">
						<div>
							<div style="font-size: 11px; font-family: monospace; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; color: #71717a; margin-bottom: 2px;">
								YOUR TICKET PASS
							</div>
							<div style="font-size: 18px; font-weight: 800; color: #09090b;">
								${tierName}
							</div>
						</div>
						<div style="text-align: right;">
							<span style="display: inline-block; background: ${tierBadgeColor}; color: #ffffff; padding: 4px 10px; border-radius: 999px; font-size: 10px; font-weight: 800; font-family: monospace; letter-spacing: 0.05em; text-transform: uppercase;">
								${tierBadge}
							</span>
							<div style="font-size: 14px; font-weight: 800; color: #09090b; margin-top: 4px; font-family: monospace;">
								${paymentDetails}
							</div>
						</div>
					</div>

					<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 10px;">
						What's Included in Your Pass:
					</div>
					<ul style="list-style: none; padding: 0; margin: 0;">
						${perksHtml}
					</ul>
				</div>

				<!-- Session Logistics Box -->
				<div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 10px; padding: 18px 20px; margin-bottom: 24px;">
					<div style="font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; color: #71717a; margin-bottom: 10px;">
						Event Schedule & Details
					</div>
					<table style="width: 100%; border-collapse: collapse; font-size: 13px;">
						<tr>
							<td style="padding: 6px 0; color: #71717a; width: 100px;">Date:</td>
							<td style="padding: 6px 0; color: #09090b; font-weight: 600;">📅 ${params.eventDate}</td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #71717a;">Time:</td>
							<td style="padding: 6px 0; color: #09090b; font-weight: 600;">🕙 ${params.eventTime}</td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #71717a;">Location:</td>
							<td style="padding: 6px 0; color: #09090b; font-weight: 600;">📍 ${params.venueDisplay}</td>
						</tr>
						<tr>
							<td style="padding: 6px 0; color: #71717a;">Order ID:</td>
							<td style="padding: 6px 0; color: #09090b; font-family: monospace; font-size: 12px;">#${params.registrationId}</td>
						</tr>
					</table>
				</div>

				<!-- WhatsApp Community Action Box -->
				<div style="background: #09090b; color: #ffffff; border-radius: 12px; padding: 24px; text-align: center; margin-bottom: 24px; box-shadow: 0 4px 16px rgba(0,0,0,0.15);">
					<div style="font-size: 16px; font-weight: 800; margin-bottom: 6px; letter-spacing: -0.01em;">
						Join the Official WhatsApp Community Group
					</div>
					<p style="font-size: 13px; color: #d4d4d8; line-height: 1.5; margin: 0 0 18px 0; max-width: 440px; margin-inline: auto;">
						All live stream joining links, tool download links, and live announcements are shared inside this private WhatsApp group.
					</p>
					<a href="${whatsappUrl}" style="display: inline-block; background: #22c55e; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 800; text-decoration: none; text-transform: uppercase; letter-spacing: 0.05em; box-shadow: 0 2px 8px rgba(34, 197, 94, 0.3);">
						Join WhatsApp Group &rarr;
					</a>
				</div>

				<!-- Warm Closing -->
				<div style="font-size: 13px; color: #52525b; line-height: 1.6; margin-bottom: 24px; border-top: 1px solid #f4f4f5; padding-top: 20px;">
					<p style="margin: 0 0 4px 0;">Looking forward to seeing you live in the session,</p>
					<p style="margin: 0; font-weight: 700; color: #09090b;">Anmol Madan &amp; The Progeta Team</p>
					<p style="margin: 0; font-size: 12px; color: #71717a;">Progeta Technologies &bull; lms.progeta.in</p>
				</div>

				<!-- Footer -->
				<div style="border-top: 1px solid #e4e4e7; padding-top: 16px; font-size: 11px; color: #a1a1aa; text-align: center;">
					&copy; ${new Date().getFullYear()} Progeta Technologies &bull; If you have any questions, reply directly to this email or reach us at progetatechnologies@gmail.com
				</div>
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: params.to,
				subject: `[Pass Confirmed: ${tierName}] You're attending ${params.eventTitle}!`,
				html
			});
			console.log(`[emailService] Registration email (${tierName}) sent to ${params.to} for event ${params.eventTitle}`);
		} catch (error) {
			console.error('[emailService] Error sending event registration email:', error);
		}
	},

	async sendEventReminder(params: {
		to: string;
		userName: string;
		eventTitle: string;
		eventDate: string;
		eventTime: string;
		venueDisplay: string;
		meetingUrl?: string;
		joiningInstructions?: string;
		whatsappGroupUrl?: string;
	}) {
		const resend = getResendClient();
		if (!resend) return;

		const html = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; background: #ffffff;">
				<h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Reminder: ${params.eventTitle} is starting soon</h1>
				<p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">
					Hi ${params.userName}, here are your session joining details:
				</p>
				<div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
					<div style="font-size: 14px; font-weight: 600; color: #09090b; margin-bottom: 6px;">📅 ${params.eventDate}</div>
					<div style="font-size: 13px; color: #52525b; margin-bottom: 6px;">🕙 ${params.eventTime}</div>
					<div style="font-size: 13px; color: #52525b; margin-bottom: 12px;">📍 ${params.venueDisplay}</div>
					${params.meetingUrl ? `<a href="${params.meetingUrl}" style="display: inline-block; background: #09090b; color: #ffffff; padding: 10px 18px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none;">Join Session &rarr;</a>` : ''}
					${params.joiningInstructions ? `<p style="font-size: 12px; color: #71717a; margin-top: 12px;">${params.joiningInstructions}</p>` : ''}
				</div>
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: params.to,
				subject: `Reminder: ${params.eventTitle} starts tomorrow!`,
				html
			});
		} catch (error) {
			console.error('[emailService] Error sending event reminder email:', error);
		}
	},

	async sendEventResourcesReleased(params: {
		to: string;
		userName: string;
		eventTitle: string;
		eventSlug: string;
		resourceCount: number;
	}) {
		const resend = getResendClient();
		if (!resend) return;

		const html = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; background: #ffffff;">
				<h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Resources Available: ${params.eventTitle}</h1>
				<p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">
					Hi ${params.userName}, the host has released ${params.resourceCount} resource(s) (slides, code repositories, worksheets) for <strong>${params.eventTitle}</strong>.
				</p>
				<div style="margin: 24px 0;">
					<a href="https://lms.progeta.in/events/${params.eventSlug}/resources" style="display: inline-block; background: #09090b; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 14px; font-weight: 600; text-decoration: none;">Access Event Resources &rarr;</a>
				</div>
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: params.to,
				subject: `Resources now available: ${params.eventTitle}`,
				html
			});
		} catch (error) {
			console.error('[emailService] Error sending event resources email:', error);
		}
	},

	async sendCreditPurchaseConfirmation(params: {
		to: string;
		userName: string;
		packageName: string;
		credits: number;
		bonusCredits: number;
		totalCredits: number;
		amountPaid: string;
		newBalance: number;
	}) {
		const resend = getResendClient();
		if (!resend) return;

		const html = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; background: #ffffff;">
				<h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Credits Added to Your Account</h1>
				<p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">
					Hi ${params.userName}, your purchase of ${params.packageName} was successful.
				</p>
				<div style="background: #fafafa; border: 1px solid #e4e4e7; border-radius: 8px; padding: 20px; margin-bottom: 24px;">
					<div style="font-size: 14px; color: #52525b; margin-bottom: 6px;">Credits Added: <strong style="color: #09090b;">+${params.totalCredits}</strong> (${params.credits} base + ${params.bonusCredits} bonus)</div>
					<div style="font-size: 14px; color: #52525b; margin-bottom: 6px;">Amount Paid: <strong style="color: #09090b;">${params.amountPaid}</strong></div>
					<div style="border-top: 1px solid #e4e4e7; padding-top: 10px; font-size: 15px; font-weight: 700; color: #09090b;">
						Current Balance: ${params.newBalance} Credits
					</div>
				</div>
				<a href="https://lms.progeta.in/events" style="display: inline-block; background: #09090b; color: #ffffff; padding: 10px 20px; border-radius: 6px; font-size: 13px; font-weight: 600; text-decoration: none;">Explore Sessions &rarr;</a>
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: params.to,
				subject: `+${params.totalCredits} Credits added to your Progeta account`,
				html
			});
		} catch (error) {
			console.error('[emailService] Error sending credit purchase email:', error);
		}
	},

	async sendEventCancellationNotice(params: {
		to: string;
		userName: string;
		eventTitle: string;
		eventDate: string;
		cancellationReason?: string;
		refundNote?: string;
	}) {
		const resend = getResendClient();
		if (!resend) return;

		const html = `
			<div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; color: #18181b; background: #ffffff;">
				<h1 style="font-size: 20px; font-weight: 700; color: #09090b; margin: 0 0 12px 0;">Event Cancelled: ${params.eventTitle}</h1>
				<p style="font-size: 14px; color: #52525b; line-height: 1.6; margin: 0 0 20px 0;">
					Hi ${params.userName}, we regret to inform you that <strong>${params.eventTitle}</strong> scheduled for ${params.eventDate} has been cancelled.
				</p>
				${params.cancellationReason ? `<p style="font-size: 13px; color: #71717a; background: #fafafa; padding: 12px; border-radius: 6px;">Reason: ${params.cancellationReason}</p>` : ''}
				${params.refundNote ? `<p style="font-size: 13px; color: #09090b; font-weight: 600;">${params.refundNote}</p>` : ''}
			</div>
		`;

		try {
			await resend.client.emails.send({
				from: `${APP_NAME} <${fromEmail}>`,
				to: params.to,
				subject: `Event Cancelled: ${params.eventTitle}`,
				html
			});
		} catch (error) {
			console.error('[emailService] Error sending event cancellation notice:', error);
		}
	}
};
