'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, getStoredMember, refreshMemberData, setLoginRedirect } from '@/lib/auth';

export default function PortalNevaCashPage() {
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-neva-cash');
      router.replace('/login');
      return;
    }
    loadData();
  }, [router]);

  const loadData = async () => {
    const id = getMemberId();
    let data = getStoredMember();
    if (id) {
      const fresh = await refreshMemberData(id);
      if (fresh) data = fresh;
    }
    setMember(data);
    setLoading(false);
  };

  if (loading) return (
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-white text-sm uppercase tracking-widest">Loading...</p>
    </div>
  );

  const balance = member?.neva_cash_balance || 0;

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PortalNav />
      <main className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <section className="py-8 border-b border-white/10 mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-2">NEVA Cash</h1>
            <p className="text-white">Earn through wins. Redeem at checkout for gear.</p>
          </section>

          {/* Balance Card */}
          <div className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/30 rounded-2xl p-10 mb-10 text-center">
            <div className="w-16 h-16 bg-amber-500/20 border border-amber-500/30 rounded-2xl flex items-center justify-center mb-6 mx-auto">
              <i className="ph-fill ph-coin text-3xl text-amber-400"></i>
            </div>
            <p className="text-amber-400 text-sm uppercase tracking-widest font-bold mb-2">Current Balance</p>
            <p className="font-display text-7xl font-bold mb-2">${parseFloat(balance).toFixed(2)}</p>
            <p className="text-white text-sm">Available to spend at checkout</p>
          </div>

          {/* How it Works */}
          <div className="mb-10">
            <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">How NEVA Cash Works</h2>
            <div className="grid md:grid-cols-3 gap-4">
              {[
                { icon: 'ph-trophy', title: 'Earn', desc: 'NEVA Cash is awarded by admins based on your wins, podium finishes, and event performance.' },
                { icon: 'ph-coin', title: 'Accumulate', desc: 'Your balance grows over time. Check here or your dashboard to see your current total.' },
                { icon: 'ph-shopping-cart', title: 'Redeem', desc: 'Apply your NEVA Cash balance at checkout when purchasing gear from The Shop.' },
              ].map(item => (
                <div key={item.title} className="bg-white/5 border border-white/10 rounded-xl p-6 text-center">
                  <i className={`ph-fill ${item.icon} text-3xl text-amber-400 mb-4`}></i>
                  <h3 className="font-bold uppercase tracking-widest text-sm mb-2">{item.title}</h3>
                  <p className="text-white text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <div className="flex gap-4 flex-wrap">
            <button onClick={() => router.push('/shop')} className="px-8 py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
              Shop Now →
            </button>
            <button onClick={() => router.push('/portal-dashboard')} className="px-8 py-4 bg-white/10 border border-white/20 text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-white/20 transition-colors">
              Back to Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
