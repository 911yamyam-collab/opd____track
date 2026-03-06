import React, { useState } from 'react';
import { MatchHistoryEntry, LiveMatchData, Player, PlayerDBEntry } from '../data/types';
import PlayerCard from './PlayerCard';
import PlayerProfile from './PlayerProfile';

interface HistoryPageProps {
  matches: MatchHistoryEntry[];
  fetchMatchPlayers?: (matchId: string) => Promise<LiveMatchData | null>;
  dbEntries?: PlayerDBEntry[];
  onAddToDB?: (entry: PlayerDBEntry) => void;
  onRemoveFromDB?: (puuid: string) => void;
}

export default function HistoryPage({ matches, fetchMatchPlayers, dbEntries = [], onAddToDB, onRemoveFromDB }: HistoryPageProps) {
  const [expandedMatchId, setExpandedMatchId] = useState<string | null>(null);
  const [expandedMatchData, setExpandedMatchData] = useState<Record<string, LiveMatchData | 'loading' | 'error'>>({});
  const [selectedPlayer, setSelectedPlayer] = useState<{ player: Player; matchData: LiveMatchData } | null>(null);

  const handleMatchClick = async (matchId: string) => {
    if (expandedMatchId === matchId) {
      setExpandedMatchId(null);
      return;
    }
    setExpandedMatchId(matchId);
    if (expandedMatchData[matchId]) return;
    if (!fetchMatchPlayers) return;

    setExpandedMatchData(prev => ({ ...prev, [matchId]: 'loading' }));
    const data = await fetchMatchPlayers(matchId);
    setExpandedMatchData(prev => ({ ...prev, [matchId]: data || 'error' }));
  };

  if (!matches || matches.length === 0) {
    return (
      <div className="p-6 md:px-12">
        <h1 className="text-xl font-bold uppercase tracking-wider mb-6 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">history</span>
          Match History
        </h1>
        <div className="flex items-center justify-center py-16 opacity-30">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl mb-2 block">history</span>
            <p className="text-xs uppercase tracking-wider font-bold">No match history available</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:px-12">
      <h1 className="text-xl font-bold uppercase tracking-wider mb-4 flex items-center gap-2">
        <span className="material-symbols-outlined text-base">history</span>
        Match History
      </h1>

      <div className="flex flex-col gap-1.5">
        {matches.map((match) => {
          const isExpanded = expandedMatchId === match.matchId;
          const expandData = expandedMatchData[match.matchId];

          return (
            <div key={match.matchId} className="rounded overflow-hidden">
              {/* Match summary row */}
              <div
                className={`relative overflow-hidden cursor-pointer border transition-all ${
                  match.result === 'win'
                    ? 'bg-emerald-500/5 border-emerald-500/15 hover:border-emerald-500/30'
                    : 'bg-primary/5 border-primary/15 hover:border-primary/30'
                } ${isExpanded ? 'border-b-0 rounded-b-none' : ''}`}
                onClick={() => handleMatchClick(match.matchId)}
              >
                {/* Map image background */}
                {match.mapImage && (
                  <div
                    className="absolute inset-0 bg-cover bg-center opacity-10"
                    style={{ backgroundImage: `url('${match.mapImage.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}')` }}
                  />
                )}

                <div className="relative z-10 flex items-center justify-between px-4 py-3 gap-3">
                  {/* Result badge */}
                  <div className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded shrink-0 ${
                    match.result === 'win' ? 'bg-emerald-500/20 text-emerald-500' : 'bg-primary/20 text-primary'
                  }`}>
                    {match.result === 'win' ? 'WIN' : 'LOSS'}
                  </div>

                  {/* Map name + mode */}
                  <div className="flex items-center gap-2 min-w-[140px]">
                    {match.mapImage && (
                      <img
                        src={match.mapImage}
                        alt={match.mapName}
                        className="w-12 h-8 object-cover rounded opacity-70 shrink-0"
                      />
                    )}
                    <div>
                      <span className="font-bold text-sm block leading-tight">{match.mapName}</span>
                      <span className="text-[9px] opacity-40 font-mono">{match.gameMode}</span>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-center min-w-[60px]">
                    <span className="font-mono font-bold text-sm">{match.score}</span>
                  </div>

                  {/* Agent */}
                  <div className="flex items-center gap-2 min-w-[80px]">
                    <div className="w-7 h-7 bg-slate-800 rounded flex items-center justify-center border border-slate-700 overflow-hidden shrink-0">
                      {match.agentIconUrl ? (
                        <img src={match.agentIconUrl} alt={match.agentName} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-[6px] font-bold opacity-40 uppercase">{match.agentName?.slice(0, 3)}</span>
                      )}
                    </div>
                    <span className="text-[10px] font-bold opacity-60 truncate">{match.agentName}</span>
                  </div>

                  {/* KDA */}
                  <div className="text-center min-w-[80px]">
                    <span className="text-[8px] uppercase opacity-40 block font-bold">KDA</span>
                    <span className="font-mono text-xs font-bold">{match.kills}/{match.deaths}/{match.assists}</span>
                  </div>

                  {/* RR */}
                  <div className="text-center min-w-[50px]">
                    <span className={`font-mono text-sm font-bold ${
                      match.rrChange >= 0 ? 'text-emerald-500' : 'text-primary'
                    }`}>
                      {match.rrChange >= 0 ? '+' : ''}{match.rrChange} RR
                    </span>
                  </div>

                  {/* Time + expand icon */}
                  <div className="flex items-center gap-2 min-w-[60px] text-right justify-end">
                    <span className="text-[9px] opacity-30 font-mono">{match.time}</span>
                    {fetchMatchPlayers && (
                      <span className={`text-[10px] opacity-40 transition-transform ${isExpanded ? 'rotate-180' : ''}`}>▼</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded 5v5 view */}
              {isExpanded && (
                <div className={`border border-t-0 ${
                  match.result === 'win' ? 'border-emerald-500/15' : 'border-primary/15'
                } bg-[#0a0e14]/80 rounded-b p-3`}>
                  {expandData === 'loading' && (
                    <div className="flex items-center justify-center py-6 gap-2 opacity-40">
                      <div className="w-4 h-4 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Loading match data...</span>
                    </div>
                  )}
                  {expandData === 'error' && (
                    <div className="text-center py-4 opacity-30">
                      <p className="text-xs uppercase font-bold">Failed to load match details</p>
                    </div>
                  )}
                  {expandData && expandData !== 'loading' && expandData !== 'error' && (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                      {/* My Team */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center border-b border-accent-cyan/20 pb-1.5 mb-2">
                          <h3 className="text-accent-cyan font-bold uppercase tracking-widest text-xs flex items-center gap-1.5">
                            <span className="w-1.5 h-1.5 bg-accent-cyan" />
                            Your Team
                          </h3>
                          <span className="text-[9px] opacity-40 font-mono">Avg: {expandData.myTeamAvgRank}</span>
                        </div>
                        {expandData.myTeam.map(p => (
                          <PlayerCard
                            key={p.puuid}
                            player={p}
                            dbEntry={dbEntries.find(d => d.puuid === p.puuid) ?? null}
                            onClick={() => setSelectedPlayer({ player: p, matchData: expandData as LiveMatchData })}
                          />
                        ))}
                      </div>
                      {/* Enemy Team */}
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center border-b border-primary/20 pb-1.5 mb-2">
                          <span className="text-[9px] opacity-40 font-mono">Avg: {expandData.enemyTeamAvgRank}</span>
                          <h3 className="text-primary font-bold uppercase tracking-widest text-xs flex items-center gap-1.5">
                            Enemy Team
                            <span className="w-1.5 h-1.5 bg-primary" />
                          </h3>
                        </div>
                        {expandData.enemyTeam.map(p => (
                          <PlayerCard
                            key={p.puuid}
                            player={p}
                            isEnemy
                            dbEntry={dbEntries.find(d => d.puuid === p.puuid) ?? null}
                            onClick={() => setSelectedPlayer({ player: p, matchData: expandData as LiveMatchData })}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Player Profile modal */}
      {selectedPlayer && (
        <PlayerProfile
          player={selectedPlayer.player}
          isEnemy={!selectedPlayer.player.isLocal && selectedPlayer.matchData.enemyTeam.some(p => p.puuid === selectedPlayer.player.puuid)}
          mapName={selectedPlayer.matchData.mapName}
          mapImage={selectedPlayer.matchData.mapImage}
          existingEntry={dbEntries.find(d => d.puuid === selectedPlayer.player.puuid) ?? null}
          onClose={() => setSelectedPlayer(null)}
          onAddToDB={onAddToDB}
          onRemoveFromDB={onRemoveFromDB}
        />
      )}
    </div>
  );
}
