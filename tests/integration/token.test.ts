import request from 'supertest';
import { composeApp } from '../../src/frameworks/compose';
import { silentLogger } from '../helpers/silentLogger';

const config = { clientId: 'billing', clientSecret: 'billing-secret' };

describe('POST /oauth/token', () => {
  it('GIVEN the registered credentials WHEN the merchant asks for a token THEN it gets a bearer token that is never live', async () => {
    // GIVEN
    const app = composeApp(config, silentLogger());

    // WHEN
    const res = await request(app).post('/oauth/token').send({
      grant_type: 'client_credentials', client_id: 'billing', client_secret: 'billing-secret', test_token: 'true',
    });

    // THEN
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      access_token: expect.stringMatching(/^[0-9a-f]{64}$/),
      token_type: 'Bearer',
      expires_in: 21600,
      live_mode: false,
    });
  });

  it('GIVEN a wrong secret WHEN the merchant asks for a token THEN it answers 400', async () => {
    // GIVEN
    const app = composeApp(config, silentLogger());

    // WHEN
    const res = await request(app).post('/oauth/token').send({
      grant_type: 'client_credentials', client_id: 'billing', client_secret: 'guess',
    });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'invalid client_id or client_secret' });
  });

  it('GIVEN no body WHEN the merchant asks for a token THEN it answers 400', async () => {
    // GIVEN
    const app = composeApp(config, silentLogger());

    // WHEN
    const res = await request(app).post('/oauth/token');

    // THEN
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'grant_type must be client_credentials' });
  });
});
