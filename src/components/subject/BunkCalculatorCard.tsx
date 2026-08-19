'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  Pencil,
  Sparkles,
  Trash2,
  CheckCircle2,
  XCircle,
  Clock,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  ShieldCheck,
  ShieldAlert,
  Zap,
} from 'lucide-react';
import { AttendanceStats } from '@/lib/calculator';

interface Props {
  subjectName: string;
  code?: string | null;
  color: string;
  stats: AttendanceStats;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BunkCalculatorCard({
  subjectName,
  code,
  color,
  stats,
  onEdit,
  onDelete,
}: Props) {
  const [showSimulator, setShowSimulator] = useState(false);
  const [simAttendExtra, setSimAttendExtra] = useState(0);
  const [simMissExtra, setSimMissExtra] = useState(0);

  const noRecords = stats.countedLectures === 0;
  const critical = stats.status === 'CRITICAL';
  const warning = stats.status === 'WARNING';
  const safe = stats.status === 'SAFE';

  // Target differential
  const diffFromTarget = Math.round((stats.percentage - stats.targetPercentage) * 10) / 10;

  // What-If Simulation Calculations
  const simAttended = stats.attendedCount + simAttendExtra;
  const simCounted = stats.countedLectures + simAttendExtra + simMissExtra;
  const simPercentage =
    simCounted > 0 ? Math.round((simAttended / simCounted) * 1000) / 10 : 100;
  const simSafe = simPercentage >= stats.targetPercentage;

  return (
    <div className="paper-card rounded-2xl p-5 border border-white/[0.08] shadow-paper-sm relative overflow-hidden flex flex-col justify-between transition-all duration-200 hover:border-white/20 hover:shadow-paper-md group">
      {/* Top Ink Accent Spine */}
      <div
        className="absolute top-0 left-0 right-0 h-[3px] transition-all group-hover:h-[4px]"
        style={{
          backgroundColor: color || '#3b82f6',
          boxShadow: `0 0 12px ${color || '#3b82f6'}80`,
        }}
      />

      <div className="space-y-4">
        {/* ── Card Header ── */}
        <div className="flex items-start justify-between gap-3 pt-1">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{
                  backgroundColor: color || '#3b82f6',
                  boxShadow: `0 0 8px ${color || '#3b82f6'}`,
                }}
              />
              <h3 className="font-bold text-base text-white tracking-tight truncate" title={subjectName}>
                {subjectName}
              </h3>
              {code && (
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.04] border border-white/10 text-paper-400 font-semibold uppercase">
                  {code}
                </span>
              )}
            </div>

