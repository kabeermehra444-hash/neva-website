'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { isApprovedMember } from '@/lib/auth';
import { SHOPIFY_PRODUCTS } from '@/lib/shopify-products';
import { fetchProductImages } from '@/lib/shopify-storefront';
import InstagramEmbed from '@/components/InstagramEmbed';

// ─────────────────────────────────────────────────────────────────────────────
// HOMEPAGE INSTAGRAM POSTS — paste up to 2 post URLs here to show real
// embedded posts in the Dispatches section. The 3rd slot is always the
// Join widget, so 2 posts fill the grid perfectly.
//
// Format:  'https://www.instagram.com/p/POST_ID/'
//
// To add a post:   paste a URL string into the array.
// To remove:       delete its line.
// ─────────────────────────────────────────────────────────────────────────────
const HOMEPAGE_INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DZ5-FVfj_6-/',
  'https://www.instagram.com/p/DZVzw4fEoma/',
  'https://www.instagram.com/p/DZX9jBqjwuX/',
];
// ─────────────────────────────────────────────────────────────────────────────

export default function HomePage() {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [isMember, setIsMember] = useState(false);
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    setIsMember(isApprovedMember());

    fetchProductImages(SHOPIFY_PRODUCTS.map(p => p.id))
      .then(setImageUrls)
      .catch(() => {});

    fetch('/api/events')
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d.slice(0, 2) : []))
      .catch(() => {});
  }, []);

  const handleEventRegister = (ev) => {
    if (!isMember) {
      router.push('/membership-apply');
    } else {
      router.push(`/events/${ev.slug || ev.id}`);
    }
  };

  return (
    <div className="font-sans bg-black text-white antialiased selection:bg-white selection:text-black">
      <PublicNav />

      <main>
        {/* ─── HERO ─── */}
        <section className="relative overflow-hidden pt-20 flex flex-col" style={{backgroundColor:'#1c1c1e', minHeight:'78vh'}}>

          {/* Top metadata strip */}
          <div className="border-y border-white/8 px-6 lg:px-12 py-3 flex-shrink-0">
            <span className="text-[10px] font-bold uppercase tracking-[0.35em] text-white/25">NEVA · PICKLEBALL · LOS ANGELES</span>
          </div>

          {/* Main body — headline left, logo right */}
          <div className="flex-1 px-6 lg:px-12 py-10 lg:py-12 flex items-center gap-8 xl:gap-16">

            {/* Headline block */}
            <div className="flex-1 min-w-0">
              {/* Logo mark — mobile only, sits above headline as a small emblem */}
              {/* Logo mark — mobile only, centered above headline with the same ambient glow as desktop */}
              <div className="lg:hidden mb-6 flex justify-center relative">
                <div
                  className="absolute pointer-events-none"
                  style={{
                    width: '180px', height: '180px',
                    background: 'radial-gradient(circle at 50% 55%, rgba(251,191,36,0.22) 0%, rgba(251,191,36,0.08) 40%, transparent 70%)',
                    filter: 'blur(20px)',
                  }}
                ></div>
                <img
                  src="/bee.png"
                  alt="NEVA"
                  aria-hidden="true"
                  className="relative z-10 h-16 w-auto object-contain"
                  style={{ opacity: 0.75 }}
                />
              </div>
              <h1
                className="font-display font-bold uppercase text-amber-400 leading-[0.86] tracking-tighter"
                style={{fontSize:'clamp(40px, 11.5vw, 152px)'}}
              >
                The Club<br />You Wear.
              </h1>
            </div>

            {/* Logo — desktop only, right column with warm amber glow */}
            <div className="hidden lg:flex items-center justify-center flex-shrink-0 relative" style={{width:'clamp(180px, 18vw, 280px)'}}>
              {/* Amber ambient glow */}
              <div className="absolute pointer-events-none" style={{
                width:'100%', height:'100%',
                background:'radial-gradient(circle at 50% 55%, rgba(251,191,36,0.18) 0%, rgba(251,191,36,0.06) 40%, transparent 70%)',
                filter:'blur(24px)',
                transform:'scale(1.6)',
              }}></div>
              <img
                src="/bee.png"
                alt="NEVA"
                className="relative z-10 w-full h-auto object-contain"
                style={{opacity:0.68}}
              />
            </div>
          </div>

          {/* Bottom strip — description left, CTAs right */}
          <div className="border-t border-white/8 px-6 lg:px-12 py-5 lg:py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 flex-shrink-0">
            <p className="text-white text-sm leading-relaxed max-w-xs font-light">
              Where apparel, events, and competition come together to create a pickleball community that extends beyond the court.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 flex-shrink-0">
              <button
                onClick={() => router.push('/membership-apply')}
                className="px-7 py-3 bg-white text-black uppercase font-bold text-xs tracking-widest rounded hover:bg-gray-100 active:scale-95 transition-all whitespace-nowrap"
              >
                Join the Club
              </button>
              <button
                onClick={() => router.push('/shop')}
                className="px-7 py-3 border border-white/20 text-white uppercase font-bold text-xs tracking-widest rounded hover:bg-white/8 active:scale-95 transition-all flex items-center gap-2 whitespace-nowrap"
              >
                Explore Shop <i className="ph ph-arrow-right text-xs"></i>
              </button>
            </div>
          </div>

        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-24 bg-black border-y border-white/10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">The System</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-16">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8 text-left">
              {[
                { num: '01', icon: 'ph-user-circle-plus', title: 'Join', route: '/membership-apply', desc: 'Sign up for Club NEVA membership and get instant access to pickleball events, competitive rankings, and everything the club has to offer.' },
                { num: '02', icon: 'ph-calendar-check', title: 'Play', route: '/events', desc: 'Browse upcoming round robins and reserve your spot directly through the member portal.' },
                { num: '03', icon: 'ph-trophy', title: 'Compete', route: '/portal-leaderboard', desc: 'Play weekly, climb the leaderboard, and earn rewards based on your results and performance.' },
                { num: '04', icon: 'ph-shopping-bag', title: 'Shop', route: '/shop', desc: 'Browse NEVA gear and spend your earned rewards at checkout on any item in The Shop.' },
              ].map(step => (
                <button
                  key={step.num}
                  type="button"
                  onClick={() => router.push(step.route)}
                  className="relative group text-left transition-transform duration-200 hover:-translate-y-1 cursor-pointer"
                >
                  <div className="text-amber-400 font-display text-6xl font-bold leading-none mb-4">{step.num}</div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center mb-4">
                    <i className={`ph-fill ${step.icon} text-lg text-white`}></i>
                  </div>
                  <h3 className="font-display text-xl uppercase font-bold mb-2 flex items-center gap-2">
                    {step.title}
                    <i className="ph ph-arrow-right text-sm opacity-0 group-hover:opacity-100 transition-opacity duration-200"></i>
                  </h3>
                  <p className="text-white text-sm leading-relaxed">{step.desc}</p>
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* ─── SHOP PREVIEW ─── */}
        <section className="py-24 md:py-32 bg-gray-50 text-black">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase mb-4">Official Gear</h2>
                <button
                  onClick={() => router.push('/portal-neva-cash')}
                  className="flex items-center gap-2 bg-black text-white px-3 py-1.5 rounded-full w-fit hover:bg-gray-800 transition-colors group"
                >
                  <i className="ph-fill ph-medal text-sm text-amber-400"></i>
                  <p className="text-xs font-medium uppercase tracking-wide">Redeemable with NEVA Cash</p>
                  <i className="ph ph-arrow-right text-xs text-gray-400 group-hover:translate-x-0.5 transition-transform"></i>
                </button>
              </div>
              <button onClick={() => router.push('/shop')} className="group text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:text-gray-600 transition-colors">
                View Full Collection <i className="ph ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {SHOPIFY_PRODUCTS.map(product => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/product/${product.slug}`)}
                >
                  <div className="aspect-[4/5] mb-4 overflow-hidden rounded-lg">
                    {imageUrls[product.id] ? (
                      <img
                        src={imageUrls[product.id]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 bg-zinc-200"
                      />
                    ) : product.soldOut ? (
                      <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center relative overflow-hidden">
                        <i className="ph-fill ph-tag absolute text-[100px] text-white/5 blur-sm -rotate-12"></i>
                        <div className="relative z-10 flex flex-col items-center gap-2">
                          <div className="w-8 h-px bg-white/25"></div>
                          <p className="font-display text-[11px] font-bold uppercase tracking-[0.25em] text-white/50">Sold Out</p>
                          <div className="w-8 h-px bg-white/25"></div>
                        </div>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                        <i className="ph ph-shirt text-5xl text-zinc-400 group-hover:text-zinc-500 transition-colors duration-300"></i>
                      </div>
                    )}
                  </div>
                  {product.category && (
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-gray-400">{product.category}</p>
                  )}
                  <h3 className="font-medium text-base uppercase group-hover:text-gray-500 transition-colors">{product.name}</h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── MEMBERS ONLY TEASER ─── */}
        <section className="py-32 bg-black relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-white/3 rounded-full blur-3xl pointer-events-none"></div>
          <div className="max-w-4xl mx-auto px-6 relative z-10 text-center flex flex-col items-center">
            <div className="w-20 h-20 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-8 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <i className="ph-fill ph-lock-key text-4xl text-white"></i>
            </div>
            <h2 className="font-display text-4xl md:text-6xl font-medium tracking-tight uppercase mb-6 leading-tight">
              Members Only:<br /><span className="text-gray-500">The Portal</span>
            </h2>
            <p className="text-lg text-gray-400 mb-10 max-w-2xl text-center font-light leading-relaxed">
              Approved members get access to live leaderboards, real-time stat tracking, weekly events, and their NEVA Cash balance, all in one private dashboard.
            </p>

            <div className="w-full max-w-3xl h-36 md:h-52 border border-white/10 bg-white/5 rounded-xl overflow-hidden mb-12 relative select-none">
              <div className="h-full w-full flex flex-col justify-between p-6 opacity-20 filter blur-sm">
                <div className="flex justify-between items-center border-b border-white/20 pb-4">
                  <div className="w-32 h-4 bg-white rounded"></div>
                  <div className="w-16 h-4 bg-white rounded"></div>
                </div>
                <div className="space-y-4">
                  <div className="w-full h-8 bg-white/50 rounded"></div>
                  <div className="w-3/4 h-8 bg-white/30 rounded"></div>
                </div>
              </div>
              <div className="absolute inset-0 flex items-center justify-center backdrop-blur-[2px]">
                <span className="px-4 py-2 border border-white/20 bg-black/80 rounded uppercase text-xs font-bold tracking-widest">Members Only</span>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={() => router.push('/membership-apply')} className="px-8 py-4 bg-white text-black uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-200 active:scale-95 transition-all">
                Join the Club
              </button>
              <button onClick={() => router.push('/login')} className="px-8 py-4 bg-transparent border border-white/30 text-white uppercase font-bold text-sm tracking-widest rounded hover:bg-white/10 active:scale-95 transition-all">
                Member Login
              </button>
            </div>
          </div>
        </section>

        {/* ─── EVENTS ─── */}
        <section className="py-24 bg-white text-black border-t border-gray-200">
          <div className="max-w-5xl mx-auto px-6">
            <div className="flex justify-between items-end mb-12 border-b border-black pb-4">
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase">Upcoming Events</h2>
              <button onClick={() => router.push('/events')} className="text-sm font-bold uppercase tracking-wider hover:text-gray-500 transition-colors hidden md:block">All Events</button>
            </div>

            <div className="divide-y divide-gray-200">
              {events.length > 0 ? events.map(ev => {
                const date = ev.date_time ? new Date(ev.date_time) : null;
                return (
                  <div key={ev.id} className="py-8 flex flex-col md:flex-row md:items-center justify-between gap-6 group hover:bg-gray-50 -mx-6 px-6 transition-colors">
                    <div className="md:w-1/3">
                      {date && (
                        <>
                          <p className="font-display text-3xl font-bold uppercase leading-none">
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}
                          </p>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {date.toLocaleDateString('en-US', { weekday: 'long', timeZone: 'America/Los_Angeles' })}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="md:w-1/3">
                      <h3 className="text-2xl font-display font-medium uppercase mb-1">{ev.title || ev.name}</h3>
                      {ev.location && <p className="text-gray-600 flex items-center gap-2"><i className="ph ph-map-pin text-lg"></i>{ev.location}</p>}
                    </div>
                    <div className="md:w-1/3 flex md:justify-end">
                      <button onClick={() => handleEventRegister(ev)} className="w-full md:w-auto px-8 py-4 bg-black text-white uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-800 transition-colors">
                        {isMember ? 'Register' : 'Join to Register'}
                      </button>
                    </div>
                  </div>
                );
              }) : (
                // Fallback if no events yet
                <div className="py-16 text-center">
                  <p className="text-gray-500">Events coming soon.</p>
                  <button onClick={() => router.push('/events')} className="mt-4 text-black font-bold uppercase text-sm tracking-wide hover:text-gray-500 transition-colors">
                    View Events Page →
                  </button>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* ─── DISPATCHES + JOIN WIDGET ─── */}
        <section className="py-24 bg-gray-100 text-black border-t border-gray-200">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase">Dispatches</h2>
                <p className="text-gray-500 text-sm mt-2">Updates &amp; moments from the courts</p>
              </div>
              <button onClick={() => router.push('/news-updates')} className="text-sm font-bold uppercase tracking-wider hover:text-gray-500 transition-colors hidden md:block">View All</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Instagram slots — filled from HOMEPAGE_INSTAGRAM_POSTS above */}
              {[0, 1].map(i =>
                HOMEPAGE_INSTAGRAM_POSTS[i] ? (
                  <InstagramEmbed key={i} url={HOMEPAGE_INSTAGRAM_POSTS[i]} />
                ) : (
                  /* Fallback placeholder shown until a URL is added */
                  <a
                    key={i}
                    href="https://instagram.com/club.neva"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300"
                  >
                    <div className="aspect-video bg-gradient-to-br from-rose-50 via-pink-50 to-orange-50 flex items-center justify-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-amber-500 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                        <i className="ph-fill ph-instagram-logo text-3xl text-white"></i>
                      </div>
                    </div>
                    <div className="p-8 flex flex-col flex-1">
                      <p className="text-[11px] font-bold uppercase tracking-widest text-gray-400 mb-3">Instagram</p>
                      <h3 className="font-display text-2xl font-medium uppercase leading-tight mb-3">@club.neva</h3>
                      <p className="text-gray-600 text-sm line-clamp-2 mb-6 flex-1">Court moments, event coverage, and new arrivals.</p>
                      <p className="text-sm font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">
                        View on Instagram <i className="ph ph-arrow-up-right"></i>
                      </p>
                    </div>
                  </a>
                )
              )}

              {/* Join Now */}
              <div className="bg-black text-white rounded-2xl overflow-hidden relative flex flex-col border border-black/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
                  <i className="ph-fill ph-seal-check text-8xl text-white"></i>
                </div>
                <div className="p-10 z-10 flex-1 flex flex-col">
                  <h3 className="font-display text-4xl font-medium uppercase mb-2">Join<br />Club NEVA</h3>
                  <div className="w-12 h-1 bg-white mb-6"></div>
                  <p className="text-gray-400 mb-8 leading-relaxed font-light">
                    Access weekly events, member leaderboards, stat tracking, and NEVA Cash rewards.
                  </p>
                  <ul className="space-y-3 mb-10 text-sm font-medium">
                    {['Weekly Round Robins', 'Official Stat Tracking', 'NEVA Cash Rewards', 'Member-Only Events'].map(item => (
                      <li key={item} className="flex items-center gap-3">
                        <i className="ph ph-check text-white bg-white/20 p-1 rounded-full text-xs"></i>
                        {item}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-auto space-y-3">
                    <button onClick={() => router.push('/membership-apply')} className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-200 active:scale-95 transition-all">
                      Join the Club
                    </button>
                    <button onClick={() => router.push('/login')} className="w-full py-4 bg-white/10 text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-white/20 active:scale-95 transition-all">
                      Member Login
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
