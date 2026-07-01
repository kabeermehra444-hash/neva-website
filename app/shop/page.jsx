'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import { SHOPIFY_PRODUCTS } from '@/lib/shopify-products';
import { fetchProductImages } from '@/lib/shopify-storefront';

export default function ShopPage() {
  const router = useRouter();
  const [filter, setFilter] = useState('All');
  const [imageUrls, setImageUrls] = useState({});

  useEffect(() => {
    fetchProductImages(SHOPIFY_PRODUCTS.map(p => p.id))
      .then(setImageUrls)
      .catch(() => {});
  }, []);

  const categories = ['All', ...new Set(SHOPIFY_PRODUCTS.map(p => p.category).filter(Boolean))];
  const filtered = filter === 'All' ? SHOPIFY_PRODUCTS : SHOPIFY_PRODUCTS.filter(p => p.category === filter);

  return (
    <div className="font-sans bg-white text-black antialiased">
      <PublicNav />
      <main className="pt-20">

        {/* Header */}
        <section className="py-20 md:py-28 bg-black text-white">
          <div className="max-w-[1600px] mx-auto px-6">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-widest font-bold mb-4">NEVA</p>
              <h1 className="font-display text-6xl md:text-8xl font-medium tracking-tighter uppercase mb-4 text-amber-400">The Shop</h1>
              <p className="text-white text-lg font-light max-w-xl">Performance apparel designed for the court. Built for movement, made to last, on and off the court.</p>
            </div>
          </div>
        </section>

        {/* Category Filter Bar */}
        {categories.length > 1 && (
          <div className="sticky top-20 z-40 bg-white border-b border-gray-200 shadow-sm">
            <div className="max-w-[1600px] mx-auto px-6 py-4 flex items-center gap-3 overflow-x-auto scrollbar-none">
              {categories.map(cat => (
                <button
                  key={cat}
                  onClick={() => setFilter(cat)}
                  className={`px-5 py-2 text-xs font-bold uppercase tracking-widest rounded-full whitespace-nowrap transition-all ${
                    filter === cat ? 'bg-black text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
              <span className="ml-auto text-xs text-gray-400 whitespace-nowrap">{filtered.length} items</span>
            </div>
          </div>
        )}

        {/* Product Grid */}
        <section className="py-12 md:py-16">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-12">
              {filtered.map(product => (
                <div
                  key={product.id}
                  className="group cursor-pointer"
                  onClick={() => router.push(`/product/${product.slug}`)}
                >
                  <div className="aspect-[4/5] mb-4 overflow-hidden rounded-xl">
                    {imageUrls[product.id] ? (
                      <img
                        src={imageUrls[product.id]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
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
                      <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                        <i className="ph ph-shirt text-5xl text-zinc-300 group-hover:text-zinc-400 transition-colors duration-300"></i>
                      </div>
                    )}
                  </div>

                  {product.category && (
                    <p className="text-[11px] font-bold uppercase tracking-widest mb-1 text-gray-400">
                      {product.category}
                    </p>
                  )}
                  <h3 className="font-medium text-base uppercase group-hover:text-gray-500 transition-colors">
                    {product.name}
                  </h3>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Member Rewards Banner */}
        <section className="py-20 bg-black text-white">
          <div className="max-w-[1600px] mx-auto px-6">
            <div className="border border-white/10 rounded-2xl p-12 md:p-20 flex flex-col md:flex-row md:items-center justify-between gap-10">
              <div className="max-w-xl">
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-gray-500 mb-4">Member Rewards</p>
                <h2 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-4 leading-tight">
                  Earn while<br />you compete.
                </h2>
                <p className="text-gray-400 leading-relaxed text-lg font-light">
                  NEVA members earn rewards through wins and event performance. Redeem your balance directly at checkout on any item in The Shop.
                </p>
              </div>
              <div className="flex flex-col gap-3 md:min-w-[220px]">
                <button
                  onClick={() => router.push('/membership-apply')}
                  className="px-8 py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded hover:bg-gray-100 active:scale-95 transition-all"
                >
                  Join the Club
                </button>
                <button
                  onClick={() => router.push('/login')}
                  className="px-8 py-4 border border-white/20 text-white font-bold uppercase text-sm tracking-widest rounded hover:bg-white/10 active:scale-95 transition-all"
                >
                  Member Login
                </button>
              </div>
            </div>
          </div>
        </section>

      </main>
      <Footer />
    </div>
  );
}
