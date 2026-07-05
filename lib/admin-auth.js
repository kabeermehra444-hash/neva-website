import { createHmac, timingSafeEqual } from 'crypto';

// Server-side admin authorization.
//
// When an admin logs in, the server issues a signed token (HMAC-SHA256)
// that encodes their email + an expiry. The signature uses ADMIN_SECRET,
// known only to the server, so the browser cannot forge or tamper with it.
// Every admin-only API route calls requireAdmin(request) before doing
// anything sensitive.
//
// This deliberately does NOT trust anything the browser claims about being
// an admin — the only thing that grants access is a valid signature.

const ADMIN_EMAILS = ['kabeermehra444@gmail.com', 'eva.vacadev@gmail.com'];
const TOKEN_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

function getSecret() {
  return process.env.ADMIN_SECRET || '';
}

function sign(payloadB64) {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

/**
 * Issues a signed admin token for the given email.
 * Returns null if the email isn't an admin or no secret is configured.
 */
export function issueAdminToken(email) {
  const normalized = (email || '').toLowerCase().trim();
  if (!ADMIN_EMAILS.includes(normalized)) return null;
  if (!getSecret()) {
    console.error('ADMIN_SECRET is not set — cannot issue admin tokens.');
    return null;
  }
  const payload = { email: normalized, exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verifies an admin token string. Returns the admin's email if valid,
 * or null otherwise.
 */
export function verifyAdminToken(token) {
  if (!token || typeof token !== 'string' || !getSecret()) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadB64, providedSig] = parts;

  // Constant-time signature comparison
  const expectedSig = sign(payloadB64);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return null;
  }
  if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  if (!ADMIN_EMAILS.includes(payload.email)) return null;
  return payload.email;
}

/**
 * Guard for admin-only API routes. Reads the token from the
 * Authorization: Bearer <token> header. Returns { email } if authorized,
 * or a NextResponse error to return directly if not.
 *
 * Usage:
 *   const auth = requireAdmin(request);
 *   if (auth.error) return auth.error;
 */
export function requireAdmin(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const email = verifyAdminToken(token);
  if (!email) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return { email };
}
