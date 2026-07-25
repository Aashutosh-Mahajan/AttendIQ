'use client';

import { useEffect, useState } from 'react';
import { AlarmClock } from 'lucide-react';

export default function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const seconds = now.getSeconds();
  const minutes = now.getMinutes();
  const hours = now.getHours() % 12;
  const hourAngle = hours * 30 + minutes * 0.5;
  const minuteAngle = minutes * 6 + seconds * 0.1;
  const secondAngle = seconds * 6;
  const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="hidden sm:flex items-center gap-3 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/10">
      <div className="relative h-10 w-10 rounded-full border-2 border-cyan-400/70 bg-[#0b0f17] shadow-[0_0_18px_-5px_rgba(34,211,238,0.75)]">
        <AlarmClock className="absolute -top-3 -left-1 h-4 w-4 text-indigo-300" />
        <AlarmClock className="absolute -top-3 -right-1 h-4 w-4 text-indigo-300 scale-x-[-1]" />
        {[0, 90, 180, 270].map((angle) => (
          <span key={angle} className="absolute left-1/2 top-0 h-1 w-px bg-cyan-200/80 origin-[0_20px]" style={{ transform: `rotate(${angle}deg)` }} />
        ))}
        <span className="absolute left-1/2 bottom-1/2 h-3.5 w-1 rounded-full bg-white origin-bottom" style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }} />
        <span className="absolute left-1/2 bottom-1/2 h-[17px] w-0.5 rounded-full bg-cyan-300 origin-bottom" style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }} />
        <span className="absolute left-1/2 bottom-1/2 h-[18px] w-px bg-rose-400 origin-bottom transition-transform duration-700 ease-linear" style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }} />
        <span className="absolute left-1/2 top-1/2 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-rose-300" />
      </div>
      <div>
        <p className="text-[10px] font-medium text-gray-500 uppercase tracking-wider">Right now</p>
        <p className="text-sm font-bold text-white tabular-nums">{displayTime}</p>
      </div>
    </div>
  );
}
