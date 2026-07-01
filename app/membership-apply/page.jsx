'use client';

import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import PublicNav from '@/components/PublicNav';
import { isApprovedMember } from '@/lib/auth';

export default function MembershipApplyPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [phone, setPhone] = useState('');
  const [skillLevel, setSkillLevel] = useState('');
  const [playFrequency, setPlayFrequency] = useState('');
  const [whyJoin, setWhyJoin] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isApprovedMember()) {
      router.replace('/portal-dashboard');
    }
  }, [router]);

  const handleApplication = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if (password.length < 8) {
      alert('Password must be at least 8 characters.');
      return;
    }
    setLoading(true);

    try {
      const res = await fetch('/api/membership-applications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          phone,
          skill_level: skillLevel,
          experience: playFrequency,
          why_join: whyJoin,
          password,
          status: 'pending',
        }),
      });

      if (res.ok) {
        setSubmitted(true);
      } else {
        const data = await res.json();
        if (res.status === 409) {
          alert('An application with this email already exists. If you applied before, please wait for our review.');
        } else {
          alert('Error submitting application. Please try again.');
        }
      }
    } catch (err) {
      console.error('Application error:', err);
      alert('Error submitting application. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="font-sans bg-black text-white antialiased min-h-screen">
        <PublicNav />
        <main className="pt-20 min-h-screen flex items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="w-20 h-20 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-8 mx-auto">
              <i className="ph-fill ph-check-circle text-4xl text-green-400"></i>
            </div>
            <h1 className="font-display text-4xl font-medium uppercase tracking-tight mb-4">Application Submitted</h1>
            <p className="text-gray-400 mb-6 leading-relaxed">
              Thank you, {firstName}! Your Club NEVA membership application has been received and is under review. We'll reach out to your email once a decision has been made.
            </p>
            <p className="text-gray-500 text-sm mb-8">Applications are typically reviewed same day or within 24 hours.</p>
            <button onClick={() => router.push('/')} className="px-8 py-4 bg-white text-black uppercase font-bold text-sm tracking-widest rounded hover:bg-gray-200 active:scale-95 transition-all">
              Return Home
            </button>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="font-sans bg-black text-white antialiased min-h-screen">
      <PublicNav />
      <main className="pt-20 pb-16 px-6">
        <div className="max-w-2xl mx-auto py-12">
          <button onClick={() => router.back()} className="flex items-center gap-2 text-gray-400 hover:text-white transition-colors mb-8 text-sm uppercase tracking-wide">
            <i className="ph ph-arrow-left"></i> Back
          </button>

          <div className="mb-10">
            <div className="w-16 h-16 border border-white/20 rounded-2xl bg-white/5 flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.1)]">
              <i className="ph-fill ph-shield-check text-3xl text-white"></i>
            </div>
            <h1 className="font-display text-4xl md:text-5xl font-medium uppercase tracking-tight mb-4">Join the Club</h1>
            <p className="text-gray-400 leading-relaxed">
              Tell us about yourself and how you play. Our team reviews every application personally. Most decisions come back same day.
            </p>
          </div>

          <form className="space-y-6" onSubmit={handleApplication}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">First Name *</label>
                <input type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                  placeholder="First name" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Last Name *</label>
                <input type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                  className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                  placeholder="Last name" />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Email Address *</label>
              <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                placeholder="your@email.com" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Password *</label>
                <div className="relative">
                  <input type={showPassword ? 'text' : 'password'} required minLength={8} value={password} onChange={e => setPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Min. 8 characters" />
                  <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <i className={`ph ph-${showPassword ? 'eye-slash' : 'eye'} text-lg`}></i>
                  </button>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Confirm Password *</label>
                <div className="relative">
                  <input type={showConfirm ? 'text' : 'password'} required minLength={8} value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-11 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                    placeholder="Repeat password" />
                  <button type="button" onClick={() => setShowConfirm(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                    <i className={`ph ph-${showConfirm ? 'eye-slash' : 'eye'} text-lg`}></i>
                  </button>
                </div>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Phone Number *</label>
              <input type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors"
                placeholder="+1 (555) 000-0000" />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Skill Level *</label>
              <select required value={skillLevel} onChange={e => setSkillLevel(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50 transition-colors appearance-none">
                <option value="" className="bg-black">Select your level</option>
                <option value="beginner" className="bg-black">Beginner (2.0–2.5)</option>
                <option value="intermediate" className="bg-black">Intermediate (3.0–3.5)</option>
                <option value="advanced" className="bg-black">Advanced (4.0–4.5)</option>
                <option value="elite" className="bg-black">Elite (5.0+)</option>
              </select>
              <p className="text-gray-500 text-xs mt-2">Ratings use the DUPR scale. Don't know your DUPR? Estimate based on how competitive you play.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">How Often Do You Play? *</label>
              <select required value={playFrequency} onChange={e => setPlayFrequency(e.target.value)}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:border-white/50 transition-colors appearance-none">
                <option value="" className="bg-black">Select frequency</option>
                <option value="once_week" className="bg-black">Once a week</option>
                <option value="twice_week" className="bg-black">2–3 times a week</option>
                <option value="daily" className="bg-black">Almost every day</option>
                <option value="tournaments" className="bg-black">Tournaments and leagues</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2 uppercase tracking-wide">Why Do You Want to Join Club NEVA? *</label>
              <textarea required value={whyJoin} onChange={e => setWhyJoin(e.target.value)} rows={4}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-white/50 transition-colors resize-none"
                placeholder="Tell us about yourself and why you want to be part of Club NEVA..." />
            </div>

            <button type="submit" disabled={loading}
              className="w-full py-4 bg-white text-black font-bold uppercase text-sm tracking-widest rounded-lg hover:bg-gray-200 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? 'Submitting Application...' : 'Submit Application'}
            </button>

            <p className="text-gray-500 text-xs text-center">
              Applications are reviewed by our team. You will be notified by email when a decision is made.
            </p>
          </form>
        </div>
      </main>
    </div>
  );
}
