import React from 'react';

interface MatchHeaderProps {
  mapName?: string;
  mapImage?: string | null;
  gameMode?: string;
  isPregame?: boolean;
}

export default function MatchHeader({ mapName = 'Loading...', mapImage, gameMode = 'Competitive', isPregame = false }: MatchHeaderProps) {
  return (
    <header className="relative overflow-hidden" style={{ minHeight: '60px' }}>
      {/* Map background image */}
      {mapImage && (
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{ backgroundImage: `url('${mapImage.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')` }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0e14]/95 via-[#0a0e14]/80 to-[#0a0e14]/95" />
        </div>
      )}
      {!mapImage && (
        <div className="absolute inset-0 bg-[#0a0e14]" />
      )}

      <div className="relative z-10 px-6 md:px-8 py-3 flex items-center justify-between">
        {/* Map name + mode */}
        <div>
          <h1 className="text-2xl font-black italic uppercase tracking-widest text-white leading-none drop-shadow-lg">
            {mapName}
          </h1>
          <p className="text-[10px] font-mono uppercase opacity-50 tracking-[0.2em] mt-0.5">{gameMode}</p>
        </div>

        {/* Status badge */}
        <div className="flex flex-col items-center">
          {isPregame ? (
            <div className="flex items-center bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded border border-amber-500/20">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full mr-2 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Agent Select</span>
            </div>
          ) : (
            <div className="flex items-center bg-emerald-500/10 text-emerald-400 px-4 py-1.5 rounded border border-emerald-500/20">
              <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full mr-2 animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest">Live Match</span>
            </div>
          )}
        </div>

        <div className="text-right">
          <div className="text-[10px] font-mono uppercase opacity-40 tracking-wider">traopd1 Tracker</div>
        </div>
      </div>
    </header>
  );
}
