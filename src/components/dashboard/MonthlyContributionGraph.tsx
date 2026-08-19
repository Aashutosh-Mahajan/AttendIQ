'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  isSameMonth,
  addMonths,
  subMonths,
  getDay,
} from 'date-fns';
import {
  ChevronLeft,
  ChevronRight,
  Flame,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  Sun,
  Clock,
  Sparkles,
  Award,
  Activity,
  Layers,
} from 'lucide-react';
import { fetchJson } from '@/lib/api-client';
import { Lecture } from './LectureCard';

interface MonthlyContributionGraphProps {
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
  refreshTrigger?: number;
}

interface DayAttendanceData {
  date: Date;
  dateStr: string;
  isCurrentMonth: boolean;
  isCurrentDay: boolean;
  lectures: Lecture[];
  attendedCount: number;
  missedCount: number;
  holidayCount: number;
  scheduledCount: number;
  totalLectures: number;
  percentage: number;
  statusType: 'EMPTY' | 'MISSED' | 'LOW' | 'MEDIUM' | 'HIGH' | 'PERFECT' | 'HOLIDAY' | 'SCHEDULED';
}

export default function MonthlyContributionGraph({
  onSelectDate,
  selectedDate,
  refreshTrigger = 0,
}: MonthlyContributionGraphProps) {
  const [currentMonth, setCurrentMonth] = useState<Date>(() => startOfMonth(new Date()));
  const [monthLectures, setMonthLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<DayAttendanceData | null>(null);
  const [activeDay, setActiveDay] = useState<DayAttendanceData | null>(null);

  // Fetch lectures for the currently viewed month (plus padding days)
  const fetchMonthLectures = useCallback(async () => {
    try {
      setLoading(true);
      const mStart = startOfWeek(startOfMonth(currentMonth), { weekStartsOn: 1 });
      const mEnd = endOfWeek(endOfMonth(currentMonth), { weekStartsOn: 1 });
      const startDateStr = format(mStart, 'yyyy-MM-dd');
      const endDateStr = format(mEnd, 'yyyy-MM-dd');

      const data = await fetchJson(`/api/lectures?startDate=${startDateStr}&endDate=${endDateStr}`, {
        ttl: 15000,
        swr: true,
      });
      if (data?.lectures) {
        setMonthLectures(data.lectures);
      }
    } catch (err) {
      console.error('Failed to load month lectures for contribution graph', err);
    } finally {
      setLoading(false);
    }
  }, [currentMonth]);

  useEffect(() => {
    fetchMonthLectures();
  }, [fetchMonthLectures, refreshTrigger]);

  // Compute all grid days (Monday to Sunday rows, week columns)
  const { weeks, monthStats, todayData } = useMemo(() => {
    const mStart = startOfMonth(currentMonth);
    const mEnd = endOfMonth(currentMonth);
    const gridStart = startOfWeek(mStart, { weekStartsOn: 1 });
    const gridEnd = endOfWeek(mEnd, { weekStartsOn: 1 });

    const allGridDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

    const dayDataList: DayAttendanceData[] = [];
    let presentDayInfo: DayAttendanceData | null = null;

    for (const day of allGridDays) {
      const dayStr = format(day, 'yyyy-MM-dd');
      const isCurrentMonth = isSameMonth(day, currentMonth);
      const isCurrentDay = isToday(day);

      const dayLectures = monthLectures
        .filter((lec) => {
          const lDateStr = typeof lec.date === 'string' ? lec.date.slice(0, 10) : format(new Date(lec.date), 'yyyy-MM-dd');
          return lDateStr === dayStr || isSameDay(new Date(lec.date), day);
        })
        .reduce<Lecture[]>((acc, lec) => {
          const isDup = acc.some((item) => item.id === lec.id || (item.subjectId === lec.subjectId && item.startTime === lec.startTime));
          if (!isDup) acc.push(lec);
          return acc;
        }, [])
        .sort((a, b) => a.startTime.localeCompare(b.startTime));

      const attendedCount = dayLectures.filter((l) => l.status === 'ATTENDED').length;
      const missedCount = dayLectures.filter((l) => l.status === 'MISSED').length;
      const holidayCount = dayLectures.filter((l) => l.status === 'HOLIDAY').length;
      const scheduledCount = dayLectures.filter((l) => l.status === 'SCHEDULED').length;
      const heldCount = attendedCount + missedCount;
      const totalLectures = dayLectures.length;

      const percentage = heldCount > 0 ? Math.round((attendedCount / heldCount) * 100) : 0;

      let statusType: DayAttendanceData['statusType'] = 'EMPTY';

      if (totalLectures === 0) {
        statusType = 'EMPTY';
      } else if (holidayCount === totalLectures) {
        statusType = 'HOLIDAY';
      } else if (heldCount === 0 && scheduledCount > 0) {
        statusType = 'SCHEDULED';
      } else if (heldCount > 0) {
        if (attendedCount === heldCount) {
          statusType = 'PERFECT';
        } else if (percentage >= 75) {
          statusType = 'HIGH';
        } else if (percentage >= 50) {
          statusType = 'MEDIUM';
        } else if (attendedCount > 0) {
          statusType = 'LOW';
        } else {
          statusType = 'MISSED';
        }
      }

      const dayObj: DayAttendanceData = {
        date: day,
        dateStr: dayStr,
        isCurrentMonth,
        isCurrentDay,
        lectures: dayLectures,
        attendedCount,
        missedCount,
        holidayCount,
        scheduledCount,
        totalLectures,
        percentage,
        statusType,
      };

      if (isCurrentDay) {
        presentDayInfo = dayObj;
      }

      dayDataList.push(dayObj);
    }

    let totalAttended = 0;
    let totalHeld = 0;
    let totalClasses = 0;
    let perfectDays = 0;
    let maxStreak = 0;
    let tempStreak = 0;

    for (const day of dayDataList) {
      if (day.isCurrentMonth) {
        totalAttended += day.attendedCount;
        totalHeld += (day.attendedCount + day.missedCount);
        totalClasses += day.totalLectures;

        const heldCount = day.attendedCount + day.missedCount;
        if (heldCount > 0 && day.attendedCount === heldCount) {
          perfectDays++;
          tempStreak++;
          if (tempStreak > maxStreak) maxStreak = tempStreak;
        } else if (day.missedCount > 0) {
          tempStreak = 0;
        }
      }
    }

    const currentStreak = tempStreak;

    // Group into week columns (each week has 7 days from Mon to Sun)
    const weekColumns: DayAttendanceData[][] = [];
    for (let i = 0; i < dayDataList.length; i += 7) {
      weekColumns.push(dayDataList.slice(i, i + 7));
    }

    const monthPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 1000) / 10 : 100;

    return {
      weeks: weekColumns,
      monthStats: {
        totalAttended,
        totalHeld,
        totalClasses,
        monthPct,
        perfectDays,
        streak: currentStreak,
        maxStreak,
      },
      todayData: presentDayInfo,
    };
  }, [currentMonth, monthLectures]);

  const handleCellClick = (dayData: DayAttendanceData) => {
    setActiveDay(dayData);
    if (onSelectDate) {
      onSelectDate(dayData.date);
    }
  };

  const getCellColor = (status: DayAttendanceData['statusType'], isCurrentMonth: boolean) => {
    if (!isCurrentMonth) {
      return 'bg-white/[0.015] border-white/[0.03] opacity-30';
    }
    switch (status) {
      case 'PERFECT':
        return 'bg-emerald-500 border-emerald-400 text-white shadow-[0_0_8px_rgba(16,185,129,0.35)]';
      case 'HIGH':
        return 'bg-emerald-600 border-emerald-500 text-white';
      case 'MEDIUM':
        return 'bg-emerald-700/80 border-emerald-600 text-emerald-100';
      case 'LOW':
        return 'bg-emerald-900 border-emerald-800 text-emerald-200';
      case 'MISSED':
        return 'bg-rose-500/80 border-rose-400 text-white';
      case 'HOLIDAY':
        return 'bg-amber-500/80 border-amber-400 text-white';
      case 'SCHEDULED':
        return 'bg-white/[0.08] border-white/20 text-paper-300';
      case 'EMPTY':
      default:
        return 'bg-white/[0.03] border-white/[0.06] hover:border-white/20';
    }
  };

  const dayLabels = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="paper-card p-5 sm:p-6 rounded-2xl border border-white/10 shadow-paper-sm space-y-6">
      {/* ── Header Bar ── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
            <Activity className="h-4 w-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                Monthly Attendance Ledger Activity
              </h2>
              <span className="px-2 py-0.5 rounded font-mono text-[9px] font-semibold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25 uppercase tracking-wider">
                GitHub Matrix
              </span>
            </div>
            <p className="text-xs text-paper-400 font-light mt-0.5">
              Daily lecture attendance heatmap for {format(currentMonth, 'MMMM yyyy')}.
            </p>
          </div>
        </div>

        {/* Month Navigation & Jump */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <button
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-paper-300 hover:text-white transition-all"
            aria-label="Previous month"
            title="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>

          <span className="px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/10 font-mono text-xs font-bold text-white min-w-[120px] text-center uppercase tracking-wider">
            {format(currentMonth, 'MMMM yyyy')}
          </span>

          <button
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            className="p-2 rounded-xl bg-white/[0.04] border border-white/10 hover:bg-white/[0.08] text-paper-300 hover:text-white transition-all"
            aria-label="Next month"
            title="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          <button
            onClick={() => setCurrentMonth(startOfMonth(new Date()))}
            className="px-3 py-1.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all ml-1"
          >
            Current Month
          </button>
        </div>
      </div>

      {/* ── Key Monthly Statistics & Present Day Badge ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {/* Present Day Metric */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08] relative overflow-hidden">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400 mb-1">
            <span className="flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
              Today
            </span>
            <span>{format(new Date(), 'd MMM')}</span>
          </div>
          <p className="text-base font-bold text-white font-mono">
            {todayData && todayData.totalLectures > 0
              ? `${todayData.attendedCount}/${todayData.totalLectures} Done`
              : 'No Classes'}
          </p>
          <p className="text-[11px] text-paper-400 mt-0.5 font-light truncate">
            {todayData && todayData.totalLectures > 0
              ? todayData.statusType === 'PERFECT'
                ? 'All attended today 🎉'
                : `${todayData.percentage}% attendance`
              : 'Rest day / Off'}
          </p>
        </div>

        {/* Month Attendance */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400 mb-1">
            <span>Month Rate</span>
            <Award className="h-3.5 w-3.5 text-stone-300" />
          </div>
          <p className="text-base font-bold text-white font-mono">
            {monthStats.totalHeld > 0 ? `${monthStats.monthPct}%` : '100%'}
          </p>
          <p className="text-[11px] text-paper-400 mt-0.5 font-light">
            {monthStats.totalAttended}/{monthStats.totalHeld} lectures held
          </p>
        </div>

        {/* Perfect Days */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400 mb-1">
            <span>Full Attendance</span>
            <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
          </div>
          <p className="text-base font-bold text-emerald-300 font-mono">
            {monthStats.perfectDays} Days
          </p>
          <p className="text-[11px] text-paper-400 mt-0.5 font-light">
            100% attended days
          </p>
        </div>

        {/* Current Streak */}
        <div className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.08]">
          <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400 mb-1">
            <span>Streak</span>
            <Flame className="h-3.5 w-3.5 text-orange-400" />
          </div>
          <p className="text-base font-bold text-orange-300 font-mono">
            {monthStats.streak} {monthStats.streak === 1 ? 'Day' : 'Days'}
          </p>
          <p className="text-[11px] text-paper-400 mt-0.5 font-light">
            Best this month: {monthStats.maxStreak}d
          </p>
        </div>
      </div>

      {/* ── Contribution Matrix (GitHub Style) ── */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-mono uppercase tracking-wider text-paper-400">
            Attendance Grid · {format(currentMonth, 'MMMM yyyy')}
          </p>
          <span className="text-[10px] font-mono text-paper-400 hidden sm:inline">
            Click any day to jump weekly schedule
          </span>
        </div>

        <div className="overflow-x-auto pb-2">
          <div className="inline-flex gap-2 min-w-full justify-start sm:justify-center p-3 rounded-2xl bg-paper-900/80 border border-white/[0.06]">
            {/* Day Labels Column */}
            <div className="grid grid-rows-7 gap-1.5 pr-2 border-r border-white/[0.06] text-[10px] font-mono text-paper-400">
              {dayLabels.map((lbl, idx) => (
                <div key={lbl} className="h-7 flex items-center justify-end font-semibold uppercase">
                  {idx % 2 === 0 ? lbl : ''}
                </div>
              ))}
            </div>

            {/* Week Columns */}
            {weeks.map((week, wIdx) => (
              <div key={`week-${wIdx}`} className="grid grid-rows-7 gap-1.5">
                {week.map((day) => {
                  const colorClass = getCellColor(day.statusType, day.isCurrentMonth);
                  const isPresentDay = day.isCurrentDay;
                  const isSelected = selectedDate && isSameDay(day.date, selectedDate);

                  return (
                    <button
                      key={day.dateStr}
                      type="button"
                      onClick={() => handleCellClick(day)}
                      onMouseEnter={() => setHoveredDay(day)}
                      onMouseLeave={() => setHoveredDay(null)}
                      className={`h-7 w-7 sm:h-8 sm:w-8 rounded-lg text-[10px] font-mono font-bold flex items-center justify-center relative transition-all duration-150 border ${colorClass} ${
                        isPresentDay
                          ? 'ring-2 ring-white ring-offset-2 ring-offset-paper-950 scale-105 z-10'
                          : isSelected
                          ? 'ring-1 ring-emerald-400 ring-offset-1 ring-offset-paper-950'
                          : 'hover:scale-110 hover:z-10'
                      }`}
                      title={`${format(day.date, 'EEEE, d MMM yyyy')}: ${
                        day.totalLectures > 0
                          ? `${day.attendedCount}/${day.totalLectures} attended (${day.percentage}%)`
                          : 'No classes'
                      }`}
                    >
                      {/* Day Number */}
                      <span className={day.isCurrentMonth ? 'text-inherit opacity-90' : 'text-paper-600 opacity-40'}>
                        {format(day.date, 'd')}
                      </span>

                      {/* Present Day Indicator Dot */}
                      {isPresentDay && (
                        <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 ring-1 ring-paper-950 shadow-sm" />
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Hovered / Active Day Details Card ── */}
      {(hoveredDay || activeDay) && (
        <div className="p-4 rounded-xl bg-white/[0.03] border border-white/10 space-y-3 animate-in">
          {(() => {
            const day = hoveredDay || activeDay!;
            return (
              <>
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/[0.06] pb-2.5">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="h-4 w-4 text-emerald-400" />
                    <span className="font-bold text-xs text-white">
                      {format(day.date, 'EEEE, d MMMM yyyy')}
                    </span>
                    {day.isCurrentDay && (
                      <span className="px-1.5 py-0.2 rounded font-mono text-[9px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 uppercase">
                        Present Day
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 font-mono text-xs">
                    {day.totalLectures > 0 ? (
                      <>
                        <span className="text-paper-400">
                          {day.attendedCount}/{day.totalLectures} Attended
                        </span>
                        <span className="font-bold text-white px-2 py-0.5 rounded bg-white/10">
                          {day.percentage}%
                        </span>
                      </>
                    ) : (
                      <span className="text-paper-500">No scheduled classes</span>
                    )}
                  </div>
                </div>

                {/* List of lectures on that day */}
                {day.lectures.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 pt-1">
                    {day.lectures.map((lec) => {
                      const statusColor =
                        lec.status === 'ATTENDED'
                          ? 'text-emerald-300 bg-emerald-500/10 border-emerald-500/20'
                          : lec.status === 'MISSED'
                          ? 'text-orange-300 bg-orange-500/10 border-orange-500/20'
                          : lec.status === 'HOLIDAY'
                          ? 'text-amber-300 bg-amber-500/10 border-amber-500/20'
                          : 'text-paper-300 bg-white/5 border-white/10';

                      return (
                        <div
                          key={lec.id}
                          className="p-2.5 rounded-lg bg-white/[0.02] border border-white/[0.05] flex items-center justify-between gap-2"
                        >
                          <div className="min-w-0">
                            <p className="text-xs font-semibold text-white truncate">{lec.subject.name}</p>
                            <p className="text-[10px] font-mono text-paper-400">{lec.startTime} – {lec.endTime}</p>
                          </div>
                          <span className={`px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase border ${statusColor}`}>
                            {lec.status}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <p className="text-xs text-paper-400 font-light">No lectures recorded for this date.</p>
                )}
              </>
            );
          })()}
        </div>
      )}

      {/* ── Legend Bar (GitHub Style) ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[10px] font-mono text-paper-400 border-t border-white/[0.06]">
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="h-3.5 w-3.5 rounded bg-white/[0.03] border border-white/[0.06]" title="No classes" />
          <span className="h-3.5 w-3.5 rounded bg-emerald-900 border border-emerald-800" title="Low (<50%)" />
          <span className="h-3.5 w-3.5 rounded bg-emerald-700/80 border border-emerald-600" title="Medium (50-74%)" />
          <span className="h-3.5 w-3.5 rounded bg-emerald-600 border border-emerald-500" title="Good (75-99%)" />
          <span className="h-3.5 w-3.5 rounded bg-emerald-500 border border-emerald-400" title="100% Perfect" />
          <span>More</span>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-rose-500/80 border border-rose-400" />
            Missed
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-amber-500/80 border border-amber-400" />
            Holiday
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded bg-white/[0.08] border border-white/20" />
            Scheduled
          </span>
          <span className="flex items-center gap-1.5">
            <span className="h-3 w-3 rounded-full ring-2 ring-white bg-emerald-500" />
            Today
          </span>
        </div>
      </div>
    </div>
  );
}
