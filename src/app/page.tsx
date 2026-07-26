import Link from 'next/link';
import {
  Calendar,
  BarChart3,
  Clock,
  BookOpen,
  Sparkles,
  ShieldCheck,
  Zap,
  ArrowRight,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
} from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-[#0b0f17] text-gray-100 font-sans overflow-x-hidden">

      {/* ── Navbar ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0b0f17]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpg" alt="AttendIQ" className="h-8 w-8 rounded-lg object-cover bg-white" />
            <span className="font-bold text-lg text-white tracking-tight">
              Attend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IQ</span>
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-gray-400 hover:text-white px-4 py-2 rounded-xl transition-colors"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2 rounded-xl transition-colors shadow-md shadow-indigo-600/25"
            >
              Get started free
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-32 pb-24 px-6 text-center overflow-hidden">
        {/* Background glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-indigo-600/10 rounded-full blur-[120px]" />
          <div className="absolute top-1/3 left-1/3 w-[400px] h-[300px] bg-cyan-500/8 rounded-full blur-[100px]" />
        </div>

        <div className="relative max-w-4xl mx-auto space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/10 text-indigo-300 text-xs font-medium">
            <Sparkles className="h-3.5 w-3.5" />
            Smart Attendance for College Students
          </div>

          {/* Headline */}
          <h1 className="text-5xl sm:text-6xl font-extrabold text-white tracking-tight leading-[1.1]">
            Never lose track of{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-cyan-400">
              your attendance
            </span>{' '}
            again
          </h1>

          <p className="text-lg text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Set up your weekly timetable once. AttendIQ auto-generates every lecture, tracks your status,
            and tells you exactly how many classes you can skip — or must attend — to hit your target.
          </p>

          {/* CTA */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-sm transition-all shadow-lg shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
            >
              Start tracking free
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/[0.05] hover:bg-white/[0.08] border border-white/10 text-white font-medium text-sm transition-colors"
            >
              Sign in to your account
            </Link>
          </div>

          <p className="text-xs text-gray-600">Free to use · No credit card required</p>
        </div>
      </section>

      {/* ── Stats strip ── */}
      <section className="border-y border-white/[0.06] bg-white/[0.02] py-8 px-6">
        <div className="max-w-4xl mx-auto grid grid-cols-3 gap-6 text-center">
          {[
            { value: '75%', label: 'Default attendance target' },
            { value: '∞', label: 'Lectures auto-generated' },
            { value: '0', label: 'Manual schedule entries after setup' },
          ].map((stat) => (
            <div key={stat.label}>
              <p className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">
                {stat.value}
              </p>
              <p className="text-xs text-gray-500 mt-1">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white">Everything you need, nothing you don&apos;t</h2>
            <p className="text-gray-400 mt-3 text-sm max-w-xl mx-auto">
              Built specifically for college students who want accurate attendance data without manual effort.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              {
                icon: Calendar,
                color: 'indigo',
                title: 'Weekly Dashboard',
                desc: 'Day-by-day lecture view with one-click status updates — Attended, Missed, or Holiday. Navigate week by week or jump to today.',
              },
              {
                icon: Zap,
                color: 'cyan',
                title: 'Auto Lecture Generation',
                desc: 'Set your timetable once. Lectures are auto-generated for the entire semester — no weekly re-entry ever again.',
              },
              {
                icon: TrendingUp,
                color: 'emerald',
                title: 'Safe Skip Calculator',
                desc: 'Instantly know how many classes you can safely miss while staying above your target percentage.',
              },
              {
                icon: AlertTriangle,
                color: 'rose',
                title: 'Recovery Alerts',
                desc: 'Below your target? Get the exact number of consecutive classes you must attend to recover your attendance.',
              },
              {
                icon: BarChart3,
                color: 'purple',
                title: 'Analytics & Charts',
                desc: 'Visual bar charts comparing per-subject attendance against your targets, with semester trend lines.',
              },
              {
                icon: ShieldCheck,
                color: 'amber',
                title: 'Secure & Private',
                desc: 'Your data is yours. Supabase Auth with email OTP verification, Row Level Security on every table.',
              },
            ].map((feature) => {
              const Icon = feature.icon;
              const colorMap: Record<string, string> = {
                indigo: 'bg-indigo-500/10 border-indigo-500/20 text-indigo-400',
                cyan: 'bg-cyan-500/10 border-cyan-500/20 text-cyan-400',
                emerald: 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400',
                rose: 'bg-rose-500/10 border-rose-500/20 text-rose-400',
                purple: 'bg-purple-500/10 border-purple-500/20 text-purple-400',
                amber: 'bg-amber-500/10 border-amber-500/20 text-amber-400',
              };
              return (
                <div
                  key={feature.title}
                  className="rounded-2xl border border-white/[0.07] bg-white/[0.03] p-6 hover:border-white/[0.12] hover:bg-white/[0.05] transition-all"
                >
                  <div className={`h-10 w-10 rounded-xl border flex items-center justify-center mb-4 ${colorMap[feature.color]}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-semibold text-white text-sm mb-2">{feature.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{feature.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-3xl mx-auto text-center mb-12">
          <h2 className="text-3xl font-bold text-white">Up and running in 3 steps</h2>
          <p className="text-gray-400 mt-3 text-sm">No complicated setup. Just sign up and go.</p>
        </div>

        <div className="max-w-3xl mx-auto space-y-4">
          {[
            {
              step: '01',
              icon: Clock,
              title: 'Create your semester',
              desc: 'Enter your semester name, start date, and end date. That\'s your entire calendar set.',
            },
            {
              step: '02',
              icon: BookOpen,
              title: 'Build your timetable',
              desc: 'Add subjects and set which days and times they occur weekly. AttendIQ detects conflicts automatically.',
            },
            {
              step: '03',
              icon: Sparkles,
              title: 'Track attendance daily',
              desc: 'Lectures appear automatically every day. Tap Attended, Missed, or Holiday — done in seconds.',
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="flex items-start gap-5 p-5 rounded-2xl border border-white/[0.07] bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="shrink-0 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-indigo-400 tracking-widest">{item.step}</span>
                  <div className="h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-indigo-400" />
                  </div>
                </div>
                <div className="pt-1">
                  <h3 className="font-semibold text-white text-sm">{item.title}</h3>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Attendance math callout ── */}
      <section className="py-20 px-6 border-t border-white/[0.06]">
        <div className="max-w-4xl mx-auto">
          <div className="rounded-2xl border border-indigo-500/20 bg-indigo-950/40 p-8 sm:p-10 text-center space-y-4">
            <div className="inline-flex items-center gap-2 text-indigo-300 text-xs font-semibold tracking-wider uppercase">
              <Zap className="h-4 w-4" />
              The Bunk Calculator
            </div>
            <h2 className="text-2xl font-bold text-white">
              Know exactly when you can skip
            </h2>
            <p className="text-gray-400 text-sm max-w-xl mx-auto">
              AttendIQ calculates your safe skips and required attendance using precise math —
              not guesswork. Set your target (default 75%), and the engine handles the rest.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6 text-left max-w-lg mx-auto">
              <div className="flex items-start gap-3 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-300">SAFE</p>
                  <p className="text-xs text-gray-400 mt-0.5">You can skip <strong className="text-white">N</strong> more classes without dropping below target</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-4 rounded-xl bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-rose-300">CRITICAL</p>
                  <p className="text-xs text-gray-400 mt-0.5">You must attend <strong className="text-white">N</strong> consecutive classes to recover</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-24 px-6 border-t border-white/[0.06]">
        <div className="max-w-2xl mx-auto text-center space-y-6">
          <h2 className="text-4xl font-extrabold text-white leading-tight">
            Start tracking smarter today
          </h2>
          <p className="text-gray-400 text-sm">
            Free to use. Takes 2 minutes to set up. Works for any college schedule.
          </p>
          <Link
            href="/signup"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm transition-all shadow-xl shadow-indigo-600/30 hover:shadow-indigo-500/40 hover:-translate-y-0.5"
          >
            Create your free account
            <ArrowRight className="h-4 w-4" />
          </Link>
          <p className="text-xs text-gray-600">
            Already have an account?{' '}
            <Link href="/login" className="text-indigo-400 hover:text-indigo-300">
              Sign in
            </Link>
          </p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/[0.06] py-8 px-6">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.jpg" alt="AttendIQ" className="h-6 w-6 rounded-md object-cover bg-white" />
            <span className="text-sm font-semibold text-white">
              Attend<span className="text-cyan-400">IQ</span>
            </span>
          </div>
          <p className="text-xs text-gray-600">
            © 2026 AttendIQ
          </p>
          <div className="flex items-center gap-4 text-xs text-gray-600">
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
