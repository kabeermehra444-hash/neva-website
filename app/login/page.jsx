'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { setStoredMember, popLoginRedirect, isApprovedMember } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resetSuccess, setResetSuccess] = useState(false);

  useEffect(() => {
    if (isApprovedMember()) { router.replace('/portal-dashboard'); return; }
    const params = new URLSearchParams(window.location.search);
    if (params.get('reset') === 'success') setResetSuccess(true);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });
      const data = await res.json();
      if (res.status === 403) { setError('Your application is pending review.'); setLoading(false); return; }
      if (!res.ok) { setError(data.error || 'Login failed. Please try again.'); setLoading(false); return; }
      setStoredMember({ id: data.id, email: data.email, name: data.name || email.split('@')[0], approved: true, wins: data.wins || 0, losses: data.losses || 0, rank: data.rank || null, neva_cash_balance: data.neva_cash_balance || 0 });
      const redirect = popLoginRedirect();
      router.push(redirect || '/portal-dashboard');
    } catch (err) { setError('Login failed. Please try again.'); setLoading(false); }
  };

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="font-display text-2xl font-bold uppercase tracking-widest text-white">Club Neva</button>
          <button onClick={() => router.push('/membership-apply')} className="px-5 py-2.5 bg-white text-black uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-200 transition-all">Apply</button>
        </div>
      </header>
      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">
            <div className="text-center mb-8">
              <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                <i className="ph-fill ph-user text-3xl text-white"></i>
              </div>
              <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-2">Member Login</h1>
              <p className="text-gray-400 text-sm">Access your NEVA account</p>
            </div>
            {resetSuccess && (
              <div className="px-4 py-3 bg-green-500/10 border border-green-500/20 rounded-lg mb-6">
                <p className="text-green-400 text-sm text-center">Password updated. You can now log in.</p>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Email Address</label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors" placeholder="member@email.com" />
              </div>
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-sm font-medium text-gray-300 uppercase tracking-wide">Password</label>
                  <button type="button" onClick={() => router.push('/forgot-password')} className="text-xs text-gray-500 hover:text-gray-300 transition-colors">
                    Forgot password?
                  </button>
                </div>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required value={password} onChange={e => setPassword(e.target.value)} className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors" placeholder="Enter your password" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <i className={`ph ph-${showPassword ? 'eye-slash' : 'eye'} text-lg`}></i>
                  </button>
                </div>
              </div>
              {error && <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg"><p className="text-red-400 text-sm">{error}</p></div>}
              <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50">
                {loading ? 'Signing In...' : 'Sign In'}
              </button>
            </form>
            <div className="mt-8 pt-6 border-t border-white/10 text-center">
              <p className="text-gray-400 text-sm mb-3">Not a member yet?</p>
              <button onClick={() => router.push('/membership-apply')} className="text-white font-bold uppercase text-sm tracking-widest hover:text-gray-300 transition-colors">Join the Club →</button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
