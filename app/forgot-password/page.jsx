'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Something went wrong. Please try again.');
        return;
      }
      setSubmitted(true);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <header className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
        <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
          <button onClick={() => router.push('/')} className="font-display text-2xl font-bold uppercase tracking-widest text-white">Club Neva</button>
          <button onClick={() => router.push('/login')} className="px-5 py-2.5 bg-white text-black uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-200 transition-all">Login</button>
        </div>
      </header>

      <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-8 md:p-10">

            {submitted ? (
              <div className="text-center">
                <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                  <i className="ph-fill ph-envelope text-3xl text-white"></i>
                </div>
                <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-4">Check Your Email</h1>
                <p className="text-gray-400 text-sm leading-relaxed mb-8">
                  If an account exists for <span className="text-white font-medium">{email}</span>, a password reset link has been sent. Check your inbox — the link expires in 1 hour.
                </p>
                <button
                  onClick={() => router.push('/login')}
                  className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all"
                >
                  Back to Login
                </button>
              </div>
            ) : (
              <>
                <div className="text-center mb-8">
                  <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 mx-auto">
                    <i className="ph-fill ph-key text-3xl text-white"></i>
                  </div>
                  <h1 className="font-display text-3xl font-medium uppercase tracking-tight mb-2">Forgot Password</h1>
                  <p className="text-gray-400 text-sm">Enter your email and we'll send a reset link.</p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Email Address</label>
                    <input
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                      placeholder="member@email.com"
                    />
                  </div>

                  {error && (
                    <div className="px-4 py-3 bg-red-500/10 border border-red-500/20 rounded-lg">
                      <p className="text-red-400 text-sm">{error}</p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {loading ? 'Sending...' : 'Send Reset Link'}
                  </button>
                </form>

                <div className="mt-6 text-center">
                  <button onClick={() => router.push('/login')} className="text-gray-500 text-sm hover:text-gray-300 transition-colors">
                    ← Back to login
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
