import React, { useState } from 'react';
import { PlayerDBEntry } from '../data/types';

interface PlayersPageProps {
  players: PlayerDBEntry[];
  onRemove?: (puuid: string) => void;
}

const CATEGORY_STYLES: Record<string, { label: string; cls: string }> = {
  friend: { label: 'Friend', cls: 'bg-emerald-500/20 text-emerald-500 border-emerald-500/30' },
  toxic:  { label: 'Toxic',  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  avoid:  { label: 'Avoid',  cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

export default function PlayersPage({ players, onRemove }: PlayersPageProps) {
  const [filter, setFilter] = useState<'all' | 'friend' | 'toxic' | 'avoid'>('all');
  const [expandedPuuid, setExpandedPuuid] = useState<string | null>(null);

  const filtered = filter === 'all' ? players : players.filter(p => p.category === filter);

  if (players.length === 0) {
    return (
      <div className="p-6 md:px-12">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">group</span>
          Players Database
        </h1>
        <div className="flex items-center justify-center py-16 opacity-30">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">person_search</span>
            <p className="text-xs uppercase tracking-wider font-bold">No players saved yet</p>
            <p className="text-[10px] mt-1 opacity-60">Click on a player in Live Match or History to add them.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:px-12">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-bold uppercase tracking-wider flex items-center gap-2">
          <span className="material-symbols-outlined text-base">group</span>
          Players Database
        </h1>
        <span className="text-[10px] opacity-30 font-mono">{players.length} players</span>
      </div>

      <div className="flex gap-2 mb-4">
        {(['all', 'friend', 'toxic', 'avoid'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`text-[9px] uppercase tracking-wider font-bold px-3 py-1.5 rounded border transition-colors ${
              filter === f
                ? 'bg-accent-cyan/10 text-accent-cyan border-accent-cyan/30'
                : 'bg-slate-800/50 text-white/40 border-slate-700/30 hover:text-white/60'
            }`}
          >
            {f === 'all' ? `All (${players.length})` : `${f} (${players.filter(p => p.category === f).length})`}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-1.5">
        {filtered.map(entry => {
          const style = CATEGORY_STYLES[entry.category];
          const isExpanded = expandedPuuid === entry.puuid;

          return (
            <div
              key={entry.puuid}
              className={`border rounded overflow-hidden transition-all ${
                isExpanded ? 'border-accent-cyan/30' : 'border-border-dark'
              }`}
            >
              {/* Main row */}
              <div
                className="relative overflow-hidden cursor-pointer hover:bg-white/[0.02] transition-colors"
                onClick={() => setExpandedPuuid(isExpanded ? null : entry.puuid)}
              >
                {/* Map image background */}
                {entry.mapImage && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-8"
                    style={{ backgroundImage: `url(${entry.mapImage})`, opacity: 0.06 }}
                  />
                )}
                <div className="relative z-10 flex items-center gap-4 px-4 py-3">
                  {/* Agent icon */}
                  <div className="w-9 h-9 bg-slate-800 rounded-lg border border-slate-700 flex items-center justify-center overflow-hidden shrink-0">
                    {entry.agentIconUrl ? (
                      <img src={entry.agentIconUrl} alt={entry.agentName} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[8px] font-bold opacity-30 uppercase">{entry.agentName?.slice(0, 2)}</span>
                    )}
                  </div>

                  {/* Name + note */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-bold text-sm">{entry.incognito ? '— Incognito —' : entry.name}</span>
                      {!entry.incognito && entry.tag && (
                        <span className="text-[9px] opacity-40 font-mono">{entry.tag}</span>
                      )}
                    </div>
                    {entry.note && (
                      <p className="text-[9px] opacity-50 mt-0.5 truncate">{entry.note}</p>
                    )}
                  </div>

                  {/* Rank */}
                  <span className="text-[10px] font-bold opacity-60 shrink-0">{entry.rankName}</span>

                  {/* Map where added */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {entry.mapImage && (
                      <img
                        src={entry.mapImage}
                        alt={entry.mapName}
                        className="w-10 h-6 object-cover rounded opacity-60"
                      />
                    )}
                    <span className="text-[9px] opacity-40 font-mono hidden sm:block">{entry.mapName}</span>
                  </div>

                  {/* Category badge */}
                  <span className={`text-[8px] uppercase font-bold px-2 py-0.5 rounded border shrink-0 ${style.cls}`}>
                    {style.label}
                  </span>

                  {/* Date */}
                  <span className="text-[9px] opacity-25 font-mono shrink-0 hidden md:block">
                    {new Date(entry.addedAt).toLocaleDateString()}
                  </span>

                  {/* Expand arrow */}
                  <span className={`text-[9px] opacity-30 transition-transform shrink-0 ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>

              {/* Expanded detail */}
              {isExpanded && (
                <div className="border-t border-border-dark bg-[#0a0e14]/60 px-4 py-3 flex items-start gap-4">
                  {/* Map info */}
                  <div className="shrink-0">
                    {entry.mapImage ? (
                      <img
                        src={entry.mapImage}
                        alt={entry.mapName}
                        className="w-24 h-16 object-cover rounded border border-border-dark"
                      />
                    ) : (
                      <div className="w-24 h-16 bg-slate-800 rounded border border-border-dark flex items-center justify-center">
                        <span className="text-[8px] opacity-30 uppercase">No image</span>
                      </div>
                    )}
                    <p className="text-[8px] opacity-40 font-mono mt-1 text-center">{entry.mapName}</p>
                  </div>

                  {/* Details */}
                  <div className="flex-1 space-y-1.5">
                    <div className="grid grid-cols-2 gap-2 text-[9px]">
                      <div>
                        <span className="opacity-40 uppercase font-bold">Agent</span>
                        <p className="font-mono">{entry.agentName || '—'}</p>
                      </div>
                      <div>
                        <span className="opacity-40 uppercase font-bold">Rank</span>
                        <p className="font-mono">{entry.rankName}</p>
                      </div>
                      <div>
                        <span className="opacity-40 uppercase font-bold">Added</span>
                        <p className="font-mono">{new Date(entry.addedAt).toLocaleString()}</p>
                      </div>
                      <div>
                        <span className="opacity-40 uppercase font-bold">Category</span>
                        <span className={`text-[8px] font-bold px-1.5 py-0.5 rounded border ${style.cls}`}>
                          {style.label}
                        </span>
                      </div>
                    </div>
                    {entry.note && (
                      <div>
                        <span className="text-[8px] opacity-40 uppercase font-bold">Note</span>
                        <p className="text-[10px] mt-0.5 opacity-70">{entry.note}</p>
                      </div>
                    )}
                  </div>

                  {/* Remove button */}
                  {onRemove && (
                    <button
                      onClick={() => onRemove(entry.puuid)}
                      className="text-[8px] uppercase font-bold text-primary/40 hover:text-primary border border-primary/20 hover:border-primary/40 px-2.5 py-1.5 rounded transition-colors shrink-0"
                    >
                      Remove
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
