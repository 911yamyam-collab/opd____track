import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { usePlayerDB } from './usePlayerDB';

describe('usePlayerDB', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it('initializes with empty list if localStorage is empty', () => {
    const { result } = renderHook(() => usePlayerDB());
    expect(result.current.players).toEqual([]);
  });

  it('loads players from localStorage on mount', () => {
    const mockData = [{ puuid: '123', name: 'Test', tag: '#123', category: 'friend', note: '' }];
    localStorage.setItem('traopd1_players_db', JSON.stringify(mockData));

    const { result } = renderHook(() => usePlayerDB());
    expect(result.current.players).toEqual(mockData);
  });

  it('adds a new player', () => {
    const { result } = renderHook(() => usePlayerDB());
    
    act(() => {
      result.current.addPlayer({ puuid: '123', name: 'Test', tag: '#123', category: 'friend', note: 'Cool guy' });
    });

    expect(result.current.players).toHaveLength(1);
    expect(result.current.players[0].name).toBe('Test');
    expect(JSON.parse(localStorage.getItem('traopd1_players_db') || '[]')).toHaveLength(1);
  });

  it('updates an existing player', () => {
    const mockData = [{ puuid: '123', name: 'Test', tag: '#123', category: 'friend', note: '' }];
    localStorage.setItem('traopd1_players_db', JSON.stringify(mockData));

    const { result } = renderHook(() => usePlayerDB());
    
    act(() => {
      result.current.addPlayer({ puuid: '123', name: 'Test', tag: '#123', category: 'toxic', note: 'Changed' });
    });

    expect(result.current.players).toHaveLength(1);
    expect(result.current.players[0].category).toBe('toxic');
  });

  it('removes a player', () => {
    const mockData = [{ puuid: '123', name: 'Test', tag: '#123', category: 'friend', note: '' }];
    localStorage.setItem('traopd1_players_db', JSON.stringify(mockData));

    const { result } = renderHook(() => usePlayerDB());
    
    act(() => {
      result.current.removePlayer('123');
    });

    expect(result.current.players).toHaveLength(0);
    expect(JSON.parse(localStorage.getItem('traopd1_players_db') || '[]')).toHaveLength(0);
  });

  it('gets a player by puuid', () => {
    const mockData = [{ puuid: '123', name: 'Test', tag: '#123', category: 'friend', note: '' }];
    localStorage.setItem('traopd1_players_db', JSON.stringify(mockData));

    const { result } = renderHook(() => usePlayerDB());
    
    const player = result.current.getPlayer('123');
    expect(player).toEqual(mockData[0]);

    const none = result.current.getPlayer('456');
    expect(none).toBeNull();
  });

  it('resolves incognito names', () => {
    const mockData = [{ puuid: '123', name: 'Unknown', tag: '#000', category: 'avoid', note: '', incognito: true }];
    localStorage.setItem('traopd1_players_db', JSON.stringify(mockData));

    const { result } = renderHook(() => usePlayerDB());
    
    act(() => {
      result.current.resolveIncognitoNames([{ puuid: '123', name: 'RealName', tag: '#NA1' }]);
    });

    expect(result.current.players[0].name).toBe('RealName');
    expect(result.current.players[0].tag).toBe('#NA1');
    expect(result.current.players[0].incognito).toBe(false);
  });
});
