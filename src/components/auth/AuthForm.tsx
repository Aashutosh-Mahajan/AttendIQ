'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';

export default function AuthForm({
  mode,
}: {
  mode: 'login' | 'signup' | 'forgot' | 'reset' | 'verify';
}) {
  const router = useRouter();
  const supabase = createSupabaseBrowserClient();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [hydrated, setHydrated] = useState(false);

  // signup: after account is created, show inline OTP step
  const [signupStep, setSignupStep] = useState<'form' | 'otp'>('form');

  // Restore email from sessionStorage for verify / reset pages
  useEffect(() => {
    if (mode === 'verify' || mode === 'reset') {
      const key = mode === 'verify' ? 'attendiq_verify_email' : 'attendiq_reset_email';
      const stored = sessionStorage.getItem(key);
      if (stored) setEmail(stored);
    }
    setHydrated(true);
  }, [mode]);

  // Countdown for resend button
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [resendCooldown]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setInfo('');

    try {

      // ── SIGN UP — STEP 1: create account & send OTP ────────────────────────
      if (mode === 'signup' && signupStep === 'form') {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email: email.trim().toLowerCase(),
          password,
          options: { data: { name: name.trim() } },
        });

        if (signUpErr) {
          setError(signUpErr.message || 'Unable to create account.');
          return;
        }

        // If Supabase auto-confirmed (dashboard "Confirm email" OFF), sign out
        // so the user must still verify via OTP
        if (signUpData?.session) {
          await supabase.auth.signOut();
        }

        // signUp already sends the OTP — move to step 2 immediately.
        // We do NOT call signInWithOtp here to avoid rate-limit errors.
        setSignupStep('otp');
        setResendCooldown(60);
        return;
      }

      // ── SIGN UP — STEP 2: verify OTP & log in ─────────────────────────────
      if (mode === 'signup' && signupStep === 'otp') {
        let verified = false;

        const { error: e1 } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: 'email',
        });
        if (!e1) {
          verified = true;
        } else {
          const { error: e2 } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otp,
            type: 'signup',
          });
          if (!e2) verified = true;
        }

        if (!verified) {
          setError('Invalid or expired code. Use Resend to get a new one.');
          return;
        }

        router.push('/');
        router.refresh();
        return;
      }

      // ── VERIFY EMAIL (standalone /verify-email page) ───────────────────────
      if (mode === 'verify') {
        let verified = false;

        const { error: e1 } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: 'email',
        });
        if (!e1) {
          verified = true;
        } else {
          const { error: e2 } = await supabase.auth.verifyOtp({
            email: email.trim().toLowerCase(),
            token: otp,
            type: 'signup',
          });
          if (!e2) verified = true;
        }

        if (!verified) {
          setError('Invalid or expired code. Use Resend to get a new one.');
          return;
        }

        sessionStorage.removeItem('attendiq_verify_email');
        router.push('/');
        router.refresh();
        return;
      }

      // ── SIGN IN ────────────────────────────────────────────────────────────
      if (mode === 'login') {
        const { error: signInErr } = await supabase.auth.signInWithPassword({
          email: email.trim().toLowerCase(),
          password,
        });

        if (signInErr) {
          if (
            signInErr.message?.toLowerCase().includes('email not confirmed') ||
            signInErr.message?.toLowerCase().includes('not confirmed')
          ) {
            // Resend OTP and go to verify-email page
            await supabase.auth.signInWithOtp({
              email: email.trim().toLowerCase(),
              options: { shouldCreateUser: false },
            });
            sessionStorage.setItem('attendiq_verify_email', email.trim().toLowerCase());
            router.push('/verify-email');
            return;
          }
          setError(signInErr.message || 'Incorrect email or password.');
          return;
        }

        router.push('/');
        router.refresh();
        return;
      }

      // ── FORGOT PASSWORD ────────────────────────────────────────────────────
      if (mode === 'forgot') {
        // resetPasswordForEmail triggers the dedicated "Reset Password" email
        // template in Supabase (Authentication → Email Templates → Reset Password).
        // With OTP enabled, Supabase sends a 6-digit token instead of a link.
        const { error: resetErr } = await supabase.auth.resetPasswordForEmail(
          email.trim().toLowerCase(),
          { redirectTo: `${window.location.origin}/reset-password` }
        );

        if (resetErr) {
          setError(resetErr.message || 'Failed to send reset email.');
          return;
        }

        sessionStorage.setItem('attendiq_reset_email', email.trim().toLowerCase());
        router.push('/reset-password');
        return;
      }

      // ── RESET PASSWORD ─────────────────────────────────────────────────────
      if (mode === 'reset') {
        // type: 'recovery' matches the token sent by resetPasswordForEmail
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email: email.trim().toLowerCase(),
          token: otp,
          type: 'recovery',
        });

        if (verifyErr) {
          setError(verifyErr.message || 'Invalid or expired code.');
          return;
        }

        const { error: updateErr } = await supabase.auth.updateUser({ password });
        if (updateErr) {
          setError(updateErr.message || 'Failed to set new password.');
          return;
        }

        sessionStorage.removeItem('attendiq_reset_email');
        router.push('/login');
        return;
      }

    } finally {
      setLoading(false);
    }
  };

  const resendOtp = async () => {
    if (resendCooldown > 0 || !email) return;
    setError('');
    setInfo('');

    let err: { message: string } | null = null;

    if (mode === 'reset') {
      // Resend the dedicated password-reset email
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      err = error;
    } else {
      // Resend signup / verify OTP
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      err = error;
    }

    if (err) {
      setError(err.message || 'Failed to resend code.');
    } else {
      setInfo('A new code has been sent to your email.');
      setResendCooldown(60);
    }
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_m, s, mid, d) =>
        s + '*'.repeat(Math.min(mid.length, 5)) + d
      )
    : '';

  // ── Titles & subtitles ─────────────────────────────────────────────────────
  const getTitle = () => {
    if (mode === 'signup' && signupStep === 'otp') return 'Verify your email';
    if (mode === 'signup') return 'Create your account';
    if (mode === 'verify') return 'Verify your email';
    if (mode === 'forgot') return 'Reset your password';
    if (mode === 'reset') return 'Set new password';
    return 'Welcome back';
  };

  const getSubtitle = () => {
    if (mode === 'signup' && signupStep === 'otp')
      return `We sent a 6-digit code to ${maskedEmail}. Enter it below to activate your account.`;
    if (mode === 'signup') return 'Use your email to get started.';
    if (mode === 'verify')
      return email
        ? `Enter the 6-digit code sent to ${maskedEmail}.`
        : 'Enter your email and the 6-digit code we sent you.';
    if (mode === 'forgot') return "Enter your email and we'll send a 6-digit reset code.";
    if (mode === 'reset')
      return `Enter the code sent to ${maskedEmail || 'your email'} and choose a new password.`;
    return 'Sign in to your timetable and attendance.';
  };

  const getButtonText = () => {
    if (loading) return 'Please wait…';
    if (mode === 'signup' && signupStep === 'otp') return 'Verify & sign in';
    if (mode === 'signup') return 'Create account';
    if (mode === 'verify') return 'Verify email';
    if (mode === 'forgot') return 'Send reset code';
    if (mode === 'reset') return 'Reset password';
    return 'Sign in';
  };

  const showOtpInput =
    (mode === 'signup' && signupStep === 'otp') ||
    mode === 'verify' ||
    mode === 'reset';

  const showResend = showOtpInput;

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </main>
    );
  }

  return (
    <main
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center p-5 bg-[#0b0f17]"
    >
      <div className="w-full max-w-md glass-card rounded-2xl p-7 border border-white/10">

        {/* Brand */}
        <div className="flex items-center gap-3 mb-7">
          <img src="/logo.jpg" alt="AttendIQ Logo" className="h-10 w-10 rounded-xl object-cover bg-white" />
          <div>
            <h1 className="font-bold text-xl text-white">
              Attend<span className="text-cyan-300">IQ</span>
            </h1>
            <p className="text-xs text-gray-400">Track Today, Stay Ahead</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">{getSubtitle()}</p>

        {/* OTP step indicator for signup */}
        {mode === 'signup' && (
          <div className="flex items-center gap-2 mb-5">
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${signupStep === 'form' ? 'bg-indigo-500' : 'bg-indigo-500'}`} />
            <div className={`h-1.5 flex-1 rounded-full transition-colors ${signupStep === 'otp' ? 'bg-indigo-500' : 'bg-white/10'}`} />
            <span className="text-xs text-gray-500 ml-1">
              {signupStep === 'form' ? 'Step 1 of 2' : 'Step 2 of 2'}
            </span>
          </div>
        )}

        {error && (
          <p className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{error}</p>
        )}
        {info && (
          <p className="mb-4 p-3 rounded-xl bg-emerald-500/20 text-emerald-300 text-xs">{info}</p>
        )}

        <form suppressHydrationWarning onSubmit={submit} className="space-y-4 text-sm">

          {/* ── SIGNUP STEP 1: name + email + password ── */}
          {mode === 'signup' && signupStep === 'form' && (
            <>
              <input
                suppressHydrationWarning
                required
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <input
                suppressHydrationWarning
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="relative">
                <input
                  suppressHydrationWarning
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  placeholder="Password (8+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button suppressHydrationWarning type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}

          {/* ── SIGNUP STEP 2: OTP only ── */}
          {mode === 'signup' && signupStep === 'otp' && (
            <div className="space-y-3">
              {/* Email badge */}
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="text-sm text-gray-300 truncate">{email}</span>
              </div>
              {/* OTP input */}
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-4 rounded-xl bg-[#0b0f17] border border-indigo-500/40 text-white placeholder-gray-700 tracking-[0.6em] text-center text-2xl font-bold focus:outline-none focus:border-indigo-500"
              />
              <p className="text-xs text-gray-500 text-center">
                Check your inbox (and spam folder) for the 6-digit code.
              </p>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <input
                suppressHydrationWarning
                required
                type="email"
                placeholder="Email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
              />
              <div className="relative">
                <input
                  suppressHydrationWarning
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button suppressHydrationWarning type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <div className="flex justify-end">
                <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                  Forgot your password?
                </Link>
              </div>
            </>
          )}

          {/* ── VERIFY (standalone page) ── */}
          {mode === 'verify' && (
            <>
              {!email && (
                <input
                  suppressHydrationWarning
                  required
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
              )}
              {email && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-sm text-gray-300 truncate">{email}</span>
                </div>
              )}
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-4 rounded-xl bg-[#0b0f17] border border-indigo-500/40 text-white placeholder-gray-700 tracking-[0.6em] text-center text-2xl font-bold focus:outline-none focus:border-indigo-500"
              />
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <input
              suppressHydrationWarning
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
            />
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === 'reset' && (
            <>
              {email && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.04] border border-white/10">
                  <Mail className="h-4 w-4 text-indigo-400 shrink-0" />
                  <span className="text-sm text-gray-300 truncate">{email}</span>
                </div>
              )}
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="_ _ _ _ _ _"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-4 rounded-xl bg-[#0b0f17] border border-indigo-500/40 text-white placeholder-gray-700 tracking-[0.6em] text-center text-2xl font-bold focus:outline-none focus:border-indigo-500"
              />
              <div className="relative">
                <input
                  suppressHydrationWarning
                  required
                  type={showPassword ? 'text' : 'password'}
                  minLength={8}
                  placeholder="New password (8+ characters)"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-3 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white placeholder-gray-600 focus:outline-none focus:border-indigo-500"
                />
                <button suppressHydrationWarning type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-3.5 text-gray-400 hover:text-white">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}

          <button
            suppressHydrationWarning
            disabled={loading}
            className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold transition-colors"
          >
            {getButtonText()}
          </button>
        </form>

        {/* Resend OTP */}
        {showResend && (
          <p className="text-center text-xs text-gray-400 mt-4">
            Didn&apos;t receive a code?{' '}
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendCooldown > 0 || !email}
              className="text-indigo-400 hover:text-indigo-300 disabled:opacity-40 underline-offset-2 hover:underline"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </p>
        )}

        {/* Back link on signup OTP step */}
        {mode === 'signup' && signupStep === 'otp' && (
          <p className="text-center text-xs text-gray-400 mt-3">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setSignupStep('form'); setOtp(''); setError(''); }}
              className="text-indigo-400 hover:text-indigo-300 underline-offset-2 hover:underline"
            >
              Go back
            </button>
          </p>
        )}

        {/* Footer links */}
        {mode !== 'verify' && mode !== 'reset' && mode !== 'forgot' && signupStep !== 'otp' && (
          <p className="text-center text-xs text-gray-400 mt-5">
            {mode === 'login' ? (
              <>New here? <Link className="text-cyan-300" href="/signup">Create an account</Link></>
            ) : (
              <>Already have an account? <Link className="text-cyan-300" href="/login">Sign in</Link></>
            )}
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-center text-xs text-gray-400 mt-5">
            Remember your password?{' '}
            <Link className="text-cyan-300" href="/login">Sign in</Link>
          </p>
        )}

      </div>
    </main>
  );
}
