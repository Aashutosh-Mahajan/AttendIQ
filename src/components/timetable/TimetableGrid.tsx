'use client';

import React, { useEffect, useState } from 'react';
import { eachDayOfInterval, endOfMonth, format, getDay, isSameDay, isSameMonth, startOfMonth } from 'date-fns';
import { AlertCircle, CalendarDays, Check, Clock, History, MapPin, Pencil, Plus, Trash2, X, ChevronLeft, ChevronRight } from 'lucide-react';
import { fetchJson, invalidateCache } from '@/lib/api-client';

interface Subject { id: string; name: string; color: string }
interface TimetableSlot { id: string; dayOfWeek: number; startTime: string; endTime: string; room?: string | null; isActive: boolean; subject: Subject }
interface Semester { id: string; name: string; startDate: string; endDate: string }
interface TermSummary extends Semester { isActive: boolean; subjectCount: number; attendance: { percentage: number; attendedCount: number; countedLectures: number } }

const DAYS = [
  { id: 1, name: 'Monday', short: 'Mon' },
  { id: 2, name: 'Tuesday', short: 'Tue' },
  { id: 3, name: 'Wednesday', short: 'Wed' },
  { id: 4, name: 'Thursday', short: 'Thu' },
  { id: 5, name: 'Friday', short: 'Fri' },
  { id: 6, name: 'Saturday', short: 'Sat' },
];

