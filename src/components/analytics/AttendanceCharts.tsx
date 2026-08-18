'use client';

import React from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Award, Flame, Target, TrendingUp } from 'lucide-react';

export interface SubjectAnalytics {
  name: string;
  code?: string | null;
  color: string;
  percentage: number;
  targetPercentage: number;
  attended: number;
  total: number;
}

export interface TrendPoint {
  week: string;
  percentage: number;
}

export default function AttendanceCharts({
  subjects,
  overallPercentage,
  trendData,
}: {
  subjects: SubjectAnalytics[];
  overallPercentage: number;
  trendData: TrendPoint[];
}) {
  const safeSubjects = subjects.filter(
    (subject) => subject.total > 0 && subject.percentage >= subject.targetPercentage
  ).length;

  return (
    <div className="space-y-6">
      {/* ── Metric Cards ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Metric
          icon={<Award className="h-5 w-5" />}
          label="Overall Term Attendance"
          value={subjects.some((subject) => subject.total > 0) ? `${overallPercentage}%` : '—'}
          subtext="Combined across all held lectures"
        />
        <Metric
          icon={<Target className="h-5 w-5" />}
          label="Active Courses"
          value={`${subjects.length} Course${subjects.length === 1 ? '' : 's'}`}
          subtext="Enrolled in current term"
        />
        <Metric
          icon={<Flame className="h-5 w-5" />}
          label="On-Target Courses"
          value={`${safeSubjects} / ${subjects.length}`}
          subtext={`${subjects.length - safeSubjects} currently need attention`}
        />
      </div>

      {subjects.length === 0 ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-3">
          <h3 className="text-base font-bold text-white">No courses to analyse</h3>
          <p className="text-xs text-paper-400 font-light">Add courses and record lecture attendance to unlock performance statistics.</p>
        </div>
      ) : (
        <>
          {/* ── Subject Progress Breakdown ── */}
          <section className="paper-card rounded-2xl p-6 border border-white/10 shadow-paper-sm space-y-5">
            <div>
              <h3 className="text-base font-bold text-white">Course Attendance Breakdown</h3>
              <p className="text-xs text-paper-400 font-light mt-0.5">
                Bar indicates current attendance; the white pin mark represents your target threshold.
              </p>
            </div>

            <div className="space-y-4 pt-2">
              {subjects.map((subject) => {
                const hasRecords = subject.total > 0;
                const percentage = hasRecords ? Math.max(0, Math.min(subject.percentage, 100)) : 0;
                const isUnderTarget = hasRecords && percentage < subject.targetPercentage;

                return (
                  <div key={subject.name} className="space-y-2 p-3 rounded-xl bg-white/[0.02] border border-white/[0.05]">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2 w-2 rounded-full" style={{ backgroundColor: subject.color }} />
                        <span className="text-xs font-bold text-white">{subject.name}</span>
                        {subject.code && (
                          <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-paper-400">
                            {subject.code}
                          </span>
                        )}
                      </div>
                      <span className="text-xs font-mono text-paper-300">
                        {hasRecords ? (
                          <>
                            <span className="text-paper-400">{subject.attended}/{subject.total}</span> · <span className={`font-bold ${isUnderTarget ? 'text-orange-400' : 'text-emerald-400'}`}>{percentage}%</span>
                          </>
                        ) : (
                          'No lectures held yet'
                        )}
                      </span>
                    </div>

                    <div className="relative h-2.5 rounded-full bg-white/[0.04] border border-white/5 overflow-visible">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: `${percentage}%`, backgroundColor: subject.color }}
                      />
                      {/* Target Pin */}
                      <span
                        className="absolute -top-1 h-4.5 w-0.5 bg-white shadow-paper-sm"
                        style={{ left: `${Math.max(1, Math.min(subject.targetPercentage, 99))}%` }}
                        title={`Target: ${subject.targetPercentage}%`}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Weekly Momentum Trend Chart ── */}
          <section className="paper-card rounded-2xl p-6 border border-white/10 shadow-paper-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-paper-400" />
                  <h3 className="text-base font-bold text-white">Weekly Attendance Momentum</h3>
                </div>
                <p className="text-xs text-paper-400 font-light mt-0.5">
                  Aggregated percentage across all attended and missed classes week by week.
                </p>
              </div>
            </div>

            {trendData.length === 0 ? (
              <p className="text-xs font-mono text-paper-400 py-12 text-center">
                Record attendance in the weekly view to visualize your semester trend.
              </p>
            ) : (
              <div className="h-64 mt-4 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendData} margin={{ top: 10, right: 15, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                    <XAxis
                      dataKey="week"
                      stroke="#78716c"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      tickLine={false}
                    />
                    <YAxis
                      domain={[0, 100]}
                      stroke="#78716c"
                      fontSize={11}
                      fontFamily="JetBrains Mono, monospace"
                      unit="%"
                      tickLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#1c1917',
                        borderColor: 'rgba(255,255,255,0.12)',
                        borderRadius: 12,
                        color: '#f5f5f4',
                        fontFamily: 'JetBrains Mono, monospace',
                        fontSize: 12,
                        boxShadow: '0 4px 20px -2px rgba(0,0,0,0.5)',
                      }}
                      formatter={(value: number) => [`${value}%`, 'Attendance']}
                    />
                    <Line
                      name="Attendance"
                      type="monotone"
                      dataKey="percentage"
                      stroke="#ffffff"
                      strokeWidth={2.5}
                      dot={{ fill: '#ffffff', stroke: '#1c1917', strokeWidth: 2, r: 4 }}
                      activeDot={{ r: 6, fill: '#fb923c' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

function Metric({
  icon,
  label,
  value,
  subtext,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}) {
  return (
    <div className="paper-card rounded-2xl p-5 border border-white/[0.08] shadow-paper-sm flex items-start gap-4">
      <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">{label}</p>
        <h3 className="text-2xl font-bold font-mono text-white tracking-tight mt-0.5 tabular-nums">{value}</h3>
        <p className="text-[11px] text-paper-400 font-light mt-1">{subtext}</p>
      </div>
    </div>
  );
}
