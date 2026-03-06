import React, { useState } from 'react';
import { Player, PlayerDBEntry } from '../data/types';
import { getTierName, getTierColor } from '../utils/rank';

interface PlayerProfileProps {
  player: Player;
  isEnemy: boolean;
  mapName?: string;
  mapImage?: string | null;
  matchId?: string;
  existingEntry?: PlayerDBEntry | null;
  onClose: () => void;
  onAddToDB?: (entry: PlayerDBEntry) => void;
  onRemoveFromDB?: (puuid: string) => void;
}

function WeaponSlot({ label, name, iconUrl }: { label: string; name?: string; iconUrl?: string | null }) {
  return (
    <div className="bg-[#1a2332] border border-[#2a3544] rounded-sm h-[60px] flex flex-col items-center justify-center p-1.5 hover:border-[#3a4554] transition-colors overflow-hidden">
      {iconUrl ? (
        <img
          src={iconUrl}
          alt={name || label}
          className="h-7 object-contain opacity-80 mb-0.5"
          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
        />
      ) : null}
      <span className="text-[7px] text-white/50 uppercase tracking-wide font-medium leading-none text-center">
        {name && name !== label ? name.slice(0, 14) : label}
      </span>
    </div>
  );
}

const CATEGORY_STYLES = {
  friend: { label: 'Friend', cls: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', active: 'bg-emerald-500/40 text-emerald-300 border-emerald-400/60' },
  toxic:  { label: 'Toxic',  cls: 'bg-red-500/20 text-red-400 border-red-500/30',             active: 'bg-red-500/40 text-red-300 border-red-400/60' },
  avoid:  { label: 'Avoid',  cls: 'bg-amber-500/20 text-amber-400 border-amber-500/30',       active: 'bg-amber-500/40 text-amber-300 border-amber-400/60' },
};

export default function PlayerProfile({
  player, isEnemy, mapName, mapImage, matchId,
  existingEntry, onClose, onAddToDB, onRemoveFromDB,
}: PlayerProfileProps) {
  const rankName = getTierName(player.rankTier);
  const rankColor = getTierColor(player.rankTier);
  const peakName = getTierName(player.peakRankTier);

  const [dbCategory, setDbCategory] = useState<'friend' | 'toxic' | 'avoid' | null>(
    existingEntry?.category ?? null
  );
  const [dbNote, setDbNote] = useState(existingEntry?.note ?? '');
  const [showDBForm, setShowDBForm] = useState(false);

  const handleSaveToDB = () => {
    if (!dbCategory || !onAddToDB) return;
    onAddToDB({
      puuid: player.puuid,
      name: player.incognito ? 'Incognito' : player.name,
      tag: player.tag,
      category: dbCategory,
      note: dbNote,
      mapName: mapName || 'Unknown',
      mapImage: mapImage || null,
      agentName: player.agentName,
      agentIconUrl: player.agentIconUrl,
      rankName: player.rankTier >= 3 ? rankName : 'Unranked',
      addedAt: Date.now(),
      matchId,
      incognito: player.incognito,
    });
    setShowDBForm(false);
  };

  const statItem = (label: string, value: string | number, color?: string) => (
    <div className="flex flex-col items-center bg-slate-800/50 rounded-lg p-2 border border-slate-700/30">
      <span className="text-[7px] uppercase tracking-wider opacity-40 font-bold">{label}</span>
      <span className={`font-mono text-sm font-bold mt-0.5 ${color || 'text-white'}`}>{value}</span>
    </div>
  );

  const renderSkins = () => {
    const S = 0.7;
    const colW = Math.round(130 * S);
    const gap = Math.round(150 * S);
    const skins = player.skins;

    const hasAnySkin = skins && (skins.phantom || skins.vandal || skins.operator || skins.melee);

    if (!skins && !hasAnySkin) {
      return (
        <div className="text-center py-3 opacity-30">
          <p className="text-xs uppercase tracking-wider font-bold">
            {isEnemy ? 'Loadout not available for enemy players' : 'Loadout loading...'}
          </p>
        </div>
      );
    }

    return (
      <div className="relative w-full" style={{ height: `${Math.round(430 * S)}px` }}>
        {/* SIDEARMS */}
        <div className="absolute flex flex-col gap-1" style={{ left: '0px', top: '0px', width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Sidearms</h4>
          {['Classic','Shorty','Frenzy','Ghost','Sheriff'].map(n => <WeaponSlot key={n} label={n} />)}
        </div>
        {/* SMGs */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap}px`, top: '0px', width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">SMGs</h4>
          {['Stinger','Spectre'].map(n => <WeaponSlot key={n} label={n} />)}
        </div>
        {/* SHOTGUNS */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap}px`, top: `${Math.round(185 * S)}px`, width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Shotguns</h4>
          {['Bucky','Judge'].map(n => <WeaponSlot key={n} label={n} />)}
        </div>
        {/* RIFLES */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap * 2}px`, top: '0px', width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Rifles</h4>
          {[
            { label: 'Phantom', skin: skins?.phantom },
            { label: 'Vandal',  skin: skins?.vandal },
            { label: 'Bulldog', skin: null },
            { label: 'Guardian', skin: null },
          ].map(({ label, skin }) => (
            <WeaponSlot key={label} label={label} name={skin?.name} iconUrl={skin?.iconUrl} />
          ))}
        </div>
        {/* MELEE */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap * 2}px`, top: `${Math.round(335 * S)}px`, width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Melee</h4>
          <WeaponSlot label="Knife" name={skins?.melee?.name} iconUrl={skins?.melee?.iconUrl} />
        </div>
        {/* SNIPER RIFLES */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap * 3}px`, top: '0px', width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Sniper Rifles</h4>
          {[
            { label: 'Operator', skin: skins?.operator },
            { label: 'Marshal',  skin: null },
            { label: 'Outlaw',   skin: null },
          ].map(({ label, skin }) => (
            <WeaponSlot key={label} label={label} name={skin?.name} iconUrl={skin?.iconUrl} />
          ))}
        </div>
        {/* MACHINE GUNS */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap * 3}px`, top: `${Math.round(260 * S)}px`, width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Machine Guns</h4>
          {['Ares','Odin'].map(n => <WeaponSlot key={n} label={n} />)}
        </div>
        {/* PLAYER CARD placeholder */}
        <div className="absolute flex flex-col gap-1" style={{ left: `${gap * 4}px`, top: '0px', width: `${colW}px` }}>
          <h4 className="text-white text-[8px] uppercase tracking-widest font-bold mb-0.5">Card</h4>
          <div className="bg-[#1a2332] border border-[#2a3544] rounded-sm" style={{ height: `${Math.round(260 * S)}px` }} />
        </div>
      </div>
    );
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="bg-[#0f1923] border border-[#2a3544] rounded-lg w-full max-w-[820px] max-h-[90vh] overflow-y-auto shadow-2xl relative">
          {/* Close button — sticky so it stays visible while scrolling */}
          <div className="sticky top-0 z-50 flex justify-end pointer-events-none">
            <button
              onClick={onClose}
              className="pointer-events-auto m-2 w-7 h-7 bg-[#1a2332]/90 hover:bg-[#2a3544] border border-[#2a3544] rounded flex items-center justify-center text-white/70 hover:text-white transition-colors text-sm shadow-lg"
            >✕</button>
          </div>

          {/* Header with optional map background — pulled up behind sticky close row */}
          <div className="relative overflow-hidden rounded-t-lg -mt-9">
            {mapImage && (
              <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url(${mapImage})` }}>
                <div className="absolute inset-0 bg-gradient-to-b from-[#0f1923]/80 to-[#0f1923]" />
              </div>
            )}
            <div className="relative z-10 p-5 pb-3">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 bg-[#1a2332] rounded-lg border border-[#2a3544] flex items-center justify-center shrink-0 overflow-hidden">
                  {player.agentIconUrl ? (
                    <img src={player.agentIconUrl} alt={player.agentName} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm font-bold opacity-30 uppercase">{player.agentName?.slice(0,3) || '?'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <h2 className="text-lg font-bold text-white">
                      {player.incognito ? '— Incognito —' : (player.name || 'Unknown')}
                    </h2>
                    {!player.incognito && player.tag && (
                      <span className="text-xs opacity-40 font-mono">{player.tag}</span>
                    )}
                    {player.isLocal && (
                      <span className="text-[9px] bg-accent-cyan/20 text-accent-cyan px-1.5 py-0.5 rounded uppercase font-bold">You</span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <div className="flex items-center gap-1 bg-[#1a2332] border border-[#2a3544] rounded px-2 py-0.5">
                      <span className={`text-[9px] font-bold uppercase ${player.rankTier >= 3 ? rankColor : 'text-slate-500'}`}>
                        {player.rankTier >= 3 ? rankName : 'Unranked'}
                      </span>
                      {player.rankTier >= 3 && (
                        <span className="text-[8px] font-mono text-accent-cyan/70 ml-1">{player.rr} RR</span>
                      )}
                    </div>
                    {player.peakRankTier >= 3 && (
                      <div className="flex items-center gap-1 bg-amber-900/20 border border-amber-700/30 rounded px-2 py-0.5">
                        <span className="text-[8px] font-bold text-amber-400/70 uppercase">Peak: {peakName}</span>
                      </div>
                    )}
                    {player.accountLevel > 0 && (
                      <span className="text-[8px] opacity-40 font-mono">Lv. {player.accountLevel}</span>
                    )}
                    {player.leaderboard > 0 && (
                      <span className="text-[8px] font-bold text-yellow-400">LB #{player.leaderboard}</span>
                    )}
                    {mapName && (
                      <span className="text-[8px] opacity-30 font-mono">{mapName}</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-5 pt-3">
            {/* Stats grid */}
            <div className="grid grid-cols-4 gap-1.5 mb-3">
              {statItem('Games', player.games)}
              {statItem('WR', player.wr === 'N/A' ? 'N/A' : `${player.wr}%`,
                typeof player.wr === 'number' && player.wr > 50 ? 'text-emerald-500' : 'text-primary')}
              {statItem('RR', player.rankTier >= 3 ? player.rr : '—', 'text-accent-cyan')}
              {statItem('Agent', player.agentName || '—')}
            </div>

            {/* KDA (for history/past match players) */}
            {(player.kills !== undefined || player.deaths !== undefined) && (
              <div className="grid grid-cols-3 gap-1.5 mb-3">
                {statItem('Kills', player.kills ?? 0, 'text-emerald-400')}
                {statItem('Deaths', player.deaths ?? 0, 'text-primary')}
                {statItem('Assists', player.assists ?? 0, 'text-yellow-400')}
              </div>
            )}

            {/* Recent matches */}
            {player.history.length > 0 && (
              <div className="mb-3">
                <h3 className="text-[8px] uppercase tracking-widest opacity-40 font-bold mb-1">Recent Matches</h3>
                <div className="flex gap-1">
                  {player.history.map((entry, i) => (
                    <div
                      key={i}
                      className={`flex-1 rounded p-1 text-center border ${entry.result === 'win' ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-primary/10 border-primary/20'}`}
                    >
                      <div className={`text-[8px] font-bold uppercase ${entry.result === 'win' ? 'text-emerald-500' : 'text-primary'}`}>
                        {entry.result === 'win' ? 'W' : 'L'}
                      </div>
                      <div className={`text-[9px] font-mono font-bold ${entry.result === 'win' ? 'text-emerald-400' : 'text-primary'}`}>
                        {entry.result === 'win' ? '+' : '-'}{entry.rrChange}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add to DB section */}
            {onAddToDB && !player.isLocal && (
              <div className="mb-3">
                {existingEntry ? (
                  <div className="flex items-center gap-2 p-2.5 bg-[#1a2332] border border-[#2a3544] rounded-lg">
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded border ${CATEGORY_STYLES[existingEntry.category].cls}`}>
                      {CATEGORY_STYLES[existingEntry.category].label}
                    </span>
                    {existingEntry.note && (
                      <span className="text-[9px] opacity-50 flex-1 truncate">{existingEntry.note}</span>
                    )}
                    <button
                      onClick={() => setShowDBForm(true)}
                      className="text-[8px] uppercase font-bold opacity-40 hover:opacity-70 transition-opacity ml-auto"
                    >Edit</button>
                    {onRemoveFromDB && (
                      <button
                        onClick={() => { onRemoveFromDB(player.puuid); onClose(); }}
                        className="text-[8px] uppercase font-bold text-primary/50 hover:text-primary transition-colors"
                      >Remove</button>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => setShowDBForm(v => !v)}
                    className="w-full text-[9px] uppercase font-bold tracking-wider px-3 py-2 bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan rounded hover:bg-accent-cyan/20 transition-colors"
                  >
                    + Add to Players Database
                  </button>
                )}

                {showDBForm && (
                  <div className="mt-2 p-3 bg-[#1a2332] border border-[#2a3544] rounded-lg space-y-2">
                    <div className="flex gap-2">
                      {(Object.entries(CATEGORY_STYLES) as [string, typeof CATEGORY_STYLES['friend']][]).map(([key, style]) => (
                        <button
                          key={key}
                          onClick={() => setDbCategory(key as 'friend' | 'toxic' | 'avoid')}
                          className={`flex-1 text-[9px] uppercase font-bold px-2 py-1.5 rounded border transition-colors ${dbCategory === key ? style.active : style.cls}`}
                        >
                          {style.label}
                        </button>
                      ))}
                    </div>
                    <input
                      type="text"
                      placeholder="Note (optional)..."
                      value={dbNote}
                      onChange={e => setDbNote(e.target.value)}
                      className="w-full bg-[#0f1923] border border-[#2a3544] rounded px-2.5 py-1.5 text-xs text-white placeholder-white/20 focus:outline-none focus:border-accent-cyan/40"
                    />
                    <button
                      onClick={handleSaveToDB}
                      disabled={!dbCategory}
                      className="w-full text-[9px] uppercase font-bold tracking-wider px-3 py-1.5 bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan rounded hover:bg-accent-cyan/30 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    >
                      Save to Database
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Loadout section */}
          <div className="border-t border-[#2a3544] p-5 bg-[#0a0e14]/50">
            <h3 className="text-[9px] uppercase tracking-widest font-bold text-white/60 mb-3 flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-accent-cyan rounded-full" />
              Loadout
            </h3>
            {renderSkins()}
          </div>
        </div>
      </div>
    </>
  );
}
