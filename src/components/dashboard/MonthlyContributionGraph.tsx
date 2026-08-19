'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  isSameDay,
  isToday,
  subWeeks,
  isSameMonth,
  addDays,
} from 'date-fns';
import { fetchJson } from '@/lib/api-client';
import { Lecture } from './LectureCard';

interface MonthlyContributionGraphProps {
  onSelectDate?: (date: Date) => void;
  selectedDate?: Date;
  refreshTrigger?: number;
}

interface DayData {
  date: Date;
  dateStr: string;
  isToday: boolean;
  attendedCount: number;
  missedCount: number;
  holidayCount: number;
  scheduledCount: number;
  totalLectures: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = empty/none, 1 = 1-25%, 2 = 26-50%, 3 = 51-75%, 4 = 76-100%
  lectures: Lecture[];
}

export default function MonthlyContributionGraph({
  onSelectDate,
  selectedDate,
  refreshTrigger = 0,
}: MonthlyContributionGraphProps) {
  const [allLectures, setAllLectures] = useState<Lecture[]>([]);
  const [semesterRange, setSemesterRange] = useState<{ start: Date; end: Date } | null>(null);
  const [loading, setLoading] = useState(true);
  const [hoveredDay, setHoveredDay] = useState<{ day: DayData; x: number; y: number } | null>(null);

  // Fetch all lectures and active semester
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [lecturesRes, semesterRes] = await Promise.all([
        fetchJson('/api/lectures', { ttl: 15000, swr: true }),
        fetchJson('/api/semesters', { ttl: 30000, swr: true }),
      ]);

      if (lecturesRes?.lectures) {
        setAllLectures(lecturesRes.lectures);
      }
      if (semesterRes?.activeSemester) {
        setSemesterRange({
          start: new Date(semesterRes.activeSemester.startDate),
          end: new Date(semesterRes.activeSemester.endDate),
        });
      }
    } catch (err) {
      console.error('Failed to load contribution data', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData, refreshTrigger]);

  // Compute the 52-week horizontal grid matching GitHub's contribution matrix
  const { weeks, monthLabels, totalAttendedCount, totalHeldCount } = useMemo(() => {
    const today = new Date();
    // End on the coming Sunday of the current week (or semester end, whichever is later)
    let gridEnd = endOfWeek(today, { weekStartsOn: 1 });
    if (semesterRange?.end && semesterRange.end > gridEnd) {
      gridEnd = endOfWeek(semesterRange.end, { weekStartsOn: 1 });
    }

    // Default to a 52-week (1-year) horizontal span, or starting from semester start
    let gridStart = startOfWeek(subWeeks(gridEnd, 51), { weekStartsOn: 1 });
    if (semesterRange?.start && semesterRange.start < gridStart) {
      gridStart = startOfWeek(semesterRange.start, { weekStartsOn: 1 });
    }

    const allDays = eachDayOfInterval({ start: gridStart, end: gridEnd });

    // Map lectures by date string for fast O(1) lookup
    const lecturesByDate = new Map<string, Lecture[]>();
    let totalAttended = 0;
    let totalHeld = 0;

    for (const lec of allLectures) {
      const dStr = typeof lec.date === 'string' ? lec.date.slice(0, 10) : format(new Date(lec.date), 'yyyy-MM-dd');
      const list = lecturesByDate.get(dStr) ?? [];
      list.push(lec);
      lecturesByDate.set(dStr, list);

      if (lec.status === 'ATTENDED') {
        totalAttended++;
        totalHeld++;
      } else if (lec.status === 'MISSED') {
        totalHeld++;
      }
    }

    // Build day objects
    const dayDataList: DayData[] = allDays.map((day) => {
      const dateStr = format(day, 'yyyy-MM-dd');
      const dayLectures = lecturesByDate.get(dateStr) ?? [];

      const attendedCount = dayLectures.filter((l) => l.status === 'ATTENDED').length;
      const missedCount = dayLectures.filter((l) => l.status === 'MISSED').length;
      const holidayCount = dayLectures.filter((l) => l.status === 'HOLIDAY').length;
      const scheduledCount = dayLectures.filter((l) => l.status === 'SCHEDULED').length;
      const totalLectures = dayLectures.length;
      const heldCount = attendedCount + missedCount;

      let level: DayData['level'] = 0;

      if (attendedCount > 0) {
        if (heldCount > 0) {
          const pct = attendedCount / heldCount;
          if (pct >= 0.99) level = 4;
          else if (pct >= 0.75) level = 3;
          else if (pct >= 0.4) level = 2;
          else level = 1;
        } else {
          level = 4;
        }
      } else if (missedCount > 0) {
        level = 1; // Show minimal activity color for missed to reflect held class
      }

      return {
        date: day,
        dateStr,
        isToday: isToday(day),
        attendedCount,
        missedCount,
        holidayCount,
        scheduledCount,
        totalLectures,
        level,
        lectures: dayLectures,
      };
    });

    // Group into week columns (7 days per column: Mon = index 0 ... Sun = index 6)
    const weekColumns: DayData[][] = [];
    for (let i = 0; i < dayDataList.length; i += 7) {
      weekColumns.push(dayDataList.slice(i, i + 7));
    }

    // Calculate month labels positions across columns
    const labels: Array<{ name: string; colIndex: number }> = [];
    let lastMonth = -1;

    weekColumns.forEach((week, colIdx) => {
      // Check the first day or middle day of the week
      const sampleDay = week[0]?.date || week[3]?.date;
      if (sampleDay) {
        const monthNum = sampleDay.getMonth();
        if (monthNum !== lastMonth) {
          labels.push({
            name: format(sampleDay, 'MMM'),
            colIndex: colIdx,
          });
          lastMonth = monthNum;
        }
      }
    });

    return {
      weeks: weekColumns,
      monthLabels: labels,
      totalAttendedCount: totalAttended,
      totalHeldCount: totalHeld,
    };
  }, [allLectures, semesterRange]);

  // Color mapper matching GitHub's exact dark mode palette
  const getCellColor = (day: DayData) => {
    if (day.totalLectures === 0) {
      return 'bg-[#161b22] border-[#21262d]';
    }

    if (day.holidayCount > 0 && day.attendedCount === 0 && day.missedCount === 0) {
      return 'bg-[#d29922]/40 border-[#d29922]/60';
    }

    if (day.attendedCount === 0 && day.missedCount > 0) {
      return 'bg-[#da3633]/60 border-[#da3633]/80';
    }

    if (day.scheduledCount > 0 && day.attendedCount === 0 && day.missedCount === 0) {
      return 'bg-[#21262d] border-[#30363d]';
    }

    switch (day.level) {
      case 4:
        return 'bg-[#39d353] border-[#39d353]'; // 100% / Highest (bright GitHub green)
      case 3:
        return 'bg-[#26a641] border-[#26a641]'; // 75-99%
      case 2:
        return 'bg-[#006d32] border-[#006d32]'; // 40-74%
      case 1:
        return 'bg-[#0e4429] border-[#0e4429]'; // 1-39%
      case 0:
      default:
        return 'bg-[#161b22] border-[#21262d]';
    }
  };

  const handleMouseEnter = (event: React.MouseEvent<HTMLDivElement>, day: DayData) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setHoveredDay({
      day,
      x: rect.left + rect.width / 2,
      y: rect.top,
    });
  };

  const handleMouseLeave = () => {
    setHoveredDay(null);
  };

  const handleCellClick = (day: DayData) => {
    if (onSelectDate) {
      onSelectDate(day.date);
    }
  };

  return (
    <div className="paper-card p-4 sm:p-5 rounded-2xl border border-white/10 shadow-paper-sm text-[#7d8590] select-none">
      {/* ── Top Header Bar ── */}
      <div className="flex items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono font-bold text-white tracking-tight">
            {totalAttendedCount} {totalAttendedCount === 1 ? 'lecture' : 'lectures'} attended in active term
          </span>
        </div>
        <span className="text-[10px] font-mono text-paper-400">
          Click any square to view week
        </span>
      </div>

      {/* ── GitHub Contribution Heatmap Grid ── */}
      <div className="overflow-x-auto pb-1 scrollbar-thin">
        <div className="inline-block min-w-full">
          {/* Month Labels Header */}
          <div className="relative h-4 mb-1 text-[10px] font-mono text-[#7d8590]">
            {monthLabels.map((lbl, idx) => {
              // Calculate left offset based on column index: 28px left margin + colIndex * 13.5px
              const leftOffset = 28 + lbl.colIndex * 13.5;
              return (
                <span
                  key={`${lbl.name}-${idx}`}
                  className="absolute"
                  style={{ left: `${leftOffset}px` }}
                >
                  {lbl.name}
                </span>
              );
            })}
          </div>

          {/* Grid: Left Day Labels (Mon, Wed, Fri) + Week Columns */}
          <div className="flex items-start gap-1.5">
            {/* Day of Week Labels (Mon = 0, Wed = 2, Fri = 4) */}
            <div className="grid grid-rows-7 gap-[2.5px] text-[9px] font-mono text-[#7d8590] pr-1 pt-[1px] leading-[10px]">
              <span className="h-[10px] flex items-center justify-end">Mon</span>
              <span className="h-[10px]" />
              <span className="h-[10px] flex items-center justify-end">Wed</span>
              <span className="h-[10px]" />
              <span className="h-[10px] flex items-center justify-end">Fri</span>
              <span className="h-[10px]" />
              <span className="h-[10px]" />
            </div>

            {/* Week Columns */}
            <div className="flex gap-[2.5px]">
              {weeks.map((week, colIdx) => (
                <div key={`col-${colIdx}`} className="grid grid-rows-7 gap-[2.5px]">
                  {week.map((day) => {
                    const colorClass = getCellColor(day);
                    const isSelected = selectedDate && isSameDay(day.date, selectedDate);
                    const isTodayDate = day.isToday;

                    return (
                      <div
                        key={day.dateStr}
                        onClick={() => handleCellClick(day)}
                        onMouseEnter={(e) => handleMouseEnter(e, day)}
                        onMouseLeave={handleMouseLeave}
                        className={`w-[11px] h-[11px] rounded-[2px] border transition-transform cursor-pointer relative ${colorClass} ${
                          isTodayDate
                            ? 'ring-1 ring-white shadow-[0_0_6px_rgba(255,255,255,0.6)] scale-110 z-10'
                            : isSelected
                            ? 'ring-1 ring-emerald-400 scale-105 z-10'
                            : 'hover:scale-125 hover:z-20'
                        }`}
                      />
                    );
                  })}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom Legend & Info ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mt-3 pt-2 border-t border-white/[0.06] text-[10px] font-mono text-[#7d8590]">
        <span className="hover:text-white transition-colors cursor-pointer">
          Learn how we calculate attendance
        </span>

        {/* GitHub Less -> More Scale */}
        <div className="flex items-center gap-1.5">
          <span>Less</span>
          <span className="w-[10px] h-[10px] rounded-[2px] bg-[#161b22] border border-[#21262d]" title="No attendance" />
          <span className="w-[10px] h-[10px] rounded-[2px] bg-[#0e4429] border border-[#0e4429]" title="Low" />
          <span className="w-[10px] h-[10px] rounded-[2px] bg-[#006d32] border border-[#006d32]" title="Medium" />
          <span className="w-[10px] h-[10px] rounded-[2px] bg-[#26a641] border border-[#26a641]" title="Good" />
          <span className="w-[10px] h-[10px] rounded-[2px] bg-[#39d353] border border-[#39d353]" title="100% Attended" />
          <span>More</span>
        </div>
      </div>

      {/* ── Fixed Floating Tooltip (GitHub Style) ── */}
      {hoveredDay && (
        <div
          className="fixed z-50 pointer-events-none transform -translate-x-1/2 -translate-y-full mb-2"
          style={{
            left: `${hoveredDay.x}px`,
            top: `${hoveredDay.y - 8}px`,
          }}
        >
          <div className="bg-[#1b1f24] text-white text-[11px] font-mono px-3 py-2 rounded-lg border border-[#30363d] shadow-xl whitespace-nowrap space-y-1">
            <p className="font-bold text-stone-200">
              {hoveredDay.day.attendedCount > 0
                ? `${hoveredDay.day.attendedCount} ${
                    hoveredDay.day.attendedCount === 1 ? 'lecture' : 'lectures'
                  } attended on ${format(hoveredDay.day.date, 'MMM d, yyyy')}`
                : hoveredDay.day.missedCount > 0
                ? `${hoveredDay.day.missedCount} missed on ${format(hoveredDay.day.date, 'MMM d, yyyy')}`
                : hoveredDay.day.holidayCount > 0
                ? `Holiday on ${format(hoveredDay.day.date, 'MMM d, yyyy')}`
                : `No lectures on ${format(hoveredDay.day.date, 'MMM d, yyyy')}`}
            </p>

            {hoveredDay.day.totalLectures > 0 && (
              <div className="text-[10px] text-[#7d8590] pt-0.5 border-t border-[#30363d] flex gap-2">
                <span>Total: {hoveredDay.day.totalLectures}</span>
                {hoveredDay.day.attendedCount > 0 && (
                  <span className="text-emerald-400">Attended: {hoveredDay.day.attendedCount}</span>
                )}
                {hoveredDay.day.missedCount > 0 && (
                  <span className="text-rose-400">Missed: {hoveredDay.day.missedCount}</span>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
