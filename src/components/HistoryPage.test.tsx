import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import HistoryPage from './HistoryPage';
import { MatchHistoryEntry } from '../data/types';

describe('HistoryPage', () => {
  it('renders empty state when no matches', () => {
    render(<HistoryPage matches={[]} />);
    expect(screen.getByText('No match history available')).toBeInTheDocument();
  });

  it('renders match list', () => {
    const matches: MatchHistoryEntry[] = [
      {
        matchId: '1',
        mapName: 'Ascent',
        mapImage: '',
        gameMode: 'Competitive',
        result: 'win',
        score: '13-10',
        agentName: 'Jett',
        agentIconUrl: '',
        kills: 20,
        deaths: 10,
        assists: 5,
        rrChange: 20,
        time: '1h ago'
      }
    ];

    render(<HistoryPage matches={matches} />);
    expect(screen.getByText('Ascent')).toBeInTheDocument();
    expect(screen.getByText('13-10')).toBeInTheDocument();
    expect(screen.getByText('WIN')).toBeInTheDocument();
  });

  it('expands match on click', async () => {
    const matches: MatchHistoryEntry[] = [
      {
        matchId: '1',
        mapName: 'Ascent',
        mapImage: '',
        gameMode: 'Competitive',
        result: 'win',
        score: '13-10',
        agentName: 'Jett',
        agentIconUrl: '',
        kills: 20,
        deaths: 10,
        assists: 5,
        rrChange: 20,
        time: '1h ago'
      }
    ];

    const fetchMatchPlayers = vi.fn().mockResolvedValue({
      mapName: 'Ascent',
      mapImage: '',
      gameMode: 'Competitive',
      isPregame: false,
      myTeamAvgRank: 10,
      enemyTeamAvgRank: 10,
      myTeam: [],
      enemyTeam: []
    });

    render(<HistoryPage matches={matches} fetchMatchPlayers={fetchMatchPlayers} />);
    
    // click to expand
    fireEvent.click(screen.getByText('Ascent'));
    
    expect(fetchMatchPlayers).toHaveBeenCalledWith('1');
    expect(screen.getByText('Loading match data...')).toBeInTheDocument();
    
    // wait for mock to resolve
    const yourTeam = await screen.findByText('Your Team');
    expect(yourTeam).toBeInTheDocument();
  });
});
