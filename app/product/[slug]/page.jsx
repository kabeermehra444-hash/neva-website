'use client';

import { useRouter, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import PublicNav from '@/components/PublicNav';
import Footer from '@/components/Footer';
import ShopifyBuyButton from '@/components/ShopifyBuyButton';
import { SHOPIFY_PRODUCTS } from '@/lib/shopify-products';
import { fetchProductImages } from '@/lib/shopify-storefront';

// ─── Per-product details ─────────────────────────────────────────────────────
// Add an entry keyed by the product's Shopify handle (slug) to customise
// bullet points for that product. Falls back to DEFAULT_DETAILS otherwise.
const PRODUCT_DETAILS = {
  // 'colony-skirt': [
  //   'Mid-length performance skirt with built-in compression short.',
  //   '87% polyester / 13% spandex.',
  //   'Machine washable cold.',
  //   'True to size fit.',
  // ],
  // 'heritage-hat': [
  //   'Structured 6-panel design.',
  //   'Adjustable snapback closure.',
  //   'One size fits most.',
  // ],
};

const DEFAULT_DETAILS = [
  'Premium quality materials.',
  'Designed for performance and comfort on and off the court.',
  'Machine washable.',
  'True to size fit.',
];
// ─────────────────────────────────────────────────────────────────────────────

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const [imageUrl, setImageUrl] = useState(null);

  const product = params?.slug
    ? SHOPIFY_PRODUCTS.find(p => p.slug === params.slug)
    : null;

  useEffect(() => {
    if (params?.slug && !product) router.replace('/shop');
  }, [params?.slug, product]);

  useEffect(() => {
    if (!product?.id) return;
    fetchProductImages([product.id])
      .then(map => setImageUrl(map[product.id] ?? null))
      .catch(() => {});
  }, [product?.id]);

  if (!product) return null;

  const details = PRODUCT_DETAILS[product.slug] || DEFAULT_DETAILS;

  return (
    <div className="font-sans bg-white text-black antialiased">
      <PublicNav />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-6 py-16">

          <button
            onClick={() => router.push('/shop')}
            className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10 uppercase tracking-wide"
          >
            <i className="ph ph-caret-left"></i> Back to Shop
          </button>

          <div className="grid md:grid-cols-2 gap-16 items-start">

            {/* ── Image panel ──────────────────────────────────────────────── */}
            <div className="aspect-square rounded-2xl overflow-hidden md:sticky md:top-28">
              {imageUrl ? (
                <img
                  src={imageUrl}
                  alt={product.name}
                  className="w-full h-full object-cover bg-zinc-100"
                />
              ) : product.soldOut ? (
                <div className="w-full h-full bg-gradient-to-br from-zinc-900 to-zinc-800 flex items-center justify-center relative overflow-hidden">
                  <i className="ph-fill ph-tag absolute text-[200px] text-white/5 blur-sm -rotate-12"></i>
                  <div className="relative z-10 flex flex-col items-center gap-3">
                    <div className="w-12 h-px bg-white/25"></div>
                    <p className="font-display text-sm font-bold uppercase tracking-[0.3em] text-white/50">Sold Out</p>
                    <div className="w-12 h-px bg-white/25"></div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full bg-zinc-100 flex items-center justify-center">
                  <i className="ph ph-shirt text-[96px] text-zinc-300"></i>
                </div>
              )}
            </div>

            {/* ── Details panel ─────────────────────────────────────────────── */}
            <div className="py-4">
              {product.category && (
                <p className="text-xs font-bold uppercase tracking-widest mb-4 text-gray-500">
                  {product.category}
                </p>
              )}

              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase mb-8">
                {product.name}
              </h1>

              {/* Product details */}
              <div className="mb-8 pb-8 border-b border-gray-200">
                <h2 className="text-sm font-bold uppercase tracking-widest mb-4">Product Details</h2>
                <p className="text-xs font-bold uppercase tracking-[0.25em] text-gray-300">Coming Soon</p>
              </div>

              {/* Shopify Buy Button — renders price, size/variant selector, qty, and checkout */}
              <div className="mb-10">
                <ShopifyBuyButton productId={product.id} />
              </div>

              {/* Trust signals */}
              <div className="pt-8 border-t border-gray-200 space-y-3">
                {[
                  { icon: 'ph-truck', text: 'Free shipping on all orders' },
                  { icon: 'ph-arrow-counter-clockwise', text: '30-day returns' },
                  { icon: 'ph-shield-check', text: 'Secure checkout' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-gray-600">
                    <i className={`ph-fill ${item.icon} text-xl`}></i>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
      <Footer />
    </div>
  );
}
