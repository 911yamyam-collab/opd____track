import { renderHook, act } from '@testing-library/react';
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { useValorant } from './useValorant';

// Mock the global fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

describe('useValorant', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/status')) {
        return { ok: true, json: async () => ({ running: true, gameState: 'MENUS', queueId: '' }) };
      }
      if (url.includes('/api/history')) {
        return { ok: true, json: async () => ({ matches: [] }) };
      }
      if (url.includes('/api/me')) {
        return { ok: true, json: async () => ({ puuid: '123', name: 'Me', history: [] }) };
      }
      if (url.includes('/api/live-match')) {
        return { ok: true, json: async () => ({ mapName: 'Ascent' }) };
      }
      return { ok: false };
    });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes and polls status', async () => {
    const { result } = renderHook(() => useValorant());

    // Wait for the poll to complete
    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.gameState).toBe('MENUS');
    expect(result.current.myInfo?.name).toBe('Me');
  });

  it('handles NOT_RUNNING state', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/status')) {
        return { ok: true, json: async () => ({ running: false, gameState: 'NOT_RUNNING', queueId: '' }) };
      }
      return { ok: true, json: async () => ({}) };
    });

    const { result } = renderHook(() => useValorant());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.gameState).toBe('NOT_RUNNING');
    expect(result.current.error).toBe('VALORANT is not running');
  });

  it('fetches match data when INGAME', async () => {
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/status')) {
        return { ok: true, json: async () => ({ running: true, gameState: 'INGAME', queueId: 'competitive' }) };
      }
      if (url.includes('/api/live-match')) {
        return { ok: true, json: async () => ({ mapName: 'Ascent' }) };
      }
      if (url.includes('/api/history')) return { ok: true, json: async () => ({ matches: [] }) };
      return { ok: false };
    });

    const { result } = renderHook(() => useValorant());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.gameState).toBe('INGAME');
    expect(result.current.match?.mapName).toBe('Ascent');
  });

  it('preserves match data as lastMatch when leaving INGAME', async () => {
    let state = 'INGAME';
    mockFetch.mockImplementation(async (url: string) => {
      if (url.includes('/api/status')) {
        return { ok: true, json: async () => ({ running: true, gameState: state, queueId: 'competitive' }) };
      }
      if (url.includes('/api/live-match')) {
        return { ok: true, json: async () => ({ mapName: 'Ascent' }) };
      }
      if (url.includes('/api/history')) return { ok: true, json: async () => ({ matches: [] }) };
      if (url.includes('/api/me')) return { ok: true, json: async () => ({ puuid: '123', name: 'Me' }) };
      return { ok: false };
    });

    const { result } = renderHook(() => useValorant());

    await act(async () => {
      await vi.advanceTimersByTimeAsync(100);
    });

    expect(result.current.gameState).toBe('INGAME');
    expect(result.current.match?.mapName).toBe('Ascent');

    // Second poll: MENUS
    state = 'MENUS';

    await act(async () => {
      await vi.advanceTimersByTimeAsync(5000); // Trigger poll interval
    });

    expect(result.current.gameState).toBe('MENUS');
    expect(result.current.match?.mapName).toBe('Ascent'); // match is kept until new match
    expect(result.current.lastMatch?.mapName).toBe('Ascent');
    expect(result.current.matchEnded).toBe(true);
  });
});

