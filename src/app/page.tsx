import Link from 'next/link';
import Image from 'next/image';
import {
  Calendar,
  BarChart3,
  Clock,
  BookOpen,
  Sparkles,
  ShieldCheck,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  FileSpreadsheet,
  Check,
  Flame,
} from 'lucide-react';
import { createSupabaseServerClient } from '@/lib/auth/server';

export default async function LandingPage() {
  const supabase = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen bg-paper-950 text-paper-100 font-sans ledger-grid-bg selection:bg-paper-200/20 selection:text-white">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.08] bg-paper-950/85 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Image src="/logo.jpg" alt="AttendIQ Logo" width={32} height={32} className="h-8 w-8 rounded-lg object-cover bg-white ring-1 ring-white/20 shadow-paper-sm" />
            <span className="font-bold text-lg text-white tracking-tight">
              Attend<span className="text-stone-300 font-serif italic text-xl">IQ</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            {user ? (
              <Link
                href="/dashboard"
                className="text-xs font-semibold bg-white text-paper-950 hover:bg-stone-200 px-4 py-2 rounded-xl transition-all shadow-paper-sm hover:scale-[1.02] active:scale-[0.98] flex items-center gap-1.5"
              >
                Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/login"
                  className="text-xs font-medium text-paper-400 hover:text-white px-3.5 py-2 rounded-lg transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="text-xs font-semibold bg-white text-paper-950 hover:bg-stone-200 px-4 py-2 rounded-xl transition-all shadow-paper-sm hover:scale-[1.02] active:scale-[0.98]"
                >
                  Get started free
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-20 px-6 text-center overflow-hidden">
        {/* Subtle stationery ambient light */}
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="w-[600px] h-[350px] bg-white/[0.02] rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Archival Tag */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-white/10 bg-white/[0.03] text-stone-300 text-[11px] font-mono tracking-widest uppercase shadow-paper-inset">
            <FileSpreadsheet className="h-3.5 w-3.5 text-stone-400" />
            Automated Academic Ledger
          </div>

          {/* Editorial Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-bold text-white tracking-tight leading-[1.08]">
            Master your college schedule with{' '}
            <span className="font-serif italic font-normal text-stone-300">
              ink & paper clarity.
            </span>
          </h1>

          <p className="text-base sm:text-lg text-paper-400 max-w-2xl mx-auto leading-relaxed font-light">
            Set your weekly timetable once. AttendIQ maintains an automated attendance ledger, calculates your safe skips with mathematical precision, and guarantees you hit your target.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-3">
            {user ? (
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs tracking-wide transition-all shadow-paper-md hover:-translate-y-0.5 active:translate-y-0"
              >
                Go to Dashboard
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            ) : (
              <>
                <Link
                  href="/signup"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs tracking-wide transition-all shadow-paper-md hover:-translate-y-0.5 active:translate-y-0"
                >
                  Start tracking free
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 px-6 py-3.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-stone-200 font-medium text-xs transition-colors"
                >
                  Sign in to your account
                </Link>
              </>
            )}
          </div>

          <p className="text-[11px] font-mono text-paper-400 tracking-wider">
            FREE FOREVER · NO CARD REQUIRED · ROW LEVEL SECURITY
          </p>

          {/* Live Mockup / Ledger Preview Card */}
          <div className="pt-8 max-w-3xl mx-auto">
            <div className="paper-card rounded-2xl p-5 sm:p-6 border border-white/10 shadow-paper-lg text-left relative overflow-hidden">
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-emerald-500" />
                  <span className="font-mono text-xs text-stone-300 uppercase tracking-wider">
                    Today&apos;s Lecture Ledger — Wednesday
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-xs text-paper-400">
                  <span className="ink-stamp ink-stamp-attended">87.5% Average</span>
                </div>
              </div>

              {/* Mock items */}
              <div className="grid sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-paper-400">CS-301</span>
                    <span className="ink-stamp ink-stamp-attended">Attended</span>
                  </div>
                  <p className="font-semibold text-xs text-white">Algorithms & Complexity</p>
                  <p className="text-[11px] font-mono text-paper-400">09:00 – 10:15 AM</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-paper-400">MATH-202</span>
                    <span className="ink-stamp ink-stamp-attended">Attended</span>
                  </div>
                  <p className="font-semibold text-xs text-white">Linear Algebra</p>
                  <p className="text-[11px] font-mono text-paper-400">10:30 – 11:45 AM</p>
                </div>

                <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/5 text-paper-400">CS-305</span>
                    <span className="ink-stamp ink-stamp-scheduled">Scheduled</span>
                  </div>
                  <p className="font-semibold text-xs text-white">Operating Systems</p>
                  <p className="text-[11px] font-mono text-paper-400">02:00 – 03:15 PM</p>
                </div>
              </div>

              {/* Status callout ribbon */}
              <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-paper-400 font-mono">
                <span className="flex items-center gap-1.5 text-emerald-400">
                  <Sparkles className="h-3.5 w-3.5" />
                  Bunk Calculator: 4 safe skips available
                </span>
                <span className="text-[11px]">Target: 75%</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-white/[0.08] bg-white/[0.01] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-6 text-center divide-y sm:divide-y-0 sm:divide-x divide-white/[0.08]">
          {[
            { value: '75%', label: 'Default institutional threshold' },
            { value: '100%', label: 'Automatic timetable ledger sync' },
            { value: '0', label: 'Manual re-entries required' },
          ].map((stat) => (
            <div key={stat.label} className="pt-4 sm:pt-0 sm:px-4">
              <p className="text-3xl sm:text-4xl font-bold font-serif italic text-white">
                {stat.value}
              </p>
              <p className="text-xs text-paper-400 mt-1 font-mono uppercase tracking-wider">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14 space-y-2">
            <h2 className="text-3xl sm:text-4xl font-bold text-white tracking-tight">
              Crafted for precision and peace of mind
            </h2>
            <p className="text-paper-400 text-sm max-w-xl mx-auto font-light">
              Everything college students need to manage attendance thresholds without guesswork.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Calendar,
                title: 'Weekly Attendance Ledger',
                desc: 'A day-by-day timetable ledger with one-click status logging — Attended, Missed, or Holiday. Quick date jumper included.',
                stamp: 'Daily Sync',
              },
              {
                icon: Clock,
                title: 'Recurring Schedule Engine',
                desc: 'Configure your timetable once. All semester lecture instances are auto-generated with no tedious weekly schedule entry.',
                stamp: 'Automated',
              },
              {
                icon: TrendingUp,
                title: 'Safe Skip Calculator',
                desc: 'Instantly calculate the exact number of classes you can miss while keeping your percentage safely above institutional criteria.',
                stamp: 'Real-time',
              },
              {
                icon: AlertTriangle,
                title: 'Recovery Alerts',
                desc: 'Fallen below your mark? AttendIQ computes the exact streak of consecutive classes required to get back into the green.',
                stamp: 'Warning Guard',
              },
              {
                icon: BarChart3,
                title: 'Analytics & Trend Lines',
                desc: 'Clean comparative bar charts and semester progression graphs showing attendance health across every course.',
                stamp: 'Visuals',
              },
              {
                icon: ShieldCheck,
                title: 'Private & Secure',
                desc: 'Secure email OTP authentication and strict database Row-Level Security ensuring your records remain solely yours.',
                stamp: 'RLS Protected',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              return (
                <div
                  key={feature.title}
                  className="paper-card rounded-2xl p-6 paper-card-hover border border-white/[0.08] space-y-3 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-9 w-9 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white">
                        <Icon className="h-4 w-4" />
                      </div>
                      <span className="ink-stamp ink-stamp-scheduled font-mono text-[9px]">{feature.stamp}</span>
                    </div>
                    <h3 className="font-semibold text-white text-sm">{feature.title}</h3>
                    <p className="text-xs text-paper-400 leading-relaxed mt-1.5 font-light">{feature.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3-Step Process ── */}
      <section className="py-20 px-6 border-t border-white/[0.08]">
        <div className="max-w-3xl mx-auto text-center mb-12 space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">Up and running in 3 minutes</h2>
          <p className="text-paper-400 text-xs font-mono uppercase tracking-wider">Simple setup · Effortless maintenance</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-3">
          {[
            {
              step: '01',
              icon: Clock,
              title: 'Create your semester term',
              desc: 'Enter your semester start and end dates. AttendIQ calibrates your entire academic calendar automatically.',
            },
            {
              step: '02',
              icon: BookOpen,
              title: 'Configure subjects & weekly timetable',
              desc: 'Add courses and set recurring weekday lecture slots. Conflict detection prevents schedule overlaps.',
            },
            {
              step: '03',
              icon: CheckCircle2,
              title: 'Log status & check safe skip margins',
              desc: 'Open your weekly ledger each day. Mark lectures with one tap and monitor safe bunks.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="flex items-start gap-4 p-5 rounded-2xl paper-card border border-white/[0.08]"
              >
                <div className="shrink-0 flex flex-col items-center gap-1.5">
                  <span className="font-mono text-[10px] font-bold text-stone-400 tracking-wider">{item.step}</span>
                  <div className="h-9 w-9 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center">
                    <Icon className="h-4 w-4 text-stone-300" />
                  </div>
                </div>
                <div className="pt-0.5">
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-paper-400 mt-1 leading-relaxed font-light">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Bunk Calculator Callout ── */}
      <section className="py-20 px-6 border-t border-white/[0.08]">
        <div className="max-w-4xl mx-auto">
          <div className="paper-card rounded-2xl p-8 sm:p-10 border border-white/10 space-y-5 text-center">
            <div className="inline-flex items-center gap-2 text-stone-300 text-xs font-mono tracking-widest uppercase">
              <Flame className="h-4 w-4 text-amber-400" />
              The Bunk Math Engine
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold font-serif italic text-white">
              Never gamble with minimum attendance thresholds again.
            </h2>
            <p className="text-paper-400 text-xs sm:text-sm max-w-xl mx-auto font-light leading-relaxed">
              Standard 75% attendance targets are built in. The formula computes both margin surplus and deficit recovery classes in real time.
            </p>

            <div className="grid sm:grid-cols-2 gap-4 mt-6 text-left max-w-lg mx-auto">
              <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-emerald-300 uppercase tracking-wider">Safe Margin</p>
                  <Check className="h-4 w-4 text-emerald-400" />
                </div>
                <p className="text-xs text-paper-300 font-light">
                  You have <strong className="text-white font-mono font-bold">N</strong> safe skips remaining before dropping below target.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-orange-500/10 border border-orange-500/20 space-y-1">
                <div className="flex items-center justify-between">
                  <p className="text-xs font-mono font-bold text-orange-300 uppercase tracking-wider">Recovery Deficit</p>
                  <AlertTriangle className="h-4 w-4 text-orange-400" />
                </div>
                <p className="text-xs text-paper-300 font-light">
                  Must attend the next <strong className="text-white font-mono font-bold">N</strong> consecutive classes to restore status.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-24 px-6 border-t border-white/[0.08]">
        <div className="max-w-2xl mx-auto text-center space-y-5">
          <h2 className="text-3xl sm:text-5xl font-bold text-white tracking-tight leading-tight">
            Take command of your semester.
          </h2>
          <p className="text-paper-400 text-sm font-light">
            Free forever. Set up in two minutes. Works seamlessly with any collegiate timetable.
          </p>
          <div className="pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider transition-all shadow-paper-md hover:-translate-y-0.5"
            >
              Create free account
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          <p className="text-[11px] text-paper-400 font-mono">
            Already registered?{' '}
            <Link href="/login" className="text-stone-200 hover:text-white underline underline-offset-4">
              Sign in here
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.08] py-8 px-6 bg-paper-950">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2.5">
            <Image src="/logo.jpg" alt="AttendIQ Logo" width={24} height={24} className="h-6 w-6 rounded-md object-cover bg-white" />
            <span className="text-sm font-bold text-white tracking-tight">
              Attend<span className="text-stone-300 font-serif italic">IQ</span>
            </span>
          </div>
          <p className="text-xs font-mono text-paper-400">
            © 2026 AttendIQ · Academic Ledger
          </p>
          <div className="flex items-center gap-4 text-xs font-mono text-paper-400">
            <Link href="/login" className="hover:text-white transition-colors">Sign in</Link>
            <Link href="/signup" className="hover:text-white transition-colors">Sign up</Link>
            <a
              href="https://github.com/Aashutosh-Mahajan/AttendIQ"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white transition-colors"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>

    </div>
  );
}
