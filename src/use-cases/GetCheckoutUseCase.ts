import { AppError } from '../entities/errors/AppError';
import { PaymentStatus } from '../entities/Payment';
import { Preference } from '../entities/Preference';
import { IPaymentRepository } from './ports/IPaymentRepository';
import { IPreferenceRepository } from './ports/IPreferenceRepository';

export type CheckoutStatus = 'pending' | PaymentStatus;

export interface Checkout {
  preference: Preference;
  status: CheckoutStatus;
}

/** What the customer sees when opening the checkout link. */
export class GetCheckoutUseCase {
  constructor(
    private readonly preferences: IPreferenceRepository,
    private readonly payments: IPaymentRepository,
  ) {}

  async execute(preferenceId: string): Promise<Checkout> {
    const preference = await this.preferences.findById(preferenceId);
    if (!preference) throw new AppError('Checkout not found', 404);
    const payment = await this.payments.findByPreference(preference.id);
    return { preference, status: payment ? payment.status : 'pending' };
  }
}
