'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, getMemberId, getStoredMember, refreshMemberData, setLoginRedirect } from '@/lib/auth';

export default function PortalDashboardPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [member, setMember] = useState(null);
  const [events, setEvents] = useState([]);
  const [registrations, setRegistrations] = useState({}); // { [event_id]: { payment_confirmed: bool } }

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-dashboard');
      router.replace('/login');
      return;
    }
    loadDashboard();
  }, []);

  const markPaid = async (eventId) => {
    const id = getMemberId();
    const res = await fetch('/api/event-registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: eventId, member_id: id, payment_confirmed: true }),
    });
    if (res.ok) {
      setRegistrations(prev => ({ ...prev, [eventId]: { ...prev[eventId], payment_confirmed: true } }));
    }
  };

  const loadDashboard = async () => {
    const id = getMemberId();
    let data = getStoredMember();
    if (id) { const fresh = await refreshMemberData(id); if (fresh) data = fresh; }
    setMember(data);
    try {
      const [evRes, regRes] = await Promise.all([
        fetch('/api/events'),
        id ? fetch(`/api/event-registrations?member_id=${id}`) : Promise.resolve(null),
      ]);
      if (evRes.ok) {
        const d = await evRes.json();
        setEvents(Array.isArray(d) ? d.slice(0, 3) : []);
      }
      if (regRes?.ok) {
        const regs = await regRes.json();
        if (Array.isArray(regs)) {
          const map = {};
          regs.forEach(r => { map[r.event_id] = { payment_confirmed: r.payment_confirmed === true }; });
          setRegistrations(map);
        }
      }
    } catch {}
    setLoading(false);
  };

  if (loading) return (
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 border border-white/20 rounded-full mx-auto mb-4 flex items-center justify-center">
          <i className="ph ph-circle-notch text-2xl text-white animate-spin"></i>
        </div>
        <p className="text-white text-xs uppercase tracking-widest">Loading Portal...</p>
      </div>
    </div>
  );

  const wins = member?.wins || 0;
  const losses = member?.losses || 0;
  const total = wins + losses;
  const winPct = total > 0 ? ((wins/total)*100).toFixed(1)+'%' : '0%';
  const firstName = member?.first_name || member?.name?.split(' ')[0] || 'Member';
  const nevaCash = parseFloat(member?.neva_cash_balance || 0);

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PortalNav />
      <main className="pt-20 pb-16">
        <div className="max-w-[1600px] mx-auto px-6">

          {/* Welcome */}
          <section className="py-10 border-b border-white/10 mb-10">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
              <div>
                <p className="text-white text-xs uppercase tracking-widest mb-2">Welcome back,</p>
                <h1 className="font-display text-5xl md:text-6xl font-medium uppercase tracking-tight">{firstName}</h1>
              </div>
              <div className="flex gap-3 flex-wrap">
                <button onClick={() => router.push('/events')} className="px-5 py-3 bg-white/10 border border-white/20 text-white text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                  Browse Events
                </button>
                <button onClick={() => router.push('/portal-leaderboard')} className="px-5 py-3 bg-white text-black text-sm font-bold uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors">
                  View Leaderboard
                </button>
              </div>
            </div>
          </section>

          {/* Primary Stats */}
          <section className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[
              { label: 'Current Rank', value: member?.rank != null ? `#${member.rank}` : '—', sub: 'Club NEVA', icon: 'ph-medal', color: 'text-yellow-400' },
              { label: 'Total Wins', value: wins, sub: `${losses} losses`, icon: 'ph-trophy', color: 'text-green-400' },
              { label: 'Win Rate', value: winPct, sub: `${total} games`, icon: 'ph-chart-line-up', color: 'text-blue-400' },
              { label: 'NEVA Cash', value: `$${nevaCash}`, sub: 'Tap to redeem', icon: 'ph-coin', color: 'text-amber-400', onClick: () => router.push('/portal-neva-cash') },
            ].map(stat => (
              <div
                key={stat.label}
                onClick={stat.onClick}
                className={`bg-white/5 border border-white/10 rounded-xl p-6 ${stat.onClick ? 'cursor-pointer hover:bg-white/10 transition-colors' : ''}`}
              >
                <div className="flex items-start justify-between mb-4">
                  <p className="text-white text-[11px] uppercase tracking-widest font-bold">{stat.label}</p>
                  <i className={`ph-fill ${stat.icon} text-xl ${stat.color}`}></i>
                </div>
                <p className="font-display text-4xl font-bold mb-1">{stat.value}</p>
                <p className="text-white text-xs">{stat.sub}</p>
              </div>
            ))}
          </section>

          {/* Secondary Stats */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-white text-[11px] uppercase tracking-widest font-bold mb-3">Events Played</p>
              <div className="flex items-end gap-2">
                <p className="font-display text-4xl font-bold">{member?.events_played || 0}</p>
                <p className="text-white text-sm mb-1">this season</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-white text-[11px] uppercase tracking-widest font-bold mb-3">Current Streak</p>
              <div className="flex items-end gap-2">
                <p className={`font-display text-4xl font-bold ${(member?.streak||0)>0 ? 'text-green-400' : 'text-white'}`}>{member?.streak || 0}</p>
                <p className="text-white text-sm mb-1">wins in a row</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <p className="text-white text-[11px] uppercase tracking-widest font-bold mb-4">Quick Links</p>
              <div className="space-y-2">
                {[
                  ['My Profile', '/portal-profile'],
                  ['Stats & History', '/portal-stats-history'],
                  ['NEVA Cash', '/portal-neva-cash'],
                  ['Shop Gear', '/shop'],
                ].map(([label, path]) => (
                  <button key={label} onClick={() => router.push(path)} className="flex items-center justify-between w-full text-sm text-white hover:text-amber-400 transition-colors group py-0.5">
                    <span>{label}</span>
                    <i className="ph ph-arrow-right opacity-0 group-hover:opacity-100 transition-opacity text-xs"></i>
                  </button>
                ))}
              </div>
            </div>
          </section>

          {/* Win/Loss Bar */}
          {total > 0 && (
            <section className="mb-10">
              <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-white text-[11px] uppercase tracking-widest font-bold">Win / Loss Record</p>
                  <p className="text-sm font-bold">{winPct} Win Rate</p>
                </div>
                <div className="h-2.5 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-green-500 to-green-400 rounded-full transition-all duration-700" style={{width:`${(wins/total)*100}%`}}></div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-white">
                  <span className="text-green-400 font-bold">{wins} Wins</span>
                  <span>{losses} Losses</span>
                </div>
              </div>
            </section>
          )}

          {/* Upcoming Events + Recent Activity */}
          <section className="grid lg:grid-cols-2 gap-8">

            {/* Upcoming Events */}
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                <h2 className="font-display text-xl uppercase font-bold tracking-tight">Upcoming Events</h2>
                <button onClick={() => router.push('/events')} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">Browse All →</button>
              </div>
              {events.length > 0 ? (
                <div className="space-y-3">
                  {events.map(ev => {
                    const d = ev.date_time ? new Date(ev.date_time) : null;
                    return (
                      <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl p-5 hover:bg-white/10 transition-colors cursor-pointer" onClick={() => router.push(`/events/${ev.slug||ev.id}`)}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1">
                            <p className="font-bold text-sm mb-1">{ev.title||ev.name}</p>
                            <p className="text-white text-xs">
                              {d ? d.toLocaleDateString('en-US',{month:'short',day:'numeric',weekday:'short',timeZone:'America/Los_Angeles'}) : '—'}
                              {ev.location ? ` · ${ev.location}` : ''}
                            </p>
                          </div>
                          {ev.price && <p className="text-xs font-bold text-white whitespace-nowrap">${parseFloat(ev.price).toFixed(2)}</p>}
                        </div>
                        {registrations[ev.id] ? (
                          <div onClick={e => e.stopPropagation()}>
                            {/* Status badge */}
                            <div className="w-full mt-3 py-2 bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-bold uppercase tracking-wider rounded-lg text-center flex items-center justify-center gap-2">
                              Registered ✓
                              {ev.playbypoint_url && registrations[ev.id].payment_confirmed && (
                                <span className="text-amber-400">· Paid ✓</span>
                              )}
                            </div>
                            {/* Payment reminder — only when url exists and not yet self-reported */}
                            {ev.playbypoint_url && !registrations[ev.id].payment_confirmed && (
                              <div className="mt-2 px-3 py-2.5 bg-amber-400/6 border border-amber-400/20 rounded-lg">
                                <p className="text-amber-400/80 text-[11px] leading-relaxed mb-2">
                                  Don't forget to complete payment on PlayByPoint to confirm your spot.
                                </p>
                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() => markPaid(ev.id)}
                                    className="text-[11px] font-bold text-amber-400 border border-amber-400/40 px-2.5 py-1 rounded hover:bg-amber-400/10 transition-colors uppercase tracking-wide"
                                  >
                                    I've paid ✓
                                  </button>
                                  <span className="text-white/60 text-[10px]">Self-reported, not verified</span>
                                </div>
                              </div>
                            )}
                          </div>
                        ) : (
                          <button onClick={e=>{e.stopPropagation();router.push(`/events/${ev.slug||ev.id}`);}} className="w-full mt-3 py-2 bg-white/10 hover:bg-white/20 text-xs font-bold uppercase tracking-wider rounded-lg transition-colors">
                            Register
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white/5 border border-white/10 rounded-xl p-8 text-center">
                  <i className="ph ph-calendar text-3xl text-gray-600 mb-3"></i>
                  <p className="text-white text-sm">No upcoming events right now.</p>
                  <button onClick={() => router.push('/events')} className="mt-3 text-white text-xs uppercase tracking-widest hover:text-gray-300 transition-colors font-bold">Check Events Page →</button>
                </div>
              )}
            </div>

            {/* Achievements */}
            <div>
              <div className="flex items-center justify-between mb-5 border-b border-white/10 pb-4">
                <h2 className="font-display text-xl uppercase font-bold tracking-tight">Achievements</h2>
                <button onClick={() => router.push('/portal-stats-history')} className="text-gray-500 hover:text-white text-xs font-bold uppercase tracking-widest transition-colors">View Stats →</button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {[
                  { emoji: '🏆', name: 'Champion', desc: '1st Place Finish', earned: wins > 0 },
                  { emoji: '⚡', name: 'On Fire', desc: '4+ Win Streak', earned: (member?.streak||0) >= 4 },
                  { emoji: '🎯', name: 'Sharpshooter', desc: '70%+ Win Rate', earned: total > 5 && (wins/total) >= 0.7 },
                  { emoji: '🏅', name: 'Veteran', desc: '10+ Events', earned: (member?.events_played||0) >= 10 },
                  { emoji: '💰', name: 'NEVA Rich', desc: '$100+ Cash', earned: nevaCash >= 100 },
                  { emoji: '🌟', name: 'Legendary', desc: '50+ Total Wins', earned: wins >= 50 },
                ].map(badge => (
                  <div key={badge.name} className={`rounded-xl p-4 border text-center transition-all ${badge.earned ? 'bg-white/10 border-white/20' : 'bg-white/3 border-white/5 opacity-40'}`}>
                    <div className="text-2xl mb-2">{badge.emoji}</div>
                    <p className="text-xs font-bold uppercase tracking-widest mb-0.5">{badge.name}</p>
                    <p className="text-[10px] text-white">{badge.desc}</p>
                    {badge.earned && <div className="mt-2 w-2 h-2 bg-green-400 rounded-full mx-auto"></div>}
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </main>
    </div>
  );
}
