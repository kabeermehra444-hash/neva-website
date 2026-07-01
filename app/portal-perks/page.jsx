'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, setLoginRedirect } from '@/lib/auth';

export default function PortalPerksPage() {
  const router = useRouter();
  const [sponsors, setSponsors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasAttended, setHasAttended] = useState(false);
  const [revealed, setRevealed] = useState({});

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-perks');
      router.replace('/login');
      return;
    }

    const memberId = getMemberId();

    Promise.all([
      fetch('/api/sponsors').then(r => r.json()).catch(() => []),
      memberId
        ? fetch(`/api/event-checkins?member_id=${memberId}`).then(r => r.json()).catch(() => [])
        : Promise.resolve([]),
    ]).then(([sponsorsData, checkinsData]) => {
      setSponsors(Array.isArray(sponsorsData) ? sponsorsData.filter(s => s.active) : []);
      setHasAttended(Array.isArray(checkinsData) && checkinsData.some(c => c.checked_in));
    }).finally(() => setLoading(false));
  }, []);

  const handleClaim = (sponsor) => {
    if (!hasAttended) return;
    setRevealed(r => ({ ...r, [sponsor.id]: true }));
  };

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PortalNav />
      <main className="pt-20 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">

          {/* Header */}
          <div className="mb-12">
            <p className="text-amber-400 text-xs uppercase tracking-widest font-bold mb-3">Member Benefits</p>
            <h1 className="font-display text-5xl md:text-6xl font-medium uppercase tracking-tight mb-4">NEVA Perks</h1>
            <p className="text-white max-w-xl leading-relaxed">
              Exclusive discounts and offers from NEVA partners. Attend an event to unlock your perks.
            </p>
          </div>

          {!hasAttended && !loading && (
            <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl px-6 py-4 mb-10 flex items-center gap-3">
              <i className="ph ph-info text-amber-400 text-xl flex-shrink-0"></i>
              <p className="text-amber-300 text-sm">Attend a Club NEVA event to unlock all perks below.</p>
            </div>
          )}

          {loading ? (
            <div className="text-center py-20 text-white">
              <i className="ph ph-circle-notch animate-spin text-3xl mb-4"></i>
              <p>Loading perks...</p>
            </div>
          ) : sponsors.length === 0 ? (
            <div className="text-center py-20 text-white">
              <i className="ph ph-star text-4xl mb-4"></i>
              <p>No perks available yet. Check back soon.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {sponsors.map(sponsor => (
                <div key={sponsor.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden hover:border-white/20 transition-colors">
                  <div className="h-36 bg-white/3 border-b border-white/10 flex items-center justify-center px-6">
                    {sponsor.logo_url ? (
                      <img src={sponsor.logo_url} alt={sponsor.name} className="max-h-20 max-w-full object-contain" />
                    ) : (
                      <div className="w-16 h-16 bg-white/10 rounded-xl flex items-center justify-center">
                        <i className="ph ph-storefront text-3xl text-gray-500"></i>
                      </div>
                    )}
                  </div>

                  <div className="p-6">
                    <h3 className="font-bold text-lg mb-2">{sponsor.name}</h3>
                    {sponsor.description && <p className="text-white text-sm leading-relaxed mb-5">{sponsor.description}</p>}

                    {revealed[sponsor.id] ? (
                      <div className="bg-green-500/10 border border-green-500/20 rounded-lg px-4 py-3">
                        <p className="text-green-400 text-xs font-bold uppercase tracking-widest mb-1">Your Code</p>
                        <p className="font-mono font-bold text-lg text-white tracking-widest">{sponsor.discount_code || 'NEVA2026'}</p>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleClaim(sponsor)}
                        disabled={!hasAttended}
                        className="w-full py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        {hasAttended ? 'Claim Perk' : 'Attend an Event to Unlock'}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
