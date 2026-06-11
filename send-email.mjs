import { Resend } from 'resend';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const RESEND_API_KEY = process.env.RESEND_API_KEY;
if (!RESEND_API_KEY) {
	console.error('Missing RESEND_API_KEY environment variable');
	console.error('Get one at https://resend.com/api-keys');
	process.exit(1);
}

const to = process.argv[2];
if (!to) {
	console.error('Usage: node send-email.mjs <recipient-email>');
	process.exit(1);
}

const resend = new Resend(RESEND_API_KEY);
const html = readFileSync(new URL('./email-reminder-wc2026.html', import.meta.url), 'utf8');

const { data, error } = await resend.emails.send({
	from: 'Score Prediction <noreply@score-prediction.com>',
	to,
	subject: "The World Cup starts today — make your predictions!",
	html,
});

if (error) {
	console.error('Failed to send:', error);
	process.exit(1);
}

console.log(`Email sent to ${to} — id: ${data.id}`);
