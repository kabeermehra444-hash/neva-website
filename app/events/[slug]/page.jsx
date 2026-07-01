'use client';

import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { isApprovedMember, isLoggedIn, setLoginRedirect } from '@/lib/auth';

export default function EventDetailPage() {
  const router = useRouter();
  const params = useParams();
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [registered, setRegistered] = useState(false);
  const [registerError, setRegisterError] = useState('');
  const [isMember, setIsMember] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [exceptionOpen, setExceptionOpen] = useState(false);
  const [exceptionForm, setExceptionForm] = useState({ name: '', email: '', message: '' });
  const [exceptionSent, setExceptionSent] = useState(false);
  const [exceptionSending, setExceptionSending] = useState(false);
  const [attendees, setAttendees] = useState([]);
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);

  useEffect(() => {
    const member = isApprovedMember();
    setIsMember(member);
    setLoggedIn(isLoggedIn());
    if (params?.slug) fetchEvent(member);
  }, [params?.slug]);

  const fetchEvent = async (memberApproved) => {
    try {
      const res = await fetch('/api/events');
      const events = await res.json();
      const ev = Array.isArray(events)
        ? events.find(e => e.slug === params.slug || String(e.id) === params.slug)
        : null;

      if (!ev) { router.replace('/events'); return; }
      setEvent(ev);

      if (memberApproved) {
        const { getMemberId } = await import('@/lib/auth');
        const memberId = getMemberId();

        const [myRegRes, allRegRes] = await Promise.all([
          memberId ? fetch(`/api/event-registrations?event_id=${ev.id}&member_id=${memberId}`) : Promise.resolve(null),
          fetch(`/api/event-registrations?event_id=${ev.id}`),
        ]);

        if (myRegRes?.ok) {
          const regs = await myRegRes.json();
          if (Array.isArray(regs) && regs.length > 0) {
            setRegistered(true);
            setPaymentConfirmed(regs[0].payment_confirmed === true);
          }
        }

        if (allRegRes.ok) {
          const allRegs = await allRegRes.json();
          if (Array.isArray(allRegs)) {
            setAttendees(allRegs.map(r => {
              const parts = (r.name || '').trim().split(/\s+/);
              const first = parts[0] || '';
              const lastInitial = parts.length > 1 ? parts[parts.length - 1][0].toUpperCase() + '.' : '';
              return lastInitial ? `${first} ${lastInitial}` : first;
            }).filter(Boolean));
          }
        }
      }
    } catch {
      router.replace('/events');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!isMember) {
      if (!loggedIn) {
        setLoginRedirect(`/events/${params.slug}`);
        router.push('/membership-apply');
      } else {
        router.push('/portal-dashboard');
      }
      return;
    }
    setRegistering(true);
    setRegisterError('');
    try {
      const { getMemberId } = await import('@/lib/auth');
      const memberId = getMemberId();
      const res = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ event_id: event.id, member_id: memberId }),
      });
      if (res.status === 409) {
        // Already registered — treat as success
        setRegistered(true);
        return;
      }
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setRegisterError(data.error || 'Registration failed. Please try again.');
        return;
      }
      setRegistered(true);
      setEvent(ev => ev ? { ...ev, registered_count: (ev.registered_count || 0) + 1 } : ev);
    } catch {
      setRegisterError('Network error. Please check your connection and try again.');
    } finally {
      setRegistering(false);
    }
  };

  const markPaid = async () => {
    const { getMemberId } = await import('@/lib/auth');
    const memberId = getMemberId();
    const res = await fetch('/api/event-registrations', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ event_id: event.id, member_id: memberId, payment_confirmed: true }),
    });
    if (res.ok) setPaymentConfirmed(true);
  };

  const submitException = async (e) => {
    e.preventDefault();
    setExceptionSending(true);
    try {
      await fetch('/api/dupr-exceptions', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...exceptionForm, event_id: event?.id }),
      });
      setExceptionSent(true);
    } catch { /* fail silently */ }
    setExceptionSending(false);
  };

  if (loading) return (
    <div className="font-sans bg-black text-white min-h-screen">
      <PublicNav />
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <p className="text-gray-400 text-sm uppercase tracking-widest">Loading Event...</p>
      </div>
    </div>
  );

  if (!event) return null;

  const date = event.date_time ? new Date(event.date_time) : null;
  const capacity = event.capacity || event.spots_total;
  const registered_count = event.registered_count || event.spots_taken || 0;
  const spotsLeft = capacity ? capacity - registered_count : null;

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PublicNav />
      <main className="pt-20">
        {/* Event Hero */}
        <div className="relative h-72 md:h-96 bg-gray-900 overflow-hidden">
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} className="w-full h-full object-cover opacity-60" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-900 to-black flex items-center justify-center">
              <i className="ph ph-trophy text-8xl text-gray-700"></i>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent"></div>
          <div className="absolute bottom-0 left-0 right-0 p-8 max-w-5xl mx-auto">
            <button onClick={() => router.push('/events')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-4 text-sm uppercase tracking-wide">
              <i className="ph ph-arrow-left"></i> All Events
            </button>
            <h1 className="font-display text-4xl md:text-6xl font-medium uppercase tracking-tight">{event.title || event.name}</h1>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="grid md:grid-cols-3 gap-12">
            {/* Event Info */}
            <div className="md:col-span-2">
              {event.description && (
                <div className="mb-10">
                  <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-4 border-b border-white/10 pb-4">About This Event</h2>
                  <p className="text-gray-300 leading-relaxed">{event.description}</p>
                </div>
              )}

              {event.rules && (
                <div className="mb-10">
                  <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-4 border-b border-white/10 pb-4">Rules & Notes</h2>
                  <p className="text-gray-300 leading-relaxed">{event.rules}</p>
                </div>
              )}

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-4">
                {date && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Date & Time</p>
                    <p className="font-bold">{date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
                    <p className="text-gray-400 text-sm mt-1">
                      {(() => {
                        const start = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
                        const endDate = event.end_time ? new Date(event.end_time) : null;
                        const end = endDate ? endDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : null;
                        return end ? `${start} – ${end}` : start;
                      })()}
                    </p>
                  </div>
                )}
                {event.location && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Location</p>
                    <p className="font-bold">{event.location}</p>
                  </div>
                )}
                {event.price && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Entry Fee</p>
                    <p className="font-bold text-lg">${parseFloat(event.price).toFixed(2)}</p>
                  </div>
                )}
                {capacity && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">Spots</p>
                    <p className="font-bold">{registered_count} / {capacity} filled</p>
                    {spotsLeft !== null && spotsLeft > 0 && (
                      <p className={`text-sm mt-1 ${spotsLeft <= 3 ? 'text-orange-400' : 'text-green-400'}`}>{spotsLeft} remaining</p>
                    )}
                  </div>
                )}
                {event.dupr_minimum && parseFloat(event.dupr_minimum) > 0 && (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-5 col-span-2">
                    <p className="text-gray-500 text-xs uppercase tracking-widest mb-2">DUPR Minimum</p>
                    <p className="font-bold text-lg">{parseFloat(event.dupr_minimum).toFixed(1)}</p>
                    <p className="text-gray-500 text-xs mt-2">DUPR is an independent rating system. Don't have a rating yet? Request an exception below.</p>
                    {!exceptionSent ? (
                      <>
                        <button onClick={() => setExceptionOpen(v => !v)} className="text-gray-400 text-xs mt-2 hover:text-white transition-colors flex items-center gap-1">
                          <i className="ph ph-chat-circle-dots"></i>
                          Playing below the skill requirement? Let us know and we'll take a look.
                        </button>
                        {exceptionOpen && (
                          <form onSubmit={submitException} className="mt-4 space-y-3">
                            <input required type="text" placeholder="Your name" value={exceptionForm.name} onChange={e => setExceptionForm(f => ({...f, name: e.target.value}))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/40" />
                            <input required type="email" placeholder="Your email" value={exceptionForm.email} onChange={e => setExceptionForm(f => ({...f, email: e.target.value}))}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/40" />
                            <textarea placeholder="Tell us a bit about your game — how long you've been playing, your style, recent results..." value={exceptionForm.message} onChange={e => setExceptionForm(f => ({...f, message: e.target.value}))} rows={3}
                              className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:border-white/40 resize-none" />
                            <button type="submit" disabled={exceptionSending} className="px-5 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                              {exceptionSending ? 'Sending...' : 'Send Request'}
                            </button>
                          </form>
                        )}
                      </>
                    ) : (
                      <p className="text-green-400 text-xs mt-2">✓ Request sent — we'll be in touch soon.</p>
                    )}
                  </div>
                )}
              </div>

              {/* Who's Coming — members only */}
              {isMember && (
                <div className="mt-10">
                  <h2 className="font-display text-2xl uppercase font-bold tracking-tight mb-4 border-b border-white/10 pb-4 flex items-center gap-3">
                    Who's Coming
                    {attendees.length > 0 && (
                      <span className="text-sm font-sans font-normal text-gray-500 normal-case tracking-normal">
                        {attendees.length} registered
                      </span>
                    )}
                  </h2>
                  {attendees.length === 0 ? (
                    <p className="text-gray-500 text-sm">No one has registered yet — be the first.</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {attendees.map((name, i) => (
                        <span key={i} className="px-3 py-1.5 bg-white/5 border border-white/10 rounded-full text-sm text-gray-300 font-medium">
                          {name}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Registration Card */}
            <div className="md:col-span-1">
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 sticky top-28">
                <h3 className="font-display text-xl uppercase font-bold tracking-tight mb-6">Registration</h3>

                {/* ── Step 1 ── */}
                {event.playbypoint_url && isMember && (
                  <div className="flex items-center gap-2 mb-4">
                    <span className="w-5 h-5 rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-[10px] font-bold text-gray-400 flex-shrink-0">1</span>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Reserve your spot</p>
                  </div>
                )}

                {registered ? (
                  <div className="text-center py-2">
                    <div className="w-12 h-12 bg-green-500/20 border border-green-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                      <i className="ph-fill ph-check-circle text-2xl text-green-400"></i>
                    </div>
                    <p className="font-bold text-green-400 mb-1">You're Registered!</p>
                    <p className="text-gray-400 text-sm">
                      {event.playbypoint_url ? 'Step 1 complete — see payment below.' : 'See you at the event.'}
                    </p>
                    {!event.playbypoint_url && (
                      <button onClick={() => router.push('/portal-dashboard')} className="mt-4 w-full py-3 bg-white/10 text-white text-sm font-bold uppercase tracking-widest rounded hover:bg-white/20 transition-colors">
                        View Portal
                      </button>
                    )}
                  </div>
                ) : isMember ? (
                  <>
                    {event.price && <p className="text-3xl font-bold mb-6">${parseFloat(event.price).toFixed(2)}</p>}
                    <button
                      onClick={handleRegister}
                      disabled={registering || (spotsLeft !== null && spotsLeft <= 0)}
                      className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-xl transition-all active:scale-95 mb-4 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-200"
                    >
                      {registering ? 'Registering...' : spotsLeft !== null && spotsLeft <= 0 ? 'Event Full' : 'Register Now'}
                    </button>
                    {registerError && (
                      <p className="text-red-400 text-xs text-center mb-3">{registerError}</p>
                    )}
                    <div className="mt-4 pt-4 border-t border-white/10">
                      <p className="text-gray-500 text-xs text-center">Members only. Secure registration.</p>
                    </div>
                  </>
                ) : (
                  <div className="text-center">
                    {event.price && <p className="text-3xl font-bold mb-6">${parseFloat(event.price).toFixed(2)}</p>}
                    <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-full flex items-center justify-center mx-auto mb-4">
                      <i className="ph ph-lock text-xl text-gray-400"></i>
                    </div>
                    <p className="text-white font-bold mb-1">Membership Required</p>
                    <p className="text-gray-500 text-sm mb-6">
                      {loggedIn ? 'Your membership application is pending review.' : 'You must be an approved Club NEVA member to register for events.'}
                    </p>
                    {!loggedIn && (
                      <button onClick={() => router.push('/membership-apply')}
                        className="w-full py-3 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-xl hover:bg-gray-200 active:scale-95 transition-all">
                        Join the Club
                      </button>
                    )}
                  </div>
                )}

                {/* ── Step 2 — PlayByPoint payment (only when URL is set and user is a member) ── */}
                {event.playbypoint_url && isMember && (
                  <div className="mt-5 pt-5 border-t border-white/10">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="w-5 h-5 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center text-[10px] font-bold text-amber-400 flex-shrink-0">2</span>
                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Confirm payment</p>
                    </div>

                    {paymentConfirmed ? (
                      <div className="flex items-center gap-2 mb-4 py-2 px-3 bg-amber-400/10 border border-amber-400/25 rounded-lg">
                        <i className="ph-fill ph-check-circle text-amber-400 text-base flex-shrink-0"></i>
                        <p className="text-amber-400 text-xs font-bold">Payment marked as complete</p>
                      </div>
                    ) : (
                      <p className="text-gray-500 text-xs leading-relaxed mb-4">
                        {registered
                          ? 'You\'re on the list. Complete payment via PlayByPoint to lock in your spot.'
                          : 'After registering above, complete payment on PlayByPoint to confirm your spot.'}
                      </p>
                    )}

                    <a
                      href={event.playbypoint_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full py-3.5 bg-amber-400/10 border border-amber-400/35 text-amber-400 font-bold text-xs uppercase tracking-widest rounded-xl hover:bg-amber-400/18 active:scale-95 transition-all"
                    >
                      Pay &amp; Confirm Your Spot <i className="ph ph-arrow-up-right text-sm"></i>
                    </a>

                    {registered && !paymentConfirmed && (
                      <button
                        onClick={markPaid}
                        className="mt-3 w-full py-2.5 border border-white/10 text-gray-500 text-[11px] font-bold uppercase tracking-widest rounded hover:bg-white/5 hover:text-gray-400 transition-colors"
                      >
                        I've paid — mark as complete
                      </button>
                    )}
                    {registered && !paymentConfirmed && (
                      <p className="text-gray-700 text-[10px] text-center mt-1.5">Self-reported, not verified by NEVA</p>
                    )}

                    {(paymentConfirmed || !registered) && (
                      <button onClick={() => router.push('/portal-dashboard')} className="mt-3 w-full py-2.5 bg-white/5 text-gray-400 text-xs font-bold uppercase tracking-widest rounded hover:bg-white/10 transition-colors">
                        View Portal
                      </button>
                    )}
                  </div>
                )}

                {/* Add to Calendar */}
                {date && (() => {
                  const fmt = (d) => d.toISOString().replace(/[-:]/g,'').split('.')[0]+'Z';
                  const end = new Date(date.getTime() + 2 * 60 * 60 * 1000);
                  const gcal = `https://calendar.google.com/calendar/render?action=TEMPLATE`
                    + `&text=${encodeURIComponent(event.title || event.name)}`
                    + `&dates=${fmt(date)}/${fmt(end)}`
                    + (event.location ? `&location=${encodeURIComponent(event.location)}` : '')
                    + (event.description ? `&details=${encodeURIComponent(event.description)}` : '');
                  return (
                    <a href={gcal} target="_blank" rel="noopener noreferrer"
                      className="mt-4 flex items-center justify-center gap-2 w-full py-3 border border-white/10 text-gray-400 hover:text-white hover:border-white/30 font-bold text-xs uppercase tracking-wider rounded-xl transition-colors">
                      <i className="ph ph-calendar-plus text-base"></i>
                      Add to Calendar
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
