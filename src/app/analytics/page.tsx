'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { BarChart3, ArrowRight } from 'lucide-react';
import AttendanceCharts, { SubjectAnalytics, TrendPoint } from '@/components/analytics/AttendanceCharts';
import { fetchJson } from '@/lib/api-client';

export default function AnalyticsPage() {
  const [subjects, setSubjects] = useState<SubjectAnalytics[]>([]);
  const [trend, setTrend] = useState<TrendPoint[]>([]);
  const [overall, setOverall] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasSemester, setHasSemester] = useState<boolean | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const [subjectData, termData, lecturesData] = await Promise.all([
          fetchJson('/api/subjects', { ttl: 5000 }),
          fetchJson('/api/semesters', { ttl: 15000 }),
          fetchJson('/api/lectures', { ttl: 5000 }),
        ]);

        setHasSemester(Boolean(termData.activeSemester));
        const raw = subjectData.subjects ?? [];
        const allLectures = lecturesData.lectures ?? [];

        let attended = 0, counted = 0;
        const weekly = new Map<string, { attended: number; counted: number }>();

        const formatted = raw.map((subject: any) => {
          const stats = subject.stats;
          attended += stats?.attendedCount ?? 0;
          counted += stats?.countedLectures ?? 0;

          return {
            name: subject.name,
            code: subject.code,
            color: subject.color,
            percentage: stats?.percentage ?? 0,
            targetPercentage: subject.targetPercentage,
            attended: stats?.attendedCount ?? 0,
            total: stats?.countedLectures ?? 0,
          };
        });

        allLectures.forEach((lecture: any) => {
          if (lecture.status !== 'ATTENDED' && lecture.status !== 'MISSED') return;
          const date = new Date(lecture.date);
          const monday = new Date(date);
          monday.setDate(date.getDate() - ((date.getDay() + 6) % 7));
          const key = monday.toISOString().slice(0, 10);
          const point = weekly.get(key) ?? { attended: 0, counted: 0 };
          point.counted++;
          if (lecture.status === 'ATTENDED') point.attended++;
          weekly.set(key, point);
        });

        setSubjects(formatted);
        setOverall(counted ? Math.round((attended / counted) * 1000) / 10 : 0);
        setTrend(
          [...weekly.entries()]
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([week, point]) => ({
              week: new Date(`${week}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
              percentage: Math.round((point.attended / point.counted) * 1000) / 10,
            }))
        );
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="paper-card p-5 rounded-2xl flex items-center justify-between border border-white/10 shadow-paper-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
            <BarChart3 className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Attendance Analytics & Trends</h2>
            <p className="text-xs text-paper-400 font-light mt-0.5">Statistical breakdown and weekly momentum across your active term.</p>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl paper-card border border-white/5 animate-pulse" />
      ) : !hasSemester ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-paper-300">
            <BarChart3 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create a term to view analytics</h3>
            <p className="text-xs text-paper-400 mt-1 font-light leading-relaxed">
              Analytics are computed from real class attendance within your active academic term.
            </p>
          </div>
          <Link
            href="/timetable"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            Go to Timetable Builder
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <AttendanceCharts subjects={subjects} overallPercentage={overall} trendData={trend} />
      )}
    </div>
  );
}
