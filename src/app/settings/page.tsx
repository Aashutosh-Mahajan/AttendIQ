'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, LockKeyhole, Settings, UserRound, Loader2, KeyRound, Eye, EyeOff } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reminders, setReminders] = useState(true);
  const [compactView, setCompactView] = useState(false);
  
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Password change state
  const [passwordMode, setPasswordMode] = useState<'idle' | 'requesting' | 'entering'>('idle');
  const [passwordCode, setPasswordCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');

  // Load real profile from API + local preferences from localStorage
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const res = await fetch('/api/auth/me');
        if (res.ok) {
          const data = await res.json();
          setName(data.user.name || '');
          setEmail(data.user.email || '');
        }
      } catch {
        // Middleware handles redirect
      }

      // Load UI preferences from localStorage
      try {
        const stored = window.localStorage.getItem('attendiq-prefs');
        if (stored) {
          const prefs = JSON.parse(stored);
          setReminders(prefs.reminders ?? true);
          setCompactView(prefs.compactView ?? false);
        }
      } catch {
        // Ignore parse errors
      }

      setLoading(false);
    };

    loadSettings();
  }, []);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      // Save profile name to the database
      const res = await fetch('/api/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to save.');
        setSaving(false);
        return;
      }

      // Save UI preferences to localStorage
      window.localStorage.setItem(
        'attendiq-prefs',
        JSON.stringify({ reminders, compactView })
      );

      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  };

  const requestPasswordReset = async () => {
    setPasswordMode('requesting');
    setPasswordError('');
    setPasswordSuccess('');
    
    try {
      const res = await fetch('/api/settings/password/request', { method: 'POST' });
      if (!res.ok) {
        const data = await res.json();
        setPasswordError(data.error || 'Failed to send code.');
        setPasswordMode('idle');
        return;
      }
      
      setPasswordMode('entering');
    } catch {
      setPasswordError('Network error. Please try again.');
      setPasswordMode('idle');
    }
  };

  const submitPasswordChange = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    
    if (newPassword.length < 8) {
      return setPasswordError('Password must be at least 8 characters long.');
    }

    try {
      const res = await fetch('/api/settings/password/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: passwordCode, newPassword }),
      });

      if (!res.ok) {
        const data = await res.json();
        return setPasswordError(data.error || 'Failed to update password.');
      }

      setPasswordSuccess('Password updated successfully.');
      setPasswordMode('idle');
      setPasswordCode('');
      setNewPassword('');
      setTimeout(() => setPasswordSuccess(''), 3000);
    } catch {
      setPasswordError('Network error. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/10">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Settings</h2>
          <p className="text-xs text-gray-400">Manage your profile and everyday app preferences.</p>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile & Preferences Form */}
        <form onSubmit={saveSettings} className="space-y-6">
          {/* Profile Section */}
          <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
            <div className="flex items-center gap-2">
              <UserRound className="h-4 w-4 text-cyan-400" />
              <h3 className="font-bold text-white">Profile</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1">Display name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="block text-gray-400 mb-1">Email address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-gray-500 cursor-not-allowed focus:outline-none"
                />
                <p className="text-[10px] text-gray-600 mt-1">Email cannot be changed.</p>
              </div>
            </div>
          </section>

          {/* Preferences Section */}
          <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-cyan-400" />
              <h3 className="font-bold text-white">Preferences</h3>
            </div>
            <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Attendance reminders</p>
                <p className="text-xs text-gray-500 mt-0.5">Keep the weekly attendance checklist visible.</p>
              </div>
              <input
                type="checkbox"
                checked={reminders}
                onChange={(e) => setReminders(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
            </label>
            <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Compact timetable cards</p>
                <p className="text-xs text-gray-500 mt-0.5">Use denser cards for busy weekly schedules.</p>
              </div>
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="h-4 w-4 accent-indigo-500"
              />
            </label>
          </section>

          {/* Info Note */}
          <section className="glass-card p-5 rounded-2xl border border-white/10 flex gap-3 text-xs text-gray-400">
            <LockKeyhole className="h-4 w-4 text-indigo-300 shrink-0" />
            <p>Semester dates and recurring lectures are managed in the Timetable Builder, so Settings stays focused on your account and preferences.</p>
          </section>

          {/* Error */}
          {error && (
            <p className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{error}</p>
          )}

          {/* Save Button */}
          <button
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
          >
            {saving ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="h-4 w-4" />
            ) : null}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
          </button>
        </form>

        {/* Password Management Section */}
        <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-white">Security</h3>
          </div>
          
          <div className="text-sm">
            <p className="text-gray-400 mb-4">Change your account password securely using a verification code sent to your email.</p>
            
            {passwordSuccess && (
              <p className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-400 text-xs flex items-center gap-2">
                <Check className="h-4 w-4" />
                {passwordSuccess}
              </p>
            )}

            {passwordError && (
              <p className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{passwordError}</p>
            )}

            {passwordMode === 'idle' && (
              <button
                onClick={requestPasswordReset}
                className="px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs transition-colors"
              >
                Change password
              </button>
            )}

            {passwordMode === 'requesting' && (
              <button disabled className="px-4 py-2.5 rounded-xl bg-white/[0.05] border border-white/10 text-white font-medium text-xs flex items-center gap-2 opacity-70">
                <Loader2 className="h-4 w-4 animate-spin" />
                Sending code…
              </button>
            )}

            {passwordMode === 'entering' && (
              <form onSubmit={submitPasswordChange} className="space-y-4 max-w-sm">
                <p className="text-xs text-indigo-300">We sent a 6-digit code to your email.</p>
                <div>
                  <input
                    required
                    inputMode="numeric"
                    maxLength={6}
                    placeholder="6-digit code"
                    value={passwordCode}
                    onChange={(e) => setPasswordCode(e.target.value.replace(/\D/g, ''))}
                    className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white tracking-widest text-center focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="relative">
                  <input
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    placeholder="New password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    className="w-full p-2.5 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <div className="flex gap-2">
                  <button
                    type="submit"
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
                  >
                    Update password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPasswordMode('idle');
                      setPasswordCode('');
                      setNewPassword('');
                      setPasswordError('');
                    }}
                    className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium text-xs transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
