import request from 'supertest';
import { checkoutRequest, merchantToken, provider } from '../helpers/provider';

describe('Checkouts', () => {
  it('GIVEN a merchant token WHEN the merchant creates a checkout THEN it gets the id and the link the customer pays at', async () => {
    // GIVEN
    const app = provider();
    const token = await merchantToken(app);

    // WHEN
    const res = await request(app).post('/checkout/preferences').set('Authorization', `Bearer ${token}`).send(checkoutRequest);

    // THEN
    expect(res.status).toBe(201);
    expect(res.body).toEqual({
      id: expect.stringMatching(/^[0-9a-f-]{36}$/),
      init_point: `https://gateway.example/checkout/${res.body.id}`,
      external_reference: checkoutRequest.external_reference,
      total_amount: 180,
      date_created: expect.any(String),
    });
  });

  it('GIVEN no token WHEN a checkout is created THEN it answers 401', async () => {
    // GIVEN
    const app = provider();

    // WHEN
    const res = await request(app).post('/checkout/preferences').send(checkoutRequest);

    // THEN
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ error: 'invalid access token' });
  });

  it('GIVEN a checkout without items WHEN it is created THEN it answers 400', async () => {
    // GIVEN
    const app = provider();
    const token = await merchantToken(app);

    // WHEN
    const res = await request(app).post('/checkout/preferences').set('Authorization', `Bearer ${token}`)
      .send({ ...checkoutRequest, items: [] });

    // THEN
    expect(res.status).toBe(400);
    expect(res.body).toEqual({ error: 'items must have at least one item' });
  });

  it('GIVEN a checkout WHEN the customer opens its link THEN it shows what will be paid, still pending, with no token', async () => {
    // GIVEN
    const app = provider();
    const token = await merchantToken(app);
    const created = await request(app).post('/checkout/preferences').set('Authorization', `Bearer ${token}`).send(checkoutRequest);

    // WHEN
    const res = await request(app).get(`/checkout/${created.body.id}`);

    // THEN
    expect(res.status).toBe(200);
    expect(res.body).toEqual({
      id: created.body.id,
      description: 'Budget of service order 42',
      total_amount: 180,
      currency_id: 'BRL',
      external_reference: checkoutRequest.external_reference,
      status: 'pending',
    });
  });

  it('GIVEN no such checkout WHEN its link is opened THEN it answers 404', async () => {
    // GIVEN
    const app = provider();

    // WHEN
    const res = await request(app).get('/checkout/00000000-0000-4000-8000-000000000000');

    // THEN
    expect(res.status).toBe(404);
    expect(res.body).toEqual({ error: 'Checkout not found' });
  });
});
