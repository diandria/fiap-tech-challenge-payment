import { AppError } from './errors/AppError';

/** The customer's decision at the checkout: there is no card to really charge. */
export type PaymentStatus = 'approved' | 'rejected';

export interface NewPayment {
  preferenceId: string;
  clientId: string;
  status: PaymentStatus;
  statusDetail: string;
  transactionAmount: number;
  currencyId: string;
  externalReference: string;
}

export interface Payment extends NewPayment {
  /** Numeric, like Mercado Pago's payment ids. */
  id: number;
  createdAt: Date;
}

export function parsePaymentStatus(value: unknown): PaymentStatus {
  if (value === 'approved' || value === 'rejected') return value;
  throw new AppError('status must be approved or rejected', 400);
}

/** The details Mercado Pago gives an approved card payment and a refused one. */
export function statusDetailOf(status: PaymentStatus): string {
  return status === 'approved' ? 'accredited' : 'cc_rejected_other_reason';
}
