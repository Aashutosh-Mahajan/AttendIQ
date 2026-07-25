'use client';

import { CheckCircle2, Clock, Sun, XCircle } from 'lucide-react';

export interface Lecture {
  id: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'ATTENDED' | 'MISSED' | 'HOLIDAY';
  notes?: string | null;
  subject: { name: string; code?: string | null; color: string; targetPercentage: number };
}

const statusAppearance = {
  ATTENDED: { label: 'Attended', className: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40', icon: CheckCircle2 },
  MISSED: { label: 'Missed', className: 'bg-rose-500/15 text-rose-300 border-rose-500/40', icon: XCircle },
  HOLIDAY: { label: 'Holiday', className: 'bg-amber-500/15 text-amber-300 border-amber-500/40', icon: Sun },
  SCHEDULED: { label: 'Mark attendance', className: 'bg-white/5 text-gray-300 border-white/10', icon: Clock },
};

export default function LectureCard({ lecture, onOpen }: { lecture: Lecture; onOpen: (lecture: Lecture) => void }) {
  const appearance = statusAppearance[lecture.status];
  const Icon = appearance.icon;
  return <button onClick={() => onOpen(lecture)} className="w-full text-left glass-card rounded-xl p-3.5 relative group transition-all duration-200 hover:-translate-y-0.5 hover:border-indigo-500/40" style={{ borderLeftWidth: '3px', borderLeftColor: lecture.subject.color || '#6366f1' }}>
    <div className="space-y-2">
      <span className="font-semibold text-[13px] text-white leading-tight block break-words group-hover:text-cyan-200">{lecture.subject.name}</span>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          {lecture.subject.code && <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/8 text-gray-400">{lecture.subject.code}</span>}
          <span className="flex items-center gap-1 text-[11px] text-gray-500 whitespace-nowrap"><Clock className="h-3 w-3" />{lecture.startTime} – {lecture.endTime}</span>
        </div>
        <span className={`flex items-center gap-1.5 shrink-0 px-2 py-1.5 rounded-lg text-[10px] font-semibold border ${appearance.className}`}><Icon className="h-3.5 w-3.5" /><span>{appearance.label}</span></span>
      </div>
    </div>
  </button>;
}
