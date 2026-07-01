'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const [status, setStatus] = useState('validating'); // validating | valid | invalid | submitting | success
  const [errorMsg, setErrorMsg] = useState('');
  const [memberName, setMemberName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    if (!token) { setStatus('invalid'); setErrorMsg('No reset token found in this link.'); return; }

    fetch(`/api/reset-password?token=${encodeURIComponent(token)}`)
      .then(r => r.json())
      .then(data => {
        if (data.valid) { setMemberName(data.name || ''); setStatus('valid'); }
        else            { setErrorMsg(data.error || 'Invalid or expired link.'); setStatus('invalid'); }
      })
      .catch(() => { setErrorMsg('Failed to validate link. Please try again.'); setStatus('invalid'); });
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) { setErrorMsg('Passwords do not match.'); return; }
    if (password.length < 8)          { setErrorMsg('Password must be at least 8 characters.'); return; }

    setErrorMsg('');
    setStatus('submitting');

    try {
      const res = await fetch('/api/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setErrorMsg(data.error || 'Failed to reset password.'); setStatus('valid'); return; }
      setStatus('success');
      setTimeout(() => router.push('/login?reset=success'), 2000);
    } catch {
      setErrorMsg('Network error. Please try again.');
      setStatus('valid');
    }
  };

  // ── States ──────────────────────────────────────────────────────────────────

  if (status === 'validating') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto animate-pulse">
          <i className="ph ph-lock text-3xl text-white/40"></i>
        </div>
        <p className="text-gray-400 text-sm uppercase tracking-widest">Validating link…</p>
      </div>
    );
  }

  if (status === 'invalid') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 border border-red-500/30 rounded-2xl bg-red-500/10 flex items-center justify-center mb-6 mx-auto">
          <i className="ph-fill ph-x-circle text-3xl text-red-400"></i>
        </div>
        <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-4">Link Invalid</h1>
        <p className="text-gray-400 text-sm leading-relaxed mb-8">{errorMsg}</p>
        <button
          onClick={() => router.push('/forgot-password')}
          className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
        >
          Request New Link
        </button>
        <button onClick={() => router.push('/login')} className="mt-4 block w-full text-center text-gray-500 text-sm hover:text-gray-300 transition-colors">
          Back to login
        </button>
      </div>
    );
  }

  if (status === 'success') {
    return (
      <div className="text-center">
        <div className="w-16 h-16 border border-green-500/30 rounded-2xl bg-green-500/10 flex items-center justify-center mb-6 mx-auto">
          <i className="ph-fill ph-check-circle text-3xl text-green-400"></i>
        </div>
        <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-4">Password Updated</h1>
        <p className="text-gray-400 text-sm">Redirecting you to login…</p>
      </div>
    );
  }

  // valid / submitting — show the form
  return (
    <>
      <div className="text-center mb-8">
        <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
          <i className="ph-fill ph-lock-key text-3xl text-white"></i>
        </div>
        <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-2">Set New Password</h1>
        {memberName && <p className="text-gray-400 text-sm">Hi {memberName} — choose a new password below.</p>}
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">New Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              required
              minLength={8}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="Min. 8 characters"
            />
            <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              <i className={`ph ph-${showPassword ? 'eye-slash' : 'eye'} text-lg`}></i>
            </button>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Confirm Password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              required
              minLength={8}
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
              placeholder="Repeat password"
            />
            <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              <i className={`ph ph-${showConfirm ? 'eye-slash' : 'eye'} text-lg`}></i>
            </button>
          </div>
        </div>

        {errorMsg && (
          <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
            <p className="text-red-400 text-sm">{errorMsg}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={status === 'submitting'}
          className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
        >
          {status === 'submitting' ? 'Saving…' : 'Update Password'}
        </button>
      </form>
    </>
  );
}

export default function ResetPasswordPage() {
  const router = useRouter();
  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="font-display text-2xl font-bold uppercase tracking-widest text-white">Club Neva</button>
        </div>
      </header>

      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
            <Suspense fallback={<p className="text-center text-gray-400 text-sm">Loading…</p>}>
              <ResetPasswordForm />
            </Suspense>
          </div>
        </div>
      </main>
    </div>
  );
}
