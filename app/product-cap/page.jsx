'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';

export default function ProductCapPage() {
  const router = useRouter();
  const [mainImage, setMainImage] = useState('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop');
  const [cartCount, setCartCount] = useState(0);
  const [selectedSize] = useState('One Size');
  const [addToCartStatus, setAddToCartStatus] = useState('idle');
  const addToCartBtnRef = useRef(null);

  useEffect(() => {
    updateCartBadge();
  }, []);

  const getCartItems = () => {
    return JSON.parse(localStorage.getItem('cartItems') || '[]');
  };

  const saveCartItems = (items) => {
    localStorage.setItem('cartItems', JSON.stringify(items));
  };

  const getCartCountValue = () => {
    const items = getCartItems();
    return items.reduce((total, item) => total + (item.quantity || 1), 0);
  };

  const updateCartBadge = () => {
    const count = getCartCountValue();
    setCartCount(count);
  };

  const switchImage = (imageUrl) => {
    setMainImage(imageUrl);
  };

  const addToCart = (productData) => {
    const items = getCartItems();
    const existingIndex = items.findIndex(item => 
      item.id === productData.id && item.size === selectedSize
    );
    
    if (existingIndex >= 0) {
      items[existingIndex].quantity = (items[existingIndex].quantity || 1) + 1;
    } else {
      items.push({
        id: productData.id,
        name: productData.name,
        price: productData.price,
        size: selectedSize,
        quantity: 1,
        image: productData.image
      });
    }
    
    saveCartItems(items);
    updateCartBadge();
    
    setAddToCartStatus('added');
    setTimeout(() => {
      setAddToCartStatus('idle');
    }, 2000);
  };

    return (
      <>
        <div className="font-sans bg-white text-black antialiased">
          {/* Navigation */}
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-white border-b border-gray-200">
        <div className="hidden lg:grid grid-cols-3 items-center max-w-[1600px] mx-auto px-8 h-20">
            <nav className="flex items-center gap-8 text-sm font-medium tracking-wide">
                <button onClick={() => router.push('/shop')} className="text-black font-bold uppercase underline decoration-2 underline-offset-8">Shop</button>
                <button onClick={() => router.push('/events')} className="text-gray-500 hover:text-black transition-colors uppercase">Events</button>
                <button onClick={() => router.push('/news-updates')} className="text-gray-500 hover:text-black transition-colors uppercase">News & Updates</button>
                <button onClick={() => router.push('/about')} className="text-gray-500 hover:text-black transition-colors uppercase">About</button>
            </nav>

            <div className="text-center">
                <button onClick={() => router.push('/')} className="font-display text-3xl font-bold uppercase tracking-widest text-black">Club Neva</button>
            </div>

            <div className="flex items-center justify-end gap-6 text-sm font-medium tracking-wide">
                <button className="text-black hover:text-gray-600 transition-colors"><i className="ph ph-magnifying-glass text-xl"></i></button>
                <button onClick={() => router.push('/checkout')} className="text-black hover:text-gray-600 transition-colors relative">
                    <i className="ph ph-shopping-cart text-xl"></i>
                    <span id="cartBadge" className="absolute -top-1 -right-2 bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">{cartCount}</span>
                </button>
                <div className="h-4 w-px bg-gray-200 mx-2"></div>
                <button className="text-black hover:text-gray-600 transition-colors uppercase">Login</button>
                <button className="px-5 py-2.5 bg-black text-white uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-800 active:scale-95 transition-all">Apply</button>
            </div>
        </div>
    </header>

    <main className="pt-20">
        {/* Product Detail */}
        <section className="py-16 md:py-24">
            <div className="max-w-[1600px] mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                    {/* Images */}
                    <div>
                        <div className="aspect-square bg-gray-100 mb-4 overflow-hidden rounded-lg">
                            <img id="mainImage" src={mainImage} alt="Club Cap" className="w-full h-full object-cover" />
                        </div>
                        {/* Thumbnail Gallery */}
                        <div className="grid grid-cols-4 gap-4">
                            <button onClick={() => switchImage('https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop')} className="aspect-square bg-gray-100 rounded overflow-hidden border-2 border-black">
                                <img src="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop" alt="View 1" className="w-full h-full object-cover" />
                            </button>
                            <button onClick={() => switchImage('https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop')} className="aspect-square bg-gray-100 rounded overflow-hidden border-2 border-transparent hover:border-black transition-colors">
                                <img src="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?q=80&w=1000&auto=format&fit=crop" alt="View 2" className="w-full h-full object-cover" />
                            </button>
                            <button onClick={() => switchImage('https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?q=80&w=1000&auto=format&fit=crop')} className="aspect-square bg-gray-100 rounded overflow-hidden border-2 border-transparent hover:border-black transition-colors">
                                <img src="https://images.unsplash.com/photo-1575428652377-a2d80e2277fc?q=80&w=1000&auto=format&fit=crop" alt="View 3" className="w-full h-full object-cover" />
                            </button>
                            <button onClick={() => switchImage('https://images.unsplash.com/photo-1589663881289-b4652ab7b265?q=80&w=1000&auto=format&fit=crop')} className="aspect-square bg-gray-100 rounded overflow-hidden border-2 border-transparent hover:border-black transition-colors">
                                <img src="https://images.unsplash.com/photo-1589663881289-b4652ab7b265?q=80&w=1000&auto=format&fit=crop" alt="View 4" className="w-full h-full object-cover" />
                            </button>
                        </div>
                    </div>

                    {/* Product Info */}
                    <div>
                        <button onClick={() => router.push('/shop')} className="flex items-center gap-2 text-sm text-gray-600 hover:text-black mb-6 uppercase">
                            <i className="ph ph-caret-left"></i> Back to Shop
                        </button>

                        <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tighter uppercase mb-4">Club Cap</h1>
                        <p className="text-2xl font-bold mb-8">$30.00</p>

                        <div className="mb-8">
                            <p className="text-gray-700 leading-relaxed mb-4">
                                Premium performance cap with minimal NEVA branding. Lightweight, breathable construction with moisture-wicking sweatband. Adjustable snapback closure for the perfect fit.
                            </p>
                            <ul className="space-y-2 text-sm text-gray-700">
                                <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-black mt-0.5"></i> Lightweight performance fabric</li>
                                <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-black mt-0.5"></i> Moisture-wicking sweatband</li>
                                <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-black mt-0.5"></i> Adjustable snapback closure</li>
                                <li className="flex items-start gap-2"><i className="ph-fill ph-check-circle text-black mt-0.5"></i> Embroidered NEVA logo</li>
                            </ul>
                        </div>

                        {/* Size Selection */}
                        <div className="mb-8">
                            <h3 className="font-bold uppercase tracking-wider text-sm mb-4">Select Size</h3>
                            <div className="flex gap-3">
                                <button className="px-6 py-3 border-2 border-black bg-black text-white font-medium uppercase text-sm">One Size</button>
                            </div>
                        </div>

                        {/* Add to Cart */}
                        <button 
                          ref={addToCartBtnRef}
                          id="addToCartBtn" 
                          onClick={() => addToCart({id: 'cap', name: 'Club Cap', price: 30.00, image: 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?q=80&w=1000&auto=format&fit=crop'})} 
                          className={`w-full py-4 text-white uppercase font-bold text-sm tracking-wider rounded active:scale-95 transition-all flex items-center justify-center gap-2 mb-4 ${addToCartStatus === 'added' ? 'bg-green-600' : 'bg-black hover:bg-gray-800'}`}
                        >
                            {addToCartStatus === 'added' ? (
                              <>
                                <i className="ph-fill ph-check-circle text-xl"></i>
                                <span>Added to Cart!</span>
                              </>
                            ) : (
                              <>
                                <i className="ph ph-shopping-cart text-xl"></i>
                                <span>Add to Cart</span>
                              </>
                            )}
                        </button>

                        {/* Stripe Checkout Button - YOU CAN REPLACE THE HREF WITH YOUR STRIPE PAYMENT LINK */}
                        <a href="#" className="block w-full py-4 bg-white text-black border-2 border-black uppercase font-bold text-sm tracking-wider rounded hover:bg-gray-50 active:scale-95 transition-all text-center">
                            Buy Now
                        </a>
                        <p className="text-xs text-gray-500 mt-2 text-center">Secure checkout powered by Stripe</p>


                    </div>
                </div>
            </div>
        </section>
    </main>

    {/* Footer */}
    <footer className="bg-black text-white pt-24 pb-12 border-t border-white/10 mt-16">
        <div className="max-w-[1600px] mx-auto px-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8 mb-16 border-b border-white/10 pb-16">
                <div className="col-span-1 md:col-span-1">
                    <button onClick={() => router.push('/')} className="font-display text-4xl font-bold uppercase tracking-widest text-white mb-6 block">Club Neva</button>
                    <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-6">
                        An exclusive athletic community fusing high-level competition with premium performance wear.
                    </p>
                </div>
                <div>
                    <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Explore</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><button onClick={() => router.push('/shop')} className="hover:text-gray-400 transition-colors uppercase">Shop</button></li>
                        <li><button onClick={() => router.push('/events')} className="hover:text-gray-400 transition-colors uppercase">Events</button></li>
                        <li><button onClick={() => router.push('/news-updates')} className="hover:text-gray-400 transition-colors uppercase">News</button></li>
                        <li><button onClick={() => router.push('/about')} className="hover:text-gray-400 transition-colors uppercase">About</button></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Portal</h4>
                    <ul className="space-y-4 text-sm font-medium">
                        <li><a href="#" className="hover:text-gray-400 transition-colors uppercase">Join the Club</a></li>
                        <li><a href="#" className="hover:text-gray-400 transition-colors uppercase">Member Login</a></li>
                    </ul>
                </div>
                <div>
                    <h4 className="font-bold uppercase tracking-widest text-xs text-gray-500 mb-6">Intelligence</h4>
                    <p className="text-sm text-gray-400 mb-4">Subscribe for drop alerts and open run announcements.</p>
                </div>
            </div>
            <div className="flex flex-col md:flex-row justify-between items-center text-xs text-gray-600 font-medium uppercase tracking-widest">
                <p>&copy; 2023 NEVA. All rights reserved.</p>
            </div>
        </div>
    </footer>
        </div>
      </>
    );
}