function CalendarPicker({ value, onChange, placeholder, minDate }: { value: string; onChange: (value: string) => void; placeholder: string; minDate?: string }) {
  const [open, setOpen] = useState(false);
  const [month, setMonth] = useState(() => value ? new Date(`${value}T00:00:00`) : new Date());
  const first = startOfMonth(month);
  const cells = Array(getDay(first) === 0 ? 6 : getDay(first) - 1).fill(null).concat(eachDayOfInterval({ start: first, end: endOfMonth(month) }));
  const selected = value ? new Date(`${value}T00:00:00`) : null;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/10 text-left text-white text-xs hover:border-white/20 transition-colors"
      >
        <span className={value ? 'text-white font-mono' : 'text-paper-400'}>
          {value ? format(selected!, 'dd MMM yyyy') : placeholder}
        </span>
        <CalendarDays className="h-4 w-4 text-paper-400" />
      </button>

      {open && (
        <div className="absolute z-[70] mt-2 w-72 rounded-2xl paper-card border border-white/15 p-4 shadow-paper-lg animate-in">
          <div className="flex justify-between items-center mb-3 border-b border-white/[0.08] pb-2">
            <button
              type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="p-1 rounded-lg hover:bg-white/10 text-paper-400 hover:text-white"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
              {format(month, 'MMMM yyyy')}
            </span>
            <button
              type="button"
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="p-1 rounded-lg hover:bg-white/10 text-paper-400 hover:text-white"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center font-mono text-[9px] font-semibold text-paper-400 mb-1 uppercase">
            {['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
              <span key={d}>{d}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((day, index) => {
              if (!day) return <span key={index} />;
              const date = format(day, 'yyyy-MM-dd');
              const disabled = Boolean(minDate && date < minDate);
              const isSelected = isSameDay(day, selected ?? new Date(0));
              const isCurrentMonth = isSameMonth(day, month);

              return (
                <button
                  key={date}
                  type="button"
                  disabled={disabled}
                  onClick={() => { onChange(date); setOpen(false); }}
                  className={`h-7 rounded-lg text-xs font-mono transition-all ${
                    disabled
                      ? 'text-paper-600 opacity-40 cursor-not-allowed'
                      : isSelected
                      ? 'bg-white text-paper-950 font-bold shadow-paper-sm'
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
        </div>
      )}
    </div>
  );
}

function ClockTimePicker({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<'hours' | 'minutes'>('hours');
  const [hh, mm] = value.split(':');
  const hour = Number(hh || 0);
  const minute = Number(mm || 0);
  const pm = hour >= 12;
  const shownHour = hour % 12 || 12;

  const choices = mode === 'hours' ? [12, ...Array.from({ length: 11 }, (_, i) => i + 1)] : Array.from({ length: 12 }, (_, i) => i * 5);
  const selected = mode === 'hours' ? shownHour : minute;
  const setTime = (h: number, m: number) => onChange(`${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`);
  const selectHour = (h: number) => { setTime(pm ? (h === 12 ? 12 : h + 12) : (h === 12 ? 0 : h), minute); setMode('minutes'); };
  const angle = mode === 'hours' ? (shownHour % 12) * 30 : minute * 6;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => { setMode('hours'); setOpen(!open); }}
        className="w-full flex justify-between items-center p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white text-xs hover:border-white/20 transition-colors font-mono"
      >
        <span>{String(shownHour).padStart(2, '0')}:{String(minute).padStart(2, '0')} {pm ? 'PM' : 'AM'}</span>
        <Clock className="h-4 w-4 text-paper-400" />
      </button>

      {open && (
        <div className="absolute z-[70] left-1/2 -translate-x-1/2 mt-2 w-[18rem] rounded-2xl paper-card border border-white/15 p-4 shadow-paper-lg animate-in">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
            <div className="flex items-baseline font-mono text-base">
              <button
                type="button"
                onClick={() => setMode('hours')}
                className={`font-bold transition-colors ${mode === 'hours' ? 'text-white' : 'text-paper-500 hover:text-paper-300'}`}
              >
                {String(shownHour).padStart(2, '0')}
              </button>
              <span className="mx-1 text-paper-500">:</span>
              <button
                type="button"
                onClick={() => setMode('minutes')}
                className={`font-bold transition-colors ${mode === 'minutes' ? 'text-white' : 'text-paper-500 hover:text-paper-300'}`}
              >
                {String(minute).padStart(2, '0')}
              </button>
            </div>

            <div className="flex text-[10px] font-mono bg-white/[0.04] p-0.5 rounded-lg border border-white/5">
              <button
                type="button"
                onClick={() => setTime(hour >= 12 ? hour - 12 : hour, minute)}
                className={`px-2.5 py-1 rounded-md font-bold uppercase transition-all ${!pm ? 'bg-white text-paper-950 shadow-paper-sm' : 'text-paper-400 hover:text-white'}`}
              >
                AM
              </button>
              <button
                type="button"
                onClick={() => setTime(hour < 12 ? hour + 12 : hour, minute)}
                className={`px-2.5 py-1 rounded-md font-bold uppercase transition-all ${pm ? 'bg-white text-paper-950 shadow-paper-sm' : 'text-paper-400 hover:text-white'}`}
              >
                PM
              </button>
            </div>
          </div>

          <p className="text-center font-mono text-[10px] uppercase tracking-wider text-paper-400 mt-2.5">
            Select {mode === 'hours' ? 'Hour' : 'Minutes'}
          </p>

          <div className="relative h-52 w-52 mx-auto rounded-full bg-paper-900 border border-white/10 mt-3 shadow-paper-inset">
            {/* Clock Hand */}
            <div
              className="absolute top-1/2 left-1/2 h-[68px] w-0.5 -translate-y-full bg-white origin-bottom"
              style={{ transform: `translateX(-50%) translateY(-100%) rotate(${angle}deg)` }}
            />
            <span className="absolute top-1/2 left-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400" />

            {choices.map((choice, index) => {
              const radians = ((index * 30) - 90) * Math.PI / 180;
              const isSelected = choice === selected;
              return (
                <button
                  key={choice}
                  type="button"
                  onClick={() => mode === 'hours' ? selectHour(choice) : (setTime(hour, choice), setOpen(false))}
                  style={{ left: `${50 + Math.cos(radians) * 38}%`, top: `${50 + Math.sin(radians) * 38}%` }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 h-7 w-7 rounded-full font-mono text-[11px] transition-all flex items-center justify-center ${
                    isSelected
                      ? 'bg-white text-paper-950 font-bold shadow-paper-sm'
                      : 'text-stone-300 hover:bg-white/10'
                  }`}
                >
                  {mode === 'hours' ? choice : String(choice).padStart(2, '0')}
                </button>
              );
            })}
          </div>
          <p className="text-center text-[10px] font-mono text-paper-400 mt-2.5">5-minute steps.</p>
        </div>
      )}
    </div>
  );
}

function TermForm({
  name,
  setName,
  start,
  setStart,
  end,
  setEnd,
  onSubmit,
  error,
  action,
}: {
  name: string;
  setName: (value: string) => void;
  start: string;
  setStart: (value: string) => void;
  end: string;
  setEnd: (value: string) => void;
  onSubmit: (event: React.FormEvent) => void;
  error: string;
  action: string;
}) {
  return (
    <form onSubmit={onSubmit} className="space-y-4 text-xs">
      {error && (
        <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs flex items-center gap-2">
          <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
          <span>{error}</span>
        </div>
      )}
      <div>
        <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Semester Term Name</label>
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
          placeholder="e.g. Fall 2026 / Semester VI"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Start Date</label>
          <CalendarPicker value={start} onChange={setStart} placeholder="Select start date" />
        </div>
        <div>
          <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">End Date</label>
          <CalendarPicker value={end} onChange={setEnd} placeholder="Select end date" minDate={start} />
        </div>
      </div>
      <div className="pt-2">
        <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all">
          <Check className="h-4 w-4" />
          {action}
        </button>
      </div>
    </form>
  );
}

export default function TimetableGrid() {
  const [semester, setSemester] = useState<Semester | null>(null);
  const [terms, setTerms] = useState<TermSummary[]>([]);
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [termModal, setTermModal] = useState<'new' | 'edit' | null>(null);

  const [slotModal, setSlotModal] = useState(false);
  const [editingSlot, setEditingSlot] = useState<TimetableSlot | null>(null);
  const [subject, setSubject] = useState('');
  const [day, setDay] = useState(1);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:15');
  const [room, setRoom] = useState('');
  const [error, setError] = useState('');

  const fetchData = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [termsData, slotsData] = await Promise.all([
        fetchJson('/api/semesters', { forceRefresh, ttl: 30000, swr: true }),
        fetchJson('/api/timetable', { forceRefresh, ttl: 15000, swr: true }),
      ]);
      setSemester(termsData.activeSemester ?? null);
      setTerms(termsData.semesters ?? []);
      setSlots((slotsData.slots ?? []).filter((slot: TimetableSlot) => slot.isActive));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const resetTerm = () => { setName(''); setStart(''); setEnd(''); setError(''); };
  const openNewTerm = () => { resetTerm(); setTermModal('new'); };
  const openEditTerm = () => {
    if (!semester) return;
    setName(semester.name);
    setStart(format(new Date(semester.startDate), 'yyyy-MM-dd'));
    setEnd(format(new Date(semester.endDate), 'yyyy-MM-dd'));
    setError('');
    setTermModal('edit');
  };

  const saveTerm = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      invalidateCache();
      const response = await fetch('/api/semesters', {
        method: termModal === 'edit' ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: semester?.id, name, startDate: start, endDate: end, makeActive: true }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Unable to save the term.');
        return;
      }
      setTermModal(null);
      resetTerm();
      await fetchData(true);
    } catch {
      setError('Failed to save semester term.');
    }
  };

  const openSlot = (slot?: TimetableSlot) => {
    setEditingSlot(slot ?? null);
    setSubject(slot?.subject.name ?? '');
    setDay(slot?.dayOfWeek ?? 1);
    setStartTime(slot?.startTime ?? '09:00');
    setEndTime(slot?.endTime ?? '10:15');
    setRoom(slot?.room ?? '');
    setError('');
    setSlotModal(true);
  };

  const saveSlot = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      invalidateCache();
      const response = await fetch('/api/timetable', {
        method: editingSlot ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editingSlot?.id, subjectName: subject, dayOfWeek: day, startTime, endTime, room }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Unable to save lecture.');
        return;
      }
      setSlotModal(false);
      await fetchData(true);
    } catch {
      setError('Failed to save timetable slot.');
    }
  };

  const removeSlot = async (id: string) => {
    if (!window.confirm('Remove this recurring lecture? Past attendance will be kept.')) return;
    try {
      invalidateCache();
      await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
      await fetchData(true);
    } catch {
      window.alert('Failed to remove slot.');
    }
  };

  if (loading) return <div className="h-80 rounded-2xl paper-card border border-white/5 animate-pulse" />;

  if (!semester) {
    return (
      <div className="max-w-xl mx-auto paper-card p-8 rounded-2xl border border-white/10 shadow-paper-lg space-y-4 animate-in">
        <div className="space-y-1">
          <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Step 1 of 2</p>
          <h2 className="text-xl font-bold text-white tracking-tight">Create your semester term</h2>
          <p className="text-xs text-paper-400 font-light leading-relaxed">
            Set your dates once. Recurring timetable lectures will populate across your entire semester.
          </p>
        </div>
        <TermForm
          name={name}
          setName={setName}
          start={start}
          setStart={setStart}
          end={end}
          setEnd={setEnd}
          onSubmit={saveTerm}
          error={error}
          action="Create semester"
        />
      </div>
    );
  }

  const previousTerms = terms.filter((term) => !term.isActive);

  return (
    <div className="space-y-6">
      {/* Active Term Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 paper-card p-5 rounded-2xl border border-white/10 shadow-paper-sm">
        <div>
          <p className="text-[11px] font-mono text-paper-400 uppercase tracking-wider">
            {semester.name} · {format(new Date(semester.startDate), 'dd MMM yyyy')} – {format(new Date(semester.endDate), 'dd MMM yyyy')}
          </p>
          <h2 className="text-lg font-bold text-white tracking-tight mt-0.5">Recurring Timetable Builder</h2>
          <p className="text-xs text-paper-400 font-light mt-0.5">Lectures repeat weekly on their scheduled days until term end.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={openEditTerm}
            className="px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-paper-300 text-xs font-mono uppercase tracking-wider transition-colors"
          >
            Edit Term Dates
          </button>
          <button
            onClick={openNewTerm}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-paper-300 text-xs font-mono uppercase tracking-wider transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
            New Term
          </button>
          <button
            onClick={() => openSlot()}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Lecture
          </button>
        </div>
      </div>

      {/* 6-Day Timetable Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-3.5">
        {DAYS.map((weekday) => {
          const weekdaySlots = slots.filter((slot) => slot.dayOfWeek === weekday.id);
          return (
            <div
              key={weekday.id}
              className="paper-card rounded-2xl p-3.5 space-y-3 min-h-[300px] border border-white/[0.08]"
            >
              <div className="flex justify-between items-center border-b border-white/[0.08] pb-2">
                <span className="text-xs font-mono font-bold uppercase tracking-wider text-white">
                  {weekday.name}
                </span>
                <span className="text-[10px] font-mono text-paper-400">
                  {weekdaySlots.length} lecture{weekdaySlots.length === 1 ? '' : 's'}
                </span>
              </div>

              <div className="space-y-2">
                {weekdaySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] relative group hover:border-white/20 transition-all overflow-hidden"
                  >
                    <div
                      className="absolute top-0 bottom-0 left-0 w-1 opacity-90"
                      style={{ backgroundColor: slot.subject.color }}
                    />
                    <div className="pl-2 space-y-1">
                      <div className="flex items-start justify-between gap-1">
                        <span className="text-xs font-semibold text-white leading-tight break-words">
                          {slot.subject.name}
                        </span>
                        <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => openSlot(slot)}
                            className="p-1 text-paper-400 hover:text-white"
                            aria-label="Edit slot"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => removeSlot(slot.id)}
                            className="p-1 text-paper-400 hover:text-rose-300"
                            aria-label="Delete slot"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                      <p className="flex items-center gap-1 text-[10px] font-mono text-paper-400">
                        <Clock className="h-3 w-3" />
                        {slot.startTime} – {slot.endTime}
                      </p>
                      {slot.room && (
                        <p className="flex items-center gap-1 text-[9px] font-mono text-stone-300">
                          <MapPin className="h-2.5 w-2.5" />
                          {slot.room}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Previous Terms Archive */}
      <section className="paper-card p-5 rounded-2xl border border-white/10 shadow-paper-sm">
        <div className="flex items-center gap-2 mb-4 border-b border-white/[0.08] pb-3">
          <History className="h-4 w-4 text-paper-400" />
          <div>
            <h3 className="font-bold text-sm text-white">Archived Semester Terms</h3>
            <p className="text-[11px] text-paper-400 font-light">Historical attendance is preserved across terms.</p>
          </div>
        </div>

        {previousTerms.length === 0 ? (
          <p className="text-xs font-mono text-paper-400 py-4">No archived terms found.</p>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {previousTerms.map((term) => (
              <div
                key={term.id}
                className="rounded-xl p-4 bg-white/[0.02] border border-white/[0.06] space-y-2"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 className="text-xs font-bold text-white">{term.name}</h4>
                    <p className="text-[10px] font-mono text-paper-400 mt-0.5">
                      {format(new Date(term.startDate), 'dd MMM yyyy')} – {format(new Date(term.endDate), 'dd MMM yyyy')}
                    </p>
                  </div>
                  <span className="text-sm font-mono font-bold text-white tabular-nums">
                    {term.attendance.percentage}%
                  </span>
                </div>
                <p className="text-[10px] font-mono text-paper-400 pt-1 border-t border-white/5">
                  {term.attendance.attendedCount}/{term.attendance.countedLectures} attended · {term.subjectCount} courses
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Term Modal */}
      {termModal && (
        <div className="fixed inset-0 z-50 bg-paper-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="paper-card rounded-2xl max-w-md w-full p-6 border border-white/15 shadow-paper-lg space-y-4 animate-in">
            <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Academic Calendar</p>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {termModal === 'edit' ? 'Edit Semester Dates' : 'Start New Term'}
                </h3>
              </div>
              <button
                onClick={() => setTermModal(null)}
                className="p-1 rounded-lg text-paper-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <TermForm
              name={name}
              setName={setName}
              start={start}
              setStart={setStart}
              end={end}
              setEnd={setEnd}
              onSubmit={saveTerm}
              error={error}
              action={termModal === 'edit' ? 'Save Term Dates' : 'Start New Term'}
            />
          </div>
        </div>
      )}

      {/* Recurring Slot Modal */}
      {slotModal && (
        <div className="fixed inset-0 z-50 bg-paper-950/80 backdrop-blur-sm flex justify-center items-center p-4">
          <div className="paper-card rounded-2xl max-w-md w-full p-6 border border-white/15 shadow-paper-lg space-y-4 animate-in">
            <div className="flex justify-between items-start border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Lecture Slot</p>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {editingSlot ? 'Edit Recurring Slot' : 'Add Recurring Slot'}
                </h3>
              </div>
              <button
                onClick={() => setSlotModal(false)}
                className="p-1 rounded-lg text-paper-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={saveSlot} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Course Name</label>
                <input
                  required
                  placeholder="e.g. Computer Networks"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Day of the Week</label>
                <select
                  value={day}
                  onChange={(e) => setDay(Number(e.target.value))}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white focus:outline-none focus:border-white/30 text-xs font-mono"
                >
                  {DAYS.map((weekday) => (
                    <option key={weekday.id} value={weekday.id} className="bg-paper-900 text-white">
                      {weekday.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Start Time</label>
                  <ClockTimePicker value={startTime} onChange={setStartTime} />
                </div>
                <div>
                  <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">End Time</label>
                  <ClockTimePicker value={endTime} onChange={setEndTime} />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">Room / Hall (Optional)</label>
                <input
                  placeholder="e.g. Hall B-102"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-3 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setSlotModal(false)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-paper-300 text-xs font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm">
                  {editingSlot ? 'Save Changes' : 'Add Lecture'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
