'use client';

import React, { useState, useEffect } from 'react';
import { 
  format, 
  addWeeks, 
  subWeeks, 
  startOfWeek, 
  addDays, 
  isSameDay, 
  isToday 
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Sparkles, 
  Sun, 
  AlertTriangle, 
  CheckCircle2, 
  RefreshCw,
  Zap
} from 'lucide-react';
import LectureCard, { Lecture } from './LectureCard';

export default function WeeklyView() {
  const [currentWeekStart, setCurrentWeekStart] = useState<Date>(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [lectures, setLectures] = useState<Lecture[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
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

      if (data.lectures) {
        setLectures(data.lectures);
      }
    } catch (err) {
      console.error('Failed to fetch lectures', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchOverallHealth = async () => {
    try {
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects && data.subjects.length > 0) {
        let totalCounted = 0;
        let totalAttended = 0;
        let totalBunkable = 0;
        let totalMustAttend = 0;

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
    } catch (e) {}
  };

  useEffect(() => {
    fetchLectures();
    fetchOverallHealth();
  }, [currentWeekStart]);

  const handleStatusChange = async (id: string, nextStatus: Lecture['status']) => {
    // Optimistic UI update
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
    } catch (err) {
      console.error('Failed to update status', err);
      fetchLectures(); // revert on error
    }
  };

  const handleBulkHoliday = async (dayDate: Date) => {
    const formatted = format(dayDate, 'yyyy-MM-dd');
    
    // Optimistic local update
    setLectures((prev) =>
      prev.map((lec) => {
        if (isSameDay(new Date(lec.date), dayDate)) {
          return { ...lec, status: 'HOLIDAY' };
        }
        return lec;
      })
    );

    try {
      await fetch('/api/lectures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ date: formatted }),
      });
      fetchOverallHealth();
    } catch (err) {
      console.error('Failed to set bulk holiday', err);
      fetchLectures();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner & Navigation Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
            <CalendarIcon className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              Weekly Attendance Dashboard
            </h2>
            <p className="text-xs text-gray-400">
              {format(currentWeekStart, 'MMM d')} – {format(addDays(currentWeekStart, 5), 'MMM d, yyyy')}
            </p>
          </div>
        </div>

        {/* Quick Health Summary Pill */}
        <div className="flex items-center gap-3 bg-[#0b0f17]/60 p-2.5 rounded-xl border border-white/10">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
            <Zap className="h-4 w-4 text-cyan-400" />
            <span className="text-xs font-medium text-gray-300">Overall:</span>
            <span className="text-sm font-bold text-white">{overallHealth.percentage}%</span>
          </div>

          {overallHealth.mustAttend > 0 ? (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold">
              <AlertTriangle className="h-3.5 w-3.5" />
              <span>Must Attend: {overallHealth.mustAttend}</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Bunkable: {overallHealth.bunkable} classes</span>
            </div>
          )}
        </div>

        {/* Navigation Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentWeekStart((w) => subWeeks(w, 1))}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            title="Previous Week"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={() => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }))}
            className="px-3.5 py-2 rounded-xl bg-indigo-600/80 hover:bg-indigo-600 border border-indigo-400/30 text-white font-medium text-xs shadow-md shadow-indigo-600/20 transition-all"
          >
            Today
          </button>
          <button
            onClick={() => setCurrentWeekStart((w) => addWeeks(w, 1))}
            className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-gray-300 transition-all"
            title="Next Week"
          >
            <ChevronRight className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Days Grid (Monday - Saturday) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {weekDays.map((dayDate) => {
          const dayName = format(dayDate, 'EEEE');
          const dayNumber = format(dayDate, 'd');
          const isCurrentDay = isToday(dayDate);

          const dayLectures = lectures.filter((lec) =>
            isSameDay(new Date(lec.date), dayDate)
          );

          return (
            <div
              key={dayDate.toISOString()}
              className={`rounded-2xl flex flex-col min-h-[380px] p-3.5 transition-all duration-300 ${
                isCurrentDay
                  ? 'glass-card border-indigo-500/50 shadow-glow'
                  : 'glass-card'
              }`}
            >
              {/* Day Column Header */}
              <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10">
                <div className="flex items-baseline gap-2">
                  <span className={`text-base font-bold ${isCurrentDay ? 'text-cyan-400' : 'text-white'}`}>
                    {dayName.slice(0, 3)}
                  </span>
                  <span className={`text-xs ${isCurrentDay ? 'text-indigo-300 font-semibold' : 'text-gray-400'}`}>
                    {dayNumber} {format(dayDate, 'MMM')}
                  </span>
                </div>

                {/* Day Bulk Action Button */}
                <button
                  onClick={() => handleBulkHoliday(dayDate)}
                  className="p-1.5 rounded-lg bg-white/5 hover:bg-amber-500/20 text-gray-400 hover:text-amber-300 border border-transparent hover:border-amber-500/30 transition-all text-xs"
                  title="Mark full day as Holiday"
                >
                  <Sun className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Day Lectures Stack */}
              <div className="flex-1 space-y-2.5 overflow-y-auto pr-0.5">
                {loading ? (
                  <div className="space-y-2 pt-2">
                    <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                    <div className="h-16 rounded-xl bg-white/5 animate-pulse" />
                  </div>
                ) : dayLectures.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-4 text-gray-500">
                    <span className="text-xs italic">No classes scheduled</span>
                  </div>
                ) : (
                  dayLectures.map((lec) => (
                    <LectureCard
                      key={lec.id}
                      lecture={lec}
                      onStatusChange={handleStatusChange}
                    />
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
