import { describe, it, expect } from 'vitest';
import { getTierName, getTierShort, getTierColor } from './rank';

describe('rank utils', () => {
  describe('getTierName', () => {
    it('returns Unranked for 0', () => {
      expect(getTierName(0)).toBe('Unranked');
    });

    it('returns Iron 1 for 3', () => {
      expect(getTierName(3)).toBe('Iron 1');
    });

    it('returns Radiant for 27', () => {
      expect(getTierName(27)).toBe('Radiant');
    });

    it('returns Unranked for out of bounds', () => {
      expect(getTierName(999)).toBe('Unranked');
    });
  });

  describe('getTierShort', () => {
    it('returns UnR for 0', () => {
      expect(getTierShort(0)).toBe('UnR');
    });

    it('returns Ir1 for 3', () => {
      expect(getTierShort(3)).toBe('Ir1');
    });

    it('returns Rad for 27', () => {
      expect(getTierShort(27)).toBe('Rad');
    });

    it('returns UnR for out of bounds', () => {
      expect(getTierShort(999)).toBe('UnR');
    });
  });

  describe('getTierColor', () => {
    it('returns Unranked color for 0', () => {
      expect(getTierColor(0)).toBe('text-slate-400');
    });

    it('returns Iron color for 3', () => {
      expect(getTierColor(3)).toBe('text-stone-400');
    });

    it('returns Radiant color for 27', () => {
      expect(getTierColor(27)).toBe('text-yellow-200');
    });

    it('returns default color for out of bounds', () => {
      expect(getTierColor(999)).toBe('text-slate-400');
    });
  });
});
