export interface HistoryEntry {
  result: 'win' | 'loss';
  rrChange: number;
  matchId?: string;
}

export interface SkinInfo {
  name: string;
  iconUrl: string | null;
}

export interface PlayerSkins {
  phantom: SkinInfo | null;
  vandal: SkinInfo | null;
  operator: SkinInfo | null;
  melee: SkinInfo | null;
}

export interface Player {
  puuid: string;
  name: string;
  tag: string;
  agentName: string;
  agentIconUrl: string | null;
  rankTier: number;
  rankName: string;
  rr: number;
  leaderboard: number;
  peakRankTier: number;
  peakRankName: string;
  wr: number | string;
  games: number;
  accountLevel: number;
  incognito: boolean;
  history: HistoryEntry[];
  skins: PlayerSkins | null;
  isLocal: boolean;
  teamId: string;
  kills?: number;
  deaths?: number;
  assists?: number;
}

export interface LiveMatchData {
  mapName: string;
  mapImage: string | null;
  gameMode: string;
  isPregame: boolean;
  myTeam: Player[];
  enemyTeam: Player[];
  myTeamAvgRank: string;
  enemyTeamAvgRank: string;
}

export interface MatchHistoryEntry {
  matchId: string;
  mapName: string;
  mapImage: string | null;
  gameMode: string;
  result: 'win' | 'loss';
  score: string;
  agentName: string;
  agentIconUrl: string | null;
  kills: number;
  deaths: number;
  assists: number;
  rrChange: number;
  time: string;
}

export interface PlayerDBEntry {
  puuid: string;
  name: string;
  tag: string;
  category: 'friend' | 'toxic' | 'avoid';
  note: string;
  mapName: string;
  mapImage: string | null;
  agentName: string;
  agentIconUrl: string | null;
  rankName: string;
  addedAt: number;
  matchId?: string;
  incognito?: boolean;
}

export type GameState = 'NOT_RUNNING' | 'MENUS' | 'PREGAME' | 'INGAME' | 'DISCONNECTED' | 'loading';
