import { createHmac, timingSafeEqual } from 'crypto';

// Short-lived, per-photo access tokens for the gallery serve route.
//
// Browsers cannot attach an Authorization header to <img src> or a download
// link, so the serve route authenticates via a signed ?t= query parameter
// instead. Tokens are minted server-side only, bound to a single photo id,
// and expire quickly — so a leaked URL (history, logs, referrer) grants at
// most one photo for a short window, unlike the 14/30-day session tokens.
//
// A token stays valid for its full TTL even if the photo is unpublished in
// the meantime. That window is deliberately short.

const TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes — long enough for a page session

function getSecret() {
  return process.env.ADMIN_SECRET || '';
}

function sign(payloadB64) {
  return createHmac('sha256', getSecret()).update(payloadB64).digest('base64url');
}

/**
 * Issues a signed access token scoped to a single photo id.
 * Returns null if no secret is configured.
 */
export function issuePhotoToken(photoId) {
  if (!getSecret()) {
    console.error('ADMIN_SECRET is not set — cannot issue photo tokens.');
    return null;
  }
  const payload = { pid: String(photoId), exp: Date.now() + TOKEN_TTL_MS };
  const payloadB64 = Buffer.from(JSON.stringify(payload)).toString('base64url');
  return `${payloadB64}.${sign(payloadB64)}`;
}

/**
 * Verifies a photo token against the photo id being requested.
 * Returns true only if the signature, expiry, and photo id all check out.
 */
export function verifyPhotoToken(token, photoId) {
  if (!token || typeof token !== 'string' || !getSecret()) return false;
  const parts = token.split('.');
  if (parts.length !== 2) return false;
  const [payloadB64, providedSig] = parts;

  // Constant-time signature comparison
  const expectedSig = sign(payloadB64);
  const a = Buffer.from(providedSig);
  const b = Buffer.from(expectedSig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return false;

  let payload;
  try {
    payload = JSON.parse(Buffer.from(payloadB64, 'base64url').toString());
  } catch {
    return false;
  }
  if (!payload || typeof payload.exp !== 'number' || Date.now() > payload.exp) return false;
  return payload.pid === String(photoId);
}
