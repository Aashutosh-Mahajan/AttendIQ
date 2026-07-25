'use client';

import React from 'react';
import { CheckCircle2, XCircle, Sun, Clock, MapPin } from 'lucide-react';

export interface Lecture {
  id: string;
  subjectId: string;
  date: string;
  startTime: string;
  endTime: string;
  status: 'SCHEDULED' | 'ATTENDED' | 'MISSED' | 'HOLIDAY';
  notes?: string | null;
  subject: {
    name: string;
    code?: string | null;
    color: string;
    targetPercentage: number;
  };
}

interface LectureCardProps {
  lecture: Lecture;
  onStatusChange: (id: string, nextStatus: Lecture['status']) => void;
}

export default function LectureCard({ lecture, onStatusChange }: LectureCardProps) {
  const getNextStatus = (curr: Lecture['status']): Lecture['status'] => {
    switch (curr) {
      case 'SCHEDULED':
        return 'ATTENDED';
      case 'ATTENDED':
        return 'MISSED';
      case 'MISSED':
        return 'HOLIDAY';
      case 'HOLIDAY':
      default:
        return 'SCHEDULED';
    }
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    const next = getNextStatus(lecture.status);
    onStatusChange(lecture.id, next);
  };

  const renderStatusBadge = () => {
    switch (lecture.status) {
      case 'ATTENDED':
        return (
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-500/30 transition-all shadow-[0_0_12px_rgba(16,185,129,0.2)]"
            title="Click to change status"
          >
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
            <span>Attended</span>
          </button>
        );
      case 'MISSED':
        return (
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-rose-500/20 text-rose-300 border border-rose-500/40 hover:bg-rose-500/30 transition-all shadow-[0_0_12px_rgba(244,63,94,0.2)]"
            title="Click to change status"
          >
            <XCircle className="h-3.5 w-3.5 text-rose-400" />
            <span>Missed</span>
          </button>
        );
      case 'HOLIDAY':
        return (
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 transition-all shadow-[0_0_12px_rgba(245,158,11,0.2)]"
            title="Click to change status"
          >
            <Sun className="h-3.5 w-3.5 text-amber-400" />
            <span>Holiday</span>
          </button>
        );
      case 'SCHEDULED':
      default:
        return (
          <button
            onClick={handleToggle}
            className="flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-medium bg-white/5 text-gray-400 border border-white/10 hover:bg-indigo-500/20 hover:text-indigo-300 hover:border-indigo-500/30 transition-all"
            title="Click to mark attendance"
          >
            <Clock className="h-3.5 w-3.5 text-gray-400" />
            <span>Scheduled</span>
          </button>
        );
    }
  };

  return (
    <div className="glass-card glass-card-hover rounded-xl p-3.5 relative overflow-hidden group">
      {/* Subject Color Pill */}
      <div 
        className="absolute top-0 left-0 bottom-0 w-1.5 rounded-l-xl" 
        style={{ backgroundColor: lecture.subject.color || '#6366f1' }} 
      />

      <div className="pl-2.5 flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                {lecture.subject.name}
              </span>
              {lecture.subject.code && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/10 text-gray-300">
                  {lecture.subject.code}
                </span>
              )}
            </div>
            <div className="flex items-center gap-3 text-xs text-gray-400">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-gray-400" />
                {lecture.startTime} - {lecture.endTime}
              </span>
            </div>
          </div>

          <div className="shrink-0">
            {renderStatusBadge()}
          </div>
        </div>
      </div>
    </div>
  );
}
