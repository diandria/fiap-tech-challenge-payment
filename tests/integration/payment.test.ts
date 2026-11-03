import request from 'supertest';
import { composeApp } from '../../src/frameworks/compose';
import { checkoutRequest, merchantToken, providerConfig } from '../helpers/provider';
import { silentLogger } from '../helpers/silentLogger';
import { merchantWebhook } from '../helpers/merchantWebhook';
import { merchantAcceptsSignature } from '../helpers/merchantSignatureCheck';

describe('Paying a checkout', () => {
  let merchant: Awaited<ReturnType<typeof merchantWebhook>>;

  beforeEach(async () => { merchant = await merchantWebhook(); });
  afterEach(async () => { await merchant.close(); });

  async function openCheckout() {
    const app = composeApp(providerConfig, silentLogger());
    const token = await merchantToken(app);
    const created = await request(app).post('/checkout/preferences').set('Authorization', `Bearer ${token}`)
      .send({ ...checkoutRequest, notification_url: merchant.url });
    return { app, token, checkoutId: created.body.id as string };
  }

  it('GIVEN an open checkout WHEN the customer pays it THEN the merchant is told with a signature it accepts and reads the payment with its token', async () => {
    // GIVEN
    const { app, token, checkoutId } = await openCheckout();

    // WHEN
    const paid = await request(app).post(`/checkout/${checkoutId}/pay`).send({ status: 'approved' });

    // THEN
    expect(paid.status).toBe(201);
    expect(paid.body).toEqual({ payment_id: expect.any(Number), status: 'approved', merchant_notified: true });

    const [notification] = merchant.received;
    const dataId = notification.url.searchParams.get('data.id') ?? undefined;
    expect(dataId).toBe(String(paid.body.payment_id));
    expect(merchantAcceptsSignature({
      xSignature: notification.headers['x-signature'] as string,
      xRequestId: notification.headers['x-request-id'] as string,
      dataId,
      secret: providerConfig.webhookSecret,
    })).toBe(true);

    const payment = await request(app).get(`/v1/payments/${dataId}`).set('Authorization', `Bearer ${token}`);
    expect(payment.status).toBe(200);
    expect(payment.body).toEqual({
      id: paid.body.payment_id,
      status: 'approved',
      status_detail: 'accredited',
      transaction_amount: 180,
      currency_id: 'BRL',
      external_reference: checkoutRequest.external_reference,
      date_created: expect.any(String),
    });
  });

  it('GIVEN a refused payment WHEN the customer opens the link again THEN the checkout shows rejected and refuses a second payment', async () => {
    // GIVEN
    const { app, checkoutId } = await openCheckout();
    await request(app).post(`/checkout/${checkoutId}/pay`).send({ status: 'rejected' });

    // WHEN
    const checkout = await request(app).get(`/checkout/${checkoutId}`);
    const again = await request(app).post(`/checkout/${checkoutId}/pay`).send({ status: 'approved' });

    // THEN
    expect(checkout.body.status).toBe('rejected');
    expect(again.status).toBe(409);
    expect(again.body).toEqual({ error: 'Checkout already paid' });
  });

  it('GIVEN a payment WHEN it is read without the merchant token THEN it answers 401', async () => {
    // GIVEN
    const { app, checkoutId } = await openCheckout();
    const paid = await request(app).post(`/checkout/${checkoutId}/pay`).send({ status: 'approved' });

    // WHEN
    const res = await request(app).get(`/v1/payments/${paid.body.payment_id}`);

    // THEN
    expect(res.status).toBe(401);
  });

  it('GIVEN no such payment WHEN the merchant reads it THEN it answers 404', async () => {
    // GIVEN
    const { app, token } = await openCheckout();

    // WHEN
    const res = await request(app).get('/v1/payments/1000000000').set('Authorization', `Bearer ${token}`);

    // THEN
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Payment not found' });
  });
});
