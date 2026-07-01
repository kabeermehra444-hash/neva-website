'use client';
import { useRouter } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

export default function AboutPage() {
  const router = useRouter();

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PublicNav />
      <main className="pt-20">

        {/* ── HERO ─────────────────────────────────────────────────────── */}
        <section className="flex flex-col" style={{minHeight:'72vh', backgroundColor:'#1c1c1e'}}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 w-full flex flex-col flex-1">

            {/* Top line */}
            <div className="border-t border-white/10 pt-10 lg:pt-14 flex-shrink-0">
              <div className="w-8 h-px bg-amber-400/50 mb-5"></div>
              <span className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/25">NEVA · Los Angeles · Est. 2025</span>
            </div>

            {/* Headline + tagline as one block */}
            <div className="flex-1 flex items-end pb-14 lg:pb-20">
              <div className="w-full">
                <h1
                  className="font-display font-bold uppercase text-white leading-[0.86] tracking-tighter mb-8"
                  style={{fontSize:'clamp(64px, 11vw, 152px)'}}
                >
                  The<br />Philosophy<br />of NEVA.
                </h1>
                <div className="md:pl-2 max-w-sm">
                  <p className="text-white/60 text-base md:text-lg font-light leading-relaxed">
                    Apparel, events, and competition. LA's club for players who show up.
                  </p>
                </div>
              </div>
            </div>

          </div>
        </section>

        {/* ── MANIFESTO ────────────────────────────────────────────────── */}
        <section className="text-white" style={{backgroundColor:'#1c1c1e'}}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 md:py-32">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

              <div>
                <div className="w-8 h-px bg-white/20 mb-8"></div>
                <h2 className="font-display text-5xl md:text-6xl lg:text-[72px] uppercase font-bold tracking-tighter leading-[0.87]">
                  Built for<br />Players Who<br />Mean It.
                </h2>
              </div>

              <div>
                <p className="text-white/60 text-base leading-relaxed">
                  A community built around people who genuinely love the game. Show up, compete, and be part of something that takes it seriously.
                </p>
              </div>

            </div>
          </div>
        </section>

        {/* ── STATS BAR ────────────────────────────────────────────────── */}
        <section className="bg-black border-y border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
            <div className="grid grid-cols-2 md:grid-cols-4">
              {[
                { val: 'Weekly', label: 'Round Robins',   sub: 'Year-round' },
                { val: '100%',   label: 'Member Curated', sub: 'Application required' },
                { val: 'Live',   label: 'Leaderboard',    sub: 'Real-time results' },
                { val: 'NEVA',   label: 'Cash Rewards',   sub: 'Earned through wins' },
              ].map((s, i) => (
                <div
                  key={s.label}
                  className={`py-12 px-5 lg:px-8 ${i % 2 !== 0 ? 'border-l border-white/10' : ''} ${i >= 2 ? 'border-t md:border-t-0 border-white/10' : ''} ${i === 2 ? 'md:border-l md:border-white/10' : ''}`}
                >
                  <p className="font-display text-4xl md:text-5xl font-bold mb-2 text-white">{s.val}</p>
                  <p className="text-white text-xs font-bold uppercase tracking-widest mb-1">{s.label}</p>
                  <p className="text-white/40 text-xs">{s.sub}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── CORE PILLARS ─────────────────────────────────────────────── */}
        <section className="bg-black">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 pt-20 md:pt-28">
            <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-white/20 pb-12 border-b border-white/10">
              What NEVA is built around
            </p>
          </div>
          {[
            { num: '01', title: 'Play',   desc: 'Weekly competition, live rankings, and results that matter.' },
            { num: '02', title: 'Wear',   desc: 'Limited pieces built to represent the club — on the court and off it.' },
            { num: '03', title: 'Belong', desc: 'A curated group of people who take the game seriously.' },
          ].map((p) => (
            <div key={p.title} className="border-b border-white/10">
              <div className="max-w-[1400px] mx-auto px-6 lg:px-12">
                <div className="py-10 md:py-12 grid grid-cols-[48px_1fr] md:grid-cols-[64px_1fr_260px] items-center gap-4 md:gap-8">
                  <span className="font-display text-xs font-bold text-amber-400/50 tabular-nums">{p.num}</span>
                  <h3
                    className="font-display font-bold uppercase tracking-tighter text-white leading-none"
                    style={{fontSize:'clamp(48px,9vw,128px)'}}
                  >
                    {p.title}
                  </h3>
                  <p className="hidden md:block text-white text-sm leading-relaxed text-right">{p.desc}</p>
                </div>
                <p className="md:hidden text-white text-sm leading-relaxed pb-8 pl-14">{p.desc}</p>
              </div>
            </div>
          ))}
          <div className="pb-4"></div>
        </section>

        {/* ── WHY THE BEE ──────────────────────────────────────────────── */}
        <section className="bg-black border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-28 md:py-40">

            <div className="flex justify-center mb-20 md:mb-28">
              <div className="relative">
                <div
                  className="absolute pointer-events-none"
                  style={{
                    inset: '-80px',
                    background: 'radial-gradient(circle, rgba(251,191,36,0.14) 0%, transparent 65%)',
                    filter: 'blur(50px)',
                  }}
                ></div>
                <img
                  src="/bee.png"
                  alt="NEVA bee"
                  className="relative z-10"
                  style={{width:'clamp(180px,22vw,300px)', opacity:1}}
                />
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-10 lg:gap-20 items-end">
              <h2
                className="font-display font-bold uppercase tracking-tighter text-white leading-[0.87]"
                style={{fontSize:'clamp(52px,8vw,112px)'}}
              >
                Why the<br /><span className="text-amber-400">Bee.</span>
              </h2>
              <div>
                <div className="w-8 h-px bg-amber-400/40 mb-6"></div>
                <p className="text-white text-base md:text-lg leading-relaxed">
                  A bee commits entirely. No half measures, no exceptions. The bee isn't decoration — it's the standard we hold ourselves to.
                </p>
              </div>
            </div>

          </div>
        </section>

        {/* ── NEVA CASH ────────────────────────────────────────────────── */}
        <section className="border-t border-white/10" style={{backgroundColor:'#111111'}}>
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 md:py-32">
            <div className="grid md:grid-cols-2 gap-16 lg:gap-24 items-center">

              <div>
                <p className="text-[10px] font-bold uppercase tracking-[0.4em] text-amber-400/60 mb-8">Member Rewards</p>
                <h2
                  className="font-display font-bold uppercase tracking-tighter text-white leading-[0.87] mb-8"
                  style={{fontSize:'clamp(52px,7vw,100px)'}}
                >
                  NEVA<br />Cash
                </h2>
                <p className="text-white text-base leading-relaxed mb-10 max-w-xs">
                  Earn NEVA Cash through wins and event performance. Redeem it in The Shop toward any purchase — your balance will be applied at checkout.
                </p>
                <button
                  onClick={() => router.push('/membership-apply')}
                  className="px-8 py-4 bg-white text-black font-bold uppercase text-xs tracking-widest rounded hover:bg-gray-100 active:scale-95 transition-all"
                >
                  Join to Earn
                </button>
              </div>

              <div>
                {[
                  { word: 'Wins',    opacity: 0.30 },
                  { word: 'Podiums', opacity: 0.18 },
                  { word: 'Events',  opacity: 0.10 },
                ].map(({word, opacity}) => (
                  <p
                    key={word}
                    className="font-display font-bold uppercase tracking-tighter leading-[0.85] text-amber-400"
                    style={{fontSize:'clamp(52px,7vw,100px)', opacity}}
                  >
                    {word}
                  </p>
                ))}
                <div className="mt-8 pt-8 border-t border-white/10">
                  <p className="text-white/25 text-xs uppercase tracking-widest font-bold">Applied at checkout · The Shop</p>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ── JOIN CTA ─────────────────────────────────────────────────── */}
        <section className="bg-zinc-900 text-white border-t border-white/10">
          <div className="max-w-[1400px] mx-auto px-6 lg:px-12 py-24 md:py-32">
            <div className="grid md:grid-cols-2 gap-12 lg:gap-20 items-end">

              <h2
                className="font-display font-bold uppercase text-white leading-[0.86] tracking-tighter"
                style={{fontSize:'clamp(52px,8vw,112px)'}}
              >
                Ready<br />to Join<br />the Club?
              </h2>

              <div>
                <p className="text-white/60 leading-relaxed mb-8 text-base max-w-sm">
                  Applications are open. Submit yours and our team will review within 24 hours.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => router.push('/membership-apply')}
                    className="px-8 py-4 bg-white text-black font-bold uppercase text-xs tracking-widest rounded hover:bg-gray-100 active:scale-95 transition-all whitespace-nowrap"
                  >
                    Apply Now
                  </button>
                  <button
                    onClick={() => router.push('/events')}
                    className="px-8 py-4 border border-white/20 text-white font-bold uppercase text-xs tracking-widest rounded hover:bg-white/5 active:scale-95 transition-all whitespace-nowrap"
                  >
                    View Events
                  </button>
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
