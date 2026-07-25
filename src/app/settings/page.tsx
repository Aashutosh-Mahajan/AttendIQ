'use client';

import React, { useState, useEffect } from 'react';
import { Settings, ShieldCheck, Plus, Check, RefreshCw } from 'lucide-react';

export default function SettingsPage() {
  const [semesters, setSemesters] = useState<any[]>([]);
  const [activeSem, setActiveSem] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // New semester form state
  const [semName, setSemName] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [msg, setMsg] = useState('');

  const fetchSemesters = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/semesters');
      const data = await res.json();
      if (data.semesters) setSemesters(data.semesters);
      if (data.activeSemester) setActiveSem(data.activeSemester);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSemesters();
  }, []);

  const handleCreateSemester = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg('');

    try {
      const res = await fetch('/api/semesters', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: semName,
          startDate,
          endDate,
          makeActive: true,
        }),
      });

      if (res.ok) {
        setMsg('New semester created and activated successfully!');
        setSemName('');
        setStartDate('');
        setEndDate('');
        fetchSemesters();
      }
    } catch (err: any) {
      setMsg(err.message);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/10">
        <div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <Settings className="h-6 w-6" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white">App Settings & Semester Rollover</h2>
          <p className="text-xs text-gray-400">Manage academic terms, default target percentages, and account data</p>
        </div>
      </div>

      {/* Active Semester Card */}
      <div className="glass-card p-6 rounded-2xl border border-indigo-500/30 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-cyan-400 flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4" /> Current Active Semester
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
            ACTIVE
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">{activeSem ? activeSem.name : 'Spring 2026 Semester'}</h3>
        {activeSem && (
          <p className="text-xs text-gray-400">
            {new Date(activeSem.startDate).toLocaleDateString()} — {new Date(activeSem.endDate).toLocaleDateString()}
          </p>
        )}
      </div>

      {/* Create New Semester */}
      <div className="glass-card p-6 rounded-2xl border border-white/10 space-y-4">
        <h3 className="text-base font-bold text-white">Start New Academic Term</h3>

        {msg && (
          <p className="p-3 rounded-xl bg-indigo-500/20 border border-indigo-500/30 text-xs text-indigo-300">
            {msg}
          </p>
        )}

        <form onSubmit={handleCreateSemester} className="space-y-4 text-xs">
          <div>
            <label className="block text-gray-400 mb-1 font-medium">Term / Semester Name</label>
            <input
              type="text"
              placeholder="e.g. Fall 2026 Semester"
              value={semName}
              onChange={(e) => setSemName(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-400 mb-1 font-medium">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>

            <div>
              <label className="block text-gray-400 mb-1 font-medium">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30"
          >
            Create & Activate Semester
          </button>
        </form>
      </div>
    </div>
  );
}
