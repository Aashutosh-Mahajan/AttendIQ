'use client';

import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, Sun, Clock, ChevronDown } from 'lucide-react';

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

const STATUS_OPTIONS: {
  value: Lecture['status'];
  label: string;
  icon: React.ReactNode;
  badgeClass: string;
  dotColor: string;
}[] = [
  {
    value: 'ATTENDED',
    label: 'Attended',
    icon: <CheckCircle2 className="h-3.5 w-3.5" />,
    badgeClass: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40 hover:bg-emerald-500/25',
    dotColor: 'bg-emerald-400',
  },
  {
    value: 'MISSED',
    label: 'Missed',
    icon: <XCircle className="h-3.5 w-3.5" />,
    badgeClass: 'bg-rose-500/15 text-rose-300 border-rose-500/40 hover:bg-rose-500/25',
    dotColor: 'bg-rose-400',
  },
  {
    value: 'HOLIDAY',
    label: 'Holiday',
    icon: <Sun className="h-3.5 w-3.5" />,
    badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/40 hover:bg-amber-500/25',
    dotColor: 'bg-amber-400',
  },
  {
    value: 'SCHEDULED',
    label: 'Scheduled',
    icon: <Clock className="h-3.5 w-3.5" />,
    badgeClass: 'bg-white/5 text-gray-400 border-white/10 hover:bg-white/10',
    dotColor: 'bg-gray-400',
  },
];

export default function LectureCard({ lecture, onStatusChange }: LectureCardProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    if (dropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [dropdownOpen]);

  const currentOption = STATUS_OPTIONS.find((o) => o.value === lecture.status) || STATUS_OPTIONS[3];

  const handleSelect = (value: Lecture['status']) => {
    if (value !== lecture.status) {
      onStatusChange(lecture.id, value);
    }
    setDropdownOpen(false);
  };

  const statusGlow =
    lecture.status === 'ATTENDED'
      ? 'shadow-[0_0_16px_-4px_rgba(16,185,129,0.25)]'
      : lecture.status === 'MISSED'
      ? 'shadow-[0_0_16px_-4px_rgba(244,63,94,0.25)]'
      : lecture.status === 'HOLIDAY'
      ? 'shadow-[0_0_16px_-4px_rgba(245,158,11,0.25)]'
      : '';

  return (
    <div
      className={`glass-card rounded-xl p-3.5 relative overflow-visible group transition-all duration-300 hover:translate-y-[-1px] ${statusGlow}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: lecture.subject.color || '#6366f1' }}
    >
      <div className="flex flex-col gap-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <span className="font-semibold text-[13px] text-white leading-tight block truncate group-hover:text-cyan-200 transition-colors">
              {lecture.subject.name}
            </span>
            <div className="flex items-center gap-2 mt-1">
              {lecture.subject.code && (
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-white/8 text-gray-400 border border-white/5">
                  {lecture.subject.code}
                </span>
              )}
              <span className="flex items-center gap-1 text-[11px] text-gray-500">
                <Clock className="h-3 w-3" />
                {lecture.startTime} – {lecture.endTime}
              </span>
            </div>
          </div>

          {/* Status Dropdown Button */}
          <div className="relative shrink-0" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`flex items-center gap-1.5 pl-2.5 pr-2 py-1.5 rounded-lg text-xs font-semibold border transition-all duration-200 ${currentOption.badgeClass}`}
              title="Click to change attendance status"
            >
              {currentOption.icon}
              <span className="hidden sm:inline">{currentOption.label}</span>
              <ChevronDown className={`h-3 w-3 ml-0.5 transition-transform duration-200 ${dropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute right-0 top-full mt-1.5 z-50 w-40 rounded-xl bg-[#111827] border border-white/10 shadow-2xl shadow-black/60 py-1.5 animate-in fade-in slide-in-from-top-1">
                {STATUS_OPTIONS.map((option) => {
                  const isSelected = option.value === lecture.status;
                  return (
                    <button
                      key={option.value}
                      onClick={() => handleSelect(option.value)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium transition-colors ${
                        isSelected
                          ? 'bg-white/10 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      <span className={`h-2 w-2 rounded-full ${option.dotColor}`} />
                      {option.icon}
                      <span>{option.label}</span>
                      {isSelected && (
                        <CheckCircle2 className="h-3 w-3 ml-auto text-indigo-400" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
