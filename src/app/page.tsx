'use client';

import { useState, useEffect } from 'react';
import WeeklyView from '@/components/dashboard/WeeklyView';
import Link from 'next/link';
import { BookOpen, Clock, ArrowRight, Sparkles, Zap } from 'lucide-react';

export default function Home() {
  const [hasSubjects, setHasSubjects] = useState<boolean | null>(null);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        setHasSubjects(data.subjects && data.subjects.length > 0);
      })
      .catch(() => setHasSubjects(false));
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
            <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 flex items-center justify-center mx-auto shadow-xl shadow-indigo-600/30">
              <Zap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">
                Welcome to Attend<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-cyan-400">IQ</span>
              </h1>
              <p className="text-sm text-gray-400 mt-2 max-w-sm mx-auto">
                Set up your subjects and timetable to start tracking attendance and calculating safe skips.
              </p>
            </div>
          </div>

          {/* Setup Steps */}
          <div className="space-y-3">
            <Link
              href="/subjects"
              className="glass-card flex items-center gap-4 p-4 rounded-xl hover:border-indigo-500/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-indigo-500/15 border border-indigo-500/20 flex items-center justify-center shrink-0">
                <BookOpen className="h-5 w-5 text-indigo-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 1: Add Your Subjects</p>
                <p className="text-xs text-gray-500">Name, code, color, and target attendance %</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-indigo-400 transition-colors" />
            </Link>

            <Link
              href="/timetable"
              className="glass-card flex items-center gap-4 p-4 rounded-xl hover:border-cyan-500/30 transition-all group"
            >
              <div className="h-10 w-10 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center shrink-0">
                <Clock className="h-5 w-5 text-cyan-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 2: Build Your Timetable</p>
                <p className="text-xs text-gray-500">Assign subjects to weekly time slots</p>
              </div>
              <ArrowRight className="h-4 w-4 text-gray-500 group-hover:text-cyan-400 transition-colors" />
            </Link>

            <div className="glass-card flex items-center gap-4 p-4 rounded-xl opacity-50">
              <div className="h-10 w-10 rounded-lg bg-emerald-500/15 border border-emerald-500/20 flex items-center justify-center shrink-0">
                <Sparkles className="h-5 w-5 text-emerald-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-semibold text-white">Step 3: Track & Bunk Smartly</p>
                <p className="text-xs text-gray-500">Auto-generated lectures will appear here</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Normal Dashboard
  return <WeeklyView />;
}
