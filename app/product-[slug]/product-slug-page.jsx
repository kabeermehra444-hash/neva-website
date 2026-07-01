'use client';
import { useRouter, useParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import { addToCart } from '@/lib/cart';

const DEFAULT_SIZES = ['S', 'M', 'L', 'XL'];

export default function ProductPage() {
  const router = useRouter();
  const params = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [added, setAdded] = useState(false);
  const [qty, setQty] = useState(1);
  const [sizeError, setSizeError] = useState(false);

  useEffect(() => {
    if (!params?.slug) return;
    fetch('/api/products')
      .then(r => r.json())
      .then(products => {
        const match = Array.isArray(products)
          ? products.find(p => p.slug === params.slug || String(p.id) === params.slug)
          : null;
        if (!match) { router.replace('/shop'); return; }
        setProduct(match);
        // Always default to S
        const sizes = getSizes(match);
        setSelectedSize(sizes[0]);
      })
      .catch(() => router.replace('/shop'))
      .finally(() => setLoading(false));
  }, [params?.slug]);

  const getSizes = (p) => {
    const raw = Array.isArray(p?.size_options) ? p.size_options : [];
    // If product has sizes already use them, otherwise use defaults
    const hasRealSizes = raw.some(s => ['XS','S','M','L','XL','XXL','One Size'].includes(s));
    return hasRealSizes ? raw : DEFAULT_SIZES;
  };

  const handleAddToCart = () => {
    if (!selectedSize) { setSizeError(true); return; }
    setSizeError(false);
    for (let i = 0; i < qty; i++) {
      addToCart({ id: product.id, name: product.name, price: parseFloat(product.price), image: product.image_url, size: selectedSize });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleBuyNow = () => {
    if (!selectedSize) { setSizeError(true); return; }
    handleAddToCart();
    setTimeout(() => router.push('/checkout'), 100);
  };

  if (loading) return (
    <div className="font-sans bg-white text-black antialiased min-h-screen">
      <PublicNav />
      <div className="pt-20 flex items-center justify-center min-h-screen">
        <div className="grid md:grid-cols-2 gap-12 max-w-5xl mx-auto px-6 w-full animate-pulse">
          <div className="aspect-square bg-gray-100 rounded-2xl"></div>
          <div className="space-y-6 pt-8">
            <div className="h-10 bg-gray-100 rounded w-3/4"></div>
            <div className="h-8 bg-gray-100 rounded w-1/4"></div>
            <div className="h-4 bg-gray-100 rounded"></div>
          </div>
        </div>
      </div>
    </div>
  );

  if (!product) return null;

  const sizes = getSizes(product);
  const price = parseFloat(product.price || 0);

  return (
    <div className="font-sans bg-white text-black antialiased">
      <PublicNav />
      <main className="pt-20">
        <div className="max-w-6xl mx-auto px-6 py-16">
          <button onClick={() => router.push('/shop')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black transition-colors mb-10 uppercase tracking-wide">
            <i className="ph ph-caret-left"></i> Back to Shop
          </button>

          <div className="grid md:grid-cols-2 gap-16 items-start">
            {/* Image */}
            <div className="aspect-square bg-gray-100 rounded-2xl overflow-hidden sticky top-28">
              {product.image_url
                ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                : <div className="w-full h-full flex items-center justify-center"><i className="ph ph-shirt text-8xl text-gray-300"></i></div>
              }
            </div>

            {/* Details */}
            <div className="py-4">
              {product.category && <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-3">{product.category}</p>}
              <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase mb-4">{product.name}</h1>
              <p className="text-3xl font-bold mb-6">${price.toFixed(2)}</p>

              {product.description && <p className="text-gray-600 leading-relaxed mb-8">{product.description}</p>}

              {/* Size Selector */}
              <div className="mb-8">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-bold uppercase tracking-widest">Size</p>
                  {sizeError && <p className="text-red-500 text-xs font-medium">Please select a size</p>}
                </div>
                <div className="flex flex-wrap gap-2">
                  {sizes.map(size => (
                    <button
                      key={size}
                      onClick={() => { setSelectedSize(size); setSizeError(false); }}
                      className={`w-14 h-14 border-2 text-sm font-bold uppercase rounded-lg transition-all ${
                        selectedSize === size
                          ? 'bg-black text-white border-black'
                          : sizeError
                          ? 'border-red-300 text-gray-500 hover:border-gray-400'
                          : 'border-gray-200 text-gray-700 hover:border-black'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* Qty */}
              <div className="mb-8">
                <p className="text-sm font-bold uppercase tracking-widest mb-3">Quantity</p>
                <div className="flex items-center border-2 border-gray-200 rounded-lg w-fit">
                  <button onClick={() => setQty(Math.max(1, qty-1))} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold rounded-l-lg">−</button>
                  <span className="w-12 text-center font-bold text-lg">{qty}</span>
                  <button onClick={() => setQty(qty+1)} className="w-12 h-12 flex items-center justify-center hover:bg-gray-100 transition-colors text-lg font-bold rounded-r-lg">+</button>
                </div>
              </div>

              {/* Buttons */}
              <div className="space-y-3 mb-10">
                <button onClick={handleAddToCart} className={`w-full py-5 font-bold uppercase text-sm tracking-widest rounded-xl transition-all active:scale-95 ${added ? 'bg-green-500 text-white' : 'bg-black text-white hover:bg-gray-800'}`}>
                  {added ? '✓ Added to Cart' : `Add to Cart — $${(price * qty).toFixed(2)}`}
                </button>
                <button onClick={handleBuyNow} className="w-full py-5 bg-transparent border-2 border-black text-black font-bold uppercase text-sm tracking-widest rounded-xl hover:bg-gray-50 active:scale-95 transition-all">
                  Buy Now
                </button>
              </div>

              {/* Trust signals */}
              <div className="pt-6 border-t border-gray-100 space-y-3">
                {[
                  { icon: 'ph-truck', text: 'Free shipping on all orders' },
                  { icon: 'ph-arrow-counter-clockwise', text: '30-day free returns' },
                  { icon: 'ph-shield-check', text: 'Secure checkout' },
                ].map(item => (
                  <div key={item.text} className="flex items-center gap-3 text-sm text-gray-500">
                    <i className={`ph-fill ${item.icon} text-lg`}></i>
                    {item.text}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
