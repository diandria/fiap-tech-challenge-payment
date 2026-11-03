import { AppError } from './errors/AppError';

export interface PreferenceItem {
  title: string;
  quantity: number;
  unitPrice: number;
  currencyId: string;
}

/** What the merchant asks to charge, before the provider gives it an id. */
export interface NewPreference {
  /** The merchant that created it; only that merchant may read its payments. */
  clientId: string;
  items: PreferenceItem[];
  /** The merchant's own id for the charge: the service order id, for the Billing Service. */
  externalReference: string;
  /** Where the provider tells the merchant a payment happened. */
  notificationUrl: string;
}

/** A charge waiting to be paid, which Mercado Pago calls a checkout preference. */
export interface Preference extends NewPreference {
  id: string;
  totalAmount: number;
  createdAt: Date;
}

export function totalOf(items: PreferenceItem[]): number {
  const cents = items.reduce((sum, item) => sum + Math.round(item.unitPrice * 100) * item.quantity, 0);
  return cents / 100;
}

function isHttpUrl(value: string): boolean {
  try {
    return ['http:', 'https:'].includes(new URL(value).protocol);
  } catch {
    return false;
  }
}

function invalid(message: string): never {
  throw new AppError(message, 400);
}

export function validateNewPreference(input: NewPreference): void {
  if (!Array.isArray(input.items) || input.items.length === 0) invalid('items must have at least one item');
  for (const item of input.items) {
    if (typeof item.title !== 'string' || item.title.trim() === '') invalid('every item needs a title');
    if (!Number.isInteger(item.quantity) || item.quantity <= 0) invalid('quantity must be a positive integer');
    if (typeof item.unitPrice !== 'number' || !(item.unitPrice > 0)) invalid('unit_price must be a positive number');
    if (typeof item.currencyId !== 'string' || item.currencyId === '') invalid('every item needs a currency_id');
  }
  if (typeof input.externalReference !== 'string' || input.externalReference === '') invalid('external_reference is required');
  if (typeof input.notificationUrl !== 'string' || !isHttpUrl(input.notificationUrl)) {
    invalid('notification_url must be an http(s) url');
  }
}
