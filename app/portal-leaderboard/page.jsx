'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, setLoginRedirect, getMemberId } from '@/lib/auth';

export default function PortalLeaderboardPage() {
  const router = useRouter();
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState('alltime');
  const [currentMemberId, setCurrentMemberId] = useState(null);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-leaderboard');
      router.replace('/login');
      return;
    }
    setCurrentMemberId(getMemberId());
    fetchLeaderboard();
  }, [router]);

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('/api/members?status=approved');
      if (!res.ok) throw new Error('Failed');
      const data = await res.json();
      const active = Array.isArray(data) ? data.filter(m => m.status === 'approved' || m.status === 'active') : [];
      // Sort by wins desc
      const sorted = active.sort((a, b) => (b.wins || 0) - (a.wins || 0));
      setMembers(sorted);
    } catch {
      // Also try without filter if the above fails
      try {
        const res = await fetch('/api/members');
        const data = await res.json();
        const sorted = (Array.isArray(data) ? data : []).sort((a, b) => (b.wins || 0) - (a.wins || 0));
        setMembers(sorted);
      } catch {}
    } finally {
      setLoading(false);
    }
  };

  const winPct = (wins, losses) => {
    const total = (wins || 0) + (losses || 0);
    if (total === 0) return '0%';
    return ((wins / total) * 100).toFixed(1) + '%';
  };

  const getRankDisplay = (idx) => {
    if (idx === 0) return { label: '1st', icon: '🥇' };
    if (idx === 1) return { label: '2nd', icon: '🥈' };
    if (idx === 2) return { label: '3rd', icon: '🥉' };
    return { label: `#${idx + 1}`, icon: null };
  };

  if (loading) {
    return (
      <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center">
        <p className="text-white text-sm uppercase tracking-widest">Loading Leaderboard...</p>
      </div>
    );
  }

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PortalNav />

      <main className="pt-20 pb-12">
        <div className="max-w-[1600px] mx-auto px-6">
          <section className="py-8 border-b border-white/10 mb-8">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-2">Member Leaderboard</h1>
                <p className="text-white">Ranked by total wins. Members only.</p>
              </div>
              <div className="flex gap-2 flex-wrap">
                {['alltime', 'season', 'monthly', 'weekly'].map(tf => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-2 text-xs font-bold uppercase tracking-wider rounded transition-colors ${timeframe === tf ? 'bg-white text-black' : 'bg-white/10 text-white hover:bg-white/20'}`}
                  >
                    {tf === 'alltime' ? 'All Time' : tf.charAt(0).toUpperCase() + tf.slice(1)}
                  </button>
                ))}
              </div>
            </div>
          </section>

          {members.length === 0 ? (
            <div className="text-center py-24">
              <p className="text-white">No member data available yet.</p>
            </div>
          ) : (
            <>
              {/* Top 3 Podium */}
              {members.length >= 3 && (
                <div className="grid grid-cols-3 gap-4 mb-12 max-w-2xl mx-auto">
                  {/* 2nd */}
                  <div className="text-center pt-8">
                    <div className="w-16 h-16 bg-gray-400/20 border border-gray-400/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-2xl">🥈</span>
                    </div>
                    <p className="font-bold text-sm uppercase tracking-wide truncate">{members[1]?.first_name} {members[1]?.last_name?.charAt(0)}.</p>
                    <p className="text-white text-xs">{members[1]?.wins || 0} wins</p>
                    <div className="h-16 bg-gray-400/20 rounded-t mt-3"></div>
                  </div>
                  {/* 1st */}
                  <div className="text-center">
                    <div className="w-20 h-20 bg-yellow-500/20 border border-yellow-500/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-3xl">🥇</span>
                    </div>
                    <p className="font-bold text-sm uppercase tracking-wide truncate">{members[0]?.first_name} {members[0]?.last_name?.charAt(0)}.</p>
                    <p className="text-yellow-400 text-xs font-bold">{members[0]?.wins || 0} wins</p>
                    <div className="h-24 bg-yellow-500/20 rounded-t mt-3"></div>
                  </div>
                  {/* 3rd */}
                  <div className="text-center pt-12">
                    <div className="w-14 h-14 bg-orange-700/20 border border-orange-700/40 rounded-full flex items-center justify-center mx-auto mb-3">
                      <span className="text-xl">🥉</span>
                    </div>
                    <p className="font-bold text-sm uppercase tracking-wide truncate">{members[2]?.first_name} {members[2]?.last_name?.charAt(0)}.</p>
                    <p className="text-white text-xs">{members[2]?.wins || 0} wins</p>
                    <div className="h-10 bg-orange-700/20 rounded-t mt-3"></div>
                  </div>
                </div>
              )}

              {/* Full Table */}
              <div className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                <div className="grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-4 px-6 py-3 border-b border-white/10 text-xs font-bold uppercase tracking-widest text-white">
                  <span>#</span>
                  <span>Player</span>
                  <span className="text-right">Wins</span>
                  <span className="text-right">Losses</span>
                  <span className="text-right">Win %</span>
                  <span className="text-right">Events</span>
                </div>

                {members.map((m, idx) => {
                  const rank = getRankDisplay(idx);
                  const isMe = m.id === currentMemberId;
                  return (
                    <div
                      key={m.id}
                      onClick={() => router.push(`/portal-player-profile?id=${m.id}`)}
                      className={`grid grid-cols-[40px_1fr_80px_80px_80px_80px] gap-4 px-6 py-4 border-b border-white/5 hover:bg-white/5 transition-colors cursor-pointer ${isMe ? 'bg-white/10 border-l-2 border-l-white' : ''}`}
                    >
                      <span className={`text-sm font-bold ${idx < 3 ? 'text-lg' : 'text-white'}`}>
                        {rank.icon || rank.label}
                      </span>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                          <i className="ph-fill ph-user text-sm text-white"></i>
                        </div>
                        <div>
                          <p className={`text-sm font-bold ${isMe ? 'text-white' : ''}`}>
                            {m.first_name} {m.last_name}
                            {isMe && <span className="ml-2 text-[10px] bg-white text-black px-1.5 py-0.5 rounded font-bold uppercase">You</span>}
                          </p>
                          {m.rank_label && <p className="text-xs text-white">{m.rank_label}</p>}
                        </div>
                      </div>
                      <span className="text-right text-sm font-bold text-green-400">{m.wins || 0}</span>
                      <span className="text-right text-sm text-white">{m.losses || 0}</span>
                      <span className="text-right text-sm font-medium">{winPct(m.wins, m.losses)}</span>
                      <span className="text-right text-sm text-white">{m.events_played || 0}</span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
