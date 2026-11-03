import { GetCheckoutUseCase } from '../../../src/use-cases/GetCheckoutUseCase';
import { InMemoryPreferenceRepository } from '../../../src/adapters/InMemoryPreferenceRepository';

describe('GetCheckoutUseCase', () => {
  it('shows a checkout nobody paid yet as pending', async () => {
    const preferences = new InMemoryPreferenceRepository();
    const created = await preferences.create({
      clientId: 'billing',
      items: [{ title: 'Budget', quantity: 1, unitPrice: 180, currencyId: 'BRL' }],
      externalReference: 'order-42',
      notificationUrl: 'https://gateway.example/payments/notifications',
      totalAmount: 180,
    });

    const checkout = await new GetCheckoutUseCase(preferences).execute(created.id);

    expect(checkout).toMatchObject({ preference: created, status: 'pending' });
  });

  it('answers 404 for a checkout that does not exist', async () => {
    await expect(new GetCheckoutUseCase(new InMemoryPreferenceRepository()).execute('nope'))
      .rejects.toMatchObject({ statusCode: 404, message: 'Checkout not found' });
  });
});
