import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import PlayerCard from './PlayerCard';
import { Player } from '../data/types';
import { vi } from 'vitest';

const mockPlayer: Player = {
  puuid: '1234',
  name: 'TestPlayer',
  tag: '#NA1',
  agentName: 'Jett',
  agentIconUrl: 'http://example.com/jett.png',
  rankTier: 24, // Immortal 1
  rankName: 'Immortal 1',
  rr: 50,
  leaderboard: 0,
  peakRankTier: 25,
  peakRankName: 'Immortal 2',
  wr: 55,
  games: 100,
  accountLevel: 50,
  incognito: false,
  history: [
    { result: 'win', rrChange: 20, matchId: '1' },
    { result: 'loss', rrChange: 15, matchId: '2' },
  ],
  skins: {
    phantom: { name: 'Oni Phantom', iconUrl: 'http://example.com/oni.png' },
    vandal: null,
    operator: null,
    melee: null,
  },
  isLocal: false,
  teamId: 'Blue',
};

describe('PlayerCard', () => {
  it('renders player name and tag', () => {
    render(<PlayerCard player={mockPlayer} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('#NA1')).toBeInTheDocument();
  });

  it('handles incognito player correctly', () => {
    const incognitoPlayer = { ...mockPlayer, incognito: true, name: 'Hidden' };
    render(<PlayerCard player={incognitoPlayer} />);
    expect(screen.getByText('— Incognito —')).toBeInTheDocument();
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument();
  });

  it('renders db entry badge if provided', () => {
    render(<PlayerCard player={mockPlayer} dbEntry={{ puuid: '1234', name: 'TestPlayer', category: 'toxic', note: 'bad behavior' }} />);
    expect(screen.getByText('Toxic')).toBeInTheDocument();
    expect(screen.getByText('bad behavior')).toBeInTheDocument();
  });

  it('triggers onClick when clicked', () => {
    const onClick = vi.fn();
    const { container } = render(<PlayerCard player={mockPlayer} onClick={onClick} />);
    fireEvent.click(container.firstChild as HTMLElement);
    expect(onClick).toHaveBeenCalled();
  });
});
