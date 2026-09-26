import request from 'supertest';
import { app } from '../src/app';

describe('Phase 27: Production API Routing & JSON Regression Tests', () => {
  it('GET /api/health must return JSON and never HTML', async () => {
    const res = await request(app).get('/api/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.text).not.toContain('<html');
    expect(res.body.success).toBe(true);
    expect(res.body.service).toBe('Alpha Coach API');
    expect(res.body.version).toBe('1.0.4');
  });

  it('GET /health (dual-mounted) must return JSON and never HTML', async () => {
    const res = await request(app).get('/health');
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.body.success).toBe(true);
  });

  it('GET /api/v1/mt5/bridge/device/status without token must return JSON 401 and never HTML', async () => {
    const res = await request(app).get('/api/v1/mt5/bridge/device/status');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.body.authorized).toBe(false);
  });

  it('GET /v1/mt5/bridge/device/status (dual-mounted) must return JSON 401 and never HTML', async () => {
    const res = await request(app).get('/v1/mt5/bridge/device/status');
    expect(res.status).toBe(401);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.body.authorized).toBe(false);
  });

  it('POST /api/v1/mt5/bridge/session/create must return JSON 200 and never HTML', async () => {
    const res = await request(app)
      .post('/api/v1/mt5/bridge/session/create')
      .send({ deviceName: 'Jest Test Runner' });
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.body.success).toBe(true);
    expect(res.body.sessionCode).toBeDefined();
  });

  it('Unknown /api route must return JSON 404 and never HTML', async () => {
    const res = await request(app).get('/api/unknown/endpoint/path');
    expect(res.status).toBe(404);
    expect(res.headers['content-type']).toMatch(/application\/json/);
    expect(res.text).not.toContain('<!doctype html>');
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
  });
});
