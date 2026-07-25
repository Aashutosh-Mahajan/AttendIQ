'use client';

import { useEffect, useState } from 'react';
import { Bell, Check, LockKeyhole, Settings, UserRound } from 'lucide-react';

export default function SettingsPage() {
  const [name, setName] = useState('Student');
  const [email, setEmail] = useState('student@college.edu');
  const [reminders, setReminders] = useState(true);
  const [compactView, setCompactView] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = window.localStorage.getItem('attendiq-settings');
    if (stored) {
      const settings = JSON.parse(stored);
      setName(settings.name ?? 'Student'); setEmail(settings.email ?? 'student@college.edu');
      setReminders(settings.reminders ?? true); setCompactView(settings.compactView ?? false);
    }
  }, []);

  const saveSettings = (event: React.FormEvent) => {
    event.preventDefault();
    window.localStorage.setItem('attendiq-settings', JSON.stringify({ name: name.trim() || 'Student', email, reminders, compactView }));
    setSaved(true); window.setTimeout(() => setSaved(false), 2500);
  };

  return <div className="space-y-6 max-w-4xl">
    <div className="glass-card p-5 rounded-2xl flex items-center gap-4 border border-white/10"><div className="h-12 w-12 rounded-xl bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400"><Settings className="h-6 w-6" /></div><div><h2 className="text-xl font-bold text-white">Settings</h2><p className="text-xs text-gray-400">Manage your profile and everyday app preferences.</p></div></div>
    <form onSubmit={saveSettings} className="space-y-6">
      <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-5"><div className="flex items-center gap-2"><UserRound className="h-4 w-4 text-cyan-400" /><h3 className="font-bold text-white">Profile</h3></div><div className="grid sm:grid-cols-2 gap-4 text-xs"><div><label className="block text-gray-400 mb-1">Display name</label><input value={name} onChange={(event) => setName(event.target.value)} className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500" /></div><div><label className="block text-gray-400 mb-1">Email address</label><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full p-2.5 rounded-xl bg-[#0b0f17] border border-white/10 text-white focus:outline-none focus:border-indigo-500" /></div></div></section>
      <section className="glass-card p-6 rounded-2xl border border-white/10 space-y-4"><div className="flex items-center gap-2"><Bell className="h-4 w-4 text-cyan-400" /><h3 className="font-bold text-white">Preferences</h3></div><label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer"><div><p className="text-sm font-medium text-white">Attendance reminders</p><p className="text-xs text-gray-500 mt-0.5">Keep the weekly attendance checklist visible.</p></div><input type="checkbox" checked={reminders} onChange={(event) => setReminders(event.target.checked)} className="h-4 w-4 accent-indigo-500" /></label><label className="flex items-center justify-between gap-4 p-3 rounded-xl bg-white/[0.03] border border-white/5 cursor-pointer"><div><p className="text-sm font-medium text-white">Compact timetable cards</p><p className="text-xs text-gray-500 mt-0.5">Use denser cards for busy weekly schedules.</p></div><input type="checkbox" checked={compactView} onChange={(event) => setCompactView(event.target.checked)} className="h-4 w-4 accent-indigo-500" /></label></section>
      <section className="glass-card p-5 rounded-2xl border border-white/10 flex gap-3 text-xs text-gray-400"><LockKeyhole className="h-4 w-4 text-indigo-300 shrink-0" /><p>Semester dates and recurring lectures are managed in the Timetable Builder, so Settings stays focused on your account and preferences.</p></section>
      <button className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-xs shadow-md shadow-indigo-600/30">{saved ? <Check className="h-4 w-4" /> : null}{saved ? 'Saved' : 'Save settings'}</button>
    </form>
  </div>;
}
