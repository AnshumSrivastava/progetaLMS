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
	}
};
