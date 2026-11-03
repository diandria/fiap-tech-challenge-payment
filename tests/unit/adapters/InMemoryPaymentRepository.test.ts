import { InMemoryPaymentRepository } from '../../../src/adapters/InMemoryPaymentRepository';

const payment = {
  preferenceId: 'pref-1',
  clientId: 'billing',
  status: 'approved' as const,
  statusDetail: 'accredited',
  transactionAmount: 180,
  currencyId: 'BRL',
  externalReference: 'order-42',
};

describe('InMemoryPaymentRepository', () => {
  it('gives each payment a ten-digit numeric id, like Mercado Pago', async () => {
    const created = await new InMemoryPaymentRepository().create(payment);

    expect(String(created.id)).toMatch(/^\d{10}$/);
  });

  it('finds a payment by its id and by its checkout', async () => {
    const payments = new InMemoryPaymentRepository();
    const created = await payments.create(payment);

    expect(await payments.findById(created.id)).toEqual(created);
    expect(await payments.findByPreference('pref-1')).toEqual(created);
  });

  it('finds nothing for an id or a checkout it does not have', async () => {
    const payments = new InMemoryPaymentRepository();

    expect(await payments.findById(1234567890)).toBeNull();
    expect(await payments.findByPreference('pref-2')).toBeNull();
  });
});
