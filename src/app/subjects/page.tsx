'use client';

import Link from 'next/link';
import { useEffect, useState, useMemo } from 'react';
import {
  AlertCircle,
  BookOpen,
  Plus,
  X,
  ArrowRight,
  Search,
  SlidersHorizontal,
  Flame,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  TrendingUp,
  ShieldCheck,
  ShieldAlert,
  HelpCircle,
} from 'lucide-react';
import BunkCalculatorCard from '@/components/subject/BunkCalculatorCard';
import { fetchJson, invalidateCache } from '@/lib/api-client';

interface SubjectData {
  id: string;
  name: string;
  code?: string | null;
  color: string;
  targetPercentage: number;
  stats: any;
}

const COLORS = [
  '#3b82f6', // Blue
  '#10b981', // Emerald
  '#f59e0b', // Amber
  '#ec4899', // Pink
  '#8b5cf6', // Purple
  '#06b6d4', // Cyan
  '#f97316', // Orange
  '#6366f1', // Indigo
];

const TARGET_PRESETS = [70, 75, 80, 85];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSemester, setHasSemester] = useState<boolean | null>(null);

  // Search, Filter & Sort State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'SAFE' | 'WARNING' | 'CRITICAL'>('ALL');
  const [sortBy, setSortBy] = useState<'NAME' | 'ATTENDANCE_ASC' | 'ATTENDANCE_DESC' | 'BUNKS_DESC'>('NAME');

  // Modal State
  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<SubjectData | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [target, setTarget] = useState('75');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const load = async (forceRefresh = false) => {
    try {
      setLoading(true);
      const [subjectData, termData] = await Promise.all([
        fetchJson('/api/subjects', { forceRefresh, ttl: 15000, swr: true }),
        fetchJson('/api/semesters', { forceRefresh, ttl: 30000, swr: true }),
      ]);
      setSubjects(subjectData.subjects ?? []);
      setHasSemester(Boolean(termData.activeSemester));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // Summary Metrics Computation
  const overallStats = useMemo(() => {
    if (!subjects.length) {
      return {
        totalSubjects: 0,
        overallPct: 100,
        totalBunks: 0,
        criticalCount: 0,
        warningCount: 0,
        safeCount: 0,
        totalHeld: 0,
        totalAttended: 0,
      };
    }

    let totalAttended = 0;
    let totalHeld = 0;
    let totalBunks = 0;
    let criticalCount = 0;
    let warningCount = 0;
    let safeCount = 0;

    for (const sub of subjects) {
      if (sub.stats) {
        totalAttended += sub.stats.attendedCount;
        totalHeld += sub.stats.countedLectures;
        totalBunks += sub.stats.bunkableClasses;

        if (sub.stats.status === 'CRITICAL') criticalCount++;
        else if (sub.stats.status === 'WARNING') warningCount++;
        else safeCount++;
      }
    }

    const overallPct = totalHeld > 0 ? Math.round((totalAttended / totalHeld) * 1000) / 10 : 100;

    return {
      totalSubjects: subjects.length,
      overallPct,
      totalBunks,
      criticalCount,
      warningCount,
      safeCount,
      totalHeld,
      totalAttended,
    };
  }, [subjects]);

  // Filter and Sort Subjects
  const filteredSubjects = useMemo(() => {
    return subjects
      .filter((sub) => {
        // Search filter
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchesName = sub.name.toLowerCase().includes(q);
          const matchesCode = sub.code ? sub.code.toLowerCase().includes(q) : false;
          if (!matchesName && !matchesCode) return false;
        }

        // Status tab filter
        if (statusFilter === 'SAFE') return sub.stats?.status === 'SAFE';
        if (statusFilter === 'WARNING') return sub.stats?.status === 'WARNING';
        if (statusFilter === 'CRITICAL') return sub.stats?.status === 'CRITICAL';
        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'ATTENDANCE_ASC') {
          return (a.stats?.percentage ?? 0) - (b.stats?.percentage ?? 0);
        }
        if (sortBy === 'ATTENDANCE_DESC') {
          return (b.stats?.percentage ?? 0) - (a.stats?.percentage ?? 0);
        }
        if (sortBy === 'BUNKS_DESC') {
          return (b.stats?.bunkableClasses ?? 0) - (a.stats?.bunkableClasses ?? 0);
        }
        return a.name.localeCompare(b.name);
      });
  }, [subjects, searchQuery, statusFilter, sortBy]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setCode('');
    setColor(COLORS[0]);
    setTarget('75');
    setError('');
    setModal('add');
  };

  const openEdit = (subject: SubjectData) => {
    setEditing(subject);
    setName(subject.name);
    setCode(subject.code ?? '');
    setColor(subject.color);
    setTarget(String(subject.targetPercentage));
    setError('');
    setModal('edit');
  };

  const save = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      setSaving(true);
      invalidateCache('/api/subjects');
      invalidateCache('/api/lectures');
      const response = await fetch('/api/subjects', {
        method: modal === 'edit' ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: editing?.id, name, code, color, targetPercentage: target }),
      });
      const result = await response.json();
      if (!response.ok) {
        setError(result.error ?? 'Unable to save subject.');
        return;
      }
      setModal(null);
      await load(true);
    } catch {
      setError('Failed to save subject.');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (subject: SubjectData) => {
    if (!window.confirm(`Delete ${subject.name} and its lecture history? This cannot be undone.`)) return;
    try {
      invalidateCache('/api/subjects');
      invalidateCache('/api/lectures');
      const response = await fetch(`/api/subjects?id=${subject.id}`, { method: 'DELETE' });
      if (response.ok) await load(true);
      else {
        const result = await response.json();
        window.alert(result.error ?? 'Unable to delete subject.');
      }
    } catch {
      window.alert('Failed to delete subject.');
    }
  };

  return (
    <div className="space-y-6">
      {/* ── Page Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.08] pb-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">Courses & Safe Skip Margins</h1>
            <span className="px-2 py-0.5 rounded font-mono text-[10px] font-semibold bg-white/[0.06] border border-white/10 text-paper-300 uppercase tracking-wider">
              {subjects.length} Total
            </span>
          </div>
          <p className="text-xs text-paper-400 font-light mt-0.5">
            Manage attendance targets, track safe skips, and simulate recovery requirements.
          </p>
        </div>

        {hasSemester && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all hover:-translate-y-0.5 self-start sm:self-auto shrink-0"
          >
            <Plus className="h-4 w-4" />
            Add Course
          </button>
        )}
      </div>

      {/* ── Summary KPI Dashboard Ribbon ── */}
      {hasSemester && subjects.length > 0 && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
          {/* Overall Attendance Card */}
          <div className="paper-card p-4 rounded-2xl border border-white/[0.08] relative overflow-hidden space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400">
              <span>Overall Rate</span>
              <TrendingUp className="h-3.5 w-3.5 text-stone-300" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                overallStats.overallPct >= 75 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                {overallStats.overallPct}%
              </span>
              <span className="text-[10px] font-mono text-paper-400">
                ({overallStats.totalAttended}/{overallStats.totalHeld})
              </span>
            </div>
            <p className="text-[11px] text-paper-400 font-light truncate">
              Across all registered courses
            </p>
          </div>

          {/* Safe Skips in Bank */}
          <div className="paper-card p-4 rounded-2xl border border-white/[0.08] relative overflow-hidden space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400">
              <span>Safe Skip Bank</span>
              <Flame className="h-3.5 w-3.5 text-orange-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-black font-mono tracking-tight text-orange-300">
                {overallStats.totalBunks} {overallStats.totalBunks === 1 ? 'Class' : 'Classes'}
              </span>
            </div>
            <p className="text-[11px] text-paper-400 font-light truncate">
              Allowable skips without dropping target
            </p>
          </div>

          {/* Critical Alerts */}
          <div className="paper-card p-4 rounded-2xl border border-white/[0.08] relative overflow-hidden space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400">
              <span>Action Required</span>
              <AlertTriangle className="h-3.5 w-3.5 text-rose-400" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className={`text-2xl font-black font-mono tracking-tight ${
                overallStats.criticalCount > 0 ? 'text-rose-400' : 'text-emerald-400'
              }`}>
                {overallStats.criticalCount} {overallStats.criticalCount === 1 ? 'Course' : 'Courses'}
              </span>
            </div>
            <p className="text-[11px] text-paper-400 font-light truncate">
              {overallStats.criticalCount > 0 ? 'Currently below target threshold' : 'All courses in safe standing'}
            </p>
          </div>

          {/* Standing Distribution */}
          <div className="paper-card p-4 rounded-2xl border border-white/[0.08] relative overflow-hidden space-y-1">
            <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-paper-400">
              <span>Standing Health</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            </div>
            <div className="flex items-center gap-1.5 pt-1">
              <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/25">
                {overallStats.safeCount} Safe
              </span>
              {overallStats.warningCount > 0 && (
                <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-amber-500/15 text-amber-300 border border-amber-500/25">
                  {overallStats.warningCount} Edge
                </span>
              )}
              {overallStats.criticalCount > 0 && (
                <span className="px-2 py-0.5 rounded-md font-mono text-xs font-bold bg-rose-500/15 text-rose-300 border border-rose-500/25">
                  {overallStats.criticalCount} Alert
                </span>
              )}
            </div>
            <p className="text-[11px] text-paper-400 font-light pt-0.5">
              {overallStats.safeCount}/{overallStats.totalSubjects} courses on target
            </p>
          </div>
        </div>
      )}

      {/* ── Search, Filter Tabs & Sort Controls ── */}
      {hasSemester && subjects.length > 0 && (
        <div className="paper-card p-3.5 rounded-2xl border border-white/[0.08] flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-paper-400" />
            <input
              type="text"
              placeholder="Search courses by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 text-xs focus:outline-none focus:border-white/30 transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-paper-400 hover:text-white p-0.5"
              >
                <X className="h-3 w-3" />
              </button>
            )}
          </div>

          {/* Filter Pills & Sort */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="flex items-center p-0.5 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono">
              <button
                onClick={() => setStatusFilter('ALL')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'ALL'
                    ? 'bg-white text-paper-950 font-bold shadow-paper-sm'
                    : 'text-paper-400 hover:text-white'
                }`}
              >
                All ({subjects.length})
              </button>
              <button
                onClick={() => setStatusFilter('SAFE')}
                className={`px-3 py-1.5 rounded-lg transition-all ${
                  statusFilter === 'SAFE'
                    ? 'bg-emerald-500 text-white font-bold shadow-paper-sm'
                    : 'text-paper-400 hover:text-emerald-300'
                }`}
              >
                Safe ({overallStats.safeCount})
              </button>
              {overallStats.warningCount > 0 && (
                <button
                  onClick={() => setStatusFilter('WARNING')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'WARNING'
                      ? 'bg-amber-500 text-white font-bold shadow-paper-sm'
                      : 'text-paper-400 hover:text-amber-300'
                  }`}
                >
                  On Edge ({overallStats.warningCount})
                </button>
              )}
              {overallStats.criticalCount > 0 && (
                <button
                  onClick={() => setStatusFilter('CRITICAL')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    statusFilter === 'CRITICAL'
                      ? 'bg-rose-500 text-white font-bold shadow-paper-sm'
                      : 'text-paper-400 hover:text-rose-300'
                  }`}
                >
                  Alert ({overallStats.criticalCount})
                </button>
              )}
            </div>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-2 rounded-xl bg-white/[0.03] border border-white/10 text-xs font-mono text-paper-300 focus:outline-none focus:border-white/30 transition-colors"
            >
              <option value="NAME" className="bg-paper-950 text-white">Sort: Course Name (A-Z)</option>
              <option value="ATTENDANCE_ASC" className="bg-paper-950 text-white">Sort: Lowest Attendance</option>
              <option value="ATTENDANCE_DESC" className="bg-paper-950 text-white">Sort: Highest Attendance</option>
              <option value="BUNKS_DESC" className="bg-paper-950 text-white">Sort: Most Safe Skips</option>
            </select>
          </div>
        </div>
      )}

      {/* ── Courses Grid ── */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="h-56 rounded-2xl paper-card border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : !hasSemester ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-paper-300 shadow-paper-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create an Academic Term First</h3>
            <p className="text-xs text-paper-400 mt-1 font-light leading-relaxed">
              Courses belong to an active semester so their attendance percentages and skip margins remain synchronized with your academic term.
            </p>
          </div>
          <Link
            href="/timetable"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            Go to Timetable Builder
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : subjects.length === 0 ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="h-12 w-12 rounded-2xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-paper-300 shadow-paper-sm">
            <BookOpen className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No Courses Added Yet</h3>
            <p className="text-xs text-paper-400 mt-1 font-light leading-relaxed">
              Add your courses here to start tracking attendance target thresholds, safe skip margins, and bunk buffers.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Course
          </button>
        </div>
      ) : filteredSubjects.length === 0 ? (
        <div className="paper-card rounded-2xl p-10 text-center border border-white/10 space-y-3 max-w-md mx-auto">
          <Search className="h-8 w-8 text-paper-500 mx-auto" />
          <h4 className="text-sm font-bold text-white">No Matching Courses</h4>
          <p className="text-xs text-paper-400">
            No courses found matching &ldquo;{searchQuery}&rdquo; under the selected filter.
          </p>
          <button
            onClick={() => {
              setSearchQuery('');
              setStatusFilter('ALL');
            }}
            className="text-xs font-mono text-emerald-400 underline hover:text-emerald-300"
          >
            Clear filters
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredSubjects.map((subject) => (
            <BunkCalculatorCard
              key={subject.id}
              subjectName={subject.name}
              code={subject.code}
              color={subject.color}
              stats={subject.stats}
              onEdit={() => openEdit(subject)}
              onDelete={() => remove(subject)}
            />
          ))}
        </div>
      )}

      {/* ── Add / Edit Course Modal ── */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-paper-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card rounded-2xl max-w-md w-full p-6 border border-white/15 shadow-paper-lg space-y-5 animate-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Course Configuration</p>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {modal === 'edit' ? 'Edit Course' : 'Add New Course'}
                </h3>
              </div>
              <button
                onClick={() => setModal(null)}
                className="p-1 rounded-lg text-paper-400 hover:text-white"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={save} className="space-y-4 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1.5">
                  Course Name *
                </label>
                <input
                  required
                  placeholder="e.g. Machine Learning Lab"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-500 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1.5">
                  Course Code (Optional)
                </label>
                <input
                  placeholder="e.g. CS-402"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-500 focus:outline-none focus:border-white/30 text-xs font-mono uppercase"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-[11px] font-mono text-paper-400 uppercase tracking-wider">
                    Target Attendance Threshold (%)
                  </label>
                  <span className="font-mono text-xs font-bold text-white">{target}%</span>
                </div>

                {/* Preset Chips */}
                <div className="flex gap-1.5 mb-2">
                  {TARGET_PRESETS.map((preset) => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setTarget(String(preset))}
                      className={`flex-1 py-1 rounded-lg text-[10px] font-mono border transition-all ${
                        target === String(preset)
                          ? 'bg-white text-paper-950 font-bold border-white shadow-paper-sm'
                          : 'bg-white/[0.03] border-white/10 text-paper-400 hover:text-white hover:bg-white/5'
                      }`}
                    >
                      {preset}%
                    </button>
                  ))}
                </div>

                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-500 focus:outline-none focus:border-white/30 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-2">
                  Ink Color Accent
                </label>
                <div className="flex gap-2.5 flex-wrap">
                  {COLORS.map((value) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setColor(value)}
                      className={`h-7 w-7 rounded-full transition-transform relative ${
                        color === value ? 'ring-2 ring-white ring-offset-2 ring-offset-paper-950 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: value }}
                      aria-label={`Select color ${value}`}
                    />
                  ))}
                </div>
              </div>

              {/* Live Preview Pill */}
              <div className="p-3 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-between">
                <span className="text-[10px] font-mono text-paper-400 uppercase">Live Preview</span>
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: color }} />
                  <span className="font-bold text-xs text-white truncate max-w-[160px]">
                    {name.trim() || 'Course Name'}
                  </span>
                  {code.trim() && (
                    <span className="text-[9px] font-mono px-1.5 py-0.2 rounded bg-white/5 text-paper-400">
                      {code.trim()}
                    </span>
                  )}
                  <span className="text-[10px] font-mono text-emerald-400 font-semibold">
                    {target}%
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-paper-300 text-xs font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  disabled={saving}
                  className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm transition-all"
                >
                  {saving ? 'Saving...' : modal === 'edit' ? 'Save Changes' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
