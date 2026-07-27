import { createHmac, timingSafeEqual } from 'crypto';

// Server-side member authorization.
//
// Mirrors the admin-auth.js pattern for regular members. On login the server
// issues a signed token (HMAC-SHA256) encoding { type, id, email, exp }.
// Every member-only API route calls requireMember(request) before serving
// protected content.
//
// Known tradeoff: tokens are not re-validated against the DB on each request.
// A revoked member retains access until their token expires (14 days). This is
// a deliberate, accepted design choice matching the admin token behavior.

const TOKEN_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

function getSecret() {
  return process.env.ADMIN_SECRET || '';
}

function sign(payloadB64) {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

/**
 * Issues a signed member token for the given member id and email.
 * Returns null if no secret is configured.
 */
export function issueMemberToken(memberId, email) {
  if (!getSecret()) {
    console.error('ADMIN_SECRET is not set — cannot issue member tokens.');
    return null;
  }
  const payload = {
    type: 'member',
    id: memberId,
    email: (email || '').toLowerCase().trim(),
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verifies a member token string. Returns { id, email } if valid,
 * or null otherwise. Checks signature, expiry, and type field.
 */
export function verifyMemberToken(token) {
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
  if (!payload || payload.type !== 'member') return null;
  if (typeof payload.exp !== 'number' || Date.now() > payload.exp) return null;
  if (!payload.id || !payload.email) return null;
  return { id: payload.id, email: payload.email };
}

/**
 * Guard for member-only API routes. Reads the token from the
 * Authorization: Bearer <token> header. Returns { id, email } if authorized,
 * or a NextResponse-compatible error to return directly if not.
 *
 * Usage:
 *   const auth = requireMember(request);
 *   if (auth.error) return auth.error;
 */
export function requireMember(request) {
  const header = request.headers.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : '';
  const member = verifyMemberToken(token);
  if (!member) {
    return {
      error: new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      ),
    };
  }
  return member;
}
