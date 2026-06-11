import { createTransport } from 'nodemailer';
import { readFileSync } from 'fs';
import { config } from 'dotenv';

config();

const BREVO_SMTP_LOGIN = process.env.BREVO_SMTP_LOGIN;
const BREVO_SMTP_KEY = process.env.BREVO_SMTP_KEY;
if (!BREVO_SMTP_LOGIN || !BREVO_SMTP_KEY) {
	console.error('Missing BREVO_SMTP_LOGIN or BREVO_SMTP_KEY in .env');
	process.exit(1);
}

const recipients = process.argv.slice(2);
if (recipients.length === 0) {
	console.error('Usage: node send-email.mjs <email1> [email2] [email3] ...');
	process.exit(1);
}

const transporter = createTransport({
	host: 'smtp-relay.brevo.com',
	port: 587,
	auth: { user: BREVO_SMTP_LOGIN, pass: BREVO_SMTP_KEY },
});

const html = readFileSync(new URL('./email-reminder-wc2026.html', import.meta.url), 'utf8');
const subject = "The World Cup starts today — make your predictions!";

let sent = 0;
let failed = 0;

for (const to of recipients) {
	try {
		await transporter.sendMail({
			from: 'Score Prediction <noreply@score-prediction.com>',
			to,
			subject,
			html,
		});
		sent++;
		console.log(`  ✓ ${to} (${sent}/${recipients.length})`);
	} catch (err) {
		failed++;
		console.error(`  ✗ ${to}: ${err.message}`);
	}
}

console.log(`\nDone: ${sent} sent, ${failed} failed out of ${recipients.length}`);
