import { AppError } from '../entities/errors/AppError';
import { Preference } from '../entities/Preference';
import { IPreferenceRepository } from './ports/IPreferenceRepository';

export type CheckoutStatus = 'pending';

export interface Checkout {
  preference: Preference;
  status: CheckoutStatus;
}

/** What the customer sees when opening the checkout link. */
export class GetCheckoutUseCase {
  constructor(private readonly preferences: IPreferenceRepository) {}

  async execute(preferenceId: string): Promise<Checkout> {
    const preference = await this.preferences.findById(preferenceId);
    if (!preference) throw new AppError('Checkout not found', 404);
    return { preference, status: 'pending' };
  }
}
