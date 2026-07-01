'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, getStoredMember, refreshMemberData, setLoginRedirect } from '@/lib/auth';

export default function PortalStatsHistoryPage() {
  const router = useRouter();
  const [member, setMember] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-stats-history');
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
      <p className="text-white text-sm uppercase tracking-widest">Loading Stats...</p>
    </div>
  );

  const wins = member?.wins || 0;
  const losses = member?.losses || 0;
  const total = wins + losses;
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) : '0';

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PortalNav />
      <main className="pt-20 pb-12">
        <div className="max-w-[1600px] mx-auto px-6">
          <section className="py-8 border-b border-white/10 mb-12">
            <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-2">Stats & History</h1>
            <p className="text-white">Your full competitive record at NEVA.</p>
          </section>

          {/* Core Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { label: 'Total Wins', value: wins, color: 'text-green-400', icon: 'ph-trophy' },
              { label: 'Total Losses', value: losses, color: 'text-white', icon: 'ph-x-circle' },
              { label: 'Win Rate', value: winPct + '%', color: 'text-blue-400', icon: 'ph-percent' },
              { label: 'Events Played', value: member?.events_played || 0, color: 'text-white', icon: 'ph-calendar-check' },
            ].map(stat => (
              <div key={stat.label} className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-white text-xs uppercase tracking-widest font-medium">{stat.label}</p>
                  <i className={`ph-fill ${stat.icon} text-xl ${stat.color}`}></i>
                </div>
                <p className={`font-display text-4xl font-bold ${stat.color}`}>{stat.value}</p>
              </div>
            ))}
          </div>

          {/* Streak + Rank */}
          <div className="grid md:grid-cols-2 gap-6 mb-12">
            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h3 className="font-display text-xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">Current Form</h3>
              <div className="flex items-end gap-4">
                <div>
                  <p className="text-white text-xs uppercase tracking-widest mb-1">Active Streak</p>
                  <p className={`font-display text-5xl font-bold ${(member?.streak || 0) > 0 ? 'text-green-400' : 'text-white'}`}>
                    {member?.streak || 0}
                  </p>
                  <p className="text-white text-sm mt-1">consecutive wins</p>
                </div>
                <div className="flex-1 border-l border-white/10 pl-8">
                  <p className="text-white text-xs uppercase tracking-widest mb-1">Rank</p>
                  <p className="font-display text-5xl font-bold">{member?.rank_label || '—'}</p>
                </div>
              </div>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-8">
              <h3 className="font-display text-xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">Win / Loss Breakdown</h3>
              <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-green-400 font-bold">{wins} Wins</span>
                  <span className="text-white">{losses} Losses</span>
                </div>
                <div className="h-3 bg-white/10 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700"
                    style={{ width: total > 0 ? `${(wins / total) * 100}%` : '0%' }}
                  ></div>
                </div>
                <p className="text-center text-white font-bold mt-3">{winPct}% Win Rate</p>
              </div>
              <p className="text-white text-sm text-center">{total} total games played</p>
            </div>
          </div>

          {/* Match History placeholder */}
          <div className="mb-12">
            <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-6 border-b border-white/10 pb-4">Match History</h2>
            <div className="bg-white/5 border border-white/10 rounded-xl p-12 text-center">
              <i className="ph ph-clock-clockwise text-4xl text-gray-600 mb-4"></i>
              <p className="text-white">Detailed match history will be populated as events are recorded.</p>
              <p className="text-white text-sm mt-2">Your stats above reflect admin-recorded results.</p>
            </div>
          </div>

          <div className="flex gap-4 flex-wrap">
            <button onClick={() => router.push('/portal-leaderboard')} className="px-6 py-3 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
              View Leaderboard
            </button>
            <button onClick={() => router.push('/portal-dashboard')} className="px-6 py-3 bg-white/10 border border-white/20 text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-white/20 transition-colors">
              Dashboard
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
