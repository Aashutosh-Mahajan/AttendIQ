'use client';

import { AlertTriangle, Pencil, Sparkles, Trash2 } from 'lucide-react';
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
  const accent = critical ? 'bg-rose-500/20 text-rose-300 border-rose-500/40' : warning ? 'bg-amber-500/20 text-amber-300 border-amber-500/40' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40';
  const panel = critical ? 'bg-rose-950/30 border-rose-500/30' : warning ? 'bg-amber-950/30 border-amber-500/30' : 'bg-emerald-950/30 border-emerald-500/30';

  return <div className="glass-card rounded-2xl p-5 border border-white/10 relative overflow-hidden space-y-4">
    <div className="absolute top-0 left-0 right-0 h-1" style={{ backgroundColor: color || '#6366f1' }} />
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0"><div className="flex flex-wrap items-center gap-2"><h3 className="font-bold text-lg text-white break-words">{subjectName}</h3>{code && <span className="text-xs font-mono px-2 py-0.5 rounded bg-white/10 text-gray-300">{code}</span>}</div><p className="text-xs text-gray-400">Target attendance: {stats.targetPercentage}%</p></div>
      <div className="flex gap-1 shrink-0"><button onClick={onEdit} title="Edit subject" className="p-2 rounded-lg bg-white/5 hover:bg-cyan-500/15 text-gray-400 hover:text-cyan-300"><Pencil className="h-3.5 w-3.5" /></button><button onClick={onDelete} title="Delete subject" className="p-2 rounded-lg bg-white/5 hover:bg-rose-500/15 text-gray-400 hover:text-rose-300"><Trash2 className="h-3.5 w-3.5" /></button></div>
    </div>
    <div className="space-y-1.5"><div className="flex justify-between text-xs text-gray-400"><span>{noRecords ? 'No completed lectures yet' : `${stats.attendedCount} attended of ${stats.countedLectures} held`}</span><span>{noRecords ? 'Awaiting attendance' : `${stats.percentage}%`}</span></div><div className="w-full h-2.5 rounded-full bg-white/5 overflow-hidden p-0.5 border border-white/10"><div className={`h-full rounded-full transition-all duration-500 ${critical ? 'bg-gradient-to-r from-rose-500 to-amber-500' : 'bg-gradient-to-r from-emerald-500 to-cyan-400'}`} style={{ width: `${noRecords ? 0 : Math.min(stats.percentage, 100)}%` }} /></div></div>
    <div className={`rounded-xl p-4 border ${panel}`}><div className="flex items-center gap-3"><div className={`p-2.5 rounded-lg shrink-0 ${critical ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'}`}>{critical ? <AlertTriangle className="h-5 w-5" /> : <Sparkles className="h-5 w-5" />}</div><div><p className="font-bold text-sm text-white">{noRecords ? 'Start tracking attendance' : critical ? `Attend the next ${stats.mustAttendClasses} lecture${stats.mustAttendClasses === 1 ? '' : 's'}` : stats.bunkableClasses > 0 ? `You can miss ${stats.bunkableClasses} lecture${stats.bunkableClasses === 1 ? '' : 's'}` : 'Do not miss the next lecture'}</p><p className="text-xs text-gray-300/80 mt-0.5">{stats.statusMessage}</p></div></div></div>
  </div>;
}
