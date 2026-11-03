import { parsePaymentStatus, statusDetailOf } from '../../../src/entities/Payment';

describe('parsePaymentStatus', () => {
  it.each(['approved', 'rejected'])('accepts %s', (status) => {
    expect(parsePaymentStatus(status)).toBe(status);
  });

  it.each([undefined, '', 'APPROVED', 'pending', 42])('refuses %p', (status) => {
    expect(() => parsePaymentStatus(status)).toThrow(expect.objectContaining({ statusCode: 400, message: 'status must be approved or rejected' }));
  });
});

describe('statusDetailOf', () => {
  it('uses the details Mercado Pago gives an approved and a refused card payment', () => {
    expect(statusDetailOf('approved')).toBe('accredited');
    expect(statusDetailOf('rejected')).toBe('cc_rejected_other_reason');
  });
});
