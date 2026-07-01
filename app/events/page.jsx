'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import PortalNav from '@/components/PortalNav';
import Footer from '@/components/Footer';
import { isApprovedMember, isLoggedIn, getMemberId, setLoginRedirect } from '@/lib/auth';

export default function EventsPage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isMember, setIsMember] = useState(() => isApprovedMember());
  const [loggedIn, setLoggedIn] = useState(() => isLoggedIn());
  const [registeredIds, setRegisteredIds] = useState(new Set());

  useEffect(() => {
    const member = isApprovedMember();
    setIsMember(member);
    setLoggedIn(isLoggedIn());

    const memberId = member ? getMemberId() : null;

    Promise.all([
      fetch('/api/events').then(r => r.json()).catch(() => []),
      memberId ? fetch(`/api/event-registrations?member_id=${memberId}`).then(r => r.json()).catch(() => []) : Promise.resolve([]),
    ]).then(([eventsData, regsData]) => {
      setEvents(Array.isArray(eventsData) ? eventsData : []);
      if (Array.isArray(regsData)) {
        setRegisteredIds(new Set(regsData.map(r => r.event_id)));
      }
    }).finally(() => setLoading(false));
  }, []);

  const handleRegister = (ev) => {
    if (isMember) {
      router.push(`/events/${ev.slug || ev.id}`);
    } else if (loggedIn) {
      // logged in but not yet approved
      router.push('/portal-dashboard');
    } else {
      // not logged in — show login or apply
      setLoginRedirect(`/events/${ev.slug || ev.id}`);
      router.push('/membership-apply');
    }
  };

  const formatDate = (dt) => {
    if (!dt) return null;
    const d = new Date(dt);
    return {
      month: d.toLocaleDateString('en-US', { month: 'short' }).toUpperCase(),
      day: d.getDate(),
      weekday: d.toLocaleDateString('en-US', { weekday: 'long' }),
      time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
    };
  };

  const getStatusBadge = (ev) => {
    const capacity = ev.capacity || ev.spots_total;
    const registered = ev.registered_count || ev.spots_taken || 0;
    if (!capacity) return { label: 'Open', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
    const remaining = capacity - registered;
    if (remaining <= 0) return { label: 'Full', color: 'text-red-400 bg-red-500/10 border-red-500/20' };
    if (remaining <= 3) return { label: `${remaining} Left`, color: 'text-orange-400 bg-orange-500/10 border-orange-500/20' };
    return { label: 'Open', color: 'text-green-400 bg-green-500/10 border-green-500/20' };
  };

  return (
    <div className="font-sans bg-black text-white antialiased">
      {isMember ? <PortalNav /> : <PublicNav />}

      <main className="pt-20">
        {/* Hero */}
        <section className="py-24 md:py-32 bg-gradient-to-b from-black to-gray-950 border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">Competition Calendar</p>
            <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tighter uppercase mb-6 text-amber-400">Events</h1>
            <p className="text-lg text-white max-w-2xl font-light leading-relaxed">
              Weekly round robins, challenger series, and mixers. Open to view. Registration requires Club NEVA membership.
            </p>
          </div>
        </section>

        {/* Events List */}
        <section className="py-16">
          <div className="max-w-5xl mx-auto px-6">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="h-32 bg-white/5 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : events.length === 0 ? (
              <div className="text-center py-24">
                <i className="ph ph-calendar text-5xl text-gray-600 mb-4"></i>
                <p className="text-gray-400 text-lg">No upcoming events. Check back soon.</p>
              </div>
            ) : (
              <div className="divide-y divide-white/10">
                {events.map(ev => {
                  const dateObj = formatDate(ev.date_time);
                  const status = getStatusBadge(ev);
                  return (
                    <div key={ev.id} className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-white/5 -mx-6 px-6 transition-colors rounded-xl cursor-pointer" onClick={() => router.push(`/events/${ev.slug || ev.id}`)}>
                      <div className="flex gap-6 items-center md:w-1/4">
                        {dateObj && (
                          <div className="text-left min-w-[70px]">
                            <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{dateObj.month}</p>
                            <p className="font-display text-4xl font-bold leading-none">{dateObj.day}</p>
                            <p className="text-xs text-gray-500 mt-1">{dateObj.weekday}</p>
                          </div>
                        )}
                      </div>

                      <div className="flex-1 md:w-2/4">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="font-display text-2xl md:text-3xl font-medium uppercase">{ev.title || ev.name}</h3>
                          <span className={`text-[11px] font-bold uppercase px-2 py-1 rounded border ${status.color}`}>{status.label}</span>
                        </div>
                        {ev.location && (
                          <p className="text-gray-400 flex items-center gap-2 text-sm">
                            <i className="ph ph-map-pin"></i> {ev.location}
                          </p>
                        )}
                        {ev.price && (
                          <p className="text-gray-500 text-sm mt-1">${parseFloat(ev.price).toFixed(2)} entry</p>
                        )}
                      </div>

                      <div className="md:w-1/4 flex md:justify-end">
                        {isMember && registeredIds.has(ev.id) ? (
                          <div className="w-full md:w-auto px-8 py-4 font-bold uppercase text-sm tracking-widest rounded bg-green-500/10 border border-green-500/20 text-green-400 text-center">
                            Registered ✓
                          </div>
                        ) : (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRegister(ev); }}
                            className={`w-full md:w-auto px-8 py-4 font-bold uppercase text-sm tracking-widest rounded transition-all active:scale-95 ${isMember ? 'bg-white text-black hover:bg-gray-200' : 'bg-white/10 border border-white/20 text-white hover:bg-white/20'}`}
                          >
                            {isMember ? 'Register' : 'Join to Register'}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>

        {/* CTA for non-members */}
        {!isMember && (
          <section className="py-20 border-t border-white/10 bg-white/5">
            <div className="max-w-3xl mx-auto px-6 text-center">
              <h2 className="font-display text-3xl md:text-4xl font-medium uppercase tracking-tight mb-4">Ready to Compete?</h2>
              <p className="text-white mb-8">Apply for Club NEVA membership to register for events, access the leaderboard, and earn NEVA Cash.</p>
              <div className="flex gap-4 justify-center flex-wrap">
                <button onClick={() => router.push('/membership-apply')} className="px-8 py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-200 transition-all">
                  Join the Club
</button>
                <button onClick={() => router.push('/login')} className="px-8 py-4 border border-white/30 text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-white/10 transition-all">
                  Member Login
                </button>
              </div>
            </div>
          </section>
        )}
      </main>
      <Footer />
    </div>
  );
}
