'use client';

import React from 'react';
import { Sparkles, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { AttendanceStats } from '@/lib/calculator';

interface BunkCalculatorCardProps {
  subjectName: string;
  code?: string | null;
  color: string;
  stats: AttendanceStats;
}

export default function BunkCalculatorCard({
  subjectName,
  code,
  color,
  stats,
}: BunkCalculatorCardProps) {
  const isSafe = stats.status === 'SAFE';
  const isWarning = stats.status === 'WARNING';
  const isCritical = stats.status === 'CRITICAL';

  return (
    <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden space-y-4">
      {/* Subject Accent Glow Header */}
      <div 
        className="absolute top-0 left-0 right-0 h-1" 
        style={{ backgroundColor: color || '#6366f1' }} 
      />

      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-lg text-white">{subjectName}</h3>
            {code && (
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">
                {code}
              </span>
            )}
          </div>
          <p className="text-xs text-gray-400">Target Attendance: {stats.targetPercentage}%</p>
        </div>

        {/* Current Percentage Pill */}
        <div className={`px-3 py-1.5 rounded-xl font-bold text-sm flex items-center gap-1.5 border ${
          isSafe
            ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
            : isWarning
            ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
            : 'bg-rose-500/20 text-rose-300 border-rose-500/40'
        }`}>
          <span>{stats.percentage}%</span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="space-y-1.5">
        <div className="flex justify-between text-xs text-gray-400">
          <span>{stats.attendedCount} attended of {stats.countedLectures} held</span>
          <span>Target: {stats.targetPercentage}%</span>
        </div>
        <div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isSafe ? 'bg-gradient-to-r from-emerald-500 to-cyan-400' : 'bg-gradient-to-r from-rose-500 to-amber-500'
            }`}
            style={{ width: `${Math.min(stats.percentage, 100)}%` }}
          />
        </div>
      </div>

      {/* Primary Bunk Calculator Status Box */}
      <div className={`rounded-xl p-4 border transition-all ${
        isSafe
          ? 'bg-emerald-950/30 border-emerald-500/30 text-emerald-200'
          : isWarning
          ? 'bg-amber-950/30 border-amber-500/30 text-amber-200'
          : 'bg-rose-950/30 border-rose-500/30 text-rose-200'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`p-2.5 rounded-lg shrink-0 ${
            isSafe ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
          }`}>
            {isSafe ? <Sparkles className="h-5 w-5" /> : <AlertTriangle className="h-5 w-5" />}
          </div>
          <div>
            <div className="font-bold text-sm text-white">
              {isSafe && stats.bunkableClasses > 0 && (
                <span className="text-emerald-300">You can bunk next {stats.bunkableClasses} class{stats.bunkableClasses > 1 ? 'es' : ''}!</span>
              )}
              {isWarning && <span className="text-amber-300">On target threshold. Do not skip next class.</span>}
              {isCritical && (
                <span className="text-rose-300">Must attend next {stats.mustAttendClasses} class{stats.mustAttendClasses > 1 ? 'es' : ''} consecutively!</span>
              )}
            </div>
            <p className="text-xs opacity-80 mt-0.5">{stats.statusMessage}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
