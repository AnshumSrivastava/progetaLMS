import { eventBus } from './event-bus';
import { Resend } from 'resend';
import { RESEND_API_KEY, RESEND_FROM_ADDRESS } from '$env/static/private';
import { APP_NAME } from '$shared/constants';
import { db } from '../db/client';
import { users } from '../db/schema/identity.schema';
import { inArray } from 'drizzle-orm';

const resend = new Resend(RESEND_API_KEY);

const resourceTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Welcome to ${payload.className}</h2>
	<p>Hi ${payload.studentName},</p>
	<p>Here are the resources for your class:</p>
	<a href="${payload.courseUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		Access Course Material
	</a>
	<p>You can view these HTML pages and save them as PDFs from your browser.</p>
</div>
`;

const examTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Your Certification Exam is Ready!</h2>
	<p>Hi ${payload.studentName},</p>
	<p>You have been selected to take the certification exam for ${payload.className}.</p>
	<p>We've included a coupon code that grants you 100% off the exam fee:</p>
	<div style="background:#f5f5f5;padding:16px;font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center">
		${payload.couponCode}
	</div>
	<br>
	<a href="${payload.examUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		Start Exam
	</a>
</div>
`;

const certTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Congratulations, ${payload.studentName}!</h2>
	<p>You have successfully passed your assessment.</p>
	<p>Your verified digital certificate is now available.</p>
	<a href="${payload.certUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		View Certificate
	</a>
</div>
`;

const joinTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Welcome to ${payload.className}!</h2>
	<p>Hi ${payload.studentName},</p>
	<p>You've been invited to join our upcoming class.</p>
	<a href="${payload.joinUrl}" style="display:inline-block;padding:10px 20px;background:#10b981;color:white;text-decoration:none;border-radius:4px">
		Accept Invitation
	</a>
</div>
`;

const welcomeTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Welcome to ${APP_NAME}!</h2>
	<p>Hi ${payload.studentName},</p>
	<p>We are excited to have you on board. Start exploring courses and certifications today.</p>
	<a href="${payload.loginUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		Log In
	</a>
</div>
`;

const enrollmentTemplate = (payload: any) => `
<div style="font-family:system-ui,sans-serif;padding:32px">
	<h2>Enrollment Confirmed</h2>
	<p>Hi ${payload.studentName},</p>
	<p>You have successfully enrolled in <strong>${payload.courseName}</strong>.</p>
	<a href="${payload.courseUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		Start Learning
	</a>
</div>
`;

export function registerEventHandlers() {
	eventBus.clear();
	
	eventBus.on('RESOURCE_MAIL_SENT', async (payload: any, meta) => {
		const html = resourceTemplate(payload);
		
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Resource Mail to:', payload.studentEmail);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `Resources for ${payload.className}`,
			html
		});
	});

	eventBus.on('EXAM_INVITE_SENT', async (payload: any, meta) => {
		const html = examTemplate(payload);
		
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Exam Mail to:', payload.studentEmail);
			console.log('[LOCAL RESEND] Coupon:', payload.couponCode);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `Exam Invitation: ${payload.className}`,
			html
		});
	});

	eventBus.on('CERTIFICATE_ISSUED', async (payload: any, meta) => {
		let html = '';
		if (payload.customTemplate) {
			const safeCustomTemplate = payload.customTemplate.replace(/\n/g, '<br>');
			html = `
<div style="font-family:system-ui,sans-serif;padding:32px">
	${safeCustomTemplate}
	<br><br>
	<a href="${payload.certUrl}" style="display:inline-block;padding:10px 20px;background:#2563eb;color:white;text-decoration:none;border-radius:4px">
		View Certificate
	</a>
</div>
`;
		} else {
			html = certTemplate(payload);
		}
		
		const certIdMatch = payload.certUrl.match(/certificates\/([a-z0-9]+)/i);
		const certId = certIdMatch ? certIdMatch[1].toUpperCase() : 'UNKNOWN';
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Certificate Mail to:', payload.studentEmail);
			console.log('[LOCAL RESEND] URL:', payload.certUrl);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `Your Certificate is Ready!`,
			html
		});
	});

	eventBus.on('JOIN_INVITE_SENT', async (payload: any, meta) => {
		const html = joinTemplate(payload);
		
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Join Invite Mail to:', payload.studentEmail);
			console.log('[LOCAL RESEND] URL:', payload.joinUrl);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `Invitation to join ${payload.className}`,
			html
		});
	});

	eventBus.on('EMAIL_BLAST', async (payload: any, meta) => {
		// Fetch emails for userIds
		const targetUsers = await db.select({ email: users.email }).from(users).where(inArray(users.id, payload.userIds));
		const emails = targetUsers.map(u => u.email).filter(Boolean);

		if (emails.length === 0) return;

		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log(`[LOCAL RESEND] Email Blast to ${emails.length} users`);
			console.log('[LOCAL RESEND] Subject:', payload.subject);
			return;
		}

		// Resend allows batch sending to max 50 recipients per API call (or we can use BCC for a single call if it's less than 50)
		// For simplicity, we'll send individually or BCC if small. We'll use BCC for now.
		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			bcc: emails,
			subject: payload.subject,
			html: `<div style="font-family:system-ui,sans-serif;padding:32px">${payload.body.replace(/\\n/g, '<br>')}</div>`
		});
	});

	eventBus.on('USER_CREATED', async (payload: any, meta) => {
		const html = welcomeTemplate(payload);
		
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Welcome Mail to:', payload.studentEmail);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `Welcome to ${APP_NAME}!`,
			html
		});
	});

	eventBus.on('COURSE_ENROLLED', async (payload: any, meta) => {
		const html = enrollmentTemplate(payload);
		
		if (!RESEND_API_KEY || RESEND_API_KEY.startsWith('re_123456')) {
			console.log('[LOCAL RESEND] Enrollment Mail to:', payload.studentEmail);
			return;
		}

		await resend.emails.send({
			from: RESEND_FROM_ADDRESS,
			to: payload.studentEmail,
			subject: `You are enrolled in ${payload.courseName}`,
			html
		});
	});
}
