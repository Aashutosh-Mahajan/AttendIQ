'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { Eye, EyeOff } from 'lucide-react';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' | 'verify' | 'forgot' | 'reset' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // In verify and reset modes, read the email from sessionStorage
  useEffect(() => {
    if (mode === 'verify' || mode === 'reset') {
      const stored = sessionStorage.getItem('attendiq_verify_email') || sessionStorage.getItem('attendiq_reset_email');
      if (stored) {
        setEmail(stored);
      } else {
        // No email in storage — user navigated here directly, send to login
        router.replace('/login');
      }
    }
  }, [mode, router]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError('');

    const path = `/api/auth/${mode}`;
    let body: any = {};
    
    if (mode === 'verify') body = { email, code };
    else if (mode === 'forgot') body = { email };
    else if (mode === 'reset') body = { email, code, newPassword: password };
    else if (mode === 'signup') body = { name, email, password };
    else body = { email, password }; // login

    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) return setError(data.error || 'Something went wrong.');

    if (data.verificationRequired || mode === 'signup') {
      sessionStorage.setItem('attendiq_verify_email', data.email || email);
      return router.push('/verify-email');
    }

    if (mode === 'forgot') {
      sessionStorage.setItem('attendiq_reset_email', email);
      return router.push('/reset-password');
    }

    // Success for login, verify, or reset — clean up and go to dashboard
    sessionStorage.removeItem('attendiq_verify_email');
    sessionStorage.removeItem('attendiq_reset_email');
    router.push('/');
    router.refresh();
  };

  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_m, start, middle, domain) => start + '*'.repeat(Math.min(middle.length, 5)) + domain)
    : '';

  const getTitle = () => {
    if (mode === 'signup') return 'Create your account';
    if (mode === 'verify') return 'Verify your email';
    if (mode === 'forgot') return 'Reset your password';
    if (mode === 'reset') return 'Set new password';
    return 'Welcome back';
  };

  const getSubtitle = () => {
    if (mode === 'verify') return `We sent a six-digit code to ${maskedEmail || 'your email'}.`;
    if (mode === 'forgot') return 'Enter your email to receive a reset code.';
    if (mode === 'reset') return `We sent a reset code to ${maskedEmail || 'your email'}.`;
    if (mode === 'signup') return 'Use your email to get started.';
    return 'Sign in to your timetable and attendance.';
  };

  const getButtonText = () => {
    if (loading) return 'Please wait…';
    if (mode === 'signup') return 'Create account';
    if (mode === 'verify') return 'Verify email';
    if (mode === 'forgot') return 'Send reset code';
    if (mode === 'reset') return 'Reset password';
    return 'Sign in';
  };

  return (
    <main suppressHydrationWarning className="min-h-screen flex items-center justify-center p-5 bg-[#0b0f17]">
      <div className="w-full max-w-md glass-card rounded-2xl p-7 border border-white/10">
        <div className="flex items-center gap-3 mb-7">
          <img src="/logo.jpg" alt="AttendIQ Logo" className="h-10 w-10 rounded-xl object-cover bg-white" />
          <div>
            <h1 className="font-bold text-xl text-white">Attend<span className="text-cyan-300">IQ</span></h1>
            <p className="text-xs text-gray-400">Track Today, Stay Ahead</p>
          </div>
        </div>

        <h2 className="text-xl font-bold text-white">{getTitle()}</h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">{getSubtitle()}</p>

        {error && <p className="mb-4 p-3 rounded-xl bg-rose-500/20 text-rose-300 text-xs">{error}</p>}

        <form suppressHydrationWarning onSubmit={submit} className="space-y-4 text-sm">
          {mode === 'signup' && (
            <input
              suppressHydrationWarning
              required
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
            />
          )}

          {/* Email Input (hidden in verify and reset modes) */}
          {mode !== 'verify' && mode !== 'reset' && (
            <input
              suppressHydrationWarning
              required
              type="email"
              placeholder="Email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
            />
          )}

          {/* OTP Code Input */}
          {(mode === 'verify' || mode === 'reset') && (
            <input
              suppressHydrationWarning
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white tracking-[0.4em] text-center text-lg"
              autoFocus
            />
          )}

          {/* Password Input */}
          {(mode === 'login' || mode === 'signup' || mode === 'reset') && (
            <div className="relative">
              <input
                suppressHydrationWarning
                required
                type={showPassword ? 'text' : 'password'}
                minLength={8}
                placeholder={mode === 'reset' ? 'New Password (8+ characters)' : 'Password (8+ characters)'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 pr-10 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-3.5 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          )}

          {mode === 'login' && (
            <div className="flex justify-end">
              <Link href="/forgot-password" className="text-xs text-indigo-400 hover:text-indigo-300">
                Forgot your password?
              </Link>
            </div>
          )}

          <button
            suppressHydrationWarning
            disabled={loading}
            className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold"
          >
            {getButtonText()}
          </button>
        </form>

        {mode !== 'verify' && mode !== 'reset' && mode !== 'forgot' && (
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
            Remember your password? <Link className="text-cyan-300" href="/login">Sign in</Link>
          </p>
        )}
      </div>
    </main>
  );
}
