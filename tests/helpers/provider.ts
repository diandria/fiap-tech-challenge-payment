import request from 'supertest';
import { Application } from 'express';
import { composeApp } from '../../src/frameworks/compose';
import { ProviderConfig } from '../../src/frameworks/config';
import { silentLogger } from './silentLogger';

export const providerConfig: ProviderConfig = {
  clientId: 'billing',
  clientSecret: 'billing-secret',
  checkoutBaseUrl: 'https://gateway.example',
  webhookSecret: 'webhook-secret',
};

export function provider(): Application {
  return composeApp(providerConfig, silentLogger());
}

/** What the Billing Service does first: trade its credentials for a token. */
export async function merchantToken(app: Application): Promise<string> {
  const res = await request(app).post('/oauth/token').send({
    grant_type: 'client_credentials', client_id: providerConfig.clientId, client_secret: providerConfig.clientSecret,
  });
  return res.body.access_token;
}

/** The body the Billing Service sends to create a checkout. */
export const checkoutRequest = {
  items: [{ title: 'Budget of service order 42', quantity: 1, unit_price: 180, currency_id: 'BRL' }],
  external_reference: 'c5f1b0d2-0000-4000-8000-000000000042',
  notification_url: 'https://gateway.example/payments/notifications',
};
