'use client';

import React, { useState, useEffect } from 'react';
import BunkCalculatorCard from '@/components/subject/BunkCalculatorCard';
import { Plus, BookOpen, X, AlertCircle } from 'lucide-react';

interface SubjectData {
  id: string;
  name: string;
  code?: string | null;
  color: string;
  targetPercentage: number;
  stats: any;
}

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState('#6366f1');
  const [targetPercentage, setTargetPercentage] = useState('75');
  const [errorMsg, setErrorMsg] = useState('');

  const fetchSubjects = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/subjects');
      const data = await res.json();
      if (data.subjects) setSubjects(data.subjects);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjects();
  }, []);

  const handleAddSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!name.trim()) {
      setErrorMsg('Subject name is required');
      return;
    }

    try {
      const res = await fetch('/api/subjects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          code: code.trim() || undefined,
          color,
          targetPercentage,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        setErrorMsg(errData.error || 'Failed to add subject');
        return;
      }

      setName('');
      setCode('');
      setIsModalOpen(false);
      fetchSubjects();
    } catch (err: any) {
      setErrorMsg(err.message);
    }
  };

  const presetColors = [
    '#6366f1', '#06b6d4', '#10b981', '#f59e0b', 
    '#ec4899', '#8b5cf6', '#ef4444', '#3b82f6'
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 glass-card p-5 rounded-2xl">
        <div className="flex items-center gap-4">
          <div className="h-12 w-12 rounded-xl bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Subjects & Live Bunk Engine</h2>
            <p className="text-xs text-gray-400">
              Manage target attendance percentages and view real-time skip vs must-attend metrics.
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            setErrorMsg('');
            setIsModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-lg shadow-indigo-600/30 transition-all border border-indigo-400/30"
        >
          <Plus className="h-4 w-4" />
          <span>Add New Subject</span>
        </button>
      </div>

      {/* Subject Cards Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div className="h-56 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-56 rounded-2xl bg-white/5 animate-pulse" />
          <div className="h-56 rounded-2xl bg-white/5 animate-pulse" />
        </div>
      ) : subjects.length === 0 ? (
        <div className="glass-card rounded-2xl p-16 text-center space-y-4">
          <div className="h-16 w-16 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <BookOpen className="h-7 w-7 text-indigo-400" />
          </div>
          <div className="space-y-1">
            <p className="text-base font-semibold text-white">No subjects yet</p>
            <p className="text-xs text-gray-500 max-w-xs mx-auto">
              Start by adding your subjects here, then head to the Timetable Builder to set your weekly schedule.
            </p>
          </div>
          <button
            onClick={() => { setErrorMsg(''); setIsModalOpen(true); }}
            className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-lg shadow-indigo-600/25 transition-all"
          >
            Add Your First Subject
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {subjects.map((sub) => (
            <BunkCalculatorCard
              key={sub.id}
              subjectName={sub.name}
              code={sub.code}
              color={sub.color}
              stats={sub.stats}
            />
          ))}
        </div>
      )}

      {/* Add Subject Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-[#0b0f17]/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-card rounded-2xl max-w-md w-full p-6 border border-white/10 space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <h3 className="font-bold text-lg text-white">Add New Subject</h3>
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

            <form onSubmit={handleAddSubject} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-400 mb-1 font-medium">Subject Name</label>
                <input
                  type="text"
                  placeholder="e.g. Computer Networks"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Subject Code (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. CS304"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Target Attendance %</label>
                <input
                  type="number"
                  min="50"
                  max="100"
                  value={targetPercentage}
                  onChange={(e) => setTargetPercentage(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-gray-400 mb-1 font-medium">Color Badge</label>
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  {presetColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`h-7 w-7 rounded-full border-2 transition-transform ${
                        color === c ? 'border-white scale-110 shadow-lg' : 'border-transparent opacity-80'
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div className="pt-3 flex justify-end gap-2">
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
                  Save Subject
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
