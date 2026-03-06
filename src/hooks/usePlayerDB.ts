import { useState, useCallback, useEffect } from 'react';
import { PlayerDBEntry } from '../data/types';

const DB_KEY = 'traopd1_players_db';

export function usePlayerDB() {
  const [players, setPlayers] = useState<PlayerDBEntry[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem(DB_KEY);
    if (stored) {
      try { setPlayers(JSON.parse(stored)); } catch (e) { console.error('Failed to parse player DB from localStorage:', e); }
    }
  }, []);

  const persist = (list: PlayerDBEntry[]) => {
    setPlayers(list);
    localStorage.setItem(DB_KEY, JSON.stringify(list));
  };

  const addPlayer = useCallback((entry: PlayerDBEntry) => {
    setPlayers(prev => {
      const idx = prev.findIndex(p => p.puuid === entry.puuid);
      const updated = idx >= 0
        ? prev.map((p, i) => i === idx ? { ...p, ...entry } : p)
        : [...prev, entry];
      localStorage.setItem(DB_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const removePlayer = useCallback((puuid: string) => {
    setPlayers(prev => {
      const updated = prev.filter(p => p.puuid !== puuid);
      localStorage.setItem(DB_KEY, JSON.stringify(updated));
      return updated;
    });
  }, []);

  const getPlayer = useCallback((puuid: string): PlayerDBEntry | null => {
    return players.find(p => p.puuid === puuid) ?? null;
  }, [players]);

  // Resolve incognito names: after a match ends, update names for incognito entries
  const resolveIncognitoNames = useCallback((matchPlayers: { puuid: string; name: string; tag: string }[]) => {
    setPlayers(prev => {
      let changed = false;
      const updated = prev.map(entry => {
        if (!entry.incognito) return entry;
        const found = matchPlayers.find(p => p.puuid === entry.puuid);
        if (found && found.name && found.name !== 'Unknown') {
          changed = true;
          return { ...entry, name: found.name, tag: found.tag, incognito: false };
        }
        return entry;
      });
      if (changed) localStorage.setItem(DB_KEY, JSON.stringify(updated));
      return changed ? updated : prev;
    });
  }, []);

  return { players, addPlayer, removePlayer, getPlayer, resolveIncognitoNames };
}
