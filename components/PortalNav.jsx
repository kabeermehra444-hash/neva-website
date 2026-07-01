'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { clearStoredMember, getStoredMember, isAdmin } from '@/lib/auth';

export default function PortalNav() {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const menuRef = useRef(null);
  const [memberName, setMemberName] = useState('Member');
  const [adminUser, setAdminUser] = useState(false);

  useEffect(() => {
    const m = getStoredMember();
    if (m) {
      setMemberName(m.first_name || m.name?.split(' ')[0] || 'Member');
    }
    setAdminUser(isAdmin());
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        if (!e.target.closest('[data-menu-trigger]')) setMenuOpen(false);
      }
    };
    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearStoredMember();
    setMenuOpen(false);
    router.push('/');
  };

  const navLinks = [
    { label: 'Dashboard', href: '/portal-dashboard' },
    { label: 'Leaderboard', href: '/portal-leaderboard' },
    { label: 'Stats', href: '/portal-stats-history' },
    { label: 'Events', href: '/events' },
    { label: 'Perks', href: '/portal-perks' },
  ];

  const isActive = (href) => pathname === href;

  return (
    <header className="fixed top-0 left-0 right-0 w-full z-50 bg-black/80 backdrop-blur-md border-b border-white/10">
      <div className="max-w-[1600px] mx-auto px-6 h-20 flex items-center justify-between">
        {/* Logo */}
        <button onClick={() => router.push('/')} className="font-display text-2xl font-bold uppercase tracking-widest text-white hover:text-gray-300 transition-colors">
          NEVA
        </button>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium tracking-wide">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => router.push(link.href)}
              className={`transition-colors uppercase ${isActive(link.href) ? 'text-white font-bold' : 'text-white hover:text-amber-400'}`}
            >
              {link.label}
            </button>
          ))}
          {adminUser && (
            <button
              onClick={() => router.push('/portal-admin')}
              className={`transition-colors uppercase ${isActive('/portal-admin') ? 'text-white font-bold' : 'text-yellow-400 hover:text-yellow-300'}`}
            >
              Admin
            </button>
          )}
        </nav>

        {/* Desktop Member Menu */}
        <div className="hidden md:flex items-center gap-4">
          <div className="h-8 w-px bg-white/20"></div>
          <div
            className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={() => setMenuOpen(!menuOpen)}
            data-menu-trigger
          >
            <div className="w-8 h-8 bg-white/10 border border-white/20 rounded-full flex items-center justify-center">
              <i className="ph-fill ph-user text-sm text-white"></i>
            </div>
            <span className="text-xs font-medium uppercase tracking-wide">{memberName}</span>
            <i className="ph ph-caret-down text-xs text-gray-400"></i>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button className="md:hidden text-white" onClick={() => setMobileOpen(!mobileOpen)}>
          <i className={`ph ph-${mobileOpen ? 'x' : 'list'} text-2xl`}></i>
        </button>
      </div>

      {/* Desktop Dropdown Menu */}
      {menuOpen && (
        <div
          ref={menuRef}
          className="absolute top-20 right-6 bg-black/95 border border-white/10 rounded-xl overflow-hidden shadow-2xl min-w-48 z-50"
        >
          <button onClick={() => { router.push('/portal-profile'); setMenuOpen(false); }} className="w-full px-6 py-3 text-left text-sm font-medium text-white hover:bg-white/10 transition-colors uppercase tracking-wide border-b border-white/10">
            My Profile
          </button>
          <button onClick={() => { router.push('/portal-neva-cash'); setMenuOpen(false); }} className="w-full px-6 py-3 text-left text-sm font-medium text-white hover:bg-white/10 transition-colors uppercase tracking-wide border-b border-white/10">
            NEVA Cash
          </button>
          <button onClick={() => { router.push('/shop'); setMenuOpen(false); }} className="w-full px-6 py-3 text-left text-sm font-medium text-white hover:bg-white/10 transition-colors uppercase tracking-wide border-b border-white/10">
            Shop
          </button>
          {adminUser && (
            <button onClick={() => { router.push('/portal-admin'); setMenuOpen(false); }} className="w-full px-6 py-3 text-left text-sm font-medium text-yellow-400 hover:bg-white/10 transition-colors uppercase tracking-wide border-b border-white/10">
              Admin Panel
            </button>
          )}
          <button onClick={handleLogout} className="w-full px-6 py-3 text-left text-sm font-medium text-red-400 hover:bg-white/10 transition-colors uppercase tracking-wide">
            Logout
          </button>
        </div>
      )}

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden bg-black/95 border-t border-white/10 px-6 py-4 space-y-2">
          {navLinks.map(link => (
            <button
              key={link.href}
              onClick={() => { router.push(link.href); setMobileOpen(false); }}
              className={`block w-full text-left text-sm font-medium uppercase tracking-wide py-3 border-b border-white/10 transition-colors ${isActive(link.href) ? 'text-white font-bold' : 'text-white hover:text-amber-400'}`}
            >
              {link.label}
            </button>
          ))}
          <button onClick={() => { router.push('/portal-profile'); setMobileOpen(false); }} className="block w-full text-left text-sm font-medium uppercase tracking-wide py-3 border-b border-white/10 text-white hover:text-amber-400 transition-colors">My Profile</button>
          <button onClick={() => { router.push('/portal-neva-cash'); setMobileOpen(false); }} className="block w-full text-left text-sm font-medium uppercase tracking-wide py-3 border-b border-white/10 text-white hover:text-amber-400 transition-colors">NEVA Cash</button>
          {adminUser && (
            <button onClick={() => { router.push('/portal-admin'); setMobileOpen(false); }} className="block w-full text-left text-sm font-medium uppercase tracking-wide py-3 border-b border-white/10 text-yellow-400 hover:text-yellow-300 transition-colors">Admin Panel</button>
          )}
          <button onClick={handleLogout} className="block w-full text-left text-sm font-medium uppercase tracking-wide py-3 text-red-400 hover:text-red-300 transition-colors">Logout</button>
        </div>
      )}
    </header>
  );
}
