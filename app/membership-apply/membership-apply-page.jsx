'use client';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import { isApprovedMember } from '@/lib/auth';

export default function MembershipApplyPage() {
  const router = useRouter();
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', phone: '', skillLevel: '', playFrequency: '', whyJoin: '' });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isApprovedMember()) router.replace('/portal-dashboard');
  }, []);

  const validate = () => {
    const e = {};
    if (!form.firstName.trim()) e.firstName = 'Required';
    if (!form.lastName.trim()) e.lastName = 'Required';
    if (!form.email.trim()) e.email = 'Required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email address';
    if (!form.skillLevel) e.skillLevel = 'Required';
    if (!form.playFrequency) e.playFrequency = 'Required';
    if (!form.whyJoin.trim()) e.whyJoin = 'Required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    try {
      const res = await fetch('/api/membership-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: form.firstName,
          last_name: form.lastName,
          email: form.email,
          phone: form.phone,
          skill_level: form.skillLevel,
          experience: form.playFrequency,
          why_join: form.whyJoin,
          status: 'pending',
        }),
      });
      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (res.status === 409 || data.error?.includes('unique')) {
          setErrors({ email: 'An application with this email already exists.' });
        } else {
          alert('Error submitting. Please try again.');
        }
      }
    } catch {
      alert('Error submitting. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const f = (key, label, required, children) => (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">
        {label} {required && <span className="text-white">*</span>}
      </label>
      {children}
      {errors[key] && <p className="text-red-400 text-xs mt-1">{errors[key]}</p>}
    </div>
  );

  const inputClass = (key) => `w-full px-4 py-3 bg-white/10 border rounded-lg text-white placeholder-gray-500 focus:outline-none transition-colors ${errors[key] ? 'border-red-500/50 bg-red-500/10' : 'border-white/20 focus:border-white/50'}`;

  if (submitted) return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PublicNav />
      <main className="pt-20 min-h-screen flex items-center justify-center px-6">
        <div className="w-full max-w-md text-center">
          <div className="w-20 h-20 border border-green-500/30 bg-green-500/10 rounded-2xl flex items-center justify-center mb-8 mx-auto">
            <i className="ph-fill ph-check-circle text-4xl text-green-400"></i>
          </div>
          <h1 className="font-display text-4xl font-medium uppercase tracking-tight mb-4">Application Submitted</h1>
          <p className="text-gray-400 mb-3 leading-relaxed">
            Thank you, {form.firstName}! Your Club NEVA membership application has been received and is under review.
          </p>
          <p className="text-gray-500 text-sm mb-8">We'll reach out to <span className="text-white font-medium">{form.email}</span> once a decision has been made. Applications are typically reviewed within 3–5 business days.</p>
          <button onClick={() => router.push('/')} className="px-8 py-4 bg-white text-black uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-200 active:scale-95 transition-all">
            Return Home
          </button>
        </div>
      </main>
    </div>
  );

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PublicNav />
      <main className="pt-20 pb-16 px-6">
        <div className="max-w-2xl mx-auto py-12">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm uppercase tracking-wide">
            <i className="ph ph-arrow-left"></i> Back
          </button>

          <div className="mb-10">
            <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6">
              <i className="ph-fill ph-shield-check text-3xl text-white"></i>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-3">Join the Club</h1>
            <p className="text-gray-400 leading-relaxed">Club NEVA membership is by application only. Our team reviews every applicant personally.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {f('firstName', 'First Name', true,
                <input type="text" value={form.firstName} onChange={e => setForm({...form, firstName: e.target.value})} className={inputClass('firstName')} placeholder="First name" />
              )}
              {f('lastName', 'Last Name', true,
                <input type="text" value={form.lastName} onChange={e => setForm({...form, lastName: e.target.value})} className={inputClass('lastName')} placeholder="Last name" />
              )}
            </div>

            {f('email', 'Email Address', true,
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className={inputClass('email')} placeholder="your@email.com" />
            )}

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Phone Number</label>
              <input type="tel" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors" placeholder="+1 (555) 000-0000" />
            </div>

            {f('skillLevel', 'Skill Level', true,
              <select value={form.skillLevel} onChange={e => setForm({...form, skillLevel: e.target.value})} className={inputClass('skillLevel') + ' appearance-none'}>
                <option value="" className="bg-black">Select your level</option>
                <option value="beginner" className="bg-black">Beginner (2.0–2.5)</option>
                <option value="intermediate" className="bg-black">Intermediate (3.0–3.5)</option>
                <option value="advanced" className="bg-black">Advanced (4.0–4.5)</option>
                <option value="elite" className="bg-black">Elite (5.0+)</option>
              </select>
            )}

            {f('playFrequency', 'How Often Do You Play?', true,
              <select value={form.playFrequency} onChange={e => setForm({...form, playFrequency: e.target.value})} className={inputClass('playFrequency') + ' appearance-none'}>
                <option value="" className="bg-black">Select frequency</option>
                <option value="once_week" className="bg-black">Once a week</option>
                <option value="twice_week" className="bg-black">2–3 times a week</option>
                <option value="daily" className="bg-black">Almost every day</option>
                <option value="tournaments" className="bg-black">Tournaments and leagues</option>
              </select>
            )}

            {f('whyJoin', 'Why Do You Want to Join Club NEVA?', true,
              <textarea value={form.whyJoin} onChange={e => setForm({...form, whyJoin: e.target.value})} rows={4} className={inputClass('whyJoin') + ' resize-none'} placeholder="Tell us about yourself and why you want to be part of Club NEVA..." />
            )}

            <button type="submit" disabled={loading} className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting...' : 'Submit Application'}
            </button>

            <p className="text-gray-500 text-xs text-center">Applications are reviewed by our team. You will be notified by email when a decision is made.</p>
          </form>
        </div>
      </main>
    </div>
  );
}