            <div className="flex items-center gap-2 text-[11px] font-mono text-paper-400">
              <span>Target: <strong className="text-white">{stats.targetPercentage}%</strong></span>
              <span>·</span>
              <span className="flex items-center gap-1">
                {noRecords ? (
                  <span className="text-paper-400">No classes yet</span>
                ) : diffFromTarget >= 0 ? (
                  <span className="text-emerald-400 flex items-center gap-0.5">
                    <ArrowUpRight className="h-3 w-3" />
                    +{diffFromTarget}% over
                  </span>
                ) : (
                  <span className="text-rose-400 flex items-center gap-0.5">
                    <ArrowDownRight className="h-3 w-3" />
                    {diffFromTarget}% deficit
                  </span>
                )}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => {
                setShowSimulator(!showSimulator);
                setSimAttendExtra(0);
                setSimMissExtra(0);
              }}
              title="What-if Attendance Simulator"
              className={`p-1.5 rounded-lg border transition-colors ${
                showSimulator
                  ? 'bg-white/15 text-white border-white/20'
                  : 'bg-white/[0.03] border-white/5 text-paper-400 hover:text-white hover:bg-white/10'
              }`}
            >
              <Calculator className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onEdit}
              title="Edit course"
              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-white/10 text-paper-400 hover:text-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete course"
              className="p-1.5 rounded-lg bg-white/[0.03] border border-white/5 hover:bg-rose-500/15 text-paper-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* ── Attendance Metric & Gauge ── */}
        <div className="space-y-2 bg-white/[0.02] p-3 rounded-xl border border-white/[0.05]">
          <div className="flex items-baseline justify-between">
            <div className="flex items-baseline gap-1.5">
              <span
                className={`text-2xl font-black font-mono tracking-tight ${
                  noRecords
                    ? 'text-paper-400'
                    : critical
                    ? 'text-orange-400'
                    : warning
                    ? 'text-amber-300'
                    : 'text-emerald-400'
                }`}
              >
                {noRecords ? '—' : `${stats.percentage}%`}
              </span>
              <span className="text-[10px] font-mono text-paper-400 uppercase">
                {noRecords ? 'Awaiting Data' : 'Current Rate'}
              </span>
            </div>

            <div className="text-[11px] font-mono text-paper-400 flex items-center gap-1.5">
              <span>
                <strong className="text-white">{stats.attendedCount}</strong>/{stats.countedLectures} Held
              </span>
              {stats.missedCount > 0 && (
                <span className="text-rose-400/90 font-medium">({stats.missedCount} Missed)</span>
              )}
            </div>
          </div>

          {/* Dual-Layer Progress Bar with Pin Marker */}
          <div className="relative w-full h-2.5 rounded-full bg-white/[0.04] border border-white/5 overflow-visible">
            {/* Filled progress bar */}
            <div
              className={`h-full rounded-full transition-all duration-500 relative ${
                critical
                  ? 'bg-gradient-to-r from-orange-600 to-rose-500 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                  : warning
                  ? 'bg-gradient-to-r from-amber-500 to-yellow-400 shadow-[0_0_8px_rgba(245,158,11,0.4)]'
                  : 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
              }`}
              style={{ width: `${noRecords ? 0 : Math.min(stats.percentage, 100)}%` }}
            />

            {/* Target indicator marker */}
            <div
              className="absolute -top-1 bottom-0 flex flex-col items-center pointer-events-none"
              style={{ left: `${Math.max(2, Math.min(stats.targetPercentage, 98))}%` }}
              title={`Target: ${stats.targetPercentage}%`}
            >
              <div className="w-[2px] h-4.5 bg-white shadow-[0_0_4px_rgba(255,255,255,0.8)] rounded-full" />
            </div>
          </div>

          <div className="flex items-center justify-between text-[9px] font-mono text-paper-400 pt-0.5">
            <span>0%</span>
            <span className="text-stone-300 font-semibold">Target {stats.targetPercentage}%</span>
            <span>100%</span>
          </div>
        </div>

        {/* ── What-If Simulator Drawer (Toggleable) ── */}
        {showSimulator && (
          <div className="p-3 rounded-xl bg-paper-900/90 border border-white/10 space-y-2.5 animate-in">
            <div className="flex items-center justify-between text-[10px] font-mono text-paper-400 border-b border-white/[0.08] pb-1.5">
              <span className="font-bold text-white uppercase tracking-wider flex items-center gap-1">
                <Calculator className="h-3 w-3 text-emerald-400" />
                What-If Simulator
              </span>
              <button
                onClick={() => {
                  setSimAttendExtra(0);
                  setSimMissExtra(0);
                }}
                className="text-[9px] text-paper-400 hover:text-white underline"
              >
                Reset
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-paper-400 block">Attend Future</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSimAttendExtra((v) => Math.max(0, v - 1))}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-mono text-xs flex items-center justify-center hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-xs font-bold text-emerald-400">
                    +{simAttendExtra}
                  </span>
                  <button
                    onClick={() => setSimAttendExtra((v) => v + 1)}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-mono text-xs flex items-center justify-center hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[10px] font-mono text-paper-400 block">Skip / Bunk Future</span>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setSimMissExtra((v) => Math.max(0, v - 1))}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-mono text-xs flex items-center justify-center hover:bg-white/10"
                  >
                    -
                  </button>
                  <span className="flex-1 text-center font-mono text-xs font-bold text-rose-400">
                    +{simMissExtra}
                  </span>
                  <button
                    onClick={() => setSimMissExtra((v) => v + 1)}
                    className="w-6 h-6 rounded bg-white/5 border border-white/10 text-white font-mono text-xs flex items-center justify-center hover:bg-white/10"
                  >
                    +
                  </button>
                </div>
              </div>
            </div>

            {(simAttendExtra > 0 || simMissExtra > 0) && (
              <div className="pt-1.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] font-mono">
                <span className="text-paper-400">Projected Attendance:</span>
                <span className={`font-bold ${simSafe ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {simPercentage}% {simSafe ? '✅ Safe' : '⚠️ Below Target'}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Bunk & Margin Status Alert Badge ── */}
      <div
        className={`mt-4 rounded-xl p-3.5 border transition-all ${
          critical
            ? 'bg-orange-500/10 border-orange-500/25 text-orange-200'
            : warning
            ? 'bg-amber-500/10 border-amber-500/25 text-amber-200'
            : 'bg-emerald-500/10 border-emerald-500/25 text-emerald-200'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            {critical ? (
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            ) : warning ? (
              <Zap className="h-4 w-4 text-amber-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div className="min-w-0">
            <p className="font-bold text-xs text-white">
              {noRecords
                ? 'Awaiting Class Records'
                : critical
                ? `Attend next ${stats.mustAttendClasses} lecture${stats.mustAttendClasses === 1 ? '' : 's'}`
                : stats.bunkableClasses > 0
                ? `${stats.bunkableClasses} safe skip${stats.bunkableClasses === 1 ? '' : 's'} available`
                : 'Zero skip margin (On threshold)'}
            </p>
            <p className="text-[11px] text-paper-400 mt-0.5 font-light leading-relaxed">
              {stats.statusMessage}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
