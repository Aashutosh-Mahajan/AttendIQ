'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  Calendar,
  BarChart3,
  Clock,
  Settings,
  BookOpen,
  ChevronRight,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  Sparkles,
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const supabase = React.useMemo(() => createSupabaseBrowserClient(), []);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [semesterInfo, setSemesterInfo] = useState<{ name: string } | null>(null);
  const [userName, setUserName] = useState('Student');
  const [authReady, setAuthReady] = useState(false);

  const isAuthPage = ['/login', '/signup', '/verify-email', '/forgot-password', '/reset-password', '/'].some(
    (p) => pathname === p
  );

  useEffect(() => {
    if (isAuthPage) { setAuthReady(true); return; }

    const semesterPromise = fetch('/api/semesters')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data?.activeSemester) {
          setSemesterInfo({ name: data.activeSemester.name });
        }
      })
      .catch(() => {});

    const authPromise = supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) {
        const displayName =
          user.user_metadata?.name ||
          user.user_metadata?.full_name ||
          user.email?.split('@')[0] ||
          'Student';
        setUserName(displayName);
      } else {
        window.location.assign('/login');
      }
    }).catch(() => window.location.assign('/login'));

    Promise.allSettled([semesterPromise, authPromise]).then(() => setAuthReady(true));
  }, [pathname, isAuthPage, supabase]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  if (isAuthPage) return <>{children}</>;

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-paper-950">
        <div className="flex flex-col items-center gap-3">
          <div className="h-7 w-7 rounded-full border-2 border-white/20 border-t-white animate-spin" />
          <p className="text-xs text-paper-400 font-mono tracking-wider uppercase">Loading ledger…</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Weekly Ledger', icon: Calendar },
    { href: '/timetable', label: 'Timetable Builder', icon: Clock },
    { href: '/subjects', label: 'Subjects & Limits', icon: BookOpen },
    { href: '/analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { href: '/settings', label: 'Preferences', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-paper-950 text-paper-100 font-sans ledger-grid-bg">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 paper-nav border-r border-white/[0.08] px-5 py-6 fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-1 mb-7">
          <div className="relative">
            <Image
              src="/logo.jpg"
              alt="AttendIQ Logo"
              width={36}
              height={36}
              className="h-9 w-9 rounded-xl object-cover ring-1 ring-white/15 bg-white shadow-paper-sm"
            />
            <span className="absolute -bottom-1 -right-1 h-3 w-3 rounded-full bg-emerald-500 ring-2 ring-paper-950" />
          </div>
          <div>
            <h1 className="font-bold text-lg tracking-tight text-white flex items-center gap-1">
              Attend<span className="text-stone-300 font-serif italic text-xl tracking-normal">IQ</span>
            </h1>
            <p className="text-[10px] font-mono tracking-wider uppercase text-paper-400">Attendance Ledger</p>
          </div>
        </div>

        {/* Active Semester Badge */}
        <div className="mb-5 p-3 rounded-xl bg-white/[0.03] border border-white/[0.08] backdrop-blur-md">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="text-paper-400 font-medium flex items-center gap-1.5">
              <ShieldCheck className="h-3.5 w-3.5 text-stone-300" /> Active Term
            </span>
            <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
              Live
            </span>
          </div>
          <p className="text-xs font-semibold text-white truncate">
            {semesterInfo ? semesterInfo.name : 'No active term'}
          </p>
        </div>

        {/* User Badge */}
        <div className="mb-5 flex items-center justify-between gap-2 px-2.5 py-2 rounded-xl bg-white/[0.02] border border-white/[0.05]">
          <div className="min-w-0">
            <p className="text-[9px] font-mono uppercase tracking-widest text-paper-400">Signed in as</p>
            <p className="text-xs font-medium text-stone-200 truncate">{userName}</p>
          </div>
          <button
            onClick={logout}
            title="Sign out"
            aria-label="Sign out"
            className="p-1.5 rounded-lg text-paper-400 hover:text-rose-300 hover:bg-rose-500/10 transition-colors"
          >
            <LogOut className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-medium transition-all duration-150 ${
                  isActive
                    ? 'bg-white/10 text-white shadow-paper-sm border border-white/15 font-semibold'
                    : 'text-paper-400 hover:text-stone-200 hover:bg-white/[0.04]'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-white' : 'text-paper-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-3.5 w-3.5 text-stone-300" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pt-4 mt-auto border-t border-white/[0.08] text-[11px] text-paper-400 flex items-center justify-between px-1">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-stone-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
            SYNCED
          </span>
          <span className="font-mono text-[10px] text-paper-400">v1.2</span>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-14 paper-nav z-40 px-4 flex items-center justify-between border-b border-white/[0.08]">
        <div className="flex items-center gap-2.5">
          <Image src="/logo.jpg" alt="AttendIQ Logo" width={28} height={28} className="h-7 w-7 rounded-lg object-cover bg-white" />
          <span className="font-bold text-base text-white tracking-tight">
            Attend<span className="text-stone-300 font-serif italic">IQ</span>
          </span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-1.5 rounded-lg bg-white/5 text-paper-300 hover:text-white"
          aria-label="Toggle navigation menu"
        >
          {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-paper-950/98 backdrop-blur-xl pt-16 px-5 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium ${
                  isActive ? 'bg-white/10 text-white font-semibold border border-white/15' : 'text-paper-300 hover:bg-white/5'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-medium text-rose-300 hover:bg-rose-500/10 w-full mt-4 border border-rose-500/20"
          >
            <LogOut className="h-4 w-4" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-14 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 animate-in">
          {children}
        </div>
      </main>
    </div>
  );
}
