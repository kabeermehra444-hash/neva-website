'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { addToCart } from '@/lib/cart';
import { isApprovedMember } from '@/lib/auth';

export default function HomePage() {
  const router = useRouter();
  const [products, setProducts] = useState([]);
  const [events, setEvents] = useState([]);
  const [addedId, setAddedId] = useState(null);
  const [isMember, setIsMember] = useState(false);

  useEffect(() => {
    setIsMember(isApprovedMember());

    fetch('/api/products')
      .then(r => r.json())
      .then(d => setProducts(Array.isArray(d) ? d.filter(p => p.active !== false).slice(0, 4) : []))
      .catch(() => {});

    fetch('/api/events')
      .then(r => r.json())
      .then(d => setEvents(Array.isArray(d) ? d.slice(0, 2) : []))
      .catch(() => {});
  }, []);

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: parseFloat(product.price),
      image: product.image_url,
      size: Array.isArray(product.size_options) ? product.size_options[0] : 'One Size',
    });
    setAddedId(product.id);
    setTimeout(() => setAddedId(null), 1500);
  };

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
        <section className="relative min-h-screen flex items-center justify-center pt-20 overflow-hidden">
          <div className="absolute inset-0 z-0">
            <video autoPlay loop muted playsInline className="absolute inset-0 w-full h-full object-cover opacity-50">
              <source src="https://videos.pexels.com/video-files/6551539/6551539-uhd_2560_1440_25fps.mp4" type="video/mp4" />
              <source src="https://assets.mixkit.co/videos/preview/mixkit-man-plays-tennis-5737-large.mp4" type="video/mp4" />
            </video>
            <img src="https://images.unsplash.com/photo-1622228514125-9c84918e98be?q=80&w=2940&auto=format&fit=crop" alt="Pickleball" className="absolute inset-0 w-full h-full object-cover opacity-30" />
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-black/20"></div>
          </div>

          <div className="relative z-10 text-center px-6 max-w-5xl mx-auto mt-10">
            <p className="text-sm font-semibold tracking-[0.2em] text-gray-400 mb-6 uppercase">The Standard of Competition</p>
            <h1 className="font-display text-6xl md:text-9xl font-medium leading-[0.85] tracking-tighter uppercase mb-8">
              Compete.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-white via-gray-300 to-gray-500">Conquer.</span>
            </h1>
            <p className="text-lg md:text-xl text-gray-300 max-w-2xl mx-auto mb-10 font-light leading-relaxed">
              An exclusive athletic community. Host to the city's most competitive weekly round robins. Earn your rank. Claim your rewards.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <button onClick={() => router.push('/membership-apply')} className="w-full sm:w-auto px-8 py-4 bg-white text-black uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-200 active:scale-95 transition-all">
                Join the Club
