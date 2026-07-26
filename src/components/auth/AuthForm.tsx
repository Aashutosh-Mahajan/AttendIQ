'use client';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function AuthForm({ mode }: { mode: 'login' | 'signup' | 'verify' }) {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // In verify mode, read the email from sessionStorage (not URL)
  useEffect(() => {
    if (mode === 'verify') {
      const stored = sessionStorage.getItem('attendiq_verify_email');
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

    const path = mode === 'verify' ? '/api/auth/verify' : `/api/auth/${mode}`;
    const body = mode === 'verify'
      ? { email, code }
      : mode === 'signup'
        ? { name, email, password }
        : { email, password };

    const response = await fetch(path, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
    const data = await response.json();
    setLoading(false);

    if (!response.ok) return setError(data.error || 'Something went wrong.');

    if (data.verificationRequired || mode === 'signup') {
      // Store the email in sessionStorage and navigate without exposing it in the URL
      sessionStorage.setItem('attendiq_verify_email', data.email || email);
      return router.push('/verify-email');
    }

    // Verification or login succeeded — clean up and go to dashboard
    sessionStorage.removeItem('attendiq_verify_email');
    router.push('/');
    router.refresh();
  };

  // Mask email for display: "aa***@gmail.com"
  const maskedEmail = email
    ? email.replace(/^(.{2})(.*)(@.*)$/, (_m, start, middle, domain) => start + '*'.repeat(Math.min(middle.length, 5)) + domain)
    : '';

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

        <h2 className="text-xl font-bold text-white">
          {mode === 'signup' ? 'Create your account' : mode === 'verify' ? 'Verify your email' : 'Welcome back'}
        </h2>
        <p className="text-sm text-gray-400 mt-1 mb-5">
          {mode === 'verify'
            ? `We sent a six-digit code to ${maskedEmail || 'your email'}.`
            : mode === 'signup'
              ? 'Use your email to get started.'
              : 'Sign in to your timetable and attendance.'}
        </p>

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

          {/* Hide email input in verify mode — email is auto-filled from sessionStorage */}
          {mode !== 'verify' && (
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

          {mode === 'verify' ? (
            <input
              suppressHydrationWarning
              required
              inputMode="numeric"
              maxLength={6}
              placeholder="6-digit verification code"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white tracking-[0.4em] text-center text-lg"
              autoFocus
            />
          ) : (
            <input
              suppressHydrationWarning
              required
              type="password"
              minLength={8}
              placeholder="Password (8+ characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-[#0b0f17] border border-white/10 text-white"
            />
          )}

          <button
            suppressHydrationWarning
            disabled={loading}
            className="w-full p-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-60 text-white font-semibold"
          >
            {loading ? 'Please wait…' : mode === 'signup' ? 'Create account' : mode === 'verify' ? 'Verify email' : 'Sign in'}
          </button>
        </form>

        {mode !== 'verify' && (
          <p className="text-center text-xs text-gray-400 mt-5">
            {mode === 'login' ? (
              <>New here? <Link className="text-cyan-300" href="/signup">Create an account</Link></>
            ) : (
              <>Already have an account? <Link className="text-cyan-300" href="/login">Sign in</Link></>
            )}
          </p>
        )}
      </div>
    </main>
  );
}
