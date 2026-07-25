'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
  subDays,
  isSameDay,
  isToday,
  isSameMonth,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  getDay,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Sparkles,
  Sun,
  AlertTriangle,
  Zap,
  CalendarDays,
  X,
} from 'lucide-react';
import LectureCard, { Lecture } from './LectureCard';

/* ─── Mini Calendar Component ─── */
function MiniCalendar({
  selectedDate,
  onSelectDate,
  onClose,
}: {
  selectedDate: Date;
  onSelectDate: (d: Date) => void;
  onClose: () => void;
}) {
  const [viewMonth, setViewMonth] = useState(startOfMonth(selectedDate));
  const calRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (calRef.current && !calRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [onClose]);

  const monthStart = startOfMonth(viewMonth);
  const monthEnd = endOfMonth(viewMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // pad start of month grid (Monday = 0)
  const startPad = (getDay(monthStart) + 6) % 7; // 0=Mon, 6=Sun
  const paddedDays: (Date | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...daysInMonth,
  ];

  return (
    <div
      ref={calRef}
      className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl bg-[#111827] border border-white/10 shadow-2xl shadow-black/70 p-4"
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-sm font-semibold text-white">{format(viewMonth, 'MMMM yyyy')}</span>
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 transition"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="text-center text-[10px] font-semibold text-gray-500 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-0.5">
        {paddedDays.map((day, i) => {
          if (!day) return <div key={`pad-${i}`} />;

          const isSelected = isSameDay(day, selectedDate);
          const isTodayDate = isToday(day);
          const isCurrentMonth = isSameMonth(day, viewMonth);

          return (
            <button
              key={day.toISOString()}
              onClick={() => {
                onSelectDate(day);
                onClose();
              }}
              className={`h-8 w-full rounded-lg text-xs font-medium transition-all ${
                isSelected
                  ? 'bg-indigo-600 text-white shadow-md shadow-indigo-600/30'
                  : isTodayDate
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : isCurrentMonth
                  ? 'text-gray-300 hover:bg-white/10'
                  : 'text-gray-600'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Quick jump */}
      <div className="mt-3 pt-3 border-t border-white/5 flex gap-2">
        <button
          onClick={() => {
            onSelectDate(new Date());
            onClose();
          }}
          className="flex-1 text-xs text-center py-1.5 rounded-lg bg-indigo-600/80 text-white font-medium hover:bg-indigo-600 transition"
        >
          Jump to Today
        </button>
      </div>
    </div>
  );
}

/* ─── Weekly View ─── */
export default function WeeklyView() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [overallHealth, setOverallHealth] = useState<{ percentage: number; bunkable: number; mustAttend: number }>({
    percentage: 100,
    bunkable: 0,
    mustAttend: 0,
  });

  const weekDays = [0, 1, 2, 3, 4, 5].map((offset) => addDays(currentWeekStart, offset));

  const fetchLectures = async () => {
    try {
      setLoading(true);
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const res = await fetch(`/api/lectures?startDate=${startDate}&endDate=${endDate}`);
      const data = await res.json();
      if (data.lectures) setLectures(data.lectures);
    } catch (err) {
      console.error('Failed to fetch lectures', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchOverallHealth = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        let totalCounted = 0, totalAttended = 0, totalBunkable = 0, totalMustAttend = 0;
        data.subjects.forEach((s: any) => {
          if (s.stats) {
            totalCounted += s.stats.countedLectures;
            totalAttended += s.stats.attendedCount;
            totalBunkable += s.stats.bunkableClasses;
            totalMustAttend += s.stats.mustAttendClasses;
          }
        });
        const overallPct = totalCounted > 0 ? (totalAttended / totalCounted) * 100 : 100;
        setOverallHealth({
          percentage: Math.round(overallPct * 10) / 10,
          bunkable: totalBunkable,
          mustAttend: totalMustAttend,
        });
      }
    } catch {}
  };

  useEffect(() => {
    fetchLectures();
    fetchOverallHealth();
  }, [currentWeekStart]);

  const handleStatusChange = async (id: string, nextStatus: Lecture['status']) => {
    setLectures((prev) =>
      prev.map((lec) => (lec.id === id ? { ...lec, status: nextStatus } : lec))
    );
    try {
      await fetch('/api/lectures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      fetchOverallHealth();
    } catch {
      fetchLectures();
    }
  };

  const handleBulkHoliday = async (dayDate: Date) => {
    const formatted = format(dayDate, 'yyyy-MM-dd');
    setLectures((prev) =>
      prev.map((lec) =>
        isSameDay(new Date(lec.date), dayDate) ? { ...lec, status: 'HOLIDAY' } : lec
      )
    );
    try {
      await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formatted }),
      });
      fetchOverallHealth();
    } catch {
      fetchLectures();
    }
  };

  const handleCalendarSelect = (date: Date) => {
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };

  return (
    <div className="space-y-6">
      {/* ── Header ── */}
      <div className="glass-card p-5 rounded-2xl">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: title + calendar picker */}
          <div className="flex items-center gap-4">
            <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-indigo-600/80 to-cyan-500/60 flex items-center justify-center text-white shadow-lg shadow-indigo-600/20">
              <CalendarIcon className="h-5 w-5" />
            </div>
            <div className="relative">
              <h2 className="text-lg font-bold text-white">Weekly Dashboard</h2>
              <button
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-indigo-300 transition-colors mt-0.5 group"
              >
                <CalendarDays className="h-3.5 w-3.5 group-hover:text-indigo-400 transition-colors" />
                <span>
                  {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 5), 'MMM d, yyyy')}
                </span>
                <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 border border-white/10 text-gray-500 group-hover:text-indigo-300 group-hover:border-indigo-500/30 transition">
                  Pick date
                </span>
              </button>

              {calendarOpen && (
                <MiniCalendar
                  selectedDate={currentWeekStart}
                  onSelectDate={handleCalendarSelect}
                  onClose={() => setCalendarOpen(false)}
                />
              )}
            </div>
          </div>

          {/* Center: health pill */}
          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
              <Zap className="h-4 w-4 text-cyan-400" />
              <span className="text-xs font-medium text-gray-300">Overall:</span>
              <span className="text-sm font-bold text-white">{overallHealth.percentage}%</span>
            </div>

            {overallHealth.mustAttend > 0 ? (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/15 text-rose-300 border border-rose-500/30 text-xs font-semibold">
                <AlertTriangle className="h-3.5 w-3.5" />
                Must Attend: {overallHealth.mustAttend}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
                <Sparkles className="h-3.5 w-3.5" />
                Bunkable: {overallHealth.bunkable}
              </div>
            )}
          </div>

          {/* Right: week nav */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <button
              onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
              className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 border border-indigo-400/30 text-white font-semibold text-xs shadow-md shadow-indigo-600/25 transition-all"
            >
              Today
            </button>
            <button
              onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
              className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ── Day Columns Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {weekDays.map((dayDate) => {
          const dayName = format(dayDate, 'EEEE');
          const isCurrentDay = isToday(dayDate);
          const dayLectures = lectures.filter((lec) => isSameDay(new Date(lec.date), dayDate));

          const attendedCount = dayLectures.filter((l) => l.status === 'ATTENDED').length;
          const totalCount = dayLectures.length;

          return (
            <div
              key={dayDate.toISOString()}
              className={`rounded-2xl flex flex-col min-h-[420px] transition-all duration-300 ${
                isCurrentDay
                  ? 'glass-card border-indigo-500/40 shadow-[0_0_30px_-8px_rgba(99,102,241,0.25)]'
                  : 'glass-card'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between p-3.5 pb-2.5 border-b border-white/8">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-sm font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white'}`}>
                      {dayName.slice(0, 3)}
                    </span>
                    {isCurrentDay && (
                      <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                    )}
                  </div>
                  <span className="text-[11px] text-gray-500 font-medium">
                    {format(dayDate, 'd MMM')}
                  </span>
                </div>

                <div className="flex items-center gap-1.5">
                  {totalCount > 0 && (
                    <span className="text-[10px] font-medium text-gray-500 px-1.5 py-0.5 rounded bg-white/5">
                      {attendedCount}/{totalCount}
                    </span>
                  )}
                  <button
                    onClick={() => handleBulkHoliday(dayDate)}
                    className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-500 hover:text-amber-300 transition-all"
                    title="Mark full day as Holiday"
                  >
                    <Sun className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>

              {/* Lectures Stack */}
              <div className="flex-1 space-y-2 p-3 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2.5 pt-1">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-[68px] rounded-xl bg-white/[0.03] animate-pulse" />
                    ))}
                  </div>
                ) : dayLectures.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="h-10 w-10 rounded-full bg-white/[0.03] flex items-center justify-center mb-2">
                      <CalendarIcon className="h-4 w-4 text-gray-600" />
                    </div>
                    <span className="text-[11px] text-gray-600">No classes</span>
                  </div>
                ) : (
                  dayLectures.map((lec) => (
                    <LectureCard key={lec.id} lecture={lec} onStatusChange={handleStatusChange} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
