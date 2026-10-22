import React from 'react';

interface AdSlotProps {
  id: 'ad-slot-home' | 'ad-slot-result' | 'ad-slot-images';
  className?: string;
}

export const AdSlot: React.FC<AdSlotProps> = ({ id, className = '' }) => {
  return (
    <div
      id={id}
      data-ad-slot={id}
      className={`w-full max-w-3xl mx-auto rounded-xl border border-dashed border-zinc-800/80 bg-zinc-900/30 p-4 text-center text-xs text-zinc-400 select-none overflow-hidden transition-all ${className}`}
      aria-label="Monetization display container"
    >
      <div className="flex items-center justify-between px-2 mb-1">
        <span className="text-[10px] uppercase font-mono tracking-wider text-zinc-400">Sponsored</span>
        <span className="text-[10px] text-zinc-400">Adsterra Ready</span>
      </div>
      <div className="h-16 md:h-20 flex items-center justify-center rounded-lg bg-zinc-950/40 border border-zinc-800/40 text-zinc-400 text-xs font-mono">
        Responsive Ad Container · 728×90 / 300×250
      </div>
    </div>
  );
};
