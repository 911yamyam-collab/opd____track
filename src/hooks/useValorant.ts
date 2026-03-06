import { useState, useEffect, useCallback, useRef } from 'react';
import { GameState, LiveMatchData, MatchHistoryEntry, Player } from '../data/types';

const API_BASE = 'http://127.0.0.1:3001';

interface ValorantState {
  gameState: GameState;
  queueId: string;
  match: LiveMatchData | null;
  lastMatch: LiveMatchData | null;   // preserved after match ends
  matchEnded: boolean;               // flag: match just ended, showing stale data
  myInfo: Player | null;             // local player info for MENUS state
  history: MatchHistoryEntry[];
  loading: boolean;
  error: string | null;
  lastUpdated: number;
}

export function useValorant() {
  const [state, setState] = useState<ValorantState>({
    gameState: 'loading',
    queueId: '',
    match: null,
    lastMatch: null,
    matchEnded: false,
    myInfo: null,
    history: [],
    loading: true,
    error: null,
    lastUpdated: 0,
  });

  const prevGameState = useRef<GameState>('loading');
  const isFetchingMatch = useRef(false);
  const isFetchingMyInfo = useRef(false);
  const wasInMatch = useRef(false);

  const fetchStatus = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/status`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      return { running: data.running, gameState: data.gameState as GameState, queueId: data.queueId || '' };
    } catch {
      return { running: false, gameState: 'NOT_RUNNING' as GameState, queueId: '' };
    }
  }, []);

  const fetchMatch = useCallback(async () => {
    if (isFetchingMatch.current) return null;
    isFetchingMatch.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/live-match`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return null;
      return await res.json() as LiveMatchData;
    } catch {
      return null;
    } finally {
      isFetchingMatch.current = false;
    }
  }, []);

  const fetchMyInfo = useCallback(async () => {
    if (isFetchingMyInfo.current) return null;
    isFetchingMyInfo.current = true;
    try {
      const res = await fetch(`${API_BASE}/api/me`, { signal: AbortSignal.timeout(20000) });
      if (!res.ok) return null;
      return await res.json() as Player;
    } catch {
      return null;
    } finally {
      isFetchingMyInfo.current = false;
    }
  }, []);

  const fetchHistory = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/history`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return [];
      const data = await res.json();
      return data.matches as MatchHistoryEntry[];
    } catch {
      return [];
    }
  }, []);

  const fetchMatchPlayers = useCallback(async (matchId: string): Promise<LiveMatchData | null> => {
    try {
      const res = await fetch(`${API_BASE}/api/match/${matchId}/players`, { signal: AbortSignal.timeout(30000) });
      if (!res.ok) return null;
      return await res.json() as LiveMatchData;
    } catch {
      return null;
    }
  }, []);

  const poll = useCallback(async () => {
    const { running, gameState, queueId } = await fetchStatus();

    const inMatch = gameState === 'INGAME' || gameState === 'PREGAME';
    const stateChanged = gameState !== prevGameState.current;
    const wasInMatchPrev = prevGameState.current === 'INGAME' || prevGameState.current === 'PREGAME';
    const justLeftMatch = stateChanged && wasInMatchPrev && !inMatch;
    prevGameState.current = gameState;

    setState(prev => ({
      ...prev,
      gameState,
      queueId,
      loading: false,
      error: running ? null : 'VALORANT is not running',
      // Keep match data when leaving (show as ended), clear only when entering new match
      match: (stateChanged && inMatch) ? null : prev.match,
      lastMatch: justLeftMatch ? prev.match : prev.lastMatch,
      matchEnded: justLeftMatch ? true : (inMatch ? false : prev.matchEnded),
    }));

    if (inMatch) {
      wasInMatch.current = true;
      const match = await fetchMatch();
      if (match) {
        setState(prev => ({ ...prev, match, matchEnded: false, lastUpdated: Date.now() }));
      }
    }
  }, [fetchStatus, fetchMatch]);

  // Load history on mount
  useEffect(() => {
    fetchHistory().then(history => {
      setState(prev => ({ ...prev, history }));
    });
  }, [fetchHistory]);

  // Refresh history + resolve incognito names when transitioning from INGAME → MENUS
  useEffect(() => {
    if (state.gameState === 'MENUS' && wasInMatch.current) {
      wasInMatch.current = false;
      const timer = setTimeout(() => {
        fetchHistory().then(history => {
          setState(prev => ({ ...prev, history }));
        });
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.gameState, fetchHistory]);

  // Fetch myInfo when in MENUS and no myInfo yet
  useEffect(() => {
    if ((state.gameState === 'MENUS' || state.gameState === 'DISCONNECTED') && !state.myInfo && !isFetchingMyInfo.current) {
      fetchMyInfo().then(myInfo => {
        if (myInfo) setState(prev => ({ ...prev, myInfo }));
      });
    }
  }, [state.gameState, state.myInfo, fetchMyInfo]);

  // Poll every 5 seconds
  useEffect(() => {
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [poll]);

  const refresh = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true }));
    await poll();
  }, [poll]);

  return { ...state, refresh, fetchMatchPlayers };
}
