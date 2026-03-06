import React from 'react';
import { Player, PlayerDBEntry } from '../data/types';
import { getTierName, getTierColor } from '../utils/rank';

interface PlayerCardProps {
  player: Player;
  isEnemy?: boolean;
  dbEntry?: PlayerDBEntry | null;
  onClick?: () => void;
}

const DB_BADGE: Record<string, { label: string; cls: string }> = {
  friend: { label: 'Friend', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
  toxic:  { label: 'Toxic',  cls: 'bg-red-500/20 text-red-400 border-red-500/30' },
  avoid:  { label: 'Avoid',  cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
};

const WEAPON_LABELS: Record<string, string> = {
  phantom: 'PH', vandal: 'VD', operator: 'OP', melee: 'KN',
};

export default function PlayerCard({ player, isEnemy = false, dbEntry, onClick }: PlayerCardProps) {
  const rankName  = getTierName(player.rankTier);
  const rankColor = getTierColor(player.rankTier);
  const peakName  = getTierName(player.peakRankTier);
  const displayName = player.incognito ? '— Incognito —' : player.name;
  const badge = dbEntry ? DB_BADGE[dbEntry.category] : null;

  // ─── Avatar 48px ──────────────────────────────────────────────────────────
  const avatarBlock = (
    <div className="shrink-0 relative">
      <div className="w-[48px] h-[48px] bg-slate-800 rounded flex items-center justify-center border border-slate-700 overflow-hidden">
        {player.agentIconUrl
          ? <img src={player.agentIconUrl} alt={player.agentName} className="w-full h-full object-cover" />
          : <span className="text-[9px] font-bold opacity-40 uppercase">{player.agentName?.slice(0, 3) || '??'}</span>
        }
      </div>
      {player.isLocal && (
        <div className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-accent-cyan border-2 border-card-dark rounded-full" />
      )}
    </div>
  );

  // ─── Name + stats (compact) ────────────────────────────────────────────────
  const nameBlock = (
    <div className={`flex flex-col min-w-0 ${isEnemy ? 'items-end' : ''}`}>
      <div className={`flex items-baseline gap-1 flex-wrap ${isEnemy ? 'flex-row-reverse' : ''}`}>
        <span className="font-bold text-xs leading-tight">{displayName}</span>
        {!player.incognito && player.tag && (
          <span className="text-[8px] opacity-35 font-mono">{player.tag}</span>
        )}
        {player.isLocal && (
          <span className="text-[7px] bg-accent-cyan/20 text-accent-cyan px-1 rounded uppercase font-bold">You</span>
        )}
      </div>

      {/* DB badge */}
      {badge && (
        <div className={`flex items-center gap-1 mt-0.5 ${isEnemy ? 'flex-row-reverse' : ''}`}>
          <span className={`text-[7px] font-bold px-1 py-px rounded border ${badge.cls}`}>{badge.label}</span>
          {dbEntry?.note && (
            <span className="text-[7px] opacity-45 truncate max-w-[90px]">{dbEntry.note}</span>
          )}
        </div>
      )}

      {/* Peak rank */}
      {player.peakRankTier >= 3 && (
        <span className="text-[7px] opacity-30 font-mono mt-px">Peak: {peakName}</span>
      )}

      {/* WR / Games */}
      <div className={`flex gap-2 mt-0.5 ${isEnemy ? 'flex-row-reverse' : ''}`}>
        <div className={`flex flex-col ${isEnemy ? 'items-end' : ''}`}>
          <span className="text-[7px] uppercase opacity-50 font-bold">WR</span>
          <span className={`font-mono text-[9px] font-bold leading-none ${typeof player.wr === 'number' && player.wr > 50 ? 'text-emerald-500' : 'text-primary'}`}>
            {player.wr === 'N/A' ? 'N/A' : `${player.wr}%`}
          </span>
        </div>
        <div className={`flex flex-col ${isEnemy ? 'items-end' : ''}`}>
          <span className="text-[7px] uppercase opacity-50 font-bold">GMS</span>
          <span className="font-mono text-[9px] font-bold leading-none">{player.games}</span>
        </div>
        {player.leaderboard > 0 && (
          <div className={`flex flex-col ${isEnemy ? 'items-end' : ''}`}>
            <span className="text-[7px] uppercase opacity-50 font-bold">LB</span>
            <span className="font-mono text-[9px] font-bold leading-none text-yellow-400">#{player.leaderboard}</span>
          </div>
        )}
      </div>
    </div>
  );

  // ─── RR block (compact) ───────────────────────────────────────────────────
  const rrHistoryBlock = (
    <div className="flex flex-col items-center gap-0.5 min-w-[130px] shrink-0">
      <span className={`text-[9px] font-bold uppercase tracking-wide ${player.rankTier >= 3 ? rankColor : 'text-slate-500'}`}>
        {player.rankTier >= 3 ? rankName : 'Unranked'}
      </span>

      {/* RR bar — always visible */}
      <div className="w-full flex items-center gap-1.5">
        <span className="text-[7px] uppercase opacity-40 font-bold shrink-0">RR</span>
        <div className="flex-1 h-1 bg-slate-700/40 rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-accent-cyan/50 to-accent-cyan transition-all"
            style={{ width: `${Math.min(player.rr, 100)}%` }}
          />
        </div>
        <span className="text-[8px] font-mono font-bold opacity-50 shrink-0 w-6 text-right">{player.rr}</span>
      </div>

      {/* History dots */}
      {player.history.length > 0 && (
        <div className="flex space-x-1 mt-0.5">
          {player.history.map((entry, i) => (
            <div key={i} className="flex flex-col items-center gap-px">
              <div className={`w-2 h-2 rounded-full ${entry.result === 'win' ? 'bg-emerald-500' : 'bg-primary'}`} />
              <span className={`text-[6px] font-mono font-bold leading-none ${entry.result === 'win' ? 'text-emerald-500' : 'text-primary'}`}>
                {entry.result === 'win' ? '+' : ''}{entry.rrChange}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // ─── Weapon skins 2×2 (compact) ───────────────────────────────────────────
  const weaponSkinsBlock = (
    <div className="flex flex-col items-center gap-0.5 flex-1 min-w-0">
      <span className="text-[7px] uppercase opacity-25 font-bold">Skins</span>
      <div className="grid grid-cols-2 gap-1 w-full max-w-[180px]">
        {(['phantom', 'vandal', 'operator', 'melee'] as const).map((wKey) => {
          const skin = player.skins?.[wKey];
          const hasIcon = !!skin?.iconUrl;
          return (
            <div
              key={wKey}
              className="h-9 bg-slate-800/60 rounded border border-slate-700/40 flex flex-col items-center justify-center overflow-hidden"
              title={skin?.name || wKey}
            >
              {hasIcon
                ? <img src={skin!.iconUrl!} alt={skin!.name} className="h-5 w-full object-contain opacity-80 px-0.5"
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                : null
              }
              <span className="text-[6px] font-bold uppercase leading-none" style={{ opacity: hasIcon ? 0.25 : 0.55 }}>
                {skin?.name && !hasIcon
                  ? skin.name.replace(/Standard |standard /g, '').slice(0, 8)
                  : WEAPON_LABELS[wKey]}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );

  return (
    <div
      className={`player-card ${isEnemy ? 'enemy-card' : ''} bg-white dark:bg-card-dark border border-slate-300 dark:border-border-dark px-2.5 py-1.5 flex items-center justify-between gap-2 cursor-pointer`}
      onClick={onClick}
    >
      {isEnemy ? (
        <>
          {rrHistoryBlock}
          {weaponSkinsBlock}
          <div className="flex items-center gap-2 shrink-0">
            {nameBlock}
            {avatarBlock}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2 shrink-0">
            {avatarBlock}
            {nameBlock}
          </div>
          {weaponSkinsBlock}
          {rrHistoryBlock}
        </>
      )}
    </div>
  );
}
