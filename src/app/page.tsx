'use client';

import { useState, useEffect } from 'react';
import WeeklyView from '@/components/dashboard/WeeklyView';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const [hasSubjects, setHasSubjects] = useState<boolean | null>(null);
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        setHasSubjects(data.subjects && data.subjects.length > 0);
      })
      .catch(() => setHasSubjects(false));
  }, []);

  useEffect(() => {
    fetch('/api/auth/me').then((res) => res.ok ? res.json() : null).then((data) => { if (data?.user?.name) setUserName(data.user.name); }).catch(() => {});
  }, []);

  // Loading
  if (hasSubjects === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-8 w-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // Onboarding / Empty State
  if (!hasSubjects) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-lg w-full text-center space-y-8">
          {/* Logo & Welcome */}
          <div className="space-y-4">
            <img
              src="/logo.jpg"
              alt="AttendIQ Logo"
              className="h-20 w-20 rounded-2xl object-cover mx-auto shadow-2xl shadow-indigo-600/30 ring-2 ring-white/10 bg-white"
            />
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome to Attend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IQ</span>
              </h1>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                Start with your semester dates, then build a recurring timetable to track attendance automatically.
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-3">
            <Link
              href="/timetable"
              className="glass-card flex items-center gap-4 p-4 rounded-xl hover:border-indigo-500/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 1: Create Your Semester</p>
                <p className="text-xs text-gray-500">Choose its name, start date, and end date from the calendar</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link
              href="/subjects"
              className="glass-card flex items-center gap-4 p-4 rounded-xl hover:border-cyan-500/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 2: Add Subjects & Build Your Timetable</p>
                <p className="text-xs text-gray-500">Type subject names and add their weekly lecture times</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </Link>

            <div className="glass-card flex items-center gap-4 p-4 rounded-xl opacity-50">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 3: Track Attendance Smartly</p>
                <p className="text-xs text-gray-500">Auto-generated lectures will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Dashboard
  return <div className="space-y-6"><div><p className="text-sm text-cyan-300 font-semibold">Hello, {userName}</p><h1 className="text-2xl font-bold text-white mt-1">Here&apos;s your attendance week</h1><p className="text-sm text-gray-400 mt-1">Review lectures, record attendance, and keep your targets on track.</p></div><WeeklyView /></div>;
}
