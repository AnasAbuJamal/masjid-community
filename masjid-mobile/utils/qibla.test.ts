import { describe, expect, it } from 'vitest';
import { qiblaBearing, cardinalDirection } from './qibla';

describe('true-north Qibla bearing', () => {
  it('points north-east from New York', () => {
    const bearing = qiblaBearing(40.7128, -74.0060);
    expect(bearing).toBeGreaterThan(50);
    expect(bearing).toBeLessThan(65);
    expect(cardinalDirection(bearing)).toBe('NE');
  });
  it('points southeast from London', () => {
    const bearing = qiblaBearing(51.5074, -0.1278);
    expect(bearing).toBeGreaterThan(110);
    expect(bearing).toBeLessThan(130);
  });
  it('normalizes the full circle', () => {
    const bearing = qiblaBearing(-33.8688, 151.2093);
    expect(bearing).toBeGreaterThanOrEqual(0);
    expect(bearing).toBeLessThan(360);
  });
  it('rejects out-of-range or invalid coordinates', () => {
    expect(() => qiblaBearing(95, 0)).toThrow(RangeError);
    expect(() => qiblaBearing(0, -181)).toThrow(RangeError);
    expect(() => qiblaBearing(NaN, 39)).toThrow(RangeError);
  });
  it('handles cardinal labels at boundaries', () => {
    expect(cardinalDirection(0)).toBe('N');
    expect(cardinalDirection(359)).toBe('N');
    expect(cardinalDirection(90)).toBe('E');
  });
});
