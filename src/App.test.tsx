import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect } from 'vitest';
import App from './App';
import * as useValorantModule from './hooks/useValorant';
import * as usePlayerDBModule from './hooks/usePlayerDB';

vi.mock('./hooks/useValorant');
vi.mock('./hooks/usePlayerDB');

describe('App', () => {
  it('renders loading state', () => {
    vi.spyOn(useValorantModule, 'useValorant').mockReturnValue({
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
      refresh: vi.fn(),
      fetchMatchPlayers: vi.fn(),
    });
    vi.spyOn(usePlayerDBModule, 'usePlayerDB').mockReturnValue({
      players: [],
      addPlayer: vi.fn(),
      removePlayer: vi.fn(),
      getPlayer: vi.fn(() => null),
      resolveIncognitoNames: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Connecting...')).toBeInTheDocument();
  });

  it('renders not running state', () => {
    vi.spyOn(useValorantModule, 'useValorant').mockReturnValue({
      gameState: 'NOT_RUNNING',
      queueId: '',
      match: null,
      lastMatch: null,
      matchEnded: false,
      myInfo: null,
      history: [],
      loading: false,
      error: 'Not running',
      lastUpdated: 0,
      refresh: vi.fn(),
      fetchMatchPlayers: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('VALORANT Not Running')).toBeInTheDocument();
  });

  it('renders live match data', () => {
    vi.spyOn(useValorantModule, 'useValorant').mockReturnValue({
      gameState: 'INGAME',
      queueId: '',
      match: {
        mapName: 'Ascent',
        mapImage: '',
        gameMode: 'Competitive',
        isPregame: false,
        myTeamAvgRank: 10,
        enemyTeamAvgRank: 10,
        myTeam: [
          { puuid: '1', name: 'Ally1', tag: '#123', agentName: 'Jett', agentIconUrl: '', rankTier: 10, rankName: 'Silver', rr: 50, leaderboard: 0, peakRankTier: 10, peakRankName: 'Silver', wr: 50, games: 10, accountLevel: 10, incognito: false, history: [], skins: null, isLocal: true, teamId: 'Blue' }
        ],
        enemyTeam: [
          { puuid: '2', name: 'Enemy1', tag: '#123', agentName: 'Reyna', agentIconUrl: '', rankTier: 10, rankName: 'Silver', rr: 50, leaderboard: 0, peakRankTier: 10, peakRankName: 'Silver', wr: 50, games: 10, accountLevel: 10, incognito: false, history: [], skins: null, isLocal: false, teamId: 'Red' }
        ],
      },
      lastMatch: null,
      matchEnded: false,
      myInfo: null,
      history: [],
      loading: false,
      error: null,
      lastUpdated: 0,
      refresh: vi.fn(),
      fetchMatchPlayers: vi.fn(),
    });

    render(<App />);
    expect(screen.getByText('Ally1')).toBeInTheDocument();
    expect(screen.getByText('Enemy1')).toBeInTheDocument();
  });
});
