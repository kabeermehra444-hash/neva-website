// Shared helper for sending emails via Resend.
//
// Vercel's serverless functions occasionally drop outbound network
// connections mid-request (a known "SocketError: other side closed" /
// UND_ERR_SOCKET issue, not specific to Resend). A second attempt almost
// always succeeds, so this wraps every send with a couple of automatic
// retries instead of silently failing the first time.

const RESEND_URL = 'https://api.resend.com/emails';
const MAX_ATTEMPTS = 3;
const RETRY_DELAY_MS = 600;

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Sends an email via Resend, retrying on transient network failures.
 * @param {{to: string|string[], subject: string, html: string, bcc?: string[], from?: string}} params
 * @returns {Promise<boolean>} true if the email was sent successfully
 */
export async function sendEmail({ to, subject, html, bcc, from = 'NEVA <onboarding@resend.dev>' }) {
  const key = process.env.RESEND_API_KEY;
  if (!key) {
    console.error('RESEND_API_KEY is not set — skipping email send.');
    return false;
  }

  const body = { from, to, subject, html };
  if (bcc) body.bcc = bcc;

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(RESEND_URL, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${key}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      if (res.ok) return true;

      // Resend responded, but rejected the request — retrying won't help
      // (e.g. bad recipient, sandbox domain restriction, invalid key).
      const errText = await res.text().catch(() => '');
      console.error(`Resend rejected email (attempt ${attempt}/${MAX_ATTEMPTS}): ${res.status} ${errText}`);
      return false;
    } catch (err) {
      console.error(`Email send attempt ${attempt}/${MAX_ATTEMPTS} failed: ${err.message}`);
      if (attempt < MAX_ATTEMPTS) await sleep(RETRY_DELAY_MS * attempt);
    }
  }

  console.error(`Failed to send email "${subject}" after ${MAX_ATTEMPTS} attempts.`);
  return false;
}
