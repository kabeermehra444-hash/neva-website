'use client';

// ============================================================
// CLUB NEVA - SINGLE AUTH SOURCE OF TRUTH
// All auth reads/writes must go through these functions.
// Never read localStorage keys directly in components.
// ============================================================

const KEYS = {
  loggedIn: 'neva_loggedIn',
  member: 'neva_member',
  loginRedirect: 'neva_loginRedirect',
  adminToken: 'neva_adminToken',
};

export function getStoredMember() {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(KEYS.member);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setStoredMember(memberObj) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(KEYS.loggedIn, 'true');
  // Never persist the admin token inside the member object; keep it separate.
  const { adminToken, ...clean } = memberObj || {};
  localStorage.setItem(KEYS.member, JSON.stringify(clean));
  if (adminToken) localStorage.setItem(KEYS.adminToken, adminToken);
}

export function clearStoredMember() {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(KEYS.loggedIn);
  localStorage.removeItem(KEYS.member);
  localStorage.removeItem(KEYS.adminToken);
}

export function getAdminToken() {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(KEYS.adminToken);
}

// Returns headers to spread into an admin fetch(), including the bearer token.
export function adminHeaders(extra = {}) {
  const token = getAdminToken();
  return {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...extra,
  };
}

export function isLoggedIn() {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(KEYS.loggedIn) === 'true';
}

export function isApprovedMember() {
  const member = getStoredMember();
  return isLoggedIn() && member?.approved === true;
}

// These email addresses have admin access to the control panel.
const ADMIN_EMAILS = ['kabeermehra444@gmail.com', 'eva.vacadev@gmail.com'];

export function isAdmin() {
  const member = getStoredMember();
  return isLoggedIn() && member?.approved === true && ADMIN_EMAILS.includes(member?.email);
}

export function getMemberId() {
  const member = getStoredMember();
  return member?.id || null;
}

export function getMemberNevaCash() {
  const member = getStoredMember();
  return member?.neva_cash_balance || 0;
}

// Refresh member data from DB and update localStorage
export async function refreshMemberData(id) {
  if (!id) return null;
  try {
    const res = await fetch(`/api/members/${id}`);
    if (!res.ok) return null;
    const data = await res.json();
    const current = getStoredMember() || {};
    const updated = {
      ...current,
      id: data.id,
      email: data.email,
      name: data.name,
      approved: data.approved,
      rank: data.rank,
      wins: data.wins,
      losses: data.losses,
      neva_cash_balance: data.neva_cash_balance,
    };
    setStoredMember(updated);
    return updated;
  } catch {
    return null;
  }
}

// Store/retrieve where to redirect after login
export function setLoginRedirect(url) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEYS.loginRedirect, url);
}

export function popLoginRedirect() {
  if (typeof window === 'undefined') return null;
  const url = sessionStorage.getItem(KEYS.loginRedirect);
  sessionStorage.removeItem(KEYS.loginRedirect);
  return url;
}
