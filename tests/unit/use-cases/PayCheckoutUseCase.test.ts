import { PayCheckoutUseCase } from '../../../src/use-cases/PayCheckoutUseCase';
import { InMemoryPreferenceRepository } from '../../../src/adapters/InMemoryPreferenceRepository';
import { InMemoryPaymentRepository } from '../../../src/adapters/InMemoryPaymentRepository';
import { IMerchantNotifier } from '../../../src/use-cases/ports/IMerchantNotifier';

class FakeNotifier implements IMerchantNotifier {
  readonly sent: { url: string; paymentId: number }[] = [];
  constructor(private readonly delivers = true) {}
  async notify(url: string, paymentId: number): Promise<boolean> {
    this.sent.push({ url, paymentId });
    return this.delivers;
  }
}

async function scenario(notifier = new FakeNotifier()) {
  const preferences = new InMemoryPreferenceRepository();
  const payments = new InMemoryPaymentRepository();
  const preference = await preferences.create({
    clientId: 'billing',
    items: [{ title: 'Budget', quantity: 1, unitPrice: 180, currencyId: 'BRL' }],
    externalReference: 'order-42',
    notificationUrl: 'https://gateway.example/payments/notifications',
    totalAmount: 180,
  });
  return { preference, payments, notifier, pay: new PayCheckoutUseCase(preferences, payments, notifier) };
}

describe('PayCheckoutUseCase', () => {
  it('records an approved payment for the checkout amount and tells the merchant', async () => {
    const { preference, payments, notifier, pay } = await scenario();

    const result = await pay.execute({ preferenceId: preference.id, status: 'approved' });

    expect(result.payment).toMatchObject({
      preferenceId: preference.id,
      clientId: 'billing',
      status: 'approved',
      statusDetail: 'accredited',
      transactionAmount: 180,
      currencyId: 'BRL',
      externalReference: 'order-42',
    });
    expect(result.merchantNotified).toBe(true);
    expect(notifier.sent).toEqual([{ url: preference.notificationUrl, paymentId: result.payment.id }]);
    expect(await payments.findById(result.payment.id)).toEqual(result.payment);
  });

  it('records a refused payment as rejected', async () => {
    const { preference, pay } = await scenario();

    const result = await pay.execute({ preferenceId: preference.id, status: 'rejected' });

    expect(result.payment).toMatchObject({ status: 'rejected', statusDetail: 'cc_rejected_other_reason' });
  });

  it('keeps the payment when the merchant could not be told, and says so', async () => {
    const { preference, payments, pay } = await scenario(new FakeNotifier(false));

    const result = await pay.execute({ preferenceId: preference.id, status: 'approved' });

    expect(result.merchantNotified).toBe(false);
    expect(await payments.findById(result.payment.id)).not.toBeNull();
  });

  it('allows a single payment per checkout', async () => {
    const { preference, pay } = await scenario();
    await pay.execute({ preferenceId: preference.id, status: 'rejected' });

    await expect(pay.execute({ preferenceId: preference.id, status: 'approved' }))
      .rejects.toMatchObject({ statusCode: 409, message: 'Checkout already paid' });
  });

  it('answers 404 for a checkout that does not exist', async () => {
    const { pay } = await scenario();

    await expect(pay.execute({ preferenceId: 'nope', status: 'approved' }))
      .rejects.toMatchObject({ statusCode: 404, message: 'Checkout not found' });
  });

  it('refuses a status other than approved or rejected', async () => {
    const { preference, notifier, pay } = await scenario();

    await expect(pay.execute({ preferenceId: preference.id, status: 'maybe' }))
      .rejects.toMatchObject({ statusCode: 400 });
    expect(notifier.sent).toHaveLength(0);
  });
});
