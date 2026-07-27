'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isApprovedMember, setLoginRedirect, memberHeaders } from '@/lib/auth';

export default function PortalGalleryPage() {
  const router = useRouter();
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lightbox, setLightbox] = useState(null);

  useEffect(() => {
    if (!isApprovedMember()) {
      setLoginRedirect('/portal-gallery');
      router.replace('/login');
      return;
    }
    fetch('/api/gallery/member-photos', { headers: memberHeaders() })
      .then(r => r.ok ? r.json() : [])
      .then(d => setPhotos(Array.isArray(d) ? d : []))
      .catch(() => setPhotos([]))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onKey = (e) => { if (e.key === 'Escape') setLightbox(null); };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, []);

  const srcFor = (photo, download = false) =>
    `/api/gallery/photos/${photo.id}/serve?t=${photo.view_token}${download ? '&download=1' : ''}`;

  // Photos arrive ordered by event date, so grouping preserves that order.
  const groups = [];
  photos.forEach(p => {
    const last = groups[groups.length - 1];
    if (last && last.eventId === p.event_id) last.photos.push(p);
    else groups.push({ eventId: p.event_id, name: p.event_name, date: p.event_date, photos: [p] });
  });

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PortalNav />
      <main className="pt-20 pb-20">
        <div className="max-w-[1400px] mx-auto px-6 py-12">

          <div className="mb-12">
            <p className="text-amber-400 text-xs uppercase tracking-widest font-bold mb-3">Members Only</p>
            <h1 className="font-display text-5xl md:text-6xl font-medium uppercase tracking-tight mb-4">Photo Gallery</h1>
            <p className="text-white max-w-xl leading-relaxed">
              Photos from Club NEVA events. Click any photo to view it full size, or download it to keep.
            </p>
          </div>

          {loading ? (
            <div className="text-center py-20 text-white">
              <i className="ph ph-circle-notch animate-spin text-3xl mb-4"></i>
              <p>Loading photos...</p>
            </div>
          ) : photos.length === 0 ? (
            <div className="text-center py-20 text-white">
              <i className="ph ph-images text-4xl mb-4"></i>
              <p>No photos published yet. Check back after the next event.</p>
            </div>
          ) : (
            <div className="space-y-12">
              {groups.map(group => (
                <section key={group.eventId}>
                  <div className="flex items-baseline gap-3 mb-5">
                    <h2 className="font-display text-2xl font-medium uppercase tracking-tight">{group.name}</h2>
                    {group.date && (
                      <span className="text-gray-500 text-xs uppercase tracking-widest">
                        {new Date(group.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' })}
                      </span>
                    )}
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {group.photos.map(photo => (
                      <div key={photo.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden hover:border-white/20 transition-colors">
                        <button onClick={() => setLightbox(photo)} className="block w-full">
                          <img
                            src={srcFor(photo)}
                            alt={photo.caption || 'Event photo'}
                            className="w-full aspect-square object-cover hover:opacity-90 transition-opacity"
                          />
                        </button>
                        <div className="p-3 flex items-center gap-2">
                          <p className="flex-1 text-xs text-gray-400 truncate">{photo.caption || ''}</p>
                          <a
                            href={srcFor(photo, true)}
                            download
                            className="px-2.5 py-1.5 bg-white/10 border border-white/20 text-gray-300 text-[10px] font-bold uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
                            title="Download"
                          >
                            <i className="ph ph-download-simple text-sm"></i>
                          </a>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {lightbox && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center p-6"
          onClick={() => setLightbox(null)}
        >
          <button
            onClick={() => setLightbox(null)}
            className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors"
            aria-label="Close"
          >
            <i className="ph ph-x text-3xl"></i>
          </button>
          <div className="max-w-5xl w-full" onClick={e => e.stopPropagation()}>
            <img
              src={srcFor(lightbox)}
              alt={lightbox.caption || 'Event photo'}
              className="w-full max-h-[80vh] object-contain rounded-xl"
            />
            <div className="flex items-center gap-4 mt-4">
              <p className="flex-1 text-sm text-gray-400">{lightbox.caption || ''}</p>
              <a
                href={srcFor(lightbox, true)}
                download
                className="px-5 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors flex items-center gap-2"
              >
                <i className="ph ph-download-simple text-base"></i> Download
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
