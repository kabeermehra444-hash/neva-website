// Shared helper for sending emails, via Gmail SMTP.
//
// Uses your Gmail account (kabeermehra444@gmail.com) to send, authenticated
// with a Google "App Password" (not your real Gmail password) stored in the
// GMAIL_APP_PASSWORD environment variable. Unlike Resend's free sandbox
// domain, this can send to any recipient immediately — no domain
// verification required.
//
// To switch providers later (e.g. back to Resend once a domain is set up),
// only this file needs to change — everything that calls sendEmail() stays
// the same.

import nodemailer from 'nodemailer';

const GMAIL_USER = 'kabeermehra444@gmail.com';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 600;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

let transporter = null;
function getTransporter() {
  if (transporter) return transporter;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!pass) return null;
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: GMAIL_USER, pass },
  });
  return transporter;
}

/**
 * Sends an email via Gmail, retrying on transient network failures.
 * @param {{to: string|string[], subject: string, html: string, bcc?: string[]}} params
 * @returns {Promise<boolean>} true if the email was sent successfully
 */
export async function sendEmail({ to, subject, html, bcc }) {
  const t = getTransporter();
  if (!t) {
    console.error('GMAIL_APP_PASSWORD is not set — skipping email send.');
    return false;
  }

  const mail = {
    from: `NEVA <${GMAIL_USER}>`,
    to,
    subject,
    html,
  };
  if (bcc) mail.bcc = bcc;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      await t.sendMail(mail);
      return true;
    } catch (err) {
      console.error(`Email send attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  console.error(`Failed to send email "${subject}" after ${MAX_ATTEMPTS} attempts.`);
  return false;
}
