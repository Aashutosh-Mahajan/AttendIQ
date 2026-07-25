'use client';

import React, { useState, useEffect } from 'react';
import AttendanceCharts from '@/components/analytics/AttendanceCharts';
import { BarChart3 } from 'lucide-react';

export default function AnalyticsPage() {
  const [subjects, setSubjects] = useState<any[]>([]);
  const [overallPct, setOverallPct] = useState(100);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/subjects')
      .then((res) => res.json())
      .then((data) => {
        if (data.subjects) {
          let totalCounted = 0;
          let totalAttended = 0;

          const formatted = data.subjects.map((s: any) => {
            if (s.stats) {
              totalCounted += s.stats.countedLectures;
              totalAttended += s.stats.attendedCount;
            }
            return {
              name: s.name,
              code: s.code,
              color: s.color,
              percentage: s.stats?.percentage || 100,
              targetPercentage: s.targetPercentage,
              attended: s.stats?.attendedCount || 0,
              total: s.stats?.countedLectures || 0,
            };
          });

          setSubjects(formatted);
          const overall = totalCounted > 0 ? (totalAttended / totalCounted) * 100 : 100;
          setOverallPct(Math.round(overall * 10) / 10);
        }
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/10">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <BarChart3 className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">Analytics & Attendance Insights</h2>
          <p className="text-xs text-gray-400">Visual performance charts, target compliance, and semester trends</p>
        </div>
      </div>

      {loading ? (
        <div className="h-96 rounded-2xl bg-white/5 animate-pulse" />
      ) : (
        <AttendanceCharts subjects={subjects} overallPercentage={overallPct} />
      )}
    </div>
  );
}
