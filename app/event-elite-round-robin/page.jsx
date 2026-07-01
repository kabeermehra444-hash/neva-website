'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function EventEliteRoundRobinPage() {
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
        const eliteEvent = Array.isArray(eventsData) ? eventsData.find(e => e.slug === 'event-elite-round-robin' || e.name === 'Elite Round Robin') : null;
        
        if (eliteEvent) {
          setEvent(eliteEvent);
          
          const regRes = await fetch(`/api/event-registrations?event_id=${eliteEvent.id}`);
          const regData = await regRes.json();
          setRegistrations(Array.isArray(regData) ? regData : []);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error fetching event data:', error);
        setLoading(false);
      }
    }
    
    fetchEventData();
  }, []);

  const handleEventRegistration = async (eventName) => {
    const isMember = localStorage.getItem('clubNevaMember') === 'true';
    const isLoggedIn = localStorage.getItem('clubNevaLoggedIn') === 'true';
    const memberId = localStorage.getItem('clubNevaMemberId');
    
    if (!isMember) {
      if (confirm('Club NEVA membership is required to register for events.\n\nWould you like to apply for membership now?')) {
        localStorage.setItem('returnToEvent', 'event_elite_round_robin');
        router.push('/membership-apply');
      }
    } else if (!isLoggedIn) {
      if (confirm('Please log in to register for this event.')) {
        localStorage.setItem('returnToEvent', 'event_elite_round_robin');
        router.push('/login');
      }
    } else {
      if (confirm(`Register for ${eventName}?\n\nYou'll be charged $45 and receive a confirmation email.`)) {
        try {
          const res = await fetch('/api/event-registrations', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              event_id: event?.id,
              member_id: memberId,
              registration_type: 'registration',
              status: 'confirmed'
            })
          });
          
          if (res.ok) {
            alert('✓ Registration successful!\n\nYou\'re registered for ' + eventName + '. Check your email for details.');
            window.location.reload();
          } else {
            alert('Registration failed. Please try again.');
          }
        } catch (error) {
          console.error('Error registering for event:', error);
          alert('Registration failed. Please try again.');
        }
      }
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;

  const spotsLeft = event?.spots_left || 2;
  const capacity = event?.capacity || 16;
  const registeredCount = registrations.length || 14;
  const eventPrice = event?.price || 45;

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
      <section className="relative h-[300px] md:h-[400px] bg-gradient-to-br from-gray-900 via-gray-800 to-black">
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1554068865-24cecd4e34b8?w=1200')] bg-cover bg-center opacity-40"></div>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
          <div className="relative h-full max-w-5xl mx-auto px-6 flex flex-col justify-end pb-12">
              <div className="flex items-center gap-2 mb-4">
                  <span className="px-3 py-1 bg-red-600 text-white text-xs font-bold uppercase tracking-widest rounded-full">{spotsLeft} Spots Left</span>
                  <span className="px-3 py-1 bg-white/10 backdrop-blur text-white text-xs font-bold uppercase tracking-widest rounded-full">Round Robin</span>
              </div>
              <h1 className="font-display text-4xl md:text-6xl font-bold uppercase tracking-tighter text-white mb-3">{event?.name || 'Elite Round Robin'}</h1>
              <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                  <span className="flex items-center gap-1.5"><i className="ph-bold ph-calendar-blank"></i> Thursday, Oct 24, 2024</span>
                  <span className="flex items-center gap-1.5"><i className="ph-bold ph-clock"></i> 7:00 PM - 10:00 PM</span>
                  <span className="flex items-center gap-1.5"><i className="ph-bold ph-map-pin"></i> {event?.location || 'Northside Athletic Club'}</span>
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
                              <p>{event?.description || 'Join us for an elite-level round robin tournament designed for competitive players. This exclusive event brings together the top talent in the Club NEVA community for an evening of high-intensity matches.'}</p>
                              <p className="mt-4">Format: Round robin singles play with guaranteed 4-6 matches per player. All matches are best of 3 sets with match tiebreak in lieu of third set.</p>
                              <p className="mt-4"><strong>What's Included:</strong></p>
                              <ul className="list-disc pl-5 mt-2 space-y-1">
                                  <li>Premium court time at Northside Athletic Club</li>
                                  <li>Professional tournament balls</li>
                                  <li>Post-match refreshments and social</li>
                                  <li>NEVA swag for all participants</li>
                              </ul>
                          </div>
                      </div>

                      <div className="border-t border-gray-200 pt-8">
                          <h3 className="font-display text-xl font-bold uppercase mb-4">Event Details</h3>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                  <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Skill Level</span>
                                  <span className="font-medium">4.5 - 5.5 NTRP</span>
                              </div>
                              <div>
                                  <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Format</span>
                                  <span className="font-medium">Singles Round Robin</span>
                              </div>
                              <div>
                                  <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Registration Deadline</span>
                                  <span className="font-medium">Oct 23, 11:59 PM</span>
                              </div>
                              <div>
                                  <span className="text-gray-500 uppercase text-xs font-bold tracking-wider block mb-1">Cancellation Policy</span>
                                  <span className="font-medium">48 hours notice</span>
                              </div>
                          </div>
                      </div>

                      {/* Guest List */}
                      <div className="border-t border-gray-200 pt-8">
                          <h3 className="font-display text-xl font-bold uppercase mb-4">Registered Players ({registeredCount} / {capacity})</h3>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                              {Array.isArray(registrations) && registrations.length > 0 ? registrations.map((reg, index) => {
                                const firstName = reg.member?.first_name || 'Member';
                                const lastName = reg.member?.last_name || '';
                                const fullName = `${firstName} ${lastName}`.trim();
                                const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
                                const colors = [
                                  'from-blue-500 to-purple-600',
                                  'from-green-500 to-teal-600',
                                  'from-orange-500 to-red-600',
                                  'from-purple-500 to-pink-600',
                                  'from-indigo-500 to-blue-600',
                                  'from-yellow-500 to-orange-600',
                                  'from-pink-500 to-rose-600',
                                  'from-teal-500 to-green-600',
                                  'from-red-500 to-pink-600',
                                  'from-cyan-500 to-blue-600',
                                  'from-violet-500 to-purple-600',
                                  'from-lime-500 to-green-600',
                                  'from-fuchsia-500 to-pink-600',
                                  'from-amber-500 to-orange-600'
                                ];
                                const colorClass = colors[index % colors.length];
                                
                                return (
                                  <div key={reg.id} className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${colorClass} flex items-center justify-center text-white font-bold text-sm`}>{initials}</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">{fullName}</div>
                                      </div>
                                  </div>
                                );
                              }) : (
                                <>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">MJ</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Marcus Johnson</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">AR</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Alex Rivera</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white font-bold text-sm">SK</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Sarah Kim</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">JC</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">James Chen</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">EP</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Emma Park</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-yellow-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">DW</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">David Wong</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-pink-500 to-rose-600 flex items-center justify-center text-white font-bold text-sm">LM</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Lisa Martinez</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">RT</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Ryan Taylor</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">NH</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Nina Harris</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-white font-bold text-sm">KL</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Kevin Lee</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">AB</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Amy Brooks</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-lime-500 to-green-600 flex items-center justify-center text-white font-bold text-sm">TN</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Tom Nelson</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-fuchsia-500 to-pink-600 flex items-center justify-center text-white font-bold text-sm">JD</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Julia Davis</div>
                                      </div>
                                  </div>
                                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-white font-bold text-sm">MC</div>
                                      <div className="flex-1 min-w-0">
                                          <div className="font-medium text-sm truncate">Mike Cooper</div>
                                      </div>
                                  </div>
                                </>
                              )}
                          </div>
                      </div>
                  </div>

                  {/* Sidebar */}
                  <div className="md:col-span-1">
                      <div className="md:sticky md:top-24 space-y-6">
                          {/* Registration Card */}
                          <div className="border border-gray-200 rounded-2xl p-6 bg-white shadow-sm">
                              <div className="flex items-baseline justify-between mb-6">
                                  <span className="text-3xl font-display font-bold">${eventPrice}</span>
                                  <span className="text-gray-500 text-sm">per player</span>
                              </div>
                              
                              <button onClick={() => handleEventRegistration(event?.name || 'Elite Round Robin')} className="w-full py-4 bg-black text-white font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-800 transition-all active:scale-95 mb-4">
                                  Register Now
                              </button>
                              
                              <div className="space-y-3 text-sm text-gray-600">
                                  <div className="flex items-center gap-2">
                                      <i className="ph-fill ph-check-circle text-green-600"></i>
                                      <span>Members Only Event</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <i className="ph-fill ph-check-circle text-green-600"></i>
                                      <span>{registeredCount} / {capacity} Spots Filled</span>
                                  </div>
                                  <div className="flex items-center gap-2">
                                      <i className="ph-fill ph-check-circle text-green-600"></i>
                                      <span>Guaranteed 4-6 Matches</span>
                                  </div>
                              </div>
                          </div>

                          {/* Location Card */}
                          <div className="border border-gray-200 rounded-2xl p-6 bg-white">
                              <h4 className="font-display font-bold uppercase text-sm mb-4">Location</h4>
                              <p className="font-medium mb-2">Northside Athletic Club</p>
                              <p className="text-sm text-gray-600 mb-4">1247 Peachtree St NE<br />Atlanta, GA 30309</p>
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