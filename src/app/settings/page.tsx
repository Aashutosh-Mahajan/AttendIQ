'use client';

import React, { useEffect, useState } from 'react';
import { Bell, Check, LockKeyhole, Settings, UserRound, Loader2, KeyRound, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';

type PasswordStep = 'idle' | 'otp_sent' | 'set_password';

export default function SettingsPage() {
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [reminders, setReminders] = useState(true);
  const [compactView, setCompactView] = useState(false);

  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  // Password change — 3 steps: idle → otp_sent → set_password
  const [passwordStep, setPasswordStep] = useState<PasswordStep>('idle');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordError, setPasswordError] = useState('');
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [resendCooldown, setResendCooldown] = useState(0);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setName(user.user_metadata?.name ?? user.user_metadata?.full_name ?? '');
          setEmail(user.email ?? '');
        }
      } catch { /* middleware handles redirect */ }

      try {
        const stored = window.localStorage.getItem('attendiq-prefs');
        if (stored) {
          const prefs = JSON.parse(stored);
          setReminders(prefs.reminders ?? true);
          setCompactView(prefs.compactView ?? false);
        }
      } catch { /* ignore */ }

      setLoading(false);
    };
    loadSettings();
  }, [supabase]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const saveSettings = async (event: React.FormEvent) => {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      const { error: authError } = await supabase.auth.updateUser({
        data: { name: name.trim() || undefined },
      });
      if (authError) { setError(authError.message || 'Failed to save.'); setSaving(false); return; }
      window.localStorage.setItem('attendiq-prefs', JSON.stringify({ reminders, compactView }));
      setSaved(true);
      setSaving(false);
      setTimeout(() => setSaved(false), 2500);
    } catch {
      setError('Network error. Please try again.');
      setSaving(false);
    }
  };

  // Step 1 — Send OTP to user's email via resetPasswordForEmail
  const sendPasswordOtp = async () => {
    if (!email) return;
    setPasswordError('');
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) { setPasswordError(error.message || 'Failed to send verification email.'); return; }
      setPasswordStep('otp_sent');
      setResendCooldown(60);
    } finally {
      setPasswordLoading(false);
    }
  };

  // Resend OTP
  const resendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setPasswordError('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) { setPasswordError(error.message || 'Failed to resend.'); return; }
    setResendCooldown(60);
  };

  // Step 2 — Verify OTP (type: 'recovery')
  const verifyOtp = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: otp,
        type: 'recovery',
      });
      if (error) { setPasswordError(error.message || 'Invalid or expired code.'); return; }
      setPasswordStep('set_password');
    } finally {
      setPasswordLoading(false);
    }
  };

  // Step 3 — Set new password
  const submitNewPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError('');
    if (newPassword.length < 8) { setPasswordError('Password must be at least 8 characters.'); return; }
    if (newPassword !== confirmPassword) { setPasswordError('Passwords do not match.'); return; }
    setPasswordLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error) { setPasswordError(error.message || 'Failed to update password.'); return; }
      setPasswordSuccess('Password updated successfully.');
      resetPasswordState();
      setTimeout(() => setPasswordSuccess(''), 4000);
    } finally {
      setPasswordLoading(false);
    }
  };

  const resetPasswordState = () => {
    setPasswordStep('idle');
    setOtp('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError('');
    setShowPassword(false);
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_m, s, mid, d) => s + '*'.repeat(Math.min(mid.length, 5)) + d)
    : '';

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Header */}
      <div className="paper-card p-5 rounded-2xl flex items-center justify-between border border-white/10 shadow-paper-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
            <Settings className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Account & Application Preferences</h2>
            <p className="text-xs text-paper-400 font-light mt-0.5">Manage user profile, display preferences, and authentication security.</p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {/* Profile & Preferences */}
        <form onSubmit={saveSettings} className="space-y-6">
          <section className="paper-card p-6 rounded-2xl border border-white/10 shadow-paper-sm space-y-5">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <UserRound className="h-4 w-4 text-paper-400" />
              <h3 className="font-bold text-sm text-white">Profile Identity</h3>
            </div>
            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Display Name</label>
                <input
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your full name"
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  readOnly
                  className="w-full p-3 rounded-xl bg-white/[0.01] border border-white/5 text-paper-400 cursor-not-allowed font-mono text-xs focus:outline-none"
                />
                <p className="text-[10px] font-mono text-paper-500 mt-1">Verified account credential.</p>
              </div>
            </div>
          </section>

          <section className="paper-card p-6 rounded-2xl border border-white/10 shadow-paper-sm space-y-4">
            <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
              <Bell className="h-4 w-4 text-paper-400" />
              <h3 className="font-bold text-sm text-white">Application Preferences</h3>
            </div>
            <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-bold text-white">Attendance Margins Indicator</p>
                <p className="text-[11px] text-paper-400 mt-0.5 font-light">Show real-time safe bunk / must attend pills on the dashboard toolbar.</p>
              </div>
              <input
                type="checkbox"
                checked={reminders}
                onChange={(e) => setReminders(e.target.checked)}
                className="h-4 w-4 rounded accent-white cursor-pointer"
              />
            </label>
            <label className="flex items-center justify-between gap-4 p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] hover:border-white/10 cursor-pointer transition-colors">
              <div>
                <p className="text-xs font-bold text-white">Dense Timetable Slot View</p>
                <p className="text-[11px] text-paper-400 mt-0.5 font-light">Use compact spacing for full daily schedules with many classes.</p>
              </div>
              <input
                type="checkbox"
                checked={compactView}
                onChange={(e) => setCompactView(e.target.checked)}
                className="h-4 w-4 rounded accent-white cursor-pointer"
              />
            </label>
          </section>

          <section className="paper-card p-4 rounded-2xl border border-white/10 flex gap-3 text-xs text-paper-400">
            <LockKeyhole className="h-4 w-4 text-stone-300 shrink-0 mt-0.5" />
            <p className="font-light leading-relaxed">
              Semester schedules and recurring course lectures are configured inside the Timetable Builder, keeping your settings clean.
            </p>
          </section>

          {error && (
            <p className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-mono">
              {error}
            </p>
          )}

          <button
            disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-60 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
            {saving ? 'Saving Changes…' : saved ? 'Preferences Saved' : 'Save Preferences'}
          </button>
        </form>

        {/* ── Security / Change Password ── */}
        <section className="paper-card p-6 rounded-2xl border border-white/10 shadow-paper-sm space-y-5">
          <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
            <KeyRound className="h-4 w-4 text-paper-400" />
            <h3 className="font-bold text-sm text-white">Security & Password</h3>
          </div>

          {/* Success banner */}
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-mono">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {/* Error banner */}
          {passwordError && (
            <p className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs font-mono">
              {passwordError}
            </p>
          )}

          {/* ── IDLE ── */}
          {passwordStep === 'idle' && (
            <div className="space-y-3">
              <p className="text-xs text-stone-300 font-light leading-relaxed">
                To update your password, we&apos;ll dispatch a single-use verification code to{' '}
                <span className="text-white font-mono font-semibold">{maskedEmail}</span>.
              </p>
              <button
                onClick={sendPasswordOtp}
                disabled={passwordLoading}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-white font-bold text-xs font-mono uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Mail className="h-3.5 w-3.5" />}
                {passwordLoading ? 'Dispatching…' : 'Send Verification OTP'}
              </button>
            </div>
          )}

          {/* ── OTP SENT — enter code ── */}
          {passwordStep === 'otp_sent' && (
            <form onSubmit={verifyOtp} className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10 text-xs text-paper-300">
                <Mail className="h-4 w-4 shrink-0 text-paper-400" />
                <span>6-digit OTP dispatched to <strong className="text-white font-mono">{maskedEmail}</strong>.</span>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1.5">Verification Code</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="······"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/20 text-white placeholder-paper-500 tracking-[0.5em] text-center text-lg font-mono font-bold focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading || otp.length < 6}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all disabled:opacity-50"
                >
                  {passwordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {passwordLoading ? 'Verifying…' : 'Verify OTP'}
                </button>
                <button
                  type="button"
                  onClick={resetPasswordState}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-paper-300 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-[11px] font-mono text-paper-400">
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0}
                  className="text-white hover:underline disabled:opacity-40"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend OTP'}
                </button>
              </p>
            </form>
          )}

          {/* ── SET PASSWORD — after OTP verified ── */}
          {passwordStep === 'set_password' && (
            <form onSubmit={submitNewPassword} className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300 font-mono">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Identity verified. Enter new password.</span>
              </div>

              <div className="relative">
                <input
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  placeholder="New password (8+ characters)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoFocus
                  className="w-full p-3 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-paper-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>

              <input
                required
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all disabled:opacity-50"
                >
                  {passwordLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  {passwordLoading ? 'Updating…' : 'Update Password'}
                </button>
                <button
                  type="button"
                  onClick={resetPasswordState}
                  className="px-4 py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-paper-300 text-xs font-mono uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
