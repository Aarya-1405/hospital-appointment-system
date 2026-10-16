/**
 * Tests for the Prometheus /metrics endpoint.
 *
 * These are integration-style tests that exercise the Express app in-process
 * without spawning an actual HTTP server or requiring a MongoDB connection.
 * The metrics module is isolated from server.js so MongoDB is not needed.
 *
 * Run with:  npm test
 */

'use strict';

const express = require('express');
const request = require('supertest');
const { metricsMiddleware, metricsHandler } = require('../middleware/metrics');

// Build a minimal Express app that mirrors the structure of server.js
// but does NOT call connectDB(), so no MongoDB is required during tests.
function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(metricsMiddleware);
  app.get('/metrics', metricsHandler);

  // Stub a few application routes to generate real HTTP traffic metrics.
  app.get('/api/health', (req, res) => res.json({ ok: true }));
  app.get('/api/doctors', (req, res) => res.json([]));
  app.get('/api/doctors/:id', (req, res) => res.status(404).json({ message: 'not found' }));
  app.post('/api/auth/login', (req, res) => res.status(401).json({ message: 'bad credentials' }));

  return app;
}

describe('GET /metrics', () => {
  let app;

  beforeAll(() => {
    app = buildApp();
  });

  test('returns HTTP 200', async () => {
    const res = await request(app).get('/metrics');
    expect(res.status).toBe(200);
  });

  test('returns Prometheus text exposition content-type', async () => {
    const res = await request(app).get('/metrics');
    expect(res.headers['content-type']).toMatch(/text\/plain/);
    expect(res.headers['content-type']).toMatch(/version=0\.0\.4/);
  });

  test('response body begins with a valid Prometheus comment line', async () => {
    const res = await request(app).get('/metrics');
    const lines = res.text.split('\n');
    const firstComment = lines.find((l) => l.startsWith('#'));
    expect(firstComment).toBeDefined();
  });

  test('default Node.js metrics are present (process_cpu_seconds_total)', async () => {
    const res = await request(app).get('/metrics');
    expect(res.text).toContain('process_cpu_seconds_total');
  });

  test('http_requests_total counter is present after application requests', async () => {
    // Trigger several application routes first.
    await request(app).get('/api/health');
    await request(app).get('/api/doctors');
    await request(app).get('/api/doctors/nonexistentid');
    await request(app).post('/api/auth/login').send({ email: 'x', password: 'y' });

    const res = await request(app).get('/metrics');
    expect(res.text).toContain('http_requests_total');
  });

  test('http_request_duration_seconds histogram is present', async () => {
    const res = await request(app).get('/metrics');
    expect(res.text).toContain('http_request_duration_seconds_bucket');
  });

  test('/metrics requests do not appear in http_requests_total', async () => {
    const res = await request(app).get('/metrics');
    // The /metrics path should never appear as a route label value.
    expect(res.text).not.toMatch(/route="\/metrics"/);
  });

  test('metric labels do not contain sensitive header or token values', async () => {
    // Make a request with an Authorization header; it must not show up in metrics.
    await request(app).get('/api/health').set('Authorization', 'Bearer secret-token-value');
    const res = await request(app).get('/metrics');
    expect(res.text).not.toContain('secret-token-value');
    expect(res.text).not.toContain('Bearer');
  });

  test('existing API routes still work correctly', async () => {
    const healthRes = await request(app).get('/api/health');
    expect(healthRes.status).toBe(200);
    expect(healthRes.body).toEqual({ ok: true });

    const doctorsRes = await request(app).get('/api/doctors');
    expect(doctorsRes.status).toBe(200);
    expect(Array.isArray(doctorsRes.body)).toBe(true);
  });
});
