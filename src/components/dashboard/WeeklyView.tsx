'use client';

import React, { useState, useEffect, useRef } from 'react';
import { fetchJson, invalidateCache } from '@/lib/api-client';
import {
  format,
  addWeeks,
  subWeeks,
  startOfWeek,
  addDays,
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
  CheckCircle2,
  XCircle,
  X,
  Flame,
  Activity,
} from 'lucide-react';
import LectureCard, { Lecture } from './LectureCard';
import LiveClock from './LiveClock';
import MonthlyContributionGraph from './MonthlyContributionGraph';

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
  const startPad = (getDay(monthStart) + 6) % 7;
  const paddedDays: (Date | null)[] = [
    ...Array.from({ length: startPad }, () => null),
    ...daysInMonth,
  ];

  return (
    <div
      ref={calRef}
      className="absolute left-0 top-full mt-2 z-50 w-72 rounded-2xl paper-card border border-white/15 shadow-paper-lg p-4 animate-in"
    >
      {/* Month header */}
      <div className="flex items-center justify-between mb-3 border-b border-white/[0.08] pb-2">
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() - 1, 1))}
          className="p-1 rounded-lg hover:bg-white/10 text-paper-400 hover:text-white transition"
          aria-label="Previous month"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
          {format(viewMonth, 'MMMM yyyy')}
        </span>
        <button
          onClick={() => setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + 1, 1))}
          className="p-1 rounded-lg hover:bg-white/10 text-paper-400 hover:text-white transition"
          aria-label="Next month"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Day names */}
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
          <div key={d} className="text-center font-mono text-[9px] font-semibold text-paper-400 py-0.5 uppercase">
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
              className={`h-7 w-full rounded-lg text-xs font-mono transition-all ${
                isSelected
                  ? 'bg-white text-paper-950 font-bold shadow-paper-sm'
                  : isTodayDate
                  ? 'bg-white/10 text-white font-semibold border border-white/20'
                  : isCurrentMonth
                  ? 'text-paper-200 hover:bg-white/10'
                  : 'text-paper-500'
              }`}
            >
              {format(day, 'd')}
            </button>
          );
        })}
      </div>

      {/* Quick jump */}
      <div className="mt-3 pt-2.5 border-t border-white/[0.08] flex gap-2">
        <button
          onClick={() => {
            onSelectDate(new Date());
            onClose();
          }}
          className="flex-1 text-[11px] font-mono uppercase tracking-wider text-center py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white font-semibold transition"
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
  const [selectedLecture, setSelectedLecture] = useState<Lecture | null>(null);
  const [overallHealth, setOverallHealth] = useState<{ percentage: number; bunkable: number; mustAttend: number }>({
    percentage: 100,
    bunkable: 0,
    mustAttend: 0,
  });
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const weekDays = [0, 1, 2, 3, 4, 5].map((offset) => addDays(currentWeekStart, offset));

  const fetchLectures = React.useCallback(async (forceRefresh = false) => {
    try {
      setLoading(true);
      const startDate = format(currentWeekStart, 'yyyy-MM-dd');
      const endDate = format(addDays(currentWeekStart, 6), 'yyyy-MM-dd');

      const data = await fetchJson(`/api/lectures?startDate=${startDate}&endDate=${endDate}`, {
        forceRefresh,
        ttl: 10000,
        swr: true,
      });
      if (data.lectures) setLectures(data.lectures);
    } catch (err) {
      console.error('Failed to fetch lectures', err);
    } finally {
      setLoading(false);
    }
  }, [currentWeekStart]);

  const fetchOverallHealth = React.useCallback(async (forceRefresh = false) => {
    try {
      const data = await fetchJson('/api/subjects', { forceRefresh, ttl: 15000, swr: true });
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
      } else {
        setOverallHealth({ percentage: 100, bunkable: 0, mustAttend: 0 });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchLectures();
  }, [fetchLectures]);

  useEffect(() => {
    fetchOverallHealth();
  }, [fetchOverallHealth]);

  const handleStatusChange = async (id: string, nextStatus: Lecture['status']) => {
    // Instant optimistic update
    setLectures((prev) =>
      prev.map((lec) => (lec.id === id ? { ...lec, status: nextStatus } : lec))
    );
    setRefreshTrigger((prev) => prev + 1);
    try {
      invalidateCache('/api/lectures');
      invalidateCache('/api/subjects');
      const response = await fetch('/api/lectures', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: nextStatus }),
      });
      if (!response.ok) throw new Error('Unable to update attendance.');
      fetchOverallHealth(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      fetchLectures(true);
    }
  };

  const handleBulkStatusChange = async (dayDate: Date, status: Lecture['status']) => {
    const formatted = format(dayDate, 'yyyy-MM-dd');
    // Instant optimistic update
    setLectures((prev) =>
      prev.map((lec) =>
        isSameDay(new Date(lec.date), dayDate) ? { ...lec, status } : lec
      )
    );
    setRefreshTrigger((prev) => prev + 1);
    try {
      invalidateCache('/api/lectures');
      invalidateCache('/api/subjects');
      const response = await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formatted, status }),
      });
      if (!response.ok) throw new Error('Unable to update attendance.');
      fetchOverallHealth(true);
      setRefreshTrigger((prev) => prev + 1);
    } catch {
      fetchLectures(true);
    }
  };

  const handleCalendarSelect = (date: Date) => {
    setCurrentWeekStart(startOfWeek(date, { weekStartsOn: 1 }));
  };

  return (
    <div className="space-y-5">
      {/* ── Toolbar ── */}
      <div className="paper-card p-4 sm:p-5 rounded-2xl border border-white/10 shadow-paper-sm">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: date range picker */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
              <CalendarIcon className="h-4 w-4" />
            </div>
            <div className="relative">
              <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400 leading-none">Schedule Window</p>
              <button
                onClick={() => setCalendarOpen(!calendarOpen)}
                className="flex items-center gap-1.5 text-xs sm:text-sm font-bold text-white hover:text-stone-300 transition-colors mt-1 group"
              >
                <CalendarDays className="h-3.5 w-3.5 text-paper-400 group-hover:text-white" />
                <span>
                  {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 5), 'MMM d, yyyy')}
                </span>
                <span className="text-[9px] font-mono uppercase px-1.5 py-0.2 rounded bg-white/5 border border-white/10 text-paper-400 group-hover:border-white/20">
                  Pick
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

          {/* Center: Health & Margins */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <span className="text-[11px] font-mono text-paper-400 uppercase tracking-wider">Overall:</span>
              <span className="text-xs font-mono font-bold text-white tabular-nums">{overallHealth.percentage}%</span>
            </div>

            {overallHealth.mustAttend > 0 ? (
              <div className="ink-stamp ink-stamp-missed">
                <AlertTriangle className="h-3 w-3" />
                Must Attend: {overallHealth.mustAttend}
              </div>
            ) : (
              <div className="ink-stamp ink-stamp-attended">
                <Sparkles className="h-3 w-3" />
                Safe Skips: {overallHealth.bunkable}
              </div>
            )}
          </div>

          {/* Right: navigation controls */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => {
                const el = document.getElementById('monthly-activity');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-paper-300 hover:text-white text-xs font-mono uppercase tracking-wider transition-colors"
              title="Jump to Monthly Contribution Graph"
            >
              <Activity className="h-3.5 w-3.5 text-emerald-400" />
              <span>Month Matrix</span>
            </button>
            <LiveClock />
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
                className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-paper-300 hover:text-white transition-all"
                aria-label="Previous week"
                title="Previous week"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
                className="px-3 py-2 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all"
              >
                This week
              </button>
              <button
                onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
                className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-paper-300 hover:text-white transition-all"
                aria-label="Next week"
                title="Next week"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── 6-Day Column Grid ── */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {weekDays.map((dayDate) => {
          const dayName = format(dayDate, 'EEEE');
          const isCurrentDay = isToday(dayDate);
          const targetDayStr = format(dayDate, 'yyyy-MM-dd');

          const dayLectures = lectures
            .filter((lec) => {
              const dStr = typeof lec.date === 'string' ? lec.date.slice(0, 10) : format(new Date(lec.date), 'yyyy-MM-dd');
              return dStr === targetDayStr || isSameDay(new Date(lec.date), dayDate);
            })
            .reduce<Lecture[]>((acc, lec) => {
              const isDup = acc.some((item) => item.id === lec.id || (item.subjectId === lec.subjectId && item.startTime === lec.startTime));
              if (!isDup) acc.push(lec);
              return acc;
            }, [])
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

          const attendedCount = dayLectures.filter((l) => l.status === 'ATTENDED').length;
          const totalCount = dayLectures.length;

          return (
            <div
              key={dayDate.toISOString()}
              className={`rounded-2xl flex flex-col min-h-[350px] transition-all duration-150 paper-card border ${
                isCurrentDay
                  ? 'border-white/30 shadow-paper-md bg-white/[0.03]'
                  : 'border-white/[0.08]'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between p-3 border-b border-white/[0.08]">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-xs font-mono font-bold uppercase tracking-wider ${isCurrentDay ? 'text-white font-black' : 'text-stone-300'}`}>
                      {dayName.slice(0, 3)}
                    </span>
                    {isCurrentDay && (
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-paper-400">
                    {format(dayDate, 'd MMM')}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  {totalCount > 0 && (
                    <span className="text-[9px] font-mono text-paper-400 px-1 py-0.2 rounded bg-white/5 border border-white/5 mr-0.5">
                      {attendedCount}/{totalCount}
                    </span>
                  )}
                  {totalCount > 0 && (
                    <div className="flex items-center gap-0.5">
                      <button
                        onClick={() => handleBulkStatusChange(dayDate, 'ATTENDED')}
                        className="p-1 rounded-md hover:bg-emerald-500/20 text-paper-400 hover:text-emerald-300 transition-colors"
                        title="Mark all attended"
                        aria-label="Mark all attended"
                      >
                        <CheckCircle2 className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange(dayDate, 'MISSED')}
                        className="p-1 rounded-md hover:bg-orange-500/20 text-paper-400 hover:text-orange-300 transition-colors"
                        title="Mark all missed"
                        aria-label="Mark all missed"
                      >
                        <XCircle className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => handleBulkStatusChange(dayDate, 'HOLIDAY')}
                        className="p-1 rounded-md hover:bg-amber-500/20 text-paper-400 hover:text-amber-300 transition-colors"
                        title="Mark all as holiday"
                        aria-label="Mark all as holiday"
                      >
                        <Sun className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Lectures Stack */}
              <div className="flex-1 space-y-2 p-2.5 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 pt-1">
                    {[1, 2].map((n) => (
                      <div key={n} className="h-16 rounded-xl bg-white/[0.02] border border-white/5 animate-pulse" />
                    ))}
                  </div>
                ) : dayLectures.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center py-12">
                    <div className="h-8 w-8 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-1.5">
                      <CalendarIcon className="h-3.5 w-3.5 text-paper-500" />
                    </div>
                    <span className="text-[10px] font-mono uppercase tracking-wider text-paper-500">No Classes</span>
                  </div>
                ) : (
                  dayLectures.map((lec) => (
                    <LectureCard key={lec.id} lecture={lec} onOpen={setSelectedLecture} />
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ── GitHub-Style Monthly Attendance Contribution Matrix ── */}
      <div id="monthly-activity" className="pt-2">
        <MonthlyContributionGraph
          onSelectDate={handleCalendarSelect}
          selectedDate={currentWeekStart}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* ── Attendance Modal Dialog ── */}
      {selectedLecture && (
        <div
          className="fixed inset-0 z-50 bg-paper-950/80 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={() => setSelectedLecture(null)}
        >
          <div
            className="paper-card rounded-2xl max-w-sm w-full p-6 border border-white/15 shadow-paper-lg space-y-5 animate-in"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Record Attendance</p>
                <h3 className="text-base font-bold text-white mt-0.5">{selectedLecture.subject.name}</h3>
                <p className="text-[11px] font-mono text-paper-400 mt-1">
                  {format(new Date(selectedLecture.date), 'EEEE, d MMM')} · {selectedLecture.startTime} – {selectedLecture.endTime}
                </p>
              </div>
              <button
                onClick={() => setSelectedLecture(null)}
                className="p-1 rounded-lg text-paper-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-stone-300 font-light">Select attendance status for this lecture:</p>

            <div className="grid grid-cols-3 gap-2">
              {([
                ['ATTENDED', 'Attended', CheckCircle2, 'bg-emerald-600 hover:bg-emerald-500 text-white'],
                ['MISSED', 'Missed', XCircle, 'bg-orange-600 hover:bg-orange-500 text-white'],
                ['HOLIDAY', 'Holiday', Sun, 'bg-amber-600 hover:bg-amber-500 text-white'],
              ] as const).map(([status, label, Icon, className]) => (
                <button
                  key={status}
                  onClick={() => {
                    handleStatusChange(selectedLecture.id, status);
                    setSelectedLecture(null);
                  }}
                  className={`flex flex-col items-center gap-1.5 p-3 rounded-xl text-xs font-mono uppercase tracking-wider font-semibold transition-all shadow-paper-sm hover:scale-[1.02] active:scale-[0.98] ${className}`}
                >
                  <Icon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>

            {selectedLecture.status !== 'SCHEDULED' && (
              <button
                onClick={() => {
                  handleStatusChange(selectedLecture.id, 'SCHEDULED');
                  setSelectedLecture(null);
                }}
                className="w-full py-2.5 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[11px] font-mono uppercase tracking-wider text-paper-300 transition-colors"
              >
                Reset to Scheduled
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
