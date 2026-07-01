'use client';
import { useRouter } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import InstagramEmbed from '@/components/InstagramEmbed';

// ─────────────────────────────────────────────────────────────────────────────
// INSTAGRAM POSTS — paste full post URLs here to display them on this page.
//
// Format:  'https://www.instagram.com/p/POST_ID/'
//
// To add a post:   paste a new URL string into the array below.
// To remove a post: delete its line.
// To reorder posts: move lines up or down.
// ─────────────────────────────────────────────────────────────────────────────
const INSTAGRAM_POSTS = [
  'https://www.instagram.com/p/DZ5-FVfj_6-/',
  'https://www.instagram.com/p/DZVzw4fEoma/',
  'https://www.instagram.com/p/DZX9jBqjwuX/',
];
// ─────────────────────────────────────────────────────────────────────────────

// ─── Add site-native announcements here ──────────────────────────────────────
// These appear in the "From the Club" section above the Instagram feed.
// To add a new update: push a new object into this array.
const SITE_UPDATES = [
  {
    tag: 'Announcement',
    date: 'Jun 20, 2026',
    title: 'New gear dropping soon',
    excerpt: 'The next Club NEVA collection is almost here. Stay tuned for details on styles, sizing, and availability.',
  },
];
// ─────────────────────────────────────────────────────────────────────────────

const TAG_COLORS = {
  Recap: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Drop: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Feature: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Education: 'bg-green-500/20 text-green-400 border-green-500/30',
  Update: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Announcement: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function NewsUpdatesPage() {
  const router = useRouter();

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PublicNav />
      <main className="pt-20">

        {/* Header */}
        <section className="py-20 md:py-28 border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-6">
            <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">NEVA</p>
            <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tighter uppercase mb-6 text-amber-400">Updates</h1>
            <p className="text-lg text-white max-w-2xl font-light">Updates, announcements, and moments from the courts.</p>
          </div>
        </section>

        {/* ─── From the Club — manually-added site updates ─── */}
        <section className="py-16 border-b border-white/10">
          <div className="max-w-[1600px] mx-auto px-6">
            <h2 className="font-display text-2xl font-medium uppercase tracking-tight mb-8 text-gray-400">From the Club</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {SITE_UPDATES.map((update, i) => (
                <div key={i} className="bg-white/5 border border-white/10 rounded-2xl p-8 flex flex-col hover:border-white/20 hover:bg-white/8 transition-all duration-300">
                  <div className="flex items-center gap-3 mb-5">
                    <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded border ${TAG_COLORS[update.tag] ?? TAG_COLORS.Update}`}>
                      {update.tag}
                    </span>
                    <span className="text-gray-500 text-xs">{update.date}</span>
                  </div>
                  <h3 className="font-display text-2xl font-medium uppercase leading-tight mb-3">{update.title}</h3>
                  <p className="text-gray-400 text-sm leading-relaxed flex-1">{update.excerpt}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Recent on Instagram ─── */}
        <section className="py-16">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="flex items-end justify-between mb-8">
              <h2 className="font-display text-2xl font-medium uppercase tracking-tight text-gray-400">Recent on Instagram</h2>
              <a
                href="https://instagram.com/club.neva"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-1"
              >
                @club.neva <i className="ph ph-arrow-up-right"></i>
              </a>
            </div>

            {INSTAGRAM_POSTS.length === 0 ? (
              /* Shown when no post URLs have been added yet */
              <div className="border border-dashed border-white/20 rounded-2xl p-12 text-center">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-amber-500 flex items-center justify-center mx-auto mb-4">
                  <i className="ph-fill ph-instagram-logo text-2xl text-white"></i>
                </div>
                <p className="text-gray-500 text-sm mb-2">No posts added yet.</p>
                <p className="text-gray-600 text-xs max-w-sm mx-auto">
                  Open <code className="bg-white/10 px-1 rounded">app/news-updates/page.jsx</code> and paste
                  Instagram post URLs into the <code className="bg-white/10 px-1 rounded">INSTAGRAM_POSTS</code> array at the top of the file.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {INSTAGRAM_POSTS.map((url, i) => (
                  <InstagramEmbed key={i} url={url} />
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ─── Join widget ─── */}
        <section className="py-16 border-t border-white/10">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="bg-white text-black rounded-2xl overflow-hidden">
              <div className="p-10 md:p-16 flex flex-col md:flex-row md:items-center gap-10">
                <div className="flex-1">
                  <div className="w-12 h-12 bg-black rounded-xl flex items-center justify-center mb-6">
                    <i className="ph-fill ph-seal-check text-2xl text-white"></i>
                  </div>
                  <h3 className="font-display text-4xl font-medium uppercase mb-2">Join Club NEVA</h3>
                  <div className="w-10 h-1 bg-black mb-6"></div>
                  <p className="text-gray-600 leading-relaxed max-w-lg">
                    Access weekly round robins, live leaderboards, stat tracking, and exclusive member rewards.
                  </p>
                </div>
                <div className="flex flex-col gap-3 md:min-w-[220px]">
                  <button
                    onClick={() => router.push('/membership-apply')}
                    className="w-full py-4 bg-black text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-800 active:scale-95 transition-all"
                  >
                    Join the Club
                  </button>
                  <button
                    onClick={() => router.push('/login')}
                    className="w-full py-4 border-2 border-black text-black font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-50 active:scale-95 transition-all"
                  >
                    Member Login
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
