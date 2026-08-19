'use client';

import { useState, useEffect } from 'react';
import WeeklyView from '@/components/dashboard/WeeklyView';
import Link from 'next/link';
import Image from 'next/image';
import { BookOpen, Clock, ArrowRight, Sparkles, FileSpreadsheet } from 'lucide-react';
import { fetchJson, prefetchJson } from '@/lib/api-client';

export default function DashboardPage() {
  const [hasSubjects, setHasSubjects] = useState<boolean | null>(null);

  useEffect(() => {
    // Warm up the lectures cache in parallel
    const now = new Date();
    const dayOfWeek = (now.getDay() + 6) % 7; // Monday = 0
    const monday = new Date(now);
    monday.setDate(now.getDate() - dayOfWeek);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    const startStr = monday.toISOString().slice(0, 10);
    const endStr = sunday.toISOString().slice(0, 10);
    prefetchJson(`/api/lectures?startDate=${startStr}&endDate=${endStr}`, { ttl: 10000, swr: true });

    fetchJson('/api/subjects', { ttl: 15000, swr: true })
      .then((data) => {
        setHasSubjects(Boolean(data?.subjects && data.subjects.length > 0));
      })
      .catch(() => setHasSubjects(false));
  }, []);

  if (hasSubjects === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="h-6 w-6 rounded-full border-2 border-white/20 border-t-white animate-spin" />
      </div>
    );
  }

  if (!hasSubjects) {
    return (
      <div className="flex items-center justify-center min-h-[70vh]">
        <div className="max-w-lg w-full text-center space-y-7 animate-in">
          <div className="space-y-3">
            <div className="relative inline-block">
              <Image
                src="/logo.jpg"
                alt="AttendIQ Logo"
                width={64}
                height={64}
                className="h-16 w-16 rounded-2xl object-cover mx-auto ring-1 ring-white/20 shadow-paper-lg bg-white"
              />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white tracking-tight">
                Welcome to Attend<span className="text-stone-300 font-serif italic text-3xl">IQ</span>
              </h1>
              <p className="text-xs text-paper-400 mt-1.5 max-w-sm mx-auto font-light leading-relaxed">
                Set your semester calendar and timetable to generate your recurring attendance ledger.
              </p>
            </div>
          </div>

          <div className="space-y-2.5">
            <Link
              href="/timetable"
              className="paper-card paper-card-hover flex items-center gap-3.5 p-4 rounded-xl text-left border border-white/10 group"
            >
              <div className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-white">
                <Clock className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Step 1 · Semester Term</p>
                <p className="text-[11px] text-paper-400 mt-0.5 font-light">Set your semester name, start date, and end date</p>
              </div>
              <ArrowRight className="h-4 w-4 text-paper-400 group-hover:text-white transition-colors" />
            </Link>

            <Link
              href="/subjects"
              className="paper-card paper-card-hover flex items-center gap-3.5 p-4 rounded-xl text-left border border-white/10 group"
            >
              <div className="h-9 w-9 rounded-lg bg-white/[0.04] border border-white/10 flex items-center justify-center shrink-0 text-white">
                <BookOpen className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-white font-mono uppercase tracking-wider">Step 2 · Subjects & Schedule</p>
                <p className="text-[11px] text-paper-400 mt-0.5 font-light">Add courses and set recurring weekly lecture times</p>
              </div>
              <ArrowRight className="h-4 w-4 text-paper-400 group-hover:text-white transition-colors" />
            </Link>

            <div className="paper-card flex items-center gap-3.5 p-4 rounded-xl text-left border border-white/[0.06] opacity-40">
              <div className="h-9 w-9 rounded-lg bg-white/[0.02] border border-white/5 flex items-center justify-center shrink-0 text-paper-400">
                <FileSpreadsheet className="h-4 w-4" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-paper-400 font-mono uppercase tracking-wider">Step 3 · Automatic Ledger</p>
                <p className="text-[11px] text-paper-500 mt-0.5 font-light">Daily lectures will populate here automatically</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-1 border-b border-white/[0.08] pb-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Weekly Attendance Ledger</h1>
          <p className="text-xs text-paper-400 font-light mt-0.5">Review lectures, record attendance, and monitor safe skip margins.</p>
        </div>
      </div>
      <WeeklyView />
    </div>
  );
}
