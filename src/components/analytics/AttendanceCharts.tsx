'use client';

import React from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
  LineChart,
  Line,
} from 'recharts';
import { Award, Target, Flame, AlertCircle } from 'lucide-react';

interface SubjectAnalytics {
  name: string;
  code?: string | null;
  color: string;
  percentage: number;
  targetPercentage: number;
  attended: number;
  total: number;
}

interface AttendanceChartsProps {
  subjects: SubjectAnalytics[];
  overallPercentage: number;
}

export default function AttendanceCharts({ subjects, overallPercentage }: AttendanceChartsProps) {
  const chartData = subjects.map((s) => ({
    name: s.code || s.name.slice(0, 10),
    fullName: s.name,
    percentage: s.percentage,
    target: s.targetPercentage,
    fill: s.color,
  }));

  // Dummy 4-week trend history
  const trendData = [
    { week: 'Week 1', percentage: Math.max(65, overallPercentage - 8) },
    { week: 'Week 2', percentage: Math.max(70, overallPercentage - 4) },
    { week: 'Week 3', percentage: Math.max(72, overallPercentage - 2) },
    { week: 'Current', percentage: overallPercentage },
  ];

  return (
    <div className="space-y-6">
      {/* Top Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card rounded-2xl p-5 border border-indigo-500/30 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Overall Attendance</p>
            <h3 className="text-2xl font-bold text-white">{overallPercentage}%</h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-cyan-500/30 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
            <Target className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Active Subjects</p>
            <h3 className="text-2xl font-bold text-white">{subjects.length} Subjects</h3>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-5 border border-emerald-500/30 flex items-center gap-4">
          <div className="p-3 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <Flame className="h-6 w-6" />
          </div>
          <div>
            <p className="text-xs text-gray-400 font-medium">Safe Subjects (&ge; 75%)</p>
            <h3 className="text-2xl font-bold text-white">
              {subjects.filter((s) => s.percentage >= s.targetPercentage).length} / {subjects.length}
            </h3>
          </div>
        </div>
      </div>

      {/* Bar Chart: Subject Percentage Comparison */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Subject-wise Attendance Breakdown</h3>
          <p className="text-xs text-gray-400">Comparing live percentage against target thresholds</p>
        </div>

        <div className="h-72 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
              <YAxis domain={[0, 100]} stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f17',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                  fontSize: '12px',
                }}
              />
              <ReferenceLine y={75} stroke="#f59e0b" strokeDasharray="4 4" label={{ value: '75% Target', fill: '#f59e0b', fontSize: 10 }} />
              <Bar dataKey="percentage" radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Line Chart: Weekly Attendance Trend */}
      <div className="glass-card rounded-2xl p-6 space-y-4">
        <div>
          <h3 className="text-lg font-bold text-white">Attendance Trend History</h3>
          <p className="text-xs text-gray-400">Semester progression over recent weeks</p>
        </div>

        <div className="h-60 w-full pt-4">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={trendData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" stroke="#9ca3af" fontSize={12} />
              <YAxis domain={[50, 100]} stroke="#9ca3af" fontSize={12} />
              <Tooltip
                contentStyle={{
                  backgroundColor: '#0b0f17',
                  borderColor: 'rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  color: '#fff',
                }}
              />
              <Line type="monotone" dataKey="percentage" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
