'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useCartCount } from '@/lib/cart';
import { isLoggedIn, isApprovedMember } from '@/lib/auth';
import { useState, useEffect, useRef, useCallback } from 'react';

const STATIC_PAGES = [
  { label: 'Shop', href: '/shop' },
  { label: 'Events', href: '/events' },
  { label: 'News & Updates', href: '/news-updates' },
  { label: 'About', href: '/about' },
  { label: 'Join the Club', href: '/membership-apply' },
  { label: 'Member Login', href: '/login' },
];

export default function PublicNav() {
  const router = useRouter();
  const pathname = usePathname();
  const cartCount = useCartCount();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loggedIn, setLoggedIn] = useState(false);
  const [approved, setApproved] = useState(false);

  // Search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState({ products: [], events: [], pages: [] });
  const [searching, setSearching] = useState(false);

  // Separate refs for desktop and mobile — using one ref caused the mobile div
  // (conditionally set) to override the desktop ref when searchOpen=true,
  // making the outside-click handler treat every desktop click as "outside."
  const desktopSearchRef = useRef(null);
  const mobileSearchRef = useRef(null);
  const inputRef = useRef(null);
  const mobileInputRef = useRef(null);
  const debounceRef = useRef(null);

  useEffect(() => {
    setLoggedIn(isLoggedIn());
    setApproved(isApprovedMember());
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
    setQuery('');
    setResults({ products: [], events: [], pages: [] });
    setSearching(false);
    clearTimeout(debounceRef.current);
  }, []);

  // Close on outside click — check both desktop and mobile containers
  useEffect(() => {
    const handler = (e) => {
      const inDesktop = desktopSearchRef.current?.contains(e.target);
      const inMobile = mobileSearchRef.current?.contains(e.target);
      if (!inDesktop && !inMobile) closeSearch();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [closeSearch]);

  // Auto-focus when search opens
  useEffect(() => {
    if (!searchOpen) return;
    // Small delay so the input is in the DOM before focus
    const t = setTimeout(() => {
      inputRef.current?.focus();
      mobileInputRef.current?.focus();
    }, 30);
    return () => clearTimeout(t);
  }, [searchOpen]);

  const runSearch = useCallback(async (q) => {
    const term = q.trim().toLowerCase();
    if (term.length < 2) {
      setResults({ products: [], events: [], pages: [] });
      setSearching(false);
      return;
    }
    setSearching(true);
    try {
      const [prodRes, evRes] = await Promise.all([
        fetch('/api/products'),
        fetch('/api/events'),
      ]);

      const prods = prodRes.ok ? await prodRes.json() : [];
      const evs = evRes.ok ? await evRes.json() : [];

      const products = (Array.isArray(prods) ? prods : [])
        .filter(p => p.name?.toLowerCase().includes(term))
        .slice(0, 4)
        .map(p => ({ label: p.name, sub: `$${parseFloat(p.price || 0).toFixed(2)}`, href: `/product/${p.slug || p.id}` }));

      const events = (Array.isArray(evs) ? evs : [])
        .filter(e => (e.title || e.name)?.toLowerCase().includes(term))
        .slice(0, 4)
        .map(e => ({
          label: e.title || e.name,
          sub: e.date_time ? new Date(e.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : null,
          href: `/events/${e.slug || e.id}`,
        }));

      const pages = STATIC_PAGES
        .filter(p => p.label.toLowerCase().includes(term))
        .slice(0, 3);

      setResults({ products, events, pages });
    } catch (err) {
      console.error('Search error:', err);
      setResults({ products: [], events: [], pages: [] });
    }
    setSearching(false);
  }, []);

  const handleQueryChange = (e) => {
    const val = e.target.value;
    setQuery(val);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => runSearch(val), 200);
  };

  const handleSelect = (href) => {
    closeSearch();
    router.push(href);
  };

  const hasResults = results.products.length > 0 || results.events.length > 0 || results.pages.length > 0;
  const showDropdown = searchOpen && query.trim().length >= 2;

  const navLinks = [
    { label: 'Shop', href: '/shop' },
    { label: 'Events', href: '/events' },
    { label: 'News', href: '/news-updates' },
    { label: 'About', href: '/about' },
  ];

  const isActive = (href) => pathname === href;

  // Shared dropdown content
  const DropdownContent = () => (
    <>
      {searching && (
        <p className="text-gray-500 text-sm px-4 py-3 flex items-center gap-2">
          <i className="ph ph-circle-notch animate-spin"></i> Searching…
        </p>
      )}
      {!searching && !hasResults && (
        <p className="text-gray-500 text-sm px-4 py-4">No results for "{query}"</p>
      )}
      {!searching && results.events.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-4 pt-3 pb-1">Events</p>
          {results.events.map((r, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); handleSelect(r.href); }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3">
              <span className="text-white text-sm truncate">{r.label}</span>
              {r.sub && <span className="text-gray-500 text-xs flex-shrink-0">{r.sub}</span>}
            </button>
          ))}
        </div>
      )}
      {!searching && results.products.length > 0 && (
        <div className={results.events.length > 0 ? 'border-t border-white/5' : ''}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-4 pt-3 pb-1">Products</p>
          {results.products.map((r, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); handleSelect(r.href); }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors flex items-center justify-between gap-3">
              <span className="text-white text-sm truncate">{r.label}</span>
              {r.sub && <span className="text-gray-500 text-xs flex-shrink-0">{r.sub}</span>}
            </button>
          ))}
        </div>
      )}
      {!searching && results.pages.length > 0 && (
        <div className={(results.events.length > 0 || results.products.length > 0) ? 'border-t border-white/5' : ''}>
          <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 px-4 pt-3 pb-1">Pages</p>
          {results.pages.map((r, i) => (
            <button key={i} onMouseDown={(e) => { e.preventDefault(); handleSelect(r.href); }}
              className="w-full text-left px-4 py-2.5 hover:bg-white/5 transition-colors">
              <span className="text-white text-sm">{r.label}</span>
            </button>
          ))}
        </div>
      )}
      <div className="h-2" />
    </>
  );

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      {/* Desktop */}
      <div className="hidden lg:grid grid-cols-3 items-center max-w-[1600px] mx-auto px-8 h-20">
        <nav className="flex items-center gap-8 text-sm font-medium tracking-wide">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`transition-colors uppercase ${isActive(link.href) ? 'text-white font-bold' : 'text-white hover:text-amber-400'}`}
            >
              {link.label}
            </button>
          ))}
        </nav>

        <div className="text-center">
          <button onClick={() => router.push('/')} className="font-display text-3xl font-bold uppercase tracking-widest text-white hover:text-gray-300 transition-colors">
            NEVA
          </button>
        </div>

        <div className="flex items-center justify-end gap-4 text-sm font-medium tracking-wide">
          {/* Desktop Search */}
          <div ref={desktopSearchRef} className="relative flex items-center">
            {searchOpen ? (
              <div className="flex items-center gap-2 bg-white/10 border border-white/20 rounded-lg px-3 py-2 w-56">
                <i className="ph ph-magnifying-glass text-gray-400 text-base flex-shrink-0"></i>
                <input
                  ref={inputRef}
                  value={query}
                  onChange={handleQueryChange}
                  onKeyDown={e => e.key === 'Escape' && closeSearch()}
                  placeholder="Search…"
                  className="bg-transparent text-white text-sm placeholder-gray-500 outline-none w-full"
                />
                {query ? (
                  <button onMouseDown={(e) => { e.preventDefault(); closeSearch(); }} className="text-gray-500 hover:text-white flex-shrink-0">
                    <i className="ph ph-x text-sm"></i>
                  </button>
                ) : null}
              </div>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-white hover:text-gray-300 transition-colors p-1">
                <i className="ph ph-magnifying-glass text-xl"></i>
              </button>
            )}

            {/* Desktop Dropdown — sibling of input wrapper, still inside desktopSearchRef */}
            {showDropdown && (
              <div className="absolute top-full right-0 mt-2 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[200]">
                <DropdownContent />
              </div>
            )}
          </div>

          <button onClick={() => router.push('/checkout')} className="text-white hover:text-gray-300 transition-colors relative">
            <i className="ph ph-shopping-cart text-xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <div className="h-4 w-px bg-white/20"></div>
          {approved ? (
            <button onClick={() => router.push('/portal-dashboard')} className="text-white hover:text-gray-300 transition-colors uppercase">
              Portal
            </button>
          ) : (
            <button onClick={() => router.push('/login')} className="text-white hover:text-gray-300 transition-colors uppercase">
              Login
            </button>
          )}
          <button
            onClick={() => router.push('/membership-apply')}
            className="px-5 py-2.5 bg-white text-black uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-200 active:scale-95 transition-all"
          >
            Join
          </button>
        </div>
      </div>

      {/* Mobile */}
      <div className="lg:hidden flex items-center justify-between px-6 h-20">
        <button onClick={() => router.push('/')} className="font-display text-2xl font-bold uppercase tracking-widest text-white">
          NEVA
        </button>
        <div className="flex items-center gap-4">
          {/* Mobile Search — own ref, never conflicts with desktop */}
          <div ref={mobileSearchRef} className="relative">
            {searchOpen ? (
              <>
                <div className="flex items-center gap-2 bg-white/10 border border-white/10 rounded-lg px-3 py-2 w-44">
                  <i className="ph ph-magnifying-glass text-gray-400 text-base flex-shrink-0"></i>
                  <input
                    ref={mobileInputRef}
                    value={query}
                    onChange={handleQueryChange}
                    onKeyDown={e => e.key === 'Escape' && closeSearch()}
                    placeholder="Search…"
                    className="bg-transparent text-white text-sm placeholder-gray-500 outline-none w-full"
                  />
                  <button onMouseDown={(e) => { e.preventDefault(); closeSearch(); }} className="text-gray-500 hover:text-white flex-shrink-0">
                    <i className="ph ph-x text-sm"></i>
                  </button>
                </div>
                {/* Mobile Dropdown — sibling of input, NOT nested inside it */}
                {showDropdown && (
                  <div className="absolute top-full right-0 mt-2 w-72 bg-[#111] border border-white/10 rounded-xl shadow-2xl overflow-hidden z-[200]">
                    <DropdownContent />
                  </div>
                )}
              </>
            ) : (
              <button onClick={() => setSearchOpen(true)} className="text-white">
                <i className="ph ph-magnifying-glass text-2xl"></i>
              </button>
            )}
          </div>

          <button onClick={() => router.push('/checkout')} className="text-white relative">
            <i className="ph ph-shopping-cart text-2xl"></i>
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-2 bg-white text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                {cartCount}
              </span>
            )}
          </button>
          <button onClick={() => setMobileOpen(!mobileOpen)} className="text-white">
            <i className={`ph ph-${mobileOpen ? 'x' : 'list'} text-2xl`}></i>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="lg:hidden bg-black/95 border-t border-white/10 px-6 py-4 space-y-4">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => { router.push(link.href); setMobileOpen(false); }}
              className="block w-full text-left text-sm font-medium uppercase tracking-wide text-white hover:text-amber-400 transition-colors py-2"
            >
              {link.label}
            </button>
          ))}
          <div className="border-t border-white/10 pt-4 flex flex-col gap-3">
            {approved ? (
              <button
                onClick={() => { router.push('/portal-dashboard'); setMobileOpen(false); }}
                className="text-left text-sm font-medium uppercase tracking-wide text-gray-300 hover:text-white transition-colors py-2"
              >
                Member Portal
              </button>
            ) : (
              <button
                onClick={() => { router.push('/login'); setMobileOpen(false); }}
                className="text-left text-sm font-medium uppercase tracking-wide text-gray-300 hover:text-white transition-colors py-2"
              >
                Login
              </button>
            )}
            <button
              onClick={() => { router.push('/membership-apply'); setMobileOpen(false); }}
              className="px-5 py-3 bg-white text-black uppercase font-bold text-xs tracking-wider rounded hover:bg-gray-200 transition-all text-center"
            >
              Join the Club
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
