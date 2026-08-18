'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';

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
  const displayTime = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  return (
    <div className="hidden sm:flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.08]">
      {/* Precision Analog Ink Dial */}
      <div className="relative h-8 w-8 rounded-full border border-white/20 bg-paper-900 shadow-paper-inset flex items-center justify-center">
        {/* 12, 3, 6, 9 ticks */}
        {[0, 90, 180, 270].map((angle) => (
          <span
            key={angle}
            className="absolute left-1/2 top-0.5 h-1 w-px bg-white/40 -translate-x-1/2 origin-[50%_15px]"
            style={{ transform: `rotate(${angle}deg)` }}
          />
        ))}
        {/* Hour Hand */}
        <span
          className="absolute left-1/2 bottom-1/2 h-2.5 w-0.5 rounded-full bg-white origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${hourAngle}deg)` }}
        />
        {/* Minute Hand */}
        <span
          className="absolute left-1/2 bottom-1/2 h-3.5 w-px rounded-full bg-stone-300 origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${minuteAngle}deg)` }}
        />
        {/* Second Hand */}
        <span
          className="absolute left-1/2 bottom-1/2 h-3.5 w-px bg-orange-400 origin-bottom"
          style={{ transform: `translateX(-50%) rotate(${secondAngle}deg)` }}
        />
        {/* Center Pivot */}
        <span className="absolute left-1/2 top-1/2 h-1 w-1 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-400" />
      </div>

      <div>
        <p className="text-[9px] font-mono uppercase tracking-widest text-paper-400 leading-none">Local Time</p>
        <p className="text-xs font-mono font-bold text-white tabular-nums tracking-tight mt-0.5">{displayTime}</p>
      </div>
    </div>
  );
}
