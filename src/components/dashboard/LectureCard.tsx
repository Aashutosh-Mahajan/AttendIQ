'use client';

import { CheckCircle2, Clock, Sun, XCircle, CalendarCheck } from 'lucide-react';

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
  ATTENDED: { label: 'Attended', className: 'ink-stamp ink-stamp-attended', icon: CheckCircle2 },
  MISSED: { label: 'Missed', className: 'ink-stamp ink-stamp-missed', icon: XCircle },
  HOLIDAY: { label: 'Holiday', className: 'ink-stamp ink-stamp-holiday', icon: Sun },
  SCHEDULED: { label: 'Mark', className: 'ink-stamp ink-stamp-scheduled', icon: Clock },
};

export default function LectureCard({ lecture, onOpen }: { lecture: Lecture; onOpen: (lecture: Lecture) => void }) {
  const appearance = statusAppearance[lecture.status];
  const Icon = appearance.icon;

  return (
    <button
      onClick={() => onOpen(lecture)}
      className="w-full text-left paper-card rounded-xl p-3 relative group transition-all duration-150 hover:-translate-y-0.5 hover:border-white/20 border border-white/[0.08] shadow-paper-sm overflow-hidden"
    >
      {/* Left Ink Color Spine */}
      <span
        className="absolute left-0 top-0 bottom-0 w-1 opacity-90"
        style={{ backgroundColor: lecture.subject.color || '#94a3b8' }}
      />

      <div className="pl-1.5 space-y-1.5">
        <div className="flex items-start justify-between gap-1.5">
          <span className="font-semibold text-xs text-white leading-tight block break-words group-hover:text-stone-200">
            {lecture.subject.name}
          </span>
          {lecture.subject.code && (
            <span className="shrink-0 text-[9px] font-mono px-1 py-0.2 rounded bg-white/5 text-paper-400">
              {lecture.subject.code}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-2 pt-0.5">
          <span className="flex items-center gap-1 font-mono text-[10px] text-paper-400">
            <Clock className="h-3 w-3" />
            {lecture.startTime} – {lecture.endTime}
          </span>

          <span className={appearance.className}>
            <Icon className="h-3 w-3" />
            <span>{appearance.label}</span>
          </span>
        </div>
      </div>
    </button>
  );
}
