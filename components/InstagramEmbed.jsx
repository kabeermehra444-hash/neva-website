'use client';
import { useEffect } from 'react';

// Extract the shortcode from any Instagram post URL.
// Handles /p/SHORTCODE/, /reel/SHORTCODE/, trailing slashes, and query strings.
function getShortcode(url) {
  const match = url?.match(/instagram\.com\/(?:p|reel)\/([^/?#]+)/);
  return match ? match[1] : null;
}

// Ask Instagram's script to render any unprocessed blockquotes on the page.
// If the script hasn't loaded yet, injecting it is enough — it auto-processes on load.
function processEmbeds() {
  if (typeof window === 'undefined') return;
  if (window.instgrm) {
    window.instgrm.Embeds.process();
    return;
  }
  if (!document.querySelector('script[src*="instagram.com/embed.js"]')) {
    const s = document.createElement('script');
    s.src = '//www.instagram.com/embed.js';
    s.async = true;
    document.body.appendChild(s);
  }
}

export default function InstagramEmbed({ url, className = '' }) {
  const shortcode = getShortcode(url);

  useEffect(() => {
    processEmbeds();
  }, [shortcode]);

  if (!shortcode) {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`group flex flex-col items-center justify-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-8 hover:border-white/25 transition-all ${className}`}
        style={{ minHeight: 320 }}
      >
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-pink-500 via-red-500 to-amber-500 flex items-center justify-center shadow-lg">
          <i className="ph-fill ph-instagram-logo text-2xl text-white"></i>
        </div>
        <p className="text-xs font-bold uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">
          View on Instagram <i className="ph ph-arrow-up-right ml-1"></i>
        </p>
      </a>
    );
  }

  const permaUrl = `https://www.instagram.com/p/${shortcode}/`;

  return (
    <div className={`instagram-embed-wrapper ${className}`}>
      <blockquote
        className="instagram-media"
        data-instgrm-permalink={permaUrl}
        data-instgrm-version="14"
        style={{
          background: '#FFF',
          border: 0,
          borderRadius: '12px',
          margin: '0 auto',
          maxWidth: '540px',
          width: 'calc(100% - 2px)',
          minWidth: '326px',
        }}
      >
        {/* Shown briefly before embed.js processes the blockquote */}
        <a
          href={permaUrl}
          target="_blank"
          rel="noopener noreferrer"
          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '40px', color: '#999', fontSize: '13px', textDecoration: 'none' }}
        >
          View this post on Instagram
        </a>
      </blockquote>
    </div>
  );
}
