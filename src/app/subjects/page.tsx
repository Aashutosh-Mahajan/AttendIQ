'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { AlertCircle, BookOpen, Plus, X, ArrowRight } from 'lucide-react';
import BunkCalculatorCard from '@/components/subject/BunkCalculatorCard';

interface SubjectData {
  id: string;
  name: string;
  code?: string | null;
  color: string;
  targetPercentage: number;
  stats: any;
}

const COLORS = [
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ec4899',
  '#8b5cf6',
  '#ef4444',
  '#06b6d4',
  '#64748b',
];

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<SubjectData[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasSemester, setHasSemester] = useState<boolean | null>(null);

  const [modal, setModal] = useState<'add' | 'edit' | null>(null);
  const [editing, setEditing] = useState<SubjectData | null>(null);
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [target, setTarget] = useState('75');
  const [error, setError] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      const [subjectRes, termRes] = await Promise.all([fetch('/api/subjects'), fetch('/api/semesters')]);
      const subjectData = await subjectRes.json();
      const termData = await termRes.json();
      setSubjects(subjectData.subjects ?? []);
      setHasSemester(Boolean(termData.activeSemester));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

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
    await load();
  };

  const remove = async (subject: SubjectData) => {
    if (!window.confirm(`Delete ${subject.name} and its lecture history? This cannot be undone.`)) return;
    const response = await fetch(`/api/subjects?id=${subject.id}`, { method: 'DELETE' });
    if (response.ok) await load();
    else {
      const result = await response.json();
      window.alert(result.error ?? 'Unable to delete subject.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 paper-card p-5 rounded-2xl border border-white/10 shadow-paper-sm">
        <div className="flex items-center gap-3.5">
          <div className="h-10 w-10 rounded-xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white shrink-0">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white tracking-tight">Courses & Safe Skip Margins</h2>
            <p className="text-xs text-paper-400 font-light mt-0.5">Manage attendance target thresholds and monitor allowable bunks.</p>
          </div>
        </div>
        {hasSemester && (
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all hover:-translate-y-0.5"
          >
            <Plus className="h-3.5 w-3.5" />
            Add Course
          </button>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="h-48 rounded-2xl paper-card border border-white/5 animate-pulse" />
          ))}
        </div>
      ) : !hasSemester ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-paper-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Create a term first</h3>
            <p className="text-xs text-paper-400 mt-1 font-light leading-relaxed">
              Courses belong to an active semester so their calculations stay tied to your academic calendar.
            </p>
          </div>
          <Link
            href="/timetable"
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            Go to Timetable Builder
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : subjects.length === 0 ? (
        <div className="paper-card rounded-2xl p-12 text-center border border-white/10 space-y-4 max-w-lg mx-auto">
          <div className="h-10 w-10 rounded-xl bg-white/[0.04] border border-white/10 flex items-center justify-center mx-auto text-paper-300">
            <BookOpen className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">No courses registered</h3>
            <p className="text-xs text-paper-400 mt-1 font-light leading-relaxed">
              Add courses here or type course names when building weekly timetable slots.
            </p>
          </div>
          <button
            onClick={openAdd}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs uppercase tracking-wider font-mono shadow-paper-sm transition-all"
          >
            <Plus className="h-3.5 w-3.5" />
            Add First Course
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map((subject) => (
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

      {/* Add / Edit Modal */}
      {modal && (
        <div className="fixed inset-0 z-50 bg-paper-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="paper-card rounded-2xl max-w-md w-full p-6 border border-white/15 shadow-paper-lg space-y-5 animate-in">
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-3">
              <div>
                <p className="text-[10px] font-mono uppercase tracking-widest text-paper-400">Course Settings</p>
                <h3 className="font-bold text-base text-white mt-0.5">
                  {modal === 'edit' ? 'Edit Course' : 'Add Course'}
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
              <div className="p-3 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-200 text-xs flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-orange-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={save} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">
                  Course Name
                </label>
                <input
                  required
                  placeholder="e.g. Data Structures & Algorithms"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">
                  Course Code (Optional)
                </label>
                <input
                  placeholder="e.g. CS-201"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-mono text-paper-400 uppercase tracking-wider mb-1">
                  Target Attendance (%)
                </label>
                <input
                  required
                  type="number"
                  min="1"
                  max="100"
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  className="w-full p-2.5 rounded-xl bg-white/[0.03] border border-white/10 text-white placeholder-paper-400 focus:outline-none focus:border-white/30 text-xs font-mono"
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
                      className={`h-7 w-7 rounded-full transition-transform ${
                        color === value ? 'ring-2 ring-white ring-offset-2 ring-offset-paper-950 scale-110' : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: value }}
                      aria-label={`Select color ${value}`}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-white/[0.08]">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="px-4 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-paper-300 text-xs font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 rounded-xl bg-white hover:bg-stone-200 text-paper-950 font-bold text-xs font-mono uppercase tracking-wider shadow-paper-sm">
                  {modal === 'edit' ? 'Save Changes' : 'Add Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
