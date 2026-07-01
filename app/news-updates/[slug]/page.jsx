'use client';

import { useRouter, useParams } from 'next/navigation';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';

const ARTICLES = [
  { slug: 'fall-classic-upsets-glory', tag: 'Recap', date: 'Jun 20, 2026', title: 'Fall Classic: Upsets & Glory', excerpt: 'The definitive breakdown of last weekend\'s tournament. See who climbed the ranks and who secured the bag in the final showdown.', img: 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'winter-26-capsule-preview', tag: 'Drop', date: 'Jun 14, 2026', title: 'Winter \'26 Capsule Preview', excerpt: 'Heavyweight fabrics and court-ready silhouettes. Members get 24-hour early access and can redeem NEVA Cash on all new arrivals.', img: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'community-spotlight-marcus-c', tag: 'Feature', date: 'Jun 8, 2026', title: 'Community Spotlight: Marcus C.', excerpt: 'Meet the current #1 on the leaderboard. We sit down with Marcus to discuss his dominant run and what keeps him at the top.', img: 'https://images.unsplash.com/photo-1541534741688-6038c636f446?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'the-third-drop-blueprint', tag: 'Education', date: 'Jun 1, 2026', title: 'The Third-Drop Blueprint', excerpt: 'Mastering the third-shot drop is the single biggest unlock in competitive play. Here\'s how our top players do it.', img: 'https://images.unsplash.com/photo-1587280501635-68a0e82cd5ff?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'ranking-methodology-update', tag: 'Update', date: 'May 25, 2026', title: 'Ranking Methodology Update', excerpt: 'We\'ve refined our internal ranking system. See how these changes impact your standing on the leaderboard this season.', img: 'https://images.unsplash.com/photo-1571945153237-4929e783af4a?q=80&w=1200&auto=format&fit=crop' },
  { slug: 'new-courts-now-open', tag: 'Announcement', date: 'May 23, 2026', title: 'New Courts Now Open', excerpt: 'We\'ve secured two additional courts at Northside Athletic Club. Tuesday night round robins now have 50% more capacity.', img: 'https://images.unsplash.com/photo-1622228514125-9c84918e98be?q=80&w=1200&auto=format&fit=crop' },
];

const TAG_COLORS = {
  Recap: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Drop: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Feature: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
  Education: 'bg-green-500/20 text-green-400 border-green-500/30',
  Update: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
  Announcement: 'bg-red-500/20 text-red-400 border-red-500/30',
};

export default function ArticlePage() {
  const router = useRouter();
  const params = useParams();
  const article = ARTICLES.find(a => a.slug === params?.slug);

  if (!article) {
    return (
      <div className="font-sans bg-black text-white antialiased min-h-screen">
        <PublicNav />
        <main className="pt-20 flex items-center justify-center min-h-screen">
          <div className="text-center px-6">
            <p className="text-gray-500 text-sm uppercase tracking-widest mb-4">Article Not Found</p>
            <button onClick={() => router.push('/news-updates')} className="px-6 py-3 bg-white text-black font-bold uppercase text-xs tracking-widest rounded hover:bg-gray-200 transition-all">
              Back to Dispatches
            </button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="font-sans bg-black text-white antialiased">
      <PublicNav />
      <main className="pt-20">

        {/* Hero image */}
        <div className="relative h-72 md:h-[480px] overflow-hidden bg-gray-900">
          <img src={article.img} alt={article.title} className="w-full h-full object-cover opacity-50" />
          <div className="absolute inset-0 bg-gradient-to-t from-black via-black/30 to-transparent"></div>
        </div>

        {/* Article content */}
        <div className="max-w-3xl mx-auto px-6 py-16">
          <button onClick={() => router.push('/news-updates')} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-10 text-sm uppercase tracking-wide">
            <i className="ph ph-arrow-left"></i> All Dispatches
          </button>

          <div className="flex items-center gap-3 mb-6">
            <span className={`text-[11px] font-bold uppercase px-2.5 py-1 rounded border ${TAG_COLORS[article.tag] || 'bg-white/10 text-white border-white/20'}`}>{article.tag}</span>
            <span className="text-gray-500 text-sm">{article.date}</span>
          </div>

          <h1 className="font-display text-4xl md:text-6xl font-medium uppercase tracking-tight mb-8 leading-[0.9]">{article.title}</h1>

          <p className="text-gray-300 text-lg leading-relaxed mb-12">{article.excerpt}</p>

          <div className="border-t border-white/10 pt-12 text-center">
            <p className="text-gray-500 text-sm mb-2 uppercase tracking-widest">Full Story</p>
            <p className="text-gray-400 text-base">Coming soon — check back for the complete article.</p>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
}
