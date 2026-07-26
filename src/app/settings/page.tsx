'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, LockKeyhole, Settings, UserRound, Loader2, KeyRound, Eye, EyeOff, Mail, ShieldCheck } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';

type PasswordStep = 'idle' | 'otp_sent' | 'set_password';

export default function SettingsPage() {
  const supabase = createSupabaseBrowserClient();

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
  }, []);

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
      // OTP verified — move to password entry
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
        {/* Profile & Preferences */}
        <form onSubmit={saveSettings} className="space-y-6">
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
              <input type="checkbox" checked={reminders} onChange={(e) => setReminders(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
            </label>
            <label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-white">Compact timetable cards</p>
                <p className="text-xs text-gray-500 mt-0.5">Use denser cards for busy weekly schedules.</p>
              </div>
              <input type="checkbox" checked={compactView} onChange={(e) => setCompactView(e.target.checked)} className="h-4 w-4 accent-indigo-500" />
            </label>
          </section>

          <section className="glass-card p-5 rounded-2xl border border-white/10 flex gap-3 text-xs text-gray-400">
            <LockKeyhole className="h-4 w-4 text-indigo-300 shrink-0" />
            <p>Semester dates and recurring lectures are managed in the Timetable Builder, so Settings stays focused on your account and preferences.</p>
          </section>

          {error && <p className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{error}</p>}

          <button
            disabled={saving}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saving ? 'Saving…' : saved ? 'Saved!' : 'Save settings'}
          </button>
        </form>

        {/* ── Security / Change Password ── */}
        <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-5">
          <div className="flex items-center gap-2">
            <KeyRound className="h-4 w-4 text-cyan-400" />
            <h3 className="font-bold text-white">Security</h3>
          </div>

          {/* Success banner */}
          {passwordSuccess && (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 text-xs">
              <ShieldCheck className="h-4 w-4 shrink-0" />
              {passwordSuccess}
            </div>
          )}

          {/* Error banner */}
          {passwordError && (
            <p className="p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{passwordError}</p>
          )}

          {/* ── IDLE ── */}
          {passwordStep === 'idle' && (
            <div className="space-y-3">
              <p className="text-sm text-gray-400">
                To change your password we'll send a verification code to{' '}
                <span className="text-white font-medium">{maskedEmail}</span>.
              </p>
              <button
                onClick={sendPasswordOtp}
                disabled={passwordLoading}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-xs transition-colors disabled:opacity-50"
              >
                {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                {passwordLoading ? 'Sending…' : 'Send verification code'}
              </button>
            </div>
          )}

          {/* ── OTP SENT — enter code ── */}
          {passwordStep === 'otp_sent' && (
            <form onSubmit={verifyOtp} className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
                <Mail className="h-4 w-4 shrink-0" />
                <span>A 6-digit code was sent to <strong>{maskedEmail}</strong>. Check your inbox.</span>
              </div>

              <div>
                <label className="block text-xs text-gray-400 mb-1.5">Verification code</label>
                <input
                  required
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="_ _ _ _ _ _"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                  className="w-full p-3 rounded-xl bg-[#0b0f17] border border-indigo-500/40 text-white placeholder-gray-700 tracking-[0.6em] text-center text-xl font-bold focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading || otp.length < 6}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs transition-colors"
                >
                  {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {passwordLoading ? 'Verifying…' : 'Verify code'}
                </button>
                <button
                  type="button"
                  onClick={resetPasswordState}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
              </div>

              <p className="text-xs text-gray-500">
                Didn&apos;t receive it?{' '}
                <button
                  type="button"
                  onClick={resendOtp}
                  disabled={resendCooldown > 0}
                  className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 underline-offset-2 hover:underline"
                >
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                </button>
              </p>
            </form>
          )}

          {/* ── SET PASSWORD — after OTP verified ── */}
          {passwordStep === 'set_password' && (
            <form onSubmit={submitNewPassword} className="space-y-4 max-w-sm">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-300">
                <ShieldCheck className="h-4 w-4 shrink-0" />
                <span>Identity verified. Choose a new password.</span>
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
                  className="w-full p-2.5 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-white"
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
                className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500 text-sm"
              />

              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={passwordLoading}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white font-medium text-xs shadow-md shadow-indigo-600/30 transition-colors"
                >
                  {passwordLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  {passwordLoading ? 'Updating…' : 'Update password'}
                </button>
                <button
                  type="button"
                  onClick={resetPasswordState}
                  className="px-4 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] text-white font-medium text-xs transition-colors"
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
