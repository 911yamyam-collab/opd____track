import React from 'react';
import { Player, PlayerDBEntry } from '../data/types';
import PlayerCard from './PlayerCard';

interface PlayerListProps {
  teamName: string;
  avgRank: string;
  players: Player[];
  isEnemy?: boolean;
  dbEntries?: PlayerDBEntry[];
  onPlayerClick?: (player: Player) => void;
}

export default function PlayerList({ teamName, avgRank, players, isEnemy = false, dbEntries = [], onPlayerClick }: PlayerListProps) {
  if (!players || players.length === 0) {
    return (
      <section className="space-y-2">
        <div className={`flex justify-between items-center border-b ${isEnemy ? 'border-primary/30' : 'border-accent-cyan/30'} pb-1`}>
          {isEnemy ? (
            <>
              <span className="text-[9px] opacity-40 font-mono">Avg: {avgRank}</span>
              <h2 className="text-primary font-bold uppercase tracking-widest flex items-center text-[10px]">
                {teamName}<span className="w-1 h-1 bg-primary ml-1.5" />
              </h2>
            </>
          ) : (
            <>
              <h2 className="text-accent-cyan font-bold uppercase tracking-widest flex items-center text-[10px]">
                <span className="w-1 h-1 bg-accent-cyan mr-1.5" />{teamName}
              </h2>
              <span className="text-[9px] opacity-40 font-mono">Avg: {avgRank}</span>
            </>
          )}
        </div>
        <div className="flex items-center justify-center py-4 opacity-30">
          <p className="text-xs uppercase tracking-wider font-bold">No data available</p>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-1">
      <div className={`flex justify-between items-center border-b ${isEnemy ? 'border-primary/30' : 'border-accent-cyan/30'} pb-1`}>
        {isEnemy ? (
          <>
            <span className="text-[9px] opacity-40 font-mono">Avg: {avgRank}</span>
            <h2 className="text-primary font-bold uppercase tracking-widest flex items-center text-[10px]">
              {teamName}<span className="w-1 h-1 bg-primary ml-1.5" />
            </h2>
          </>
        ) : (
          <>
            <h2 className="text-accent-cyan font-bold uppercase tracking-widest flex items-center text-xs">
              <span className="w-1 h-1 bg-accent-cyan mr-1.5" />{teamName}
            </h2>
            <span className="text-[9px] opacity-40 font-mono">Avg: {avgRank}</span>
          </>
        )}
      </div>
      {players.map((player) => (
        <PlayerCard
          key={player.puuid}
          player={player}
          isEnemy={isEnemy}
          dbEntry={dbEntries.find(d => d.puuid === player.puuid) ?? null}
          onClick={() => onPlayerClick?.(player)}
        />
      ))}
    </section>
  );
}
