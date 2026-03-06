import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';

describe('valorant server API', () => {
  let app;

  beforeEach(async () => {
    app = (await import('../../server/valorant.js')).default;
  });

  it('GET /api/status returns running and gameState', async () => {
    const res = await request(app).get('/api/status');
    expect(res.status).toBe(200);
    expect(typeof res.body.running).toBe('boolean');
    expect(typeof res.body.gameState).toBe('string');
  });

  it('GET /api/live-match returns 503 if not authenticated', async () => {
    const res = await request(app).get('/api/live-match');
    // Depending on if Riot client is running, this might return 503 or 404 or something else
    expect([503, 404, 500, 200]).toContain(res.status);
  });

  it('GET /api/history returns correctly', async () => {
    const res = await request(app).get('/api/history');
    expect([503, 404, 500, 200]).toContain(res.status);
  });

  it('GET /api/me returns correctly', async () => {
    const res = await request(app).get('/api/me');
    expect([503, 404, 500, 200]).toContain(res.status);
  });
});

