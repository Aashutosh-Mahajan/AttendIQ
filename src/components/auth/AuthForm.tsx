'use client';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff, Mail, ArrowRight, ShieldCheck, CheckCircle2, AlertCircle } from 'lucide-react';
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

  const getDestination = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const next = params.get('next');
      if (next && next.startsWith('/') && !next.startsWith('//')) {
        return next;
      }
    }
    return '/dashboard';
  };

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

        if (signUpData?.session) {
          await supabase.auth.signOut();
        }

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

        window.location.assign(getDestination());
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
        window.location.assign(getDestination());
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

        window.location.assign(getDestination());
        return;
      }

      // ── FORGOT PASSWORD ────────────────────────────────────────────────────
      if (mode === 'forgot') {
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
        window.location.assign('/dashboard');
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
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` }
      );
      err = error;
    } else {
      const { error } = await supabase.auth.signInWithOtp({
        email: email.trim().toLowerCase(),
        options: { shouldCreateUser: false },
      });
      err = error;
    }

    if (err) {
      setError(err.message || 'Failed to resend code.');
    } else {
      setInfo('A new verification code has been dispatched.');
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
    if (mode === 'signup' && signupStep === 'otp') return 'Verify Identity';
    if (mode === 'signup') return 'Open Your Ledger';
    if (mode === 'verify') return 'Verify Email Address';
    if (mode === 'forgot') return 'Account Recovery';
    if (mode === 'reset') return 'Set New Password';
    return 'Welcome Back';
  };

  const getSubtitle = () => {
    if (mode === 'signup' && signupStep === 'otp')
      return `Enter the 6-digit code sent to ${maskedEmail}.`;
    if (mode === 'signup') return 'Start tracking your college attendance with clarity.';
    if (mode === 'verify')
      return email
        ? `Enter the 6-digit verification code sent to ${maskedEmail}.`
        : 'Enter your email and the 6-digit verification code.';
    if (mode === 'forgot') return "Enter your registered email to receive a recovery code.";
    if (mode === 'reset')
      return `Enter the code sent to ${maskedEmail || 'your email'} and set a new password.`;
    return 'Sign in to access your active timetable and ledger.';
  };

  const getButtonText = () => {
    if (loading) return 'Verifying…';
    if (mode === 'signup' && signupStep === 'otp') return 'Verify & Open Ledger';
    if (mode === 'signup') return 'Continue';
    if (mode === 'verify') return 'Verify Email';
    if (mode === 'forgot') return 'Send Recovery Code';
    if (mode === 'reset') return 'Update Password';
    return 'Sign In';
  };

  const showOtpInput =
    (mode === 'signup' && signupStep === 'otp') ||
    mode === 'verify' ||
    mode === 'reset';

  const showResend = showOtpInput;

  if (!hydrated) {
    return (
      <main className="min-h-screen flex items-center justify-center bg-paper-950">
        <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </main>
    );
  }

  return (
    <main
      suppressHydrationWarning
      className="min-h-screen flex items-center justify-center p-4 sm:p-6 bg-paper-950 ledger-grid-bg"
    >
      <div className="w-full max-w-md paper-card rounded-2xl p-7 sm:p-8 border border-white/10 shadow-paper-lg animate-in">

        {/* Brand Header */}
        <div className="flex items-center gap-3 mb-6">
          <Image src="/logo.jpg" alt="AttendIQ Logo" width={36} height={36} className="h-9 w-9 rounded-xl object-cover bg-white ring-1 ring-white/15" />
          <div>
            <h1 className="font-bold text-lg text-white tracking-tight">
              Attend<span className="text-stone-300 font-serif italic text-xl">IQ</span>
            </h1>
            <p className="text-[10px] font-mono tracking-wider uppercase text-paper-400">Academic Ledger</p>
          </div>
        </div>

        <div className="space-y-1 mb-6">
          <h2 className="text-xl font-bold text-white tracking-tight">{getTitle()}</h2>
          <p className="text-xs text-paper-400 font-light leading-relaxed">{getSubtitle()}</p>
        </div>

        {/* Progress indicator for signup */}
        {mode === 'signup' && (
          <div className="flex items-center gap-2 mb-6">
            <div className={`h-1 flex-1 rounded-full transition-colors ${signupStep === 'form' ? 'bg-white' : 'bg-white/40'}`} />
            <div className={`h-1 flex-1 rounded-full transition-colors ${signupStep === 'otp' ? 'bg-white' : 'bg-white/10'}`} />
            <span className="text-[10px] font-mono text-paper-400 ml-1 uppercase">
              {signupStep === 'form' ? 'Step 1/2' : 'Step 2/2'}
            </span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded-xl bg-orange-500/10 border border-orange-500/25 text-orange-200 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0 text-orange-400" />
            <span>{error}</span>
          </div>
        )}
        {info && (
          <div className="mb-4 p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-emerald-200 text-xs flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
            <span>{info}</span>
          </div>
        )}

        <form suppressHydrationWarning onSubmit={submit} className="space-y-3.5 text-xs">

          {/* ── SIGNUP STEP 1: name + email + password ── */}
          {mode === 'signup' && signupStep === 'form' && (
            <>
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Full Name</label>
                <input
                  suppressHydrationWarning
                  required
                  placeholder="e.g. Alex Morgan"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Email Address</label>
                <input
                  suppressHydrationWarning
                  required
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Password</label>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    placeholder="8+ characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                  />
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-paper-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </>
          )}

          {/* ── SIGNUP STEP 2: OTP only ── */}
          {mode === 'signup' && signupStep === 'otp' && (
            <div className="space-y-3">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                <Mail className="h-4 w-4 text-stone-300 shrink-0" />
                <span className="text-xs text-stone-200 truncate">{email}</span>
              </div>
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="· · · · · ·"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/20 text-white placeholder-paper-400 tracking-[0.5em] text-center text-xl font-mono font-bold focus:outline-none focus:border-white"
              />
              <p className="text-[11px] text-paper-400 text-center font-light">
                Enter the 6-digit code received in your inbox.
              </p>
            </div>
          )}

          {/* ── LOGIN ── */}
          {mode === 'login' && (
            <>
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Email</label>
                <input
                  suppressHydrationWarning
                  required
                  type="email"
                  placeholder="student@university.edu"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-paper-400 uppercase tracking-wider">Password</label>
                  <Link href="/forgot-password" className="text-[10px] font-mono text-paper-400 hover:text-white transition-colors">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <input
                    suppressHydrationWarning
                    required
                    type={showPassword ? 'text' : 'password'}
                    minLength={8}
                    placeholder="Enter password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full p-3 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                  />
                  <button
                    suppressHydrationWarning
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-3 text-paper-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
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
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              )}
              {email && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <Mail className="h-4 w-4 text-stone-300 shrink-0" />
                  <span className="text-xs text-stone-200 truncate">{email}</span>
                </div>
              )}
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="· · · · · ·"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/20 text-white placeholder-paper-400 tracking-[0.5em] text-center text-xl font-mono font-bold focus:outline-none focus:border-white"
              />
            </>
          )}

          {/* ── FORGOT PASSWORD ── */}
          {mode === 'forgot' && (
            <div>
              <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Email Address</label>
              <input
                suppressHydrationWarning
                required
                type="email"
                placeholder="student@university.edu"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
              />
            </div>
          )}

          {/* ── RESET PASSWORD ── */}
          {mode === 'reset' && (
            <>
              {email && (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-white/[0.03] border border-white/10">
                  <Mail className="h-4 w-4 text-stone-300 shrink-0" />
                  <span className="text-xs text-stone-200 truncate">{email}</span>
                </div>
              )}
              <input
                suppressHydrationWarning
                required
                inputMode="numeric"
                maxLength={6}
                placeholder="· · · · · ·"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                autoFocus
                className="w-full p-3.5 rounded-xl bg-white/[0.03] border border-white/20 text-white placeholder-paper-400 tracking-[0.5em] text-center text-xl font-mono font-bold focus:outline-none focus:border-white"
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
                  className="w-full p-3 pr-10 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
                <button
                  suppressHydrationWarning
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-3 text-paper-400 hover:text-white"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </>
          )}

          <div className="pt-2">
            <button
              suppressHydrationWarning
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-white hover:bg-stone-200 disabled:opacity-60 text-paper-950 font-bold text-xs uppercase tracking-wider transition-all shadow-paper-sm hover:-translate-y-0.5 active:translate-y-0"
            >
              {getButtonText()}
            </button>
          </div>
        </form>

        {/* Resend OTP */}
        {showResend && (
          <p className="text-center text-[11px] text-paper-400 mt-4 font-light">
            Didn&apos;t receive the code?{' '}
            <button
              type="button"
              onClick={resendOtp}
              disabled={resendCooldown > 0 || !email}
              className="text-white hover:underline underline-offset-4 disabled:opacity-40 font-medium"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
            </button>
          </p>
        )}

        {/* Back link on signup OTP step */}
        {mode === 'signup' && signupStep === 'otp' && (
          <p className="text-center text-[11px] text-paper-400 mt-2">
            Wrong email?{' '}
            <button
              type="button"
              onClick={() => { setSignupStep('form'); setOtp(''); setError(''); }}
              className="text-white hover:underline underline-offset-4"
            >
              Go back
            </button>
          </p>
        )}

        {/* Footer links */}
        {mode !== 'verify' && mode !== 'reset' && mode !== 'forgot' && signupStep !== 'otp' && (
          <p className="text-center text-[11px] text-paper-400 mt-5 font-light">
            {mode === 'login' ? (
              <>New to AttendIQ? <Link className="text-white hover:underline underline-offset-4 font-medium" href="/signup">Create account</Link></>
            ) : (
              <>Already registered? <Link className="text-white hover:underline underline-offset-4 font-medium" href="/login">Sign in</Link></>
            )}
          </p>
        )}

        {mode === 'forgot' && (
          <p className="text-center text-[11px] text-paper-400 mt-5">
            Remembered your password?{' '}
            <Link className="text-white hover:underline underline-offset-4 font-medium" href="/login">Sign in</Link>
          </p>
        )}

      </div>
    </main>
  );
}
