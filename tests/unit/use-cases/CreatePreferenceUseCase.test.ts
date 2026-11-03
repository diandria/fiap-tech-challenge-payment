import { CreatePreferenceUseCase } from '../../../src/use-cases/CreatePreferenceUseCase';
import { InMemoryPreferenceRepository } from '../../../src/adapters/InMemoryPreferenceRepository';

const input = {
  clientId: 'billing',
  items: [{ title: 'Budget', quantity: 2, unitPrice: 90, currencyId: 'BRL' }],
  externalReference: 'order-42',
  notificationUrl: 'https://gateway.example/payments/notifications',
};

describe('CreatePreferenceUseCase', () => {
  it('stores the checkout with its total and the merchant that created it', async () => {
    const preferences = new InMemoryPreferenceRepository();

    const created = await new CreatePreferenceUseCase(preferences).execute(input);

    expect(created).toMatchObject({ clientId: 'billing', totalAmount: 180, externalReference: 'order-42' });
    expect(await preferences.findById(created.id)).toEqual(created);
  });

  it('refuses an invalid checkout without storing it', async () => {
    const preferences = new InMemoryPreferenceRepository();

    await expect(new CreatePreferenceUseCase(preferences).execute({ ...input, items: [] }))
      .rejects.toMatchObject({ statusCode: 400 });
  });
});