</button>
              <button onClick={() => router.push('/about')} className="w-full sm:w-auto px-8 py-4 bg-transparent border border-white/30 text-white uppercase font-bold text-sm tracking-widest rounded hover:bg-white/10 active:scale-95 transition-all flex items-center justify-center gap-2">
                Explore Brand <i className="ph ph-arrow-right"></i>
              </button>
            </div>
          </div>

          {/* scroll hint */}
          <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-10 animate-bounce opacity-40">
            <i className="ph ph-caret-down text-2xl text-white"></i>
          </div>
        </section>

        {/* ─── HOW IT WORKS ─── */}
        <section className="py-24 bg-black border-y border-white/10">
          <div className="max-w-5xl mx-auto px-6 text-center">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">The System</p>
            <h2 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-16">How It Works</h2>
            <div className="grid md:grid-cols-4 gap-8 text-left">
              {[
                { num: '01', icon: 'ph-clipboard-text', title: 'Apply', desc: 'Submit your membership application. Our team reviews every applicant personally.' },
                { num: '02', icon: 'ph-check-circle', title: 'Get Approved', desc: 'Approved members gain full access to the portal, live stats, and weekly events.' },
                { num: '03', icon: 'ph-trophy', title: 'Compete', desc: 'Join weekly round robins, climb the live leaderboard, and track every win and loss.' },
                { num: '04', icon: 'ph-shirt', title: 'Rep the Brand', desc: 'Shop exclusive Club NEVA gear — hoodies, tees, shorts, caps and more in The Shop.' },
              ].map(step => (
                <div key={step.num} className="relative">
                  <div className="text-gray-800 font-display text-6xl font-bold leading-none mb-4">{step.num}</div>
                  <div className="w-10 h-10 bg-white/10 border border-white/20 rounded-lg flex items-center justify-center mb-4">
                    <i className={`ph-fill ${step.icon} text-lg text-white`}></i>
                  </div>
                  <h3 className="font-display text-xl uppercase font-bold mb-2">{step.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed">{step.desc}</p>
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
              Approved members get access to live leaderboards, real-time stat tracking, match history, and weekly event registration — all in one private dashboard.
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

        {/* ─── SHOP PREVIEW ─── */}
        <section className="py-24 md:py-32 bg-gray-50 text-black">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-12 gap-6">
              <div>
                <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase mb-4">Official Gear</h2>
  
              </div>
              <button onClick={() => router.push('/shop')} className="group text-sm font-bold uppercase tracking-wider flex items-center gap-2 hover:text-gray-600 transition-colors">
                View Full Collection <i className="ph ph-arrow-right group-hover:translate-x-1 transition-transform"></i>
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              {products.length > 0 ? products.map(product => (
                <div key={product.id} className="group cursor-pointer" onClick={() => router.push(`/product/${product.slug}`)}>
                  <div className="aspect-[4/5] bg-gray-200 mb-4 overflow-hidden rounded-lg relative">
                    {product.image_url ? (
                      <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <i className="ph ph-shirt text-5xl text-gray-400"></i>
                      </div>
                    )}
                    <button
                      onClick={(e) => handleAddToCart(e, product)}
                      className={`absolute bottom-4 left-4 right-4 py-3 text-xs font-bold uppercase tracking-widest rounded shadow-lg transition-all ${addedId === product.id ? 'bg-green-500 text-white opacity-100' : 'bg-white text-black hover:bg-gray-100 opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0'}`}
                    >
                      {addedId === product.id ? '✓ Added' : 'Quick Add'}
                    </button>
                  </div>
                  <h3 className="font-medium text-base uppercase mb-1">{product.name}</h3>
                  <p className="text-gray-500 font-bold">${parseFloat(product.price || 0).toFixed(2)}</p>
                </div>
              )) : (
                // Fallback static cards if no products in DB
                [
                  { id: 'h', name: 'Performance Hoodie', price: 85, img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=800' },
                  { id: 't', name: 'Pro Court Tee', price: 45, img: 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?q=80&w=800' },
                  { id: 's', name: 'Agility Shorts', price: 55, img: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=800' },
                  { id: 'c', name: 'Club Cap', price: 30, img: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=800' },
                ].map(item => (
                  <div key={item.id} className="group cursor-pointer" onClick={() => router.push('/shop')}>
                    <div className="aspect-[4/5] bg-gray-200 mb-4 overflow-hidden rounded-lg">
                      <img src={item.img} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                    </div>
                    <h3 className="font-medium text-base uppercase mb-1">{item.name}</h3>
                    <p className="text-gray-500 font-bold">${item.price}.00</p>
                  </div>
                ))
              )}
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
                            {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                          <p className="text-sm font-bold text-gray-500 uppercase tracking-widest mt-1">
                            {date.toLocaleDateString('en-US', { weekday: 'long' })}
                          </p>
                        </>
                      )}
                    </div>
                    <div className="md:w-1/3">
                      <h3 className="text-2xl font-display font-medium uppercase mb-1">{ev.title}</h3>
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

        {/* ─── NEWS + JOIN WIDGET ─── */}
        <section className="py-24 bg-gray-100 text-black border-t border-gray-200">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex justify-between items-end mb-12">
              <h2 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase">Dispatches</h2>
              <button onClick={() => router.push('/news-updates')} className="text-sm font-bold uppercase tracking-wider hover:text-gray-500 transition-colors hidden md:block">Read All</button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Article 1 */}
              <article className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300" onClick={() => router.push('/news-updates')}>
                <div className="aspect-video overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop" alt="Recap" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-black text-white px-3 py-1 uppercase text-[10px] font-bold tracking-widest rounded">Recap</div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="font-display text-2xl font-medium uppercase leading-tight mb-3">Fall Classic: Upsets & Glory</h3>
                  <p className="text-gray-600 line-clamp-2 mb-6 flex-1">The definitive breakdown of last weekend's tournament. Who climbed the ranks and who secured the bag.</p>
                  <p className="text-sm font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Read Story <i className="ph ph-arrow-right"></i></p>
                </div>
              </article>

              {/* Article 2 */}
              <article className="group cursor-pointer flex flex-col bg-white rounded-2xl overflow-hidden hover:shadow-xl transition-shadow duration-300" onClick={() => router.push('/news-updates')}>
                <div className="aspect-video overflow-hidden relative">
                  <img src="https://images.unsplash.com/photo-1519681393784-d120267933ba?q=80&w=1200&auto=format&fit=crop" alt="Drop" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  <div className="absolute top-4 left-4 bg-white text-black px-3 py-1 uppercase text-[10px] font-bold tracking-widest rounded shadow">Drop</div>
                </div>
                <div className="p-8 flex flex-col flex-1">
                  <h3 className="font-display text-2xl font-medium uppercase leading-tight mb-3">Winter '24 Capsule Preview</h3>
                  <p className="text-gray-600 line-clamp-2 mb-6 flex-1">Heavyweight fabrics and court-ready silhouettes. Members get early access and can redeem NEVA Cash on all new arrivals.</p>
                  <p className="text-sm font-bold uppercase tracking-widest flex items-center gap-1 group-hover:gap-2 transition-all">Read Story <i className="ph ph-arrow-right"></i></p>
                </div>
              </article>

              {/* Join Now */}
              <div className="bg-black text-white rounded-2xl overflow-hidden relative flex flex-col border border-black/10 shadow-2xl">
                <div className="absolute top-0 right-0 p-6 pointer-events-none opacity-10">
                  <i className="ph-fill ph-seal-check text-8xl text-white"></i>
                </div>
                <div className="p-10 z-10 flex-1 flex flex-col">
                  <h3 className="font-display text-4xl font-medium uppercase mb-2">Join<br />Club NEVA</h3>
                  <div className="w-12 h-1 bg-white mb-6"></div>
                  <p className="text-gray-400 mb-8 leading-relaxed font-light">
                    Apply for access to weekly events, member-only leaderboards, stat tracking, NEVA Cash, and gear discounts.
                  </p>
                  <ul className="space-y-3 mb-10 text-sm font-medium">
                    {['Weekly Round Robins', 'Official Stat Tracking', 'Live Leaderboard', 'Exclusive Gear Access'].map(item => (
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
