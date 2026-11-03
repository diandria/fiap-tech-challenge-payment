import { totalOf, validateNewPreference } from '../../../src/entities/Preference';

const valid = {
  clientId: 'billing',
  items: [{ title: 'Budget of service order 42', quantity: 1, unitPrice: 180, currencyId: 'BRL' }],
  externalReference: 'c5f1b0d2-0000-4000-8000-000000000042',
  notificationUrl: 'https://gateway.example/payments/notifications',
};

describe('totalOf', () => {
  it('adds up price times quantity, to the cent', () => {
    expect(totalOf([
      { title: 'Oil', quantity: 3, unitPrice: 0.1, currencyId: 'BRL' },
      { title: 'Labour', quantity: 1, unitPrice: 120.25, currencyId: 'BRL' },
    ])).toBe(120.55);
  });
});

describe('validateNewPreference', () => {
  it('accepts a well-formed checkout', () => {
    expect(() => validateNewPreference(valid)).not.toThrow();
  });

  it.each([
    ['no items', { ...valid, items: [] }, 'items must have at least one item'],
    ['an item without title', { ...valid, items: [{ ...valid.items[0], title: '' }] }, 'every item needs a title'],
    ['a fractional quantity', { ...valid, items: [{ ...valid.items[0], quantity: 1.5 }] }, 'quantity must be a positive integer'],
    ['a zero price', { ...valid, items: [{ ...valid.items[0], unitPrice: 0 }] }, 'unit_price must be a positive number'],
    ['no currency', { ...valid, items: [{ ...valid.items[0], currencyId: '' }] }, 'every item needs a currency_id'],
    ['no external reference', { ...valid, externalReference: '' }, 'external_reference is required'],
    ['a notification url that is not http', { ...valid, notificationUrl: 'ftp://somewhere' }, 'notification_url must be an http(s) url'],
    ['a notification url that is not a url', { ...valid, notificationUrl: 'not a url' }, 'notification_url must be an http(s) url'],
  ])('refuses %s', (_case, input, message) => {
    expect(() => validateNewPreference(input)).toThrow(expect.objectContaining({ statusCode: 400, message }));
  });
});
