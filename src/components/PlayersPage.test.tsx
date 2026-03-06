import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import PlayersPage from './PlayersPage';
import { PlayerDBEntry } from '../data/types';

describe('PlayersPage', () => {
  it('renders empty state when no players', () => {
    render(<PlayersPage players={[]} />);
    expect(screen.getByText('No players saved yet')).toBeInTheDocument();
  });

  it('renders players list', () => {
    const mockPlayers: PlayerDBEntry[] = [
      { puuid: '1', name: 'TestPlayer', tag: '#123', category: 'friend', addedAt: Date.now(), agentName: 'Jett', agentIconUrl: '', rankName: 'Gold', note: 'Good', incognito: false },
      { puuid: '2', name: 'ToxicPlayer', tag: '#bad', category: 'toxic', addedAt: Date.now(), agentName: 'Reyna', agentIconUrl: '', rankName: 'Silver', note: '', incognito: false }
    ];

    render(<PlayersPage players={mockPlayers} />);
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.getByText('ToxicPlayer')).toBeInTheDocument();
  });

  it('filters players by category', () => {
    const mockPlayers: PlayerDBEntry[] = [
      { puuid: '1', name: 'TestPlayer', tag: '#123', category: 'friend', addedAt: Date.now(), agentName: 'Jett', agentIconUrl: '', rankName: 'Gold', note: 'Good', incognito: false },
      { puuid: '2', name: 'ToxicPlayer', tag: '#bad', category: 'toxic', addedAt: Date.now(), agentName: 'Reyna', agentIconUrl: '', rankName: 'Silver', note: '', incognito: false }
    ];

    render(<PlayersPage players={mockPlayers} />);
    
    // click 'friend' filter
    fireEvent.click(screen.getByText(/friend \(/i));
    
    expect(screen.getByText('TestPlayer')).toBeInTheDocument();
    expect(screen.queryByText('ToxicPlayer')).not.toBeInTheDocument();
  });
});
