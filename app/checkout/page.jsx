'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import { getCartItems, updateCartItemQuantity, removeCartItem, clearCart } from '@/lib/cart';
import { getStoredMember, isApprovedMember } from '@/lib/auth';

export default function CheckoutPage() {
  const router = useRouter();
  const [cartItems, setCartItems] = useState([]);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [nevaCashBalance, setNevaCashBalance] = useState(0);
  const [applyNevaCash, setApplyNevaCash] = useState(false);
  const [isMember, setIsMember] = useState(false);

  // Payment form state
  const [form, setForm] = useState({
    email: '', firstName: '', lastName: '',
    address: '', city: '', state: '', zip: '', country: 'US',
    cardNumber: '', cardExpiry: '', cardCvc: '', cardName: '',
  });
  const [errors, setErrors] = useState({});

  // NEVA Cash can only apply to clothing — blocked if any event items are in the cart
  const hasEventItems = cartItems.some(item => item.type === 'event');
  const nevaCashEligible = isMember && nevaCashBalance > 0 && !hasEventItems;

  const subtotal = cartItems.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);
  const nevaCashDiscount = (applyNevaCash && nevaCashEligible) ? Math.min(nevaCashBalance, subtotal) : 0;
  const shipping = 0;
  const tax = (subtotal - nevaCashDiscount) * 0.0875;
  const total = subtotal - nevaCashDiscount + shipping + tax;

  useEffect(() => {
    setCartItems(getCartItems());
    const update = () => setCartItems(getCartItems());
    window.addEventListener('neva:cartUpdated', update);
    const member = getStoredMember();
    if (member) {
      setNevaCashBalance(parseFloat(member.neva_cash_balance) || 0);
      setIsMember(isApprovedMember());
    }
    return () => window.removeEventListener('neva:cartUpdated', update);
  }, []);

  const handleQtyChange = (item, delta) => {
    const updated = updateCartItemQuantity(item.id, item.size, (item.quantity || 1) + delta);
    setCartItems(updated);
  };

  const handleRemove = (item) => setCartItems(removeCartItem(item.id, item.size));

  const formatCard = (val) => val.replace(/\D/g, '').replace(/(.{4})/g, '$1 ').trim().slice(0, 19);
  const formatExpiry = (val) => {
    const v = val.replace(/\D/g, '');
    return v.length >= 2 ? v.slice(0,2) + '/' + v.slice(2,4) : v;
  };

  const validate = () => {
    const e = {};
    if (!form.email) e.email = 'Required';
    if (!form.firstName) e.firstName = 'Required';
    if (!form.lastName) e.lastName = 'Required';
    if (!form.address) e.address = 'Required';
    if (!form.city) e.city = 'Required';
    if (!form.zip) e.zip = 'Required';
    if (!form.cardNumber || form.cardNumber.replace(/\s/g,'').length < 16) e.cardNumber = 'Enter a valid card number';
    if (!form.cardExpiry || form.cardExpiry.length < 5) e.cardExpiry = 'Enter expiry MM/YY';
    if (!form.cardCvc || form.cardCvc.length < 3) e.cardCvc = 'Enter CVC';
    if (!form.cardName) e.cardName = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleCheckout = async () => {
    if (!validate()) return;
    setProcessing(true);
    // Simulate payment processing — replace with Stripe later
    await new Promise(r => setTimeout(r, 1800));
    clearCart();
    setCartItems([]);
    setCheckoutDone(true);
    setProcessing(false);
  };

  const field = (key, label, props = {}) => (
    <div>
      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500 mb-1.5">{label}</label>
      <input
        {...props}
        value={form[key]}
        onChange={e => {
          let val = e.target.value;
          if (key === 'cardNumber') val = formatCard(val);
          if (key === 'cardExpiry') val = formatExpiry(val);
          if (key === 'cardCvc') val = val.replace(/\D/g,'').slice(0,4);
          setForm(f => ({...f, [key]: val}));
          if (errors[key]) setErrors(er => ({...er, [key]: null}));
        }}
        className={`w-full px-4 py-3 border rounded-lg text-sm focus:outline-none transition-colors ${errors[key] ? 'border-red-400 bg-red-50' : 'border-gray-300 focus:border-black'}`}
      />
      {errors[key] && <p className="text-red-500 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  if (checkoutDone) return (
    <div className="font-sans bg-white text-black antialiased min-h-screen">
      <PublicNav />
      <main className="pt-20 min-h-screen flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <div className="w-20 h-20 bg-green-50 border border-green-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ph-fill ph-check-circle text-4xl text-green-500"></i>
          </div>
          <h1 className="font-display text-4xl font-medium uppercase tracking-tight mb-3">Order Confirmed!</h1>
          <p className="text-gray-500 mb-2">Thanks, {form.firstName}! Your order has been placed.</p>
          <p className="text-gray-400 text-sm mb-8">A confirmation will be sent to {form.email}</p>
          <button onClick={() => router.push('/shop')} className="px-8 py-4 bg-black text-white uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-800 transition-all">
            Continue Shopping
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="font-sans bg-white text-black antialiased">
      <PublicNav />
      <main className="pt-20 pb-20">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <button onClick={() => router.push('/shop')} className="flex items-center gap-2 text-sm text-gray-500 hover:text-black mb-8 uppercase tracking-wide transition-colors">
            <i className="ph ph-caret-left"></i> Back to Shop
          </button>
          <h1 className="font-display text-4xl md:text-5xl font-medium tracking-tight uppercase mb-10">Checkout</h1>

          {cartItems.length === 0 ? (
            <div className="text-center py-24">
              <i className="ph ph-shopping-cart text-6xl text-gray-200 mb-4"></i>
              <h2 className="font-display text-2xl uppercase mb-4">Your cart is empty</h2>
              <button onClick={() => router.push('/shop')} className="px-8 py-4 bg-black text-white uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-800 transition-all">
                Browse Shop
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-12">

              {/* Left — Forms */}
              <div className="lg:col-span-3 space-y-10">

                {/* Contact */}
                <div>
                  <h2 className="font-display text-xl uppercase font-bold tracking-tight mb-5 pb-3 border-b border-gray-200">Contact</h2>
                  <div className="space-y-4">
                    {field('email', 'Email Address', { type: 'email', placeholder: 'you@email.com' })}
                  </div>
                </div>

                {/* Shipping */}
                <div>
                  <h2 className="font-display text-xl uppercase font-bold tracking-tight mb-5 pb-3 border-b border-gray-200">Shipping Address</h2>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      {field('firstName', 'First Name', { placeholder: 'First' })}
                      {field('lastName', 'Last Name', { placeholder: 'Last' })}
                    </div>
                    {field('address', 'Street Address', { placeholder: '123 Main St' })}
                    <div className="grid grid-cols-3 gap-4">
                      {field('city', 'City', { placeholder: 'Los Angeles' })}
                      {field('state', 'State', { placeholder: 'CA' })}
                      {field('zip', 'ZIP', { placeholder: '90001' })}
                    </div>
                  </div>
                </div>

                {/* Payment */}
                <div>
                  <h2 className="font-display text-xl uppercase font-bold tracking-tight mb-5 pb-3 border-b border-gray-200">
                    Payment
                    <span className="ml-3 inline-flex items-center gap-1">
                      {['ph-credit-card','ph-lock-simple'].map(i => <i key={i} className={`ph-fill ${i} text-base text-gray-400`}></i>)}
                    </span>
                  </h2>

                  {/* Card type icons */}
                  <div className="flex gap-2 mb-5">
                    {[
                      'https://upload.wikimedia.org/wikipedia/commons/thumb/2/2a/Mastercard-logo.svg/200px-Mastercard-logo.svg.png',
                      'https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/200px-Visa_Inc._logo.svg.png',
                      'https://upload.wikimedia.org/wikipedia/commons/thumb/f/fa/American_Express_logo_%282018%29.svg/200px-American_Express_logo_%282018%29.svg.png',
                    ].map((src, i) => (
                      <div key={i} className="h-8 px-2 border border-gray-200 rounded flex items-center bg-white">
                        <img src={src} alt="card" className="h-4 object-contain" />
                      </div>
                    ))}
                  </div>

                  <div className="space-y-4">
                    {field('cardName', 'Name on Card', { placeholder: 'Full name as on card' })}
                    {field('cardNumber', 'Card Number', { placeholder: '1234 5678 9012 3456', maxLength: 19 })}
                    <div className="grid grid-cols-2 gap-4">
                      {field('cardExpiry', 'Expiry Date', { placeholder: 'MM/YY', maxLength: 5 })}
                      {field('cardCvc', 'CVC', { placeholder: '123', maxLength: 4, type: 'password' })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mt-4 text-xs text-gray-400">
                    <i className="ph-fill ph-lock-simple text-sm"></i>
                    Your payment info is encrypted and secure.
                  </div>
                </div>

              </div>

              {/* Right — Order Summary */}
              <div className="lg:col-span-2">
                <div className="bg-gray-50 rounded-2xl p-6 lg:sticky lg:top-28">
                  <h2 className="font-display text-xl uppercase font-bold tracking-tight mb-6">Order Summary</h2>

                  {/* Cart Items */}
                  <div className="space-y-4 mb-6 pb-6 border-b border-gray-200">
                    {cartItems.map((item, idx) => (
                      <div key={`${item.id}-${item.size}-${idx}`} className="flex gap-3">
                        <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                          {item.image
                            ? <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center"><i className="ph ph-shirt text-2xl text-gray-400"></i></div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm uppercase truncate">{item.name}</p>
                          <p className="text-gray-500 text-xs">Size: {item.size}</p>
                          <div className="flex items-center gap-2 mt-1.5">
                            <div className="flex items-center border border-gray-300 rounded text-xs">
                              <button onClick={() => handleQtyChange(item, -1)} className="px-2 py-1 hover:bg-gray-100">-</button>
                              <span className="px-2 font-medium">{item.quantity || 1}</span>
                              <button onClick={() => handleQtyChange(item, 1)} className="px-2 py-1 hover:bg-gray-100">+</button>
                            </div>
                            <button onClick={() => handleRemove(item)} className="text-gray-400 hover:text-red-500 transition-colors">
                              <i className="ph ph-trash text-sm"></i>
                            </button>
                          </div>
                        </div>
                        <p className="font-bold text-sm flex-shrink-0">${(item.price * (item.quantity || 1)).toFixed(2)}</p>
                      </div>
                    ))}
                  </div>

                  {/* NEVA Cash */}
                  {isMember && (
                    <div className="mb-6 pb-6 border-b border-gray-200">
                      {hasEventItems ? (
                        <div className="flex items-start gap-2 text-xs text-gray-400 bg-gray-100 rounded-lg px-3 py-2.5">
                          <i className="ph ph-info text-sm mt-0.5 flex-shrink-0"></i>
                          NEVA Cash can only be applied to clothing and merch, not event fees.
                        </div>
                      ) : nevaCashBalance > 0 ? (
                        <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
                          <div>
                            <p className="text-sm font-bold">Use NEVA Cash</p>
                            <p className="text-xs text-gray-500">Balance: ${nevaCashBalance.toFixed(2)}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {applyNevaCash && <span className="text-xs font-bold text-green-600">−${nevaCashDiscount.toFixed(2)}</span>}
                            <button
                              type="button"
                              onClick={() => setApplyNevaCash(v => !v)}
                              className={`w-10 h-6 rounded-full transition-colors relative ${applyNevaCash ? 'bg-black' : 'bg-gray-200'}`}
                            >
                              <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all ${applyNevaCash ? 'left-5' : 'left-1'}`}></span>
                            </button>
                          </div>
                        </label>
                      ) : (
                        <p className="text-xs text-gray-400">You have no NEVA Cash balance.</p>
                      )}
                    </div>
                  )}

                  {/* Totals */}
                  <div className="space-y-3 text-sm mb-6 pb-6 border-b border-gray-200">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Subtotal</span>
                      <span className="font-medium">${subtotal.toFixed(2)}</span>
                    </div>
                    {nevaCashDiscount > 0 && (
                      <div className="flex justify-between text-green-600">
                        <span>NEVA Cash</span>
                        <span className="font-medium">−${nevaCashDiscount.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between">
                      <span className="text-gray-500">Shipping</span>
                      <span className="font-medium text-green-600">Free</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-500">Tax (8.75%)</span>
                      <span className="font-medium">${tax.toFixed(2)}</span>
                    </div>
                  </div>

                  <div className="flex justify-between font-bold text-lg mb-6">
                    <span>Total</span>
                    <span>${total.toFixed(2)}</span>
                  </div>

                  <button
                    onClick={handleCheckout}
                    disabled={processing}
                    className="w-full py-4 bg-black text-white uppercase font-bold text-sm tracking-widest rounded-xl hover:bg-gray-800 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {processing ? (
                      <>
                        <i className="ph ph-circle-notch animate-spin"></i>
                        Processing...
                      </>
                    ) : (
                      <>
                        <i className="ph-fill ph-lock-simple"></i>
                        Pay ${total.toFixed(2)}
                      </>
                    )}
                  </button>

                  <div className="mt-4 space-y-2">
                    {[
                      { icon: 'ph-shield-check', text: 'Secure 256-bit encryption' },
                      { icon: 'ph-truck', text: 'Free shipping on all orders' },
                      { icon: 'ph-arrow-counter-clockwise', text: '30-day return policy' },
                    ].map(item => (
                      <div key={item.text} className="flex items-center gap-2 text-xs text-gray-400">
                        <i className={`ph-fill ${item.icon}`}></i>
                        {item.text}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>
      </main>
    </div>
  );
}
