'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  LogOut
} from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/auth/client';

interface AppShellProps {
  children: React.ReactNode;
}

export default function AppShell({ children }: AppShellProps) {
  const pathname = usePathname();
  const supabase = createSupabaseBrowserClient();

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
  }, [pathname, isAuthPage]);

  const logout = async () => {
    await supabase.auth.signOut();
    window.location.assign('/login');
  };

  if (isAuthPage) return <>{children}</>;

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0b0f17]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-10 w-10 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
          <p className="text-sm text-gray-500 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  const navItems = [
    { href: '/dashboard', label: 'Weekly Dashboard', icon: Calendar },
    { href: '/timetable', label: 'Timetable Builder', icon: Clock },
    { href: '/subjects', label: 'Subjects & Attendance', icon: BookOpen },
    { href: '/analytics', label: 'Analytics & Insights', icon: BarChart3 },
    { href: '/settings', label: 'Settings', icon: Settings },
  ];

  return (
    <div className="min-h-screen flex bg-[#0b0f17] text-gray-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-300">
      {/* Sidebar Navigation - Desktop */}
      <aside className="hidden md:flex flex-col w-64 glass-nav border-r border-white/10 px-5 py-6 fixed inset-y-0 z-30">
        {/* Brand Header */}
        <div className="flex items-center gap-3 px-2 mb-8">
          <img
            src="/logo.jpg"
            alt="AttendIQ Logo"
            className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/20 shadow-lg shadow-cyan-500/20 bg-white"
          />
          <div>
            <h1 className="font-bold text-xl tracking-tight text-white flex items-center gap-1.5">
              Attend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IQ</span>
            </h1>
            <p className="text-[11px] font-medium text-gray-400">Track Today, Stay Ahead</p>
          </div>
        </div>

        {/* Active Semester Badge */}
        <div className="mb-6 mx-1 p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/20 backdrop-blur-md">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-gray-400 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-cyan-400" /> Active Term
            </span>
            <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">LIVE</span>
          </div>
          <p className="text-sm font-semibold text-white truncate">
            {semesterInfo ? semesterInfo.name : 'No semester yet'}
          </p>
        </div>

        <div className="mb-5 mx-1 flex items-center justify-between gap-2 px-3">
          <div>
            <p className="text-[10px] text-gray-500 uppercase tracking-wider">Signed in as</p>
            <p className="text-sm font-semibold text-white truncate">Hello, {userName}</p>
          </div>
          <button
            onClick={logout}
            title="Log out"
            className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/15 text-gray-400 hover:text-rose-300"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 space-y-1.5">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/90 to-indigo-700/80 text-white shadow-md shadow-indigo-600/20 border border-indigo-500/30 font-semibold'
                    : 'text-gray-400 hover:text-white hover:bg-white/5'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`h-4 w-4 ${isActive ? 'text-cyan-300' : 'text-gray-400'}`} />
                  <span>{item.label}</span>
                </div>
                {isActive && <ChevronRight className="h-4 w-4 text-cyan-300/70" />}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="pt-4 mt-auto border-t border-white/10 text-xs text-gray-400 flex items-center justify-between px-2">
          <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync Active
          </span>
          <span className="text-gray-400 text-[11px]">v1.0.0</span>
        </div>
      </aside>

      {/* Mobile Top Header */}
      <header className="md:hidden fixed top-0 left-0 right-0 h-16 glass-nav z-40 px-4 flex items-center justify-between border-b border-white/10">
        <div className="flex items-center gap-2.5">
          <img src="/logo.jpg" alt="AttendIQ Logo" className="h-8 w-8 rounded-lg object-cover bg-white" />
          <span className="font-bold text-lg text-white">AttendIQ</span>
        </div>
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-lg bg-white/5 text-gray-300 hover:text-white"
        >
          {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-[#0b0f17]/95 backdrop-blur-xl pt-20 px-6 space-y-3">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium ${
                  isActive ? 'bg-indigo-600 text-white font-semibold' : 'text-gray-300 hover:bg-white/5'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          <button
            onClick={logout}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-base font-medium text-rose-400 hover:bg-rose-500/10 w-full"
          >
            <LogOut className="h-5 w-5" />
            <span>Sign out</span>
          </button>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 md:pl-64 pt-16 md:pt-0 min-h-screen">
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
