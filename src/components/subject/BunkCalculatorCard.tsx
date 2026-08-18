'use client';

import { AlertTriangle, Pencil, Sparkles, Trash2, CheckCircle2 } from 'lucide-react';
import { AttendanceStats } from '@/lib/calculator';

interface Props {
  subjectName: string;
  code?: string | null;
  color: string;
  stats: AttendanceStats;
  onEdit: () => void;
  onDelete: () => void;
}

export default function BunkCalculatorCard({ subjectName, code, color, stats, onEdit, onDelete }: Props) {
  const noRecords = stats.countedLectures === 0;
  const critical = stats.status === 'CRITICAL';
  const warning = stats.status === 'WARNING';

  return (
    <div className="paper-card rounded-2xl p-5 border border-white/[0.08] shadow-paper-sm relative overflow-hidden space-y-4 paper-card-hover flex flex-col justify-between">
      {/* Top Ink Spine */}
      <div className="absolute top-0 left-0 right-0 h-1 opacity-90" style={{ backgroundColor: color || '#94a3b8' }} />

      <div className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-bold text-sm text-white break-words">{subjectName}</h3>
              {code && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-paper-400">
                  {code}
                </span>
              )}
            </div>
            <p className="text-[11px] font-mono text-paper-400 mt-0.5">Target: {stats.targetPercentage}%</p>
          </div>
          <div className="flex gap-1 shrink-0">
            <button
              onClick={onEdit}
              title="Edit course"
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-white/10 text-paper-400 hover:text-white transition-colors"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={onDelete}
              title="Delete course"
              className="p-1.5 rounded-lg bg-white/[0.03] hover:bg-rose-500/10 text-paper-400 hover:text-rose-300 transition-colors"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {/* Progress bar with Target Pin */}
        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] font-mono text-paper-400">
            <span>{noRecords ? 'No classes held yet' : `${stats.attendedCount} / ${stats.countedLectures} Attended`}</span>
            <span className="font-bold text-white tabular-nums">{noRecords ? '—' : `${stats.percentage}%`}</span>
          </div>
          <div className="relative w-full h-2 rounded-full bg-white/[0.04] overflow-visible border border-white/5">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                critical
                  ? 'bg-orange-500'
                  : warning
                  ? 'bg-amber-400'
                  : 'bg-emerald-400'
              }`}
              style={{ width: `${noRecords ? 0 : Math.min(stats.percentage, 100)}%` }}
            />
            {/* Target marker pin */}
            <span
              className="absolute -top-1 h-4 w-0.5 bg-white/80"
              style={{ left: `${Math.max(2, Math.min(stats.targetPercentage, 98))}%` }}
              title={`Target: ${stats.targetPercentage}%`}
            />
          </div>
        </div>
      </div>

      {/* Margin / Deficit Status Panel */}
      <div
        className={`rounded-xl p-3.5 border transition-colors ${
          critical
            ? 'bg-orange-500/10 border-orange-500/20'
            : warning
            ? 'bg-amber-500/10 border-amber-500/20'
            : 'bg-emerald-500/10 border-emerald-500/20'
        }`}
      >
        <div className="flex items-start gap-2.5">
          <div className="mt-0.5 shrink-0">
            {critical ? (
              <AlertTriangle className="h-4 w-4 text-orange-400" />
            ) : (
              <Sparkles className="h-4 w-4 text-emerald-400" />
            )}
          </div>
          <div>
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
