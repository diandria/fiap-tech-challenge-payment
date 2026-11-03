import { GetPaymentUseCase } from '../../../src/use-cases/GetPaymentUseCase';
import { InMemoryPaymentRepository } from '../../../src/adapters/InMemoryPaymentRepository';

async function stored() {
  const payments = new InMemoryPaymentRepository();
  const payment = await payments.create({
    preferenceId: 'pref-1',
    clientId: 'billing',
    status: 'approved',
    statusDetail: 'accredited',
    transactionAmount: 180,
    currencyId: 'BRL',
    externalReference: 'order-42',
  });
  return { payment, getPayment: new GetPaymentUseCase(payments) };
}

describe('GetPaymentUseCase', () => {
  it('shows the merchant its own payment', async () => {
    const { payment, getPayment } = await stored();

    expect(await getPayment.execute({ paymentId: String(payment.id), clientId: 'billing' })).toEqual(payment);
  });

  it.each([
    ['another merchant', (id: number) => ({ paymentId: String(id), clientId: 'someone-else' })],
    ['an id that does not exist', () => ({ paymentId: '1000000000', clientId: 'billing' })],
    ['an id that is not a number', () => ({ paymentId: 'abc', clientId: 'billing' })],
  ])('answers 404 for %s', async (_case, request) => {
    const { payment, getPayment } = await stored();

    await expect(getPayment.execute(request(payment.id))).rejects.toMatchObject({ statusCode: 404, message: 'Payment not found' });
  });
});
