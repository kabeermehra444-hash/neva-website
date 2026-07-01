'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EventAllLevelsMixerPage() {
  const router = useRouter();
  const [cartCount, setCartCount] = useState(0);
  const [event, setEvent] = useState(null);
  const [registrations, setRegistrations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const count = parseInt(localStorage.getItem('cartCount') || '0');
    setCartCount(count);
  }, []);

  useEffect(() => {
    async function fetchEventData() {
      try {
        const eventRes = await fetch('/api/events');
        const eventsData = await eventRes.json();
        const allLevelsMixer = Array.isArray(eventsData) ? eventsData.find(e => e.slug === 'event_all_levels_mixer') : null;
        
        if (allLevelsMixer) {
          setEvent(allLevelsMixer);
          
          const regRes = await fetch(`/api/event-registrations?event_id=${allLevelsMixer.id}`);
          const regData = await regRes.json();
          setRegistrations(Array.isArray(regData) ? regData : []);
        }
      } catch (error) {
        console.error('Error fetching event data:', error);
      } finally {
        setLoading(false);
      }
    }
    
    fetchEventData();
  }, []);

  const handleWaitlistJoin = async (eventName) => {
    const isMember = localStorage.getItem('clubNevaMember') === 'true';
    const isLoggedIn = localStorage.getItem('clubNevaLoggedIn') === 'true';
    
    if (!isMember) {
      if (confirm('Club NEVA membership is required to join the waitlist.\n\nWould you like to apply for membership now?')) {
        localStorage.setItem('returnToEvent', 'event_all_levels_mixer');
        router.push('/membership-apply');
      }
    } else if (!isLoggedIn) {
      if (confirm('Please log in to join the waitlist.')) {
        localStorage.setItem('returnToEvent', 'event_all_levels_mixer');
        router.push('/login');
      }
    } else {
      if (confirm(`Join waitlist for ${eventName}?\n\nWe'll notify you if a spot opens up.`)) {
        try {
          const memberId = localStorage.getItem('clubNevaMemberId');
          await fetch('/api/event-registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: event?.id,
              member_id: memberId,
              registration_type: 'waitlist'
            })
          });
          alert('✓ Added to waitlist!\n\nYou\'re on the waitlist for ' + eventName + '. We\'ll email you if a spot becomes available.');
        } catch (error) {
          console.error('Error joining waitlist:', error);
          alert('There was an error joining the waitlist. Please try again.');
        }
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

    return (
      <>
        <div className="font-sans bg-white text-black antialiased">
          {/* Navigation */}
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="hidden lg:grid grid-cols-3 items-center max-w-[1600px] mx-auto px-8 h-20">
            <nav className="flex items-center gap-8 text-sm font-medium tracking-wide">
                <button onClick={() => router.push('/shop')} className="text-gray-500 hover:text-black transition-colors uppercase">Shop</button>
                <button onClick={() => router.push('/events')} className="text-black font-bold uppercase underline decoration-2 underline-offset-8">Events</button>
                <button onClick={() => router.push('/news-updates')} className="text-gray-500 hover:text-black transition-colors uppercase">News</button>
                <button onClick={() => router.push('/about')} className="text-gray-500 hover:text-black transition-colors uppercase">About</button>
            </nav>

            <div className="text-center">
                <button onClick={() => router.push('/')} className="font-display text-3xl font-bold uppercase tracking-widest text-black">NEVA</button>
            </div>

            <div className="flex items-center justify-end gap-6 text-sm font-medium tracking-wide">
                <button className="text-black hover:text-gray-600 transition-colors"><i className="ph ph-magnifying-glass text-xl"></i></button>
                <button onClick={() => router.push('/checkout')} className="text-black hover:text-gray-600 transition-colors relative">
                    <i className="ph ph-shopping-cart text-xl"></i>
                    <span className="absolute -top-1 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
                </button>
                <div className="h-4 w-px bg-gray-200 mx-2"></div>
                <button onClick={() => router.push('/login')} className="text-black hover:text-gray-600 transition-colors uppercase">Login</button>
                <button onClick={() => router.push('/membership-apply')} className="px-5 py-2.5 bg-black text-white uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-800 active:scale-95 transition-all">Apply</button>
            </div>
        </div>
    </header>

    <main className="pt-20">
        {/* Event Hero */}
        <section className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900">
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1606925797300-0b35e9d1794e?w=1200')] bg-cover bg-center opacity-30"></div>
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
            <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12">
                <div className="flex items-center gap-2 mb-4">
                    <span className="px-3 py-1 bg-gray-400 text-white text-xs font-bold uppercase tracking-widest rounded-full">{event?.spots_left === 0 ? 'Full / Waitlist' : 'Open'}</span>
                    <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-bold uppercase tracking-widest rounded-full">{event?.event_type || 'Social'}</span>
                </div>
                <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white mb-3">{event?.name || 'All-Levels Mixer'}</h1>
                <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                    <span className="flex items-center gap-1.5"><i className="ph-bold ph-calendar-blank"></i> {event?.event_date ? new Date(event.event_date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: '2-digit', timeZone: 'America/Los_Angeles' }) : 'Saturday, Nov 02, 2024'}</span>
                    <span className="flex items-center gap-1.5"><i className="ph-bold ph-clock"></i> {event?.start_time || '10:00 AM'} - {event?.end_time || '2:00 PM'}</span>
                    <span className="flex items-center gap-1.5"><i className="ph-bold ph-map-pin"></i> {event?.location || 'Midtown Sports Complex'}</span>
                </div>
            </div>
        </section>

        {/* Event Details */}
        <section className="py-12">
            <div className="max-w-5xl mx-auto px-6">
                <div className="grid md:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="md:col-span-2 space-y-8">
                        <div>
                            <h2 className="font-display text-2xl font-bold uppercase mb-4">About This Event</h2>
                            <div className="prose prose-gray max-w-none text-gray-700 leading-relaxed">
                                <p>{event?.description || 'Our most popular monthly social event! The All-Levels Mixer brings together Club NEVA members of all skill levels for a day of fun, casual play, and community building. Whether you\'re just starting out or you\'re a seasoned player, this event is designed for everyone.'}</p>
                                <p className="mt-4">Format: Rotating mixed doubles and social play with balanced teams. Emphasis is on fun, sportsmanship, and meeting new members. No pressure, all community.</p>
                                <p className="mt-4"><strong>What's Included:</strong></p>
                                <ul className="list-disc pl-5 mt-2 space-y-1">
                                    <li>4 hours of court access</li>
                                    <li>Professional equipment provided</li>
                                    <li>Catered lunch and refreshments</li>
                                    <li>NEVA merchandise raffle</li>
                                    <li>Group photo and social time</li>
                                    <li>Beginner-friendly coaching available</li>
                                </ul>
                            </div>
                        </div>

                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="font-display text-xl font-bold uppercase mb-4">Event Details</h3>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Skill Level</span>
                                    <span className="font-medium">All Levels Welcome</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Format</span>
                                    <span className="font-medium">Mixed Social Play</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Registration Deadline</span>
                                    <span className="font-medium">Oct 30, 11:59 PM</span>
                                </div>
                                <div>
                                    <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Cancellation Policy</span>
                                    <span className="font-medium">72 hours notice</span>
                                </div>
                            </div>
                        </div>

                        {/* Guest List */}
                        <div className="border-t border-gray-200 pt-8">
                            <h3 className="font-display text-xl font-bold uppercase mb-4">Registered Players ({event?.capacity - (event?.spots_left || 0)} / {event?.capacity || 32}) {event?.spots_left === 0 ? '- Full!' : ''}</h3>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                {Array.isArray(registrations) && registrations.slice(0, 4).map((reg, idx) => {
                                  const colors = [
                                    'from-blue-500 to-purple-600',
                                    'from-green-500 to-teal-600',
                                    'from-orange-500 to-red-600',
                                    'from-purple-500 to-pink-600'
                                  ];
                                  const initials = reg.member_name ? reg.member_name.split(' ').map(n => n[0]).join('') : 'AA';
                                  return (
                                    <div key={reg.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${colors[idx % 4]} flex items-center justify-center text-white font-bold text-xs`}>{initials}</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">{reg.member_name || 'Member'}</div>
                                        </div>
                                    </div>
                                  );
                                })}
                                {registrations.length === 0 && (
                                  <>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">TG</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">Taylor Green</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-xs">JM</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">Jordan Miles</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-xs">AP</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">Alex Parker</div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 p-2 bg-gray-50 rounded-lg">
                                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-xs">KC</div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium text-xs truncate">Kim Carter</div>
                                        </div>
                                    </div>
                                  </>
                                )}
                                {registrations.length > 4 && (
                                  <div className="text-center text-gray-500 text-sm p-2 col-span-2 md:col-span-4">+ {registrations.length - 4} more attendees</div>
                                )}
                            </div>
                            {event?.spots_left === 0 && (
                              <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                                  <p className="text-sm text-amber-900"><strong>This event is full.</strong> You can join the waitlist and we'll notify you if a spot opens up.</p>
                              </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="md:col-span-1">
                        <div className="sticky top-24 space-y-6">
                            {/* Registration Card */}
                            <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                                <div className="flex items-baseline justify-between mb-6">
                                    <span className="text-3xl font-display font-bold">${event?.price || 30}</span>
                                    <span className="text-gray-500 text-sm">per player</span>
                                </div>
                                
                                <button onClick={() => handleWaitlistJoin(event?.name || 'All-Levels Mixer')} className="w-full py-4 bg-gray-300 text-gray-700 font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-400 transition-all active:scale-95 mb-4">
                                    Join Waitlist
                                </button>
                                
                                <div className="space-y-3 text-sm text-gray-600">
                                    <div className="flex items-center gap-2">
                                        <i className="ph-fill ph-x-circle text-gray-400"></i>
                                        <span>Event is Full ({event?.capacity - (event?.spots_left || 0)}/{event?.capacity || 32})</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ph-fill ph-check-circle text-green-600"></i>
                                        <span>Members Only Event</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <i className="ph-fill ph-check-circle text-green-600"></i>
                                        <span>Lunch Included</span>
                                    </div>
                                </div>
                            </div>

                            {/* Location Card */}
                            <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                                <h4 className="font-display font-bold uppercase text-sm mb-4">Location</h4>
                                <p className="font-medium mb-2">{event?.location || 'Midtown Sports Complex'}</p>
                                <p className="text-sm text-gray-600 mb-4">870 Peachtree St NE<br />Atlanta, GA 30308</p>
                                <button className="text-black font-bold text-xs uppercase tracking-widest hover:underline">Get Directions →</button>
                            </div>

                            {/* Host Card */}
                            <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                                <h4 className="font-display font-bold uppercase text-sm mb-4">Hosted By</h4>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white font-bold">CN</div>
                                    <div>
                                        <div className="font-bold">Club NEVA</div>
                                        <div className="text-xs text-gray-500">Official Events</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    </main>

    {/* Footer */}
    <footer className="bg-black text-white py-12 mt-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
            <button onClick={() => router.push('/')} className="font-display text-3xl font-bold uppercase tracking-widest mb-4">NEVA</button>
            <p className="text-gray-400 text-sm">&copy; 2024 NEVA. All rights reserved.</p>
        </div>
    </footer>
        </div>
      </>
    );
}