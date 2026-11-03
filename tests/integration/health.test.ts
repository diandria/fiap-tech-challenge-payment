import request from 'supertest';
import { Router } from 'express';
import { createApp } from '../../src/frameworks/http/app';
import { silentLogger } from '../helpers/silentLogger';

describe('Health and metrics', () => {
  it('GIVEN the service is running WHEN GET /health THEN it answers 200 with status ok', async () => {
    // GIVEN
    const app = createApp({ logger: silentLogger() });

    // WHEN
    const res = await request(app).get('/health');

    // THEN
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ status: 'ok' });
  });

  it('GIVEN the service is running WHEN GET /metrics THEN it exposes the default metrics labelled with the service name', async () => {
    // GIVEN
    const app = createApp({ logger: silentLogger() });

    // WHEN
    const res = await request(app).get('/metrics');

    // THEN
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/plain');
    expect(res.text).toMatch(/process_cpu_user_seconds_total\{service_name="payment-service"\}/);
  });

  it('GIVEN a path the service does not have WHEN it is requested THEN it answers 404', async () => {
    // GIVEN
    const app = createApp({ logger: silentLogger() });

    // WHEN
    const res = await request(app).get('/nothing-here');

    // THEN
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Route not found' });
  });

  it('GIVEN a body that is not valid JSON WHEN it is sent THEN it answers 400 instead of 500', async () => {
    // GIVEN
    const app = createApp({ logger: silentLogger() });

    // WHEN
    const res = await request(app).post('/health').set('Content-Type', 'application/json').send('{ not json');

    // THEN
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'Invalid JSON body' });
  });

  it('GIVEN provider routes WHEN one of them is requested THEN it answers instead of the 404', async () => {
    // GIVEN
    const routes = Router();
    routes.get('/ping', (_req, res) => { res.json({ pong: true }); });
    const app = createApp({ logger: silentLogger(), routes });

    // WHEN
    const res = await request(app).get('/ping');

    // THEN
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ pong: true });
  });
});
