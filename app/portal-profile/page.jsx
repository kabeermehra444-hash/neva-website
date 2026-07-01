'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, getStoredMember, refreshMemberData, setLoginRedirect, clearStoredMember } from '@/lib/auth';

export default function PortalProfilePage() {
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-profile');
      router.replace('/login');
      return;
    }
    loadProfile();
  }, [router]);

  const loadProfile = async () => {
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

  const wins = member?.wins || 0;
  const losses = member?.losses || 0;
  const total = wins + losses;
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%';

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PortalNav />
      <main className="pt-20 pb-12">
        <div className="max-w-4xl mx-auto px-6">
          <section className="py-8 border-b border-white/10 mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-2">My Profile</h1>
            <p className="text-white">Your NEVA member account.</p>
          </section>

          {/* Profile Card */}
          <section className="mb-12">
            <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-10">
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="w-28 h-28 bg-white/10 border-2 border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <i className="ph-fill ph-user text-5xl text-white/50"></i>
                </div>
                <div className="flex-1">
                  <h2 className="font-display text-3xl font-bold uppercase tracking-tight mb-1">
                    {member?.first_name} {member?.last_name}
                  </h2>
                  <p className="text-white text-sm mb-2">{member?.email}</p>
                  {member?.rank_label && (
                    <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded text-xs font-bold uppercase tracking-widest mb-6">
                      {member.rank_label}
                    </span>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 pt-6 border-t border-white/10">
                    <div>
                      <p className="text-white text-xs uppercase tracking-widest font-medium mb-1">Wins</p>
                      <p className="font-display text-2xl font-bold text-green-400">{wins}</p>
                    </div>
                    <div>
                      <p className="text-white text-xs uppercase tracking-widest font-medium mb-1">Losses</p>
                      <p className="font-display text-2xl font-bold text-white">{losses}</p>
                    </div>
                    <div>
                      <p className="text-white text-xs uppercase tracking-widest font-medium mb-1">Win %</p>
                      <p className="font-display text-2xl font-bold">{winPct}</p>
                    </div>
                    <div>
                      <p className="text-white text-xs uppercase tracking-widest font-medium mb-1">Events</p>
                      <p className="font-display text-2xl font-bold">{member?.events_played || 0}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Account Details */}
          <section className="mb-12">
            <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">Account Information</h2>
            <div className="space-y-4">
              {[
                { label: 'Email Address', value: member?.email, note: 'Primary email for account communications' },
                { label: 'Phone Number', value: member?.phone || 'Not provided', note: 'Used for event communications' },
                { label: 'Member Since', value: member?.created_at ? new Date(member.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'America/Los_Angeles' }) : '—', note: 'Account creation date' },
                { label: 'NEVA Cash Balance', value: `$${member?.neva_cash_balance || 0}`, note: 'Earned through wins, redeemable at checkout' },
              ].map(item => (
                <div key={item.label} className="bg-white/5 border border-white/10 rounded-lg p-6">
                  <p className="text-white text-xs uppercase tracking-widest font-medium mb-2">{item.label}</p>
                  <p className="font-medium text-lg mb-1">{item.value}</p>
                  <p className="text-white text-sm">{item.note}</p>
                </div>
              ))}
            </div>
          </section>

          {/* Membership */}
          <section className="mb-12">
            <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">Membership</h2>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-white text-xs uppercase tracking-widest font-medium mb-3">Status</p>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                  <p className="font-bold text-green-400">Active Member</p>
                </div>
              </div>
              <div className="bg-white/5 border border-white/10 rounded-lg p-6">
                <p className="text-white text-xs uppercase tracking-widest font-medium mb-3">Current Streak</p>
                <p className="font-display text-2xl font-bold">{member?.streak || 0} <span className="text-white text-base font-normal">wins</span></p>
              </div>
            </div>
          </section>

          <div className="flex gap-4">
            <button onClick={() => router.push('/portal-dashboard')} className="px-6 py-3 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
              Back to Dashboard
            </button>
            <button onClick={() => router.push('/portal-neva-cash')} className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-white/20 transition-colors">
              NEVA Cash
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
