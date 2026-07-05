'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PortalNav from '@/components/PortalNav';
import { isAdmin, isLoggedIn, setLoginRedirect, adminHeaders, getAdminToken } from '@/lib/auth';
import { pacificWallTimeToUTCISOString } from '@/lib/timezone';

export default function PortalAdminPage() {
  const router = useRouter();
  const [tab, setTab] = useState('applications');
  const [applications, setApplications] = useState([]);
  const [members, setMembers] = useState([]);
  const [events, setEvents] = useState([]);
  const [showArchived, setShowArchived] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingMember, setEditingMember] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState(null);
  const [search, setSearch] = useState('');
  const [eventForm, setEventForm] = useState({ title: '', description: '', location: '', date: '', time: '', end_time: '', price: '', capacity: '', dupr_minimum: '', playbypoint_url: '' });
  const [eventFormOpen, setEventFormOpen] = useState(false);
  const [checkinEventId, setCheckinEventId] = useState('');
  const [checkinMembers, setCheckinMembers] = useState([]);
  const [checkinDraft, setCheckinDraft] = useState({});
  const [checkinLoading, setCheckinLoading] = useState(false);
  const [savingCheckins, setSavingCheckins] = useState(false);
  const [sponsors, setSponsors] = useState([]);
  const [sponsorForm, setSponsorForm] = useState({ name: '', logo_url: '', description: '', discount_code: '' });
  const [sponsorFormOpen, setSponsorFormOpen] = useState(false);
  const [savingSponsor, setSavingSponsor] = useState(false);
  const [editingSponsor, setEditingSponsor] = useState(null);
  const [creatingEvent, setCreatingEvent] = useState(false);
  const [createdEventLink, setCreatedEventLink] = useState(null);
  const [copiedEventId, setCopiedEventId] = useState(null);
  const [editingEvent, setEditingEvent] = useState(null);
  const [eventRegs, setEventRegs] = useState([]);
  const [guestForm, setGuestForm] = useState({ name: '', email: '' });
  const [addingGuest, setAddingGuest] = useState(false);
  const [expandedMemberId, setExpandedMemberId] = useState(null);

  useEffect(() => {
    if (!isLoggedIn()) {
      setLoginRedirect('/portal-admin');
      router.replace('/login');
      return;
    }
    if (!isAdmin()) {
      router.replace('/portal-dashboard');
      return;
    }
    fetchAll();
  }, []);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [appsRes, memsRes, evRes, spRes] = await Promise.all([
        fetch('/api/membership-applications', { headers: adminHeaders() }),
        fetch('/api/members', { headers: adminHeaders() }),
        fetch('/api/events?archived=all', { headers: adminHeaders() }),
        fetch('/api/sponsors', { headers: adminHeaders() }),
      ]);
      setApplications(await appsRes.json().then(d => Array.isArray(d) ? d : []));
      setMembers(await memsRes.json().then(d => Array.isArray(d) ? d : []));
      setEvents(await evRes.json().then(d => Array.isArray(d) ? d : []));
      setSponsors(await spRes.json().then(d => Array.isArray(d) ? d : []));
    } catch (e) { showToast('Error loading data', 'error'); }
    finally { setLoading(false); }
  };

  const approveApp = async (app) => {
    try {
      // Server now handles both member creation and status update atomically.
      const res = await fetch(`/api/membership-applications/${app.id}`, {
        method: 'PATCH', headers: adminHeaders(),
        body: JSON.stringify({ status: 'approved' }),
      });
      if (res.ok) {
        showToast(`✓ Approved: ${app.first_name} ${app.last_name}`);
        fetchAll();
      } else if (res.status === 401) {
        showToast('Session expired — please log out and back in.', 'error');
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Error approving', 'error');
      }
    } catch { showToast('Error approving', 'error'); }
  };

  const denyApp = async (app) => {
    if (!confirm(`Deny ${app.first_name} ${app.last_name}?`)) return;
    await fetch(`/api/membership-applications/${app.id}`, {
      method: 'PATCH', headers: adminHeaders(),
      body: JSON.stringify({ status: 'denied' }),
    }).catch(() => {});
    showToast(`Denied: ${app.first_name} ${app.last_name}`);
    fetchAll();
  };

  const startEdit = (m) => {
    setExpandedMemberId(null);
    setEditingMember(m.id);
    setEditForm({ wins: m.wins || 0, losses: m.losses || 0, rank: m.rank || '', neva_cash_balance: m.neva_cash_balance || 0, _originalWins: m.wins || 0 });
  };

  const saveMember = async (id) => {
    setSaving(true);
    const newWins = +editForm.wins;
    const originalWins = +editForm._originalWins;
    const winDelta = newWins - originalWins;
    const nevaCash = winDelta > 0
      ? +(+editForm.neva_cash_balance + winDelta * 0.5).toFixed(2)
      : +editForm.neva_cash_balance;
    try {
      const res = await fetch(`/api/members/${id}`, {
        method: 'PATCH',
        headers: adminHeaders(),
        body: JSON.stringify({
          wins: newWins,
          losses: +editForm.losses,
          rank: editForm.rank !== '' ? +editForm.rank : null,
          neva_cash_balance: nevaCash,
        }),
      });
      if (res.ok) {
        if (winDelta > 0) showToast(`✓ Saved · +$${(winDelta * 0.5).toFixed(2)} NEVA Cash added`);
        else showToast('✓ Member stats saved');
        setEditingMember(null);
        fetchAll();
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Save failed — check console', 'error');
      }
    } catch (err) {
      console.error('saveMember error:', err);
      showToast('Network error — could not save', 'error');
    } finally {
      setSaving(false);
    }
  };

  const submitEvent = async (e) => {
    e.preventDefault();
    setCreatingEvent(true);
    try {
      const date_time = eventForm.date && eventForm.time
        ? pacificWallTimeToUTCISOString(eventForm.date, eventForm.time)
        : eventForm.date || null;
      const end_time = eventForm.date && eventForm.end_time
        ? pacificWallTimeToUTCISOString(eventForm.date, eventForm.end_time)
        : null;
      const payload = {
        description: eventForm.description || null,
        location: eventForm.location || null,
        date_time,
        end_time,
        price: eventForm.price ? parseFloat(eventForm.price) : null,
        capacity: eventForm.capacity ? parseInt(eventForm.capacity) : null,
        dupr_minimum: eventForm.dupr_minimum ? parseFloat(eventForm.dupr_minimum) : null,
        playbypoint_url: eventForm.playbypoint_url || null,
      };
      let res;
      if (editingEvent) {
        res = await fetch(`/api/events/${editingEvent.id}`, {
          method: 'PATCH', headers: adminHeaders(),
          body: JSON.stringify({ name: eventForm.title, ...payload }),
        });
      } else {
        res = await fetch('/api/events', {
          method: 'POST', headers: adminHeaders(),
          body: JSON.stringify({ title: eventForm.title, ...payload, status: 'upcoming' }),
        });
      }
      if (res.ok) {
        if (!editingEvent) {
          const created = await res.json();
          setCreatedEventLink(`${window.location.origin}/events/${created.slug || created.id}`);
        }
        setEventForm({ title: '', description: '', location: '', date: '', time: '', end_time: '', price: '', capacity: '', dupr_minimum: '', playbypoint_url: '' });
        setEventFormOpen(false);
        setEditingEvent(null);
        setEventRegs([]);
        showToast(editingEvent ? '✓ Event updated' : '✓ Event created');
        fetchAll();
      } else {
        showToast(editingEvent ? 'Error updating event' : 'Error creating event', 'error');
      }
    } catch { showToast('Error', 'error'); }
    finally { setCreatingEvent(false); }
  };

  const fetchEventRegs = async (eventId) => {
    try {
      const res = await fetch(`/api/event-registrations?event_id=${eventId}`);
      if (res.ok) {
        const data = await res.json();
        setEventRegs(Array.isArray(data) ? data : []);
      }
    } catch {}
  };

  const removeRegistration = async (registrationId, memberName) => {
    if (!confirm(`Remove ${memberName} from this event? This cannot be undone.`)) return;
    const res = await fetch(`/api/event-registrations?id=${registrationId}`, { method: 'DELETE' });
    if (res.ok) {
      setEventRegs(prev => prev.filter(r => r.id !== registrationId));
      showToast(`✓ Removed ${memberName}`);
    } else {
      showToast('Error removing registration', 'error');
    }
  };

  const addGuestRegistration = async (eventId) => {
    if (!guestForm.name.trim()) {
      showToast('Enter a name first', 'error');
      return;
    }
    setAddingGuest(true);
    try {
      const res = await fetch('/api/event-registrations', {
        method: 'POST',
        headers: adminHeaders(),
        body: JSON.stringify({
          event_id: eventId,
          guest_name: guestForm.name.trim(),
          guest_email: guestForm.email.trim() || null,
        }),
      });
      if (res.ok) {
        setGuestForm({ name: '', email: '' });
        showToast(`✓ Added ${guestForm.name.trim()}`);
        fetchEventRegs(eventId);
      } else {
        const data = await res.json().catch(() => ({}));
        showToast(data.error || 'Error adding guest', 'error');
      }
    } catch {
      showToast('Error adding guest', 'error');
    } finally {
      setAddingGuest(false);
    }
  };

  const startEditEvent = (ev) => {
    const parseDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-CA', { timeZone: 'America/Los_Angeles' }) : '';
    const parseTime = (dt) => dt ? new Date(dt).toLocaleTimeString('en-US', { timeZone: 'America/Los_Angeles', hourCycle: 'h23', hour: '2-digit', minute: '2-digit' }) : '';
    setEventForm({
      title: ev.title || ev.name || '',
      description: ev.description || '',
      location: ev.location || '',
      date: parseDate(ev.date_time),
      time: parseTime(ev.date_time),
      end_time: parseTime(ev.end_time),
      price: ev.price != null ? String(ev.price) : '',
      capacity: ev.capacity != null ? String(ev.capacity) : '',
      dupr_minimum: ev.dupr_minimum != null ? String(ev.dupr_minimum) : '',
      playbypoint_url: ev.playbypoint_url || '',
    });
    setEditingEvent(ev);
    setEventFormOpen(true);
    fetchEventRegs(ev.id);
  };

  const deleteEvent = async (ev) => {
    if (!confirm(`Delete "${ev.title || ev.name}"? This cannot be undone.`)) return;
    const res = await fetch(`/api/events/${ev.id}`, { method: 'DELETE', headers: adminHeaders() });
    if (res.ok) { showToast('Event deleted'); fetchAll(); }
    else showToast('Error deleting event', 'error');
  };

  const copyEventLink = (link, id) => {
    navigator.clipboard.writeText(link);
    setCopiedEventId(id);
    setTimeout(() => setCopiedEventId(null), 2000);
  };

  const fetchCheckins = async (eventId) => {
    if (!eventId) { setCheckinMembers([]); setCheckinDraft({}); return; }
    setCheckinLoading(true);
    try {
      const [regsRes, checkinsRes] = await Promise.all([
        fetch(`/api/event-registrations?event_id=${eventId}`),
        fetch(`/api/event-checkins?event_id=${eventId}`),
      ]);
      const regs = regsRes.ok ? await regsRes.json() : [];
      const checkins = checkinsRes.ok ? await checkinsRes.json() : [];

      const checkinMap = {};
      (Array.isArray(checkins) ? checkins : []).forEach(c => { checkinMap[c.member_id] = !!c.checked_in; });

      const merged = (Array.isArray(regs) ? regs : []).map(r => ({
        member_id: r.member_id,
        name: r.name,
        email: r.email,
        checked_in: !!checkinMap[r.member_id],
      }));

      setCheckinMembers(merged);
      const draft = {};
      merged.forEach(m => { draft[m.member_id] = m.checked_in; });
      setCheckinDraft(draft);
    } catch { showToast('Error loading check-ins', 'error'); }
    finally { setCheckinLoading(false); }
  };

  const saveAllCheckins = async () => {
    setSavingCheckins(true);
    try {
      await Promise.all(
        Object.entries(checkinDraft).map(([memberId, checkedIn]) =>
          fetch('/api/event-checkins', {
            method: 'POST',
            headers: adminHeaders(),
            body: JSON.stringify({ event_id: parseInt(checkinEventId), member_id: parseInt(memberId), checked_in: checkedIn }),
          })
        )
      );
      showToast(`✓ Check-ins saved`);
      fetchCheckins(checkinEventId);
    } catch { showToast('Error saving check-ins', 'error'); }
    finally { setSavingCheckins(false); }
  };

  const saveSponsor = async (e) => {
    e.preventDefault();
    setSavingSponsor(true);
    try {
      if (editingSponsor) {
        const res = await fetch(`/api/sponsors/${editingSponsor}`, {
          method: 'PATCH', headers: adminHeaders(),
          body: JSON.stringify(sponsorForm),
        });
        if (res.ok) { showToast('✓ Sponsor updated'); setEditingSponsor(null); }
        else showToast('Error saving', 'error');
      } else {
        const res = await fetch('/api/sponsors', {
          method: 'POST', headers: adminHeaders(),
          body: JSON.stringify(sponsorForm),
        });
        if (res.ok) { showToast('✓ Sponsor added'); }
        else showToast('Error adding sponsor', 'error');
      }
      setSponsorForm({ name: '', logo_url: '', description: '', discount_code: '' });
      setSponsorFormOpen(false);
      fetchAll();
    } catch { showToast('Error', 'error'); }
    finally { setSavingSponsor(false); }
  };

  const toggleSponsorActive = async (sponsor) => {
    await fetch(`/api/sponsors/${sponsor.id}`, {
      method: 'PATCH', headers: adminHeaders(),
      body: JSON.stringify({ active: !sponsor.active }),
    });
    fetchAll();
  };

  const pending = applications.filter(a => a.status === 'pending');
  const reviewed = applications.filter(a => a.status !== 'pending');
  const filteredMembers = search ? members.filter(m => `${m.name} ${m.email}`.toLowerCase().includes(search.toLowerCase())) : members;

  const stats = [
    { label: 'Total Members', value: members.filter(m => m.approved).length, icon: 'ph-users', color: 'text-blue-400' },
    { label: 'Pending Apps', value: pending.length, icon: 'ph-clock', color: 'text-yellow-400' },
    { label: 'Total Events', value: events.length, icon: 'ph-calendar', color: 'text-green-400' },
    { label: 'NEVA Cash Issued', value: '$'+members.reduce((s,m)=>s+(+m.neva_cash_balance||0),0).toFixed(0), icon: 'ph-coin', color: 'text-amber-400' },
  ];

  if (loading) return (
    <div className="font-sans bg-black text-white min-h-screen flex items-center justify-center">
      <p className="text-gray-500 text-xs uppercase tracking-widest">Loading Admin...</p>
    </div>
  );

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PortalNav />

      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 px-6 py-3 rounded-xl font-bold text-sm shadow-2xl transition-all ${toast.type==='error' ? 'bg-red-500 text-white' : 'bg-white text-black'}`}>
          {toast.msg}
        </div>
      )}

      <main className="pt-20 pb-16">
        <div className="max-w-[1600px] mx-auto px-6">

          {/* Header */}
          <section className="py-8 border-b border-white/10 mb-8">
            <div className="flex items-center gap-3 mb-1">
              <span className="px-2.5 py-1 bg-yellow-400/20 border border-yellow-400/40 rounded text-yellow-400 text-[11px] font-bold uppercase tracking-widest">Admin</span>
              <h1 className="font-display text-4xl font-medium uppercase tracking-tight">Control Panel</h1>
            </div>
            <p className="text-gray-500">{members.filter(m => m.approved).length} active members · {pending.length} pending applications</p>
          </section>

          {/* Stats Row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {stats.map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-5">
                <div className="flex items-start justify-between mb-3">
                  <p className="text-gray-500 text-[11px] uppercase tracking-widest font-bold">{s.label}</p>
                  <i className={`ph-fill ${s.icon} text-lg ${s.color}`}></i>
                </div>
                <p className="font-display text-3xl font-bold">{s.value}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="flex gap-1 mb-8 border-b border-white/10">
            {[
              { key: 'applications', label: `Applications`, badge: pending.length },
              { key: 'members', label: 'Members', badge: null },
              { key: 'events', label: 'Events', badge: null },
              { key: 'checkin', label: 'Check-In', badge: null },
              { key: 'sponsors', label: 'Sponsors', badge: null },
            ].map(t => (
              <button
                key={t.key}
                onClick={() => setTab(t.key)}
                className={`px-5 py-3 text-sm font-bold uppercase tracking-wider border-b-2 transition-colors flex items-center gap-2 ${tab===t.key ? 'border-white text-white' : 'border-transparent text-gray-500 hover:text-white'}`}
              >
                {t.label}
                {t.badge > 0 && <span className="bg-yellow-400 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">{t.badge}</span>}
              </button>
            ))}
          </div>

          {/* APPLICATIONS TAB */}
          {tab === 'applications' && (
            <div>
              {pending.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <i className="ph ph-check-circle text-5xl mb-4 text-green-500/50"></i>
                  <p>No pending applications — inbox clear.</p>
                </div>
              ) : (
                <div className="space-y-4 mb-12">
                  <p className="text-yellow-400 text-xs font-bold uppercase tracking-widest mb-4">Awaiting Review ({pending.length})</p>
                  {pending.map(app => (
                    <div key={app.id} className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors">
                      <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 flex-wrap mb-2">
                            <h3 className="font-bold text-lg">{app.first_name} {app.last_name}</h3>
                            {app.skill_level && <span className="text-[11px] bg-blue-500/20 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded font-bold uppercase">{app.skill_level}</span>}
                          </div>
                          <p className="text-gray-400 text-sm mb-1">{app.email}{app.phone ? ` · ${app.phone}` : ''}</p>
                          {app.instagram_handle && <p className="text-gray-500 text-sm mb-1">@{app.instagram_handle}</p>}
                          {app.experience && <p className="text-gray-500 text-sm mb-2">Plays: {app.experience}</p>}
                          {app.why_join && (
                            <div className="mt-3 p-4 bg-white/5 rounded-lg border border-white/10">
                              <p className="text-[11px] text-gray-500 uppercase tracking-widest mb-1">Why they want to join</p>
                              <p className="text-sm text-gray-300 leading-relaxed">{app.why_join}</p>
                            </div>
                          )}
                          <p className="text-gray-600 text-xs mt-3">Submitted {app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-US',{month:'long',day:'numeric',year:'numeric',timeZone:'America/Los_Angeles'}) : '—'}</p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => approveApp(app)} className="px-5 py-2.5 bg-green-500 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-green-600 transition-colors">
                            Approve
                          </button>
                          <button onClick={() => denyApp(app)} className="px-5 py-2.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-500/30 transition-colors">
                            Deny
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {reviewed.length > 0 && (
                <div>
                  <p className="text-gray-600 text-xs font-bold uppercase tracking-widest mb-4">Previously Reviewed</p>
                  <div className="space-y-2">
                    {reviewed.map(app => (
                      <div key={app.id} className="bg-white/3 border border-white/5 rounded-lg px-5 py-3 flex items-center justify-between">
                        <div>
                          <span className="text-sm font-medium">{app.first_name} {app.last_name}</span>
                          <span className="text-gray-500 text-sm ml-3">{app.email}</span>
                        </div>
                        <span className={`text-[11px] font-bold uppercase px-2 py-0.5 rounded ${app.status==='approved' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>{app.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* MEMBERS TAB */}
          {tab === 'members' && (
            <div>
              {/* Search */}
              <div className="relative mb-6">
                <i className="ph ph-magnifying-glass absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"></i>
                <input
                  type="text" value={search} onChange={e => setSearch(e.target.value)}
                  placeholder="Search by name or email..."
                  className="w-full pl-10 pr-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/30 placeholder-gray-600"
                />
              </div>

              <div className="space-y-3">
                {filteredMembers.map(m => {
                  const app = applications.find(a => a.email === m.email);
                  const wins = m.wins || 0;
                  const losses = m.losses || 0;
                  const total = wins + losses;
                  const winPct = total > 0 ? `${((wins / total) * 100).toFixed(1)}%` : '—';
                  const isExpanded = expandedMemberId === m.id;

                  return (
                  <div key={m.id} className="bg-white/5 border border-white/10 rounded-xl overflow-hidden">
                    {editingMember === m.id ? (
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-5">
                          <h3 className="font-bold">{m.name}</h3>
                          <div className="flex gap-2">
                            <button onClick={() => saveMember(m.id)} disabled={saving} className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                              {saving ? 'Saving...' : 'Save Changes'}
                            </button>
                            <button onClick={() => setEditingMember(null)} className="px-4 py-2 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                              Cancel
                            </button>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                          {[
                            { label: 'Wins', key: 'wins', type: 'number' },
                            { label: 'Losses', key: 'losses', type: 'number' },
                            { label: 'NEVA Cash ($)', key: 'neva_cash_balance', type: 'number' },
                            { label: 'Rank', key: 'rank', type: 'number' },
                          ].map(f => (
                            <div key={f.key}>
                              <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">{f.label}</label>
                              <input type={f.type} value={editForm[f.key]} onChange={e => setEditForm({ ...editForm, [f.key]: e.target.value })}
                                className="w-full px-3 py-2.5 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/50" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        {/* Clickable summary row */}
                        <div
                          className="px-5 py-4 flex flex-col md:flex-row md:items-center justify-between gap-3 cursor-pointer hover:bg-white/4 transition-colors select-none"
                          onClick={() => setExpandedMemberId(isExpanded ? null : m.id)}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap mb-1">
                              <span className="font-bold">{m.name}</span>
                              <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${m.approved ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'}`}>{m.approved ? 'approved' : 'pending'}</span>
                            </div>
                            <p className="text-gray-500 text-sm">{m.email}</p>
                            <div className="flex flex-wrap gap-4 mt-1.5 text-xs text-gray-600">
                              <span>{wins}W / {losses}L</span>
                              <span>NEVA Cash: ${m.neva_cash_balance || 0}</span>
                              {m.rank != null && <span>Rank: #{m.rank}</span>}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-shrink-0">
                            <button
                              onClick={e => { e.stopPropagation(); startEdit(m); }}
                              className="px-4 py-2 bg-white/10 border border-white/20 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors"
                            >
                              Edit
                            </button>
                            <i className={`ph ph-caret-down text-gray-500 text-sm transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}></i>
                          </div>
                        </div>

                        {/* Accordion — member detail */}
                        {isExpanded && (
                          <div className="border-t border-white/8 px-6 py-6 grid md:grid-cols-3 gap-8">

                            {/* Personal Info */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-4">Personal</p>
                              <div className="space-y-3">
                                {[
                                  ['Name', m.name],
                                  ['Email', m.email],
                                  ['Phone', app?.phone || '—'],
                                  ['Instagram', app?.instagram_handle ? `@${app.instagram_handle}` : '—'],
                                  ['Status', m.approved ? 'Approved' : 'Pending'],
                                  ['Member Since', m.created_at ? new Date(m.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }) : '—'],
                                ].map(([label, val]) => (
                                  <div key={label}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                                    <p className="text-sm text-white/80 break-all">{val}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Competition Stats */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-4">Competition Stats</p>
                              <div className="space-y-3">
                                {[
                                  ['Wins', wins],
                                  ['Losses', losses],
                                  ['Win Rate', winPct],
                                  ['Events Played', m.events_played || 0],
                                  ['Current Streak', `${m.streak || 0} win${(m.streak || 0) !== 1 ? 's' : ''}`],
                                  ['NEVA Cash', `$${parseFloat(m.neva_cash_balance || 0).toFixed(2)}`],
                                  ['Rank', m.rank != null ? `#${m.rank}` : '—'],
                                ].map(([label, val]) => (
                                  <div key={label}>
                                    <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                                    <p className="text-sm text-white/80">{val}</p>
                                  </div>
                                ))}
                              </div>
                            </div>

                            {/* Application Details */}
                            <div>
                              <p className="text-[10px] font-bold uppercase tracking-[0.3em] text-gray-600 mb-4">Application</p>
                              {app ? (
                                <div className="space-y-3">
                                  {[
                                    ['Skill Level', app.skill_level || '—'],
                                    ['Play Frequency', app.experience || '—'],
                                    ['Applied', app.submitted_at ? new Date(app.submitted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'America/Los_Angeles' }) : '—'],
                                    ['App Status', app.status || '—'],
                                  ].map(([label, val]) => (
                                    <div key={label}>
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-0.5">{label}</p>
                                      <p className="text-sm text-white/80">{val}</p>
                                    </div>
                                  ))}
                                  {app.why_join && (
                                    <div className="pt-1">
                                      <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600 mb-1.5">Why They Joined</p>
                                      <p className="text-sm text-gray-400 leading-relaxed">{app.why_join}</p>
                                    </div>
                                  )}
                                </div>
                              ) : (
                                <p className="text-gray-600 text-sm">No application on file.</p>
                              )}
                            </div>

                          </div>
                        )}
                      </>
                    )}
                  </div>
                  );
                })}
                {filteredMembers.length === 0 && (
                  <div className="text-center py-12 text-gray-500">
                    <i className="ph ph-magnifying-glass text-3xl mb-3"></i>
                    <p>No members match "{search}"</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* EVENTS TAB */}
          {tab === 'events' && (
            <div>
              {/* Create Event */}
              <div className="mb-8">
                {!eventFormOpen ? (
                  <button onClick={() => setEventFormOpen(true)} className="flex items-center gap-2 px-5 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
                    <i className="ph ph-plus text-base"></i> Create Event
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6">
                    <div className="flex items-center justify-between mb-6">
                      <h3 className="font-bold uppercase tracking-widest text-sm">{editingEvent ? 'Edit Event' : 'New Event'}</h3>
                      <button onClick={() => { setEventFormOpen(false); setEditingEvent(null); setEventRegs([]); }} className="text-gray-500 hover:text-white transition-colors">
                        <i className="ph ph-x text-lg"></i>
                      </button>
                    </div>
                    <form onSubmit={submitEvent} className="space-y-4">
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Event Title *</label>
                        <input required type="text" value={eventForm.title} onChange={e => setEventForm({...eventForm, title: e.target.value})}
                          placeholder="e.g. Summer Slam Tournament"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
                        <textarea value={eventForm.description} onChange={e => setEventForm({...eventForm, description: e.target.value})}
                          placeholder="Event details..." rows={3}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Location</label>
                        <input type="text" value={eventForm.location} onChange={e => setEventForm({...eventForm, location: e.target.value})}
                          placeholder="e.g. Club NEVA Main Court"
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Date *</label>
                          <input required type="date" value={eventForm.date} onChange={e => setEventForm({...eventForm, date: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 [color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Start Time</label>
                          <input type="time" value={eventForm.time} onChange={e => setEventForm({...eventForm, time: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 [color-scheme:dark]" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">End Time</label>
                          <input type="time" value={eventForm.end_time} onChange={e => setEventForm({...eventForm, end_time: e.target.value})}
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm focus:outline-none focus:border-white/40 [color-scheme:dark]" />
                        </div>
                      </div>
                      <div className="grid grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Price ($)</label>
                          <input type="number" min="0" step="0.01" value={eventForm.price} onChange={e => setEventForm({...eventForm, price: e.target.value})}
                            placeholder="0.00"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Capacity</label>
                          <input type="number" min="1" value={eventForm.capacity} onChange={e => setEventForm({...eventForm, capacity: e.target.value})}
                            placeholder="e.g. 32"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">DUPR Minimum <span className="text-gray-600 normal-case tracking-normal font-normal">(optional)</span></label>
                          <input type="number" min="0" max="8" step="0.01" value={eventForm.dupr_minimum} onChange={e => setEventForm({...eventForm, dupr_minimum: e.target.value})}
                            placeholder="e.g. 4.5"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">
                          PlayByPoint Payment Link <span className="text-gray-600 normal-case tracking-normal font-normal">(optional)</span>
                        </label>
                        <input type="url" value={eventForm.playbypoint_url} onChange={e => setEventForm({...eventForm, playbypoint_url: e.target.value})}
                          placeholder="https://piklla.playbypoint.com/programs/..."
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        <p className="text-gray-600 text-[11px] mt-1.5">Members will see a "Pay & Confirm" button linking here after they register.</p>
                      </div>
                      <div className="flex gap-3 pt-2">
                        <button type="submit" disabled={creatingEvent} className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                          {creatingEvent ? (editingEvent ? 'Saving...' : 'Creating...') : (editingEvent ? 'Save Changes' : 'Create Event')}
                        </button>
                        <button type="button" onClick={() => { setEventFormOpen(false); setEditingEvent(null); setEventRegs([]); }} className="px-6 py-2.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>

                    {/* Manage Registrations — edit mode only */}
                    {editingEvent && (
                      <div className="mt-6 pt-6 border-t border-white/10">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500">
                            Registrations
                            <span className="ml-2 text-white">{eventRegs.length}</span>
                          </p>
                          <button onClick={() => fetchEventRegs(editingEvent.id)} className="text-gray-600 hover:text-white transition-colors" title="Refresh">
                            <i className="ph ph-arrows-clockwise text-sm"></i>
                          </button>
                        </div>
                        {eventRegs.length === 0 ? (
                          <p className="text-gray-600 text-sm">No registrations for this event.</p>
                        ) : (
                          <div className="space-y-1">
                            {eventRegs.map(r => (
                              <div key={r.id} className="flex items-center justify-between py-2.5 border-b border-white/5 last:border-0">
                                <div>
                                  <p className="text-sm font-medium">
                                    {r.name}
                                    {r.is_guest && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-white/10 text-gray-400 text-[9px] font-bold uppercase tracking-wider rounded">Guest</span>
                                    )}
                                    {r.rsvp_status === 'maybe' && (
                                      <span className="ml-2 px-1.5 py-0.5 bg-amber-400/15 text-amber-400 text-[9px] font-bold uppercase tracking-wider rounded">Maybe</span>
                                    )}
                                  </p>
                                  <p className="text-xs text-gray-500">{r.email || '—'}</p>
                                </div>
                                <button
                                  onClick={() => removeRegistration(r.id, r.name)}
                                  className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-500/30 transition-colors flex-shrink-0"
                                >
                                  Remove
                                </button>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Manually add someone who registered outside the site (e.g. via PlayByPoint directly) */}
                        <div className="mt-4 pt-4 border-t border-white/10">
                          <p className="text-gray-600 text-[11px] mb-2">
                            Add someone who signed up directly on PlayByPoint (not through the site):
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={guestForm.name}
                              onChange={e => setGuestForm(f => ({ ...f, name: e.target.value }))}
                              placeholder="Name"
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40"
                            />
                            <input
                              type="email"
                              value={guestForm.email}
                              onChange={e => setGuestForm(f => ({ ...f, email: e.target.value }))}
                              placeholder="Email (optional)"
                              className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40"
                            />
                            <button
                              type="button"
                              onClick={() => addGuestRegistration(editingEvent.id)}
                              disabled={addingGuest}
                              className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50 flex-shrink-0"
                            >
                              {addingGuest ? 'Adding...' : 'Add'}
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Shareable link after creation */}
              {createdEventLink && (
                <div className="mb-6 bg-green-500/10 border border-green-500/20 rounded-xl p-5">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-green-400 text-xs font-bold uppercase tracking-widest">Event Created — Shareable Link</p>
                    <button onClick={() => setCreatedEventLink(null)} className="text-gray-500 hover:text-white transition-colors">
                      <i className="ph ph-x text-sm"></i>
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <input readOnly value={createdEventLink}
                      className="flex-1 px-3 py-2 bg-black/40 border border-white/10 rounded-lg text-gray-300 text-sm font-mono focus:outline-none select-all" />
                    <button onClick={() => copyEventLink(createdEventLink, 'new')}
                      className="px-4 py-2 bg-white text-black font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-gray-200 transition-colors flex-shrink-0">
                      {copiedEventId === 'new' ? '✓ Copied!' : 'Copy'}
                    </button>
                  </div>
                </div>
              )}

              {/* Events List */}
              {events.length === 0 ? (
                <div className="text-center py-20 text-gray-500">
                  <i className="ph ph-calendar text-4xl mb-4"></i>
                  <p>No events yet. Create one above.</p>
                </div>
              ) : (() => {
                // Split into upcoming vs archived. An event is archived once
                // its end_time (or date_time as fallback) is 4+ hours ago.
                const now = Date.now();
                const GRACE_MS = 4 * 60 * 60 * 1000;
                const isPast = (ev) => {
                  const dt = ev.end_time || ev.date_time;
                  if (!dt) return false;
                  return new Date(dt).getTime() < now - GRACE_MS;
                };
                const upcoming = events.filter(ev => !isPast(ev)).sort((a, b) => new Date(a.date_time || 0) - new Date(b.date_time || 0));
                const archived = events.filter(isPast).sort((a, b) => new Date(b.date_time || 0) - new Date(a.date_time || 0));

                const renderEvent = (ev) => {
                  const d = ev.date_time ? new Date(ev.date_time) : null;
                  return (
                    <div key={ev.id} className="bg-white/5 border border-white/10 rounded-xl px-5 py-4">
                      <div className="flex items-start justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold mb-1">{ev.title||ev.name}</p>
                          <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            {d && <span>{d.toLocaleDateString('en-US',{month:'short',day:'numeric',year:'numeric',timeZone:'America/Los_Angeles'})} · {d.toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',timeZone:'America/Los_Angeles'})}</span>}
                            {ev.location && <span>{ev.location}</span>}
                            {ev.price != null && <span>${parseFloat(ev.price).toFixed(2)} entry</span>}
                            {ev.capacity && <span>{ev.capacity} spots</span>}
                            <span className={`font-bold uppercase ${ev.status==='upcoming' ? 'text-green-400' : 'text-gray-500'}`}>{ev.status}</span>
                          </div>
                          {ev.description && <p className="text-gray-600 text-xs mt-2 truncate">{ev.description}</p>}
                          <div className="flex items-center gap-2 mt-2.5">
                            <span className="text-gray-600 text-[11px] font-mono truncate">{typeof window !== 'undefined' ? window.location.origin : ''}/events/{ev.slug||ev.id}</span>
                            <button
                              onClick={() => copyEventLink(`${typeof window !== 'undefined' ? window.location.origin : ''}/events/${ev.slug||ev.id}`, ev.id)}
                              className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border border-white/10 hover:border-white/30 text-gray-500 hover:text-white rounded transition-colors flex-shrink-0"
                            >
                              {copiedEventId === ev.id ? '✓ Copied!' : 'Copy Link'}
                            </button>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <button onClick={() => router.push(`/events/${ev.slug||ev.id}`)} className="px-3 py-1.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                            View
                          </button>
                          <button onClick={() => startEditEvent(ev)} className="px-3 py-1.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                            Edit
                          </button>
                          <button onClick={() => deleteEvent(ev)} className="px-3 py-1.5 bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-red-500/30 transition-colors">
                            Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                };

                return (
                  <>
                    {/* Upcoming */}
                    <div className="flex items-center gap-3 mb-3 mt-2">
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">Upcoming ({upcoming.length})</p>
                      <div className="flex-1 h-px bg-white/5"></div>
                    </div>
                    {upcoming.length === 0 ? (
                      <p className="text-gray-600 text-sm mb-8">No upcoming events. Create one above.</p>
                    ) : (
                      <div className="space-y-3 mb-8">{upcoming.map(renderEvent)}</div>
                    )}

                    {/* Archived — collapsible */}
                    <button
                      onClick={() => setShowArchived(v => !v)}
                      className="flex items-center gap-3 w-full text-left mb-3"
                    >
                      <p className="text-xs font-bold uppercase tracking-widest text-gray-500">
                        Archived ({archived.length})
                      </p>
                      <div className="flex-1 h-px bg-white/5"></div>
                      <i className={`ph ph-caret-${showArchived ? 'up' : 'down'} text-gray-500 text-sm`}></i>
                    </button>
                    {showArchived && (
                      archived.length === 0 ? (
                        <p className="text-gray-600 text-sm">No past events yet.</p>
                      ) : (
                        <div className="space-y-3 opacity-70">{archived.map(renderEvent)}</div>
                      )
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {/* SPONSORS TAB */}
          {tab === 'sponsors' && (
            <div>
              <div className="mb-8">
                {!sponsorFormOpen ? (
                  <button onClick={() => { setSponsorFormOpen(true); setEditingSponsor(null); setSponsorForm({ name: '', logo_url: '', description: '', discount_code: '' }); }}
                    className="flex items-center gap-2 px-5 py-3 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors">
                    <i className="ph ph-plus text-base"></i> Add Sponsor
                  </button>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-6 mb-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-bold uppercase tracking-widest text-sm">{editingSponsor ? 'Edit Sponsor' : 'New Sponsor'}</h3>
                      <button onClick={() => { setSponsorFormOpen(false); setEditingSponsor(null); }} className="text-gray-500 hover:text-white transition-colors">
                        <i className="ph ph-x text-lg"></i>
                      </button>
                    </div>
                    <form onSubmit={saveSponsor} className="space-y-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Name *</label>
                          <input required type="text" value={sponsorForm.name} onChange={e => setSponsorForm(f => ({...f, name: e.target.value}))}
                            placeholder="Partner name"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Discount Code</label>
                          <input type="text" value={sponsorForm.discount_code} onChange={e => setSponsorForm(f => ({...f, discount_code: e.target.value}))}
                            placeholder="e.g. NEVA20"
                            className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Logo URL</label>
                        <input type="url" value={sponsorForm.logo_url} onChange={e => setSponsorForm(f => ({...f, logo_url: e.target.value}))}
                          placeholder="https://..."
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40" />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Description</label>
                        <textarea value={sponsorForm.description} onChange={e => setSponsorForm(f => ({...f, description: e.target.value}))}
                          placeholder="What's the perk?" rows={2}
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white text-sm placeholder-gray-600 focus:outline-none focus:border-white/40 resize-none" />
                      </div>
                      <div className="flex gap-3 pt-1">
                        <button type="submit" disabled={savingSponsor} className="px-6 py-2.5 bg-white text-black font-bold text-xs uppercase tracking-widest rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50">
                          {savingSponsor ? 'Saving...' : editingSponsor ? 'Save Changes' : 'Add Sponsor'}
                        </button>
                        <button type="button" onClick={() => { setSponsorFormOpen(false); setEditingSponsor(null); }} className="px-6 py-2.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                          Cancel
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>

              {sponsors.length === 0 ? (
                <div className="text-center py-20 text-gray-600">
                  <i className="ph ph-storefront text-4xl mb-4"></i>
                  <p>No sponsors yet. Add one above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {sponsors.map(s => (
                    <div key={s.id} className={`border rounded-xl px-5 py-4 flex items-center gap-4 transition-colors ${s.active ? 'bg-white/5 border-white/10' : 'bg-white/2 border-white/5 opacity-50'}`}>
                      {s.logo_url && <img src={s.logo_url} alt={s.name} className="h-10 w-16 object-contain flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="font-bold text-sm">{s.name}</span>
                          {!s.active && <span className="text-[10px] font-bold uppercase text-gray-600 bg-white/5 px-1.5 py-0.5 rounded">Inactive</span>}
                        </div>
                        {s.description && <p className="text-gray-500 text-xs truncate">{s.description}</p>}
                        {s.discount_code && <p className="text-gray-600 text-xs font-mono mt-0.5">Code: {s.discount_code}</p>}
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <button onClick={() => { setEditingSponsor(s.id); setSponsorForm({ name: s.name, logo_url: s.logo_url || '', description: s.description || '', discount_code: s.discount_code || '' }); setSponsorFormOpen(true); }}
                          className="px-3 py-1.5 bg-white/10 text-white font-bold text-xs uppercase tracking-wider rounded-lg hover:bg-white/20 transition-colors">
                          Edit
                        </button>
                        <button onClick={() => toggleSponsorActive(s)}
                          className={`px-3 py-1.5 font-bold text-xs uppercase tracking-wider rounded-lg transition-colors ${s.active ? 'bg-yellow-500/20 border border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/30' : 'bg-green-500/20 border border-green-500/30 text-green-400 hover:bg-green-500/30'}`}>
                          {s.active ? 'Deactivate' : 'Activate'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHECK-IN TAB */}
          {tab === 'checkin' && (
            <div>
              <div className="mb-6">
                <label className="block text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-2">Select Event</label>
                <select
                  value={checkinEventId}
                  onChange={e => { setCheckinEventId(e.target.value); fetchCheckins(e.target.value); }}
                  className="w-full max-w-sm px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-white/30"
                >
                  <option value="" className="bg-black">— Pick an event —</option>
                  {events.map(ev => (
                    <option key={ev.id} value={ev.id} className="bg-black">
                      {ev.title || ev.name}{ev.date_time ? ` — ${new Date(ev.date_time).toLocaleDateString('en-US', { month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })}` : ''}
                    </option>
                  ))}
                </select>
              </div>

              {!checkinEventId && (
                <div className="text-center py-20 text-gray-600">
                  <i className="ph ph-clipboard-text text-4xl mb-4"></i>
                  <p>Select an event above to manage check-ins.</p>
                </div>
              )}

              {checkinEventId && checkinLoading && (
                <div className="text-center py-12 text-gray-500 text-sm">Loading registrations...</div>
              )}

              {checkinEventId && !checkinLoading && (
                <div>
                  <div className="flex items-center justify-between mb-5">
                    <p className="text-gray-500 text-xs uppercase tracking-widest font-bold">
                      {Object.values(checkinDraft).filter(Boolean).length} / {checkinMembers.length} checked in
                    </p>
                  </div>

                  {checkinMembers.length === 0 ? (
                    <div className="text-center py-12 bg-white/3 border border-white/5 rounded-xl text-gray-600">
                      <i className="ph ph-user-circle-dashed text-3xl mb-3"></i>
                      <p>No registered members for this event yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2 mb-6">
                        {checkinMembers.map(m => {
                          const isChecked = !!checkinDraft[m.member_id];
                          return (
                            <label
                              key={m.member_id}
                              className={`flex items-center gap-4 px-5 py-4 border rounded-xl cursor-pointer transition-colors ${isChecked ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}
                            >
                              <input
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => setCheckinDraft(d => ({ ...d, [m.member_id]: !d[m.member_id] }))}
                                className="w-4 h-4 cursor-pointer accent-white flex-shrink-0"
                              />
                              <div className="flex-1 min-w-0">
                                <span className="font-medium text-sm">{m.name}</span>
                                <span className="text-gray-500 text-sm ml-3">{m.email}</span>
                              </div>
                              {isChecked && (
                                <span className="text-[10px] font-bold uppercase tracking-widest text-green-400 flex items-center gap-1 flex-shrink-0">
                                  <i className="ph ph-check-circle text-base"></i> Checked In
                                </span>
                              )}
                            </label>
                          );
                        })}
                      </div>
                      <button
                        onClick={saveAllCheckins}
                        disabled={savingCheckins}
                        className="px-8 py-3 bg-white text-black font-bold text-sm uppercase tracking-widest rounded-xl hover:bg-gray-200 transition-colors disabled:opacity-50"
                      >
                        {savingCheckins ? 'Saving...' : `Save Check-Ins (${Object.values(checkinDraft).filter(Boolean).length} checked)`}
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          )}

        </div>
      </main>
    </div>
  );
}
