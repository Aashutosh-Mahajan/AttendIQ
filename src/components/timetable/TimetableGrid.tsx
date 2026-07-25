'use client';

import React, { useState, useEffect } from 'react';
import { Plus, Trash2, Clock, MapPin, AlertCircle, Check, X } from 'lucide-react';

interface Subject {
  id: string;
  name: string;
  code?: string | null;
  color: string;
}

interface TimetableSlot {
  id: string;
  subjectId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  room?: string | null;
  isActive: boolean;
  subject: Subject;
}

const DAYS = [
  { id: 1, name: 'Monday' },
  { id: 2, name: 'Tuesday' },
  { id: 3, name: 'Wednesday' },
  { id: 4, name: 'Thursday' },
  { id: 5, name: 'Friday' },
  { id: 6, name: 'Saturday' },
];

export default function TimetableGrid() {
  const [slots, setSlots] = useState<TimetableSlot[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedDay, setSelectedDay] = useState(1);
  const [subjectId, setSubjectId] = useState('');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:15');
  const [room, setRoom] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      const [resSlots, resSubj] = await Promise.all([
        fetch('/api/timetable'),
        fetch('/api/subjects'),
      ]);
      const dataSlots = await resSlots.json();
      const dataSubj = await resSubj.json();

      if (dataSlots.slots) setSlots(dataSlots.slots.filter((s: TimetableSlot) => s.isActive));
      if (dataSubj.subjects) {
        setSubjects(dataSubj.subjects);
        if (dataSubj.subjects.length > 0) setSubjectId(dataSubj.subjects[0].id);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleAddSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    try {
      const res = await fetch('/api/timetable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          subjectId,
          dayOfWeek: selectedDay,
          startTime,
          endTime,
          room: room.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error || 'Failed to add slot');
        return;
      }

      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const handleDeactivateSlot = async (id: string) => {
    try {
      await fetch(`/api/timetable?id=${id}`, { method: 'DELETE' });
      setSlots((prev) => prev.filter((s) => s.id !== id));
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl">
        <div>
          <h2 className="text-xl font-bold text-white">Timetable Builder</h2>
          <p className="text-xs text-gray-400">
            Define your weekly recurring class schedule. Updates automatically generate upcoming lectures.
          </p>
        </div>
        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
        >
          <Plus className="h-4 w-4" />
          <span>Add Schedule Slot</span>
        </button>
      </div>

      {/* Grid View */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {DAYS.map((day) => {
          const daySlots = slots.filter((s) => s.dayOfWeek === day.id);

          return (
            <div key={day.id} className="glass-card rounded-2xl p-4 space-y-3 min-h-[350px]">
              <div className="flex items-center justify-between pb-2 border-b border-white/10">
                <span className="font-bold text-sm text-cyan-400">{day.name}</span>
                <span className="text-[11px] font-medium text-gray-400">{daySlots.length} slots</span>
              </div>

              <div className="space-y-2.5">
                {daySlots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-3 rounded-xl bg-[#0b0f17]/70 border border-white/10 relative group hover:border-indigo-500/40 transition-all"
                  >
                    <div
                      className="absolute top-2 left-2 bottom-2 w-1 rounded-full"
                      style={{ backgroundColor: slot.subject?.color || '#6366f1' }}
                    />
                    <div className="pl-3.5 space-y-1">
                      <div className="flex items-start justify-between">
                        <span className="font-semibold text-xs text-white">
                          {slot.subject?.name}
                        </span>
                        <button
                          onClick={() => handleDeactivateSlot(slot.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-500 hover:text-rose-400 transition-all"
                          title="Deactivate slot"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-gray-400">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-500" />
                          {slot.startTime} - {slot.endTime}
                        </span>
                      </div>

                      {slot.room && (
                        <div className="flex items-center gap-1 text-[10px] text-indigo-300">
                          <MapPin className="h-2.5 w-2.5 text-indigo-400" />
                          {slot.room}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Slot Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0f17]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white">Add Timetable Slot</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleAddSlot} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Select Subject</label>
                <select
                  value={subjectId}
                  onChange={(e) => setSubjectId(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {subjects.map((sub) => (
                    <option key={sub.id} value={sub.id}>
                      {sub.name} ({sub.code || 'No code'})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium font-sans">Day of Week</label>
                <select
                  value={selectedDay}
                  onChange={(e) => setSelectedDay(parseInt(e.target.value))}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                >
                  {DAYS.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">Start Time</label>
                  <input
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-gray-400 mb-1 font-medium">End Time</label>
                  <input
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Room / Classroom (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Lab 101 or Room 302"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium shadow-md shadow-indigo-600/30"
                >
                  Save Timetable Slot
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
