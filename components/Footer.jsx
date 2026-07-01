'use client';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export default function Footer() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null); // 'success' | 'duplicate' | 'error'
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    if (!email.trim() || submitting) return;
    setSubmitting(true);
    setStatus(null);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() }),
      });
      if (res.status === 201) {
        setStatus('success');
        setEmail('');
      } else if (res.status === 409) {
        setStatus('duplicate');
      } else {
        setStatus('error');
      }
    } catch {
      setStatus('error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <footer className="bg-black text-white pt-20 pb-10 border-t border-white/10">
      <div className="max-w-[1600px] mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16 border-b border-white/10 pb-16">
          <div>
            <button onClick={() => router.push('/')} className="font-display text-3xl font-bold uppercase tracking-widest text-white mb-5 block">NEVA</button>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">Apparel. Events. Community.</p>
            <div className="flex gap-3">
              <a href="https://instagram.com/club.neva" target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"><i className="ph ph-instagram-logo"></i></a>
              <a href="#" className="w-9 h-9 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white hover:text-black transition-colors"><i className="ph ph-twitter-logo"></i></a>
            </div>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Explore</h4>
            <ul className="space-y-3 text-sm font-medium">
              {[['Shop','/shop'],['Events','/events'],['News','/news-updates'],['About','/about']].map(([l,h])=>(
                <li key={l}><button onClick={()=>router.push(h)} className="text-gray-300 hover:text-white transition-colors uppercase">{l}</button></li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Portal</h4>
            <ul className="space-y-3 text-sm font-medium">
              <li><button onClick={()=>router.push('/membership-apply')} className="text-gray-300 hover:text-white transition-colors uppercase">Join the Club</button></li>
              <li><button onClick={()=>router.push('/login')} className="text-gray-300 hover:text-white transition-colors uppercase">Member Login</button></li>
              <li><button onClick={()=>router.push('/portal-dashboard')} className="text-gray-300 hover:text-white transition-colors uppercase">Member Portal</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Stay Updated</h4>
            <p className="text-sm text-gray-400 mb-4">Drop alerts and event announcements.</p>
            {status === 'success' ? (
              <p className="text-amber-400 text-sm font-bold">You're in! ✓</p>
            ) : (
              <form onSubmit={handleSubscribe}>
                <div className="flex">
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="Email"
                    required
                    className="bg-white/5 border border-white/10 text-white px-4 py-2.5 w-full rounded-l text-sm focus:outline-none focus:border-white/30 placeholder-gray-600"
                  />
                  <button
                    type="submit"
                    disabled={submitting}
                    className="bg-white text-black px-4 py-2.5 rounded-r font-bold uppercase text-xs tracking-widest hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-60"
                  >
                    {submitting ? '…' : 'Join'}
                  </button>
                </div>
                {status === 'duplicate' && <p className="text-amber-400/80 text-xs mt-2">Already subscribed.</p>}
                {status === 'error' && <p className="text-red-400/80 text-xs mt-2">Something went wrong. Try again.</p>}
              </form>
            )}
          </div>
        </div>
        <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-medium uppercase tracking-widest gap-4">
          <p>&copy; 2025 NEVA. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Returns</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
