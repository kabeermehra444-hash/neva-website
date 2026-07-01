'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, setLoginRedirect } from '@/lib/auth';

function PlayerProfileContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [player, setPlayer] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-leaderboard');
      router.replace('/login');
      return;
    }
    const id = searchParams.get('id');
    if (!id) { router.replace('/portal-leaderboard'); return; }
    fetchPlayer(id);
  }, [router, searchParams]);

  const fetchPlayer = async (id) => {
    try {
      const res = await fetch(`/api/members/${id}`);
      if (!res.ok) throw new Error('Not found');
      setPlayer(await res.json());
    } catch {
      router.replace('/portal-leaderboard');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return (
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-gray-400 text-sm uppercase tracking-widest">Loading Profile...</p>
    </div>
  );

  const wins = player?.wins || 0;
  const losses = player?.losses || 0;
  const total = wins + losses;
  const winPct = total > 0 ? ((wins / total) * 100).toFixed(1) + '%' : '0%';
  const isMe = player?.id === getMemberId();

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PortalNav />
      <main className="pt-20 pb-12">
        <div className="max-w-3xl mx-auto px-6">
          <button onClick={() => router.push('/portal-leaderboard')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm uppercase tracking-wide mt-8">
            <i className="ph ph-arrow-left"></i> Back to Leaderboard
          </button>

          {/* Profile Header */}
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-2xl p-10 mb-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div className="w-24 h-24 bg-white/10 border-2 border-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
                <i className="ph-fill ph-user text-4xl text-white/50"></i>
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-1 flex-wrap">
                  <h1 className="font-display text-3xl font-bold uppercase tracking-tight">
                    {player?.first_name} {player?.last_name}
                  </h1>
                  {isMe && <span className="text-[11px] bg-white text-black px-2 py-0.5 rounded font-bold uppercase">You</span>}
                </div>
                {player?.rank_label && (
                  <span className="inline-block px-3 py-1 bg-white/10 border border-white/20 rounded text-xs font-bold uppercase tracking-widest mb-4">
                    {player.rank_label}
                  </span>
                )}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t border-white/10">
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Wins</p>
                    <p className="font-display text-3xl font-bold text-green-400">{wins}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Losses</p>
                    <p className="font-display text-3xl font-bold text-gray-400">{losses}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Win %</p>
                    <p className="font-display text-3xl font-bold">{winPct}</p>
                  </div>
                  <div>
                    <p className="text-gray-400 text-xs uppercase tracking-widest mb-1">Events</p>
                    <p className="font-display text-3xl font-bold">{player?.events_played || 0}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Stats */}
          <div className="grid md:grid-cols-2 gap-4 mb-8">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-3">Current Streak</p>
              <p className={`font-display text-4xl font-bold ${(player?.streak || 0) > 0 ? 'text-green-400' : 'text-gray-400'}`}>
                {player?.streak || 0}
              </p>
              <p className="text-gray-500 text-sm mt-1">consecutive wins</p>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-gray-400 text-xs uppercase tracking-widest font-medium mb-3">Member Since</p>
              <p className="font-bold text-lg">
                {player?.created_at ? new Date(player.created_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', timeZone: 'America/Los_Angeles' }) : '—'}
              </p>
            </div>
          </div>

          {/* W/L bar */}
          {total > 0 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-8">
              <div className="flex justify-between text-sm mb-3">
                <span className="text-green-400 font-bold">{wins} Wins ({winPct})</span>
                <span className="text-gray-400">{losses} Losses</span>
              </div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: `${(wins / total) * 100}%` }}></div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

export default function PlayerProfilePage() {
  return (
    <Suspense fallback={<div className="font-sans bg-black text-white min-h-screen flex items-center justify-center"><p className="text-gray-400 text-sm uppercase tracking-widest">Loading...</p></div>}>
      <PlayerProfileContent />
    </Suspense>
  );
}
