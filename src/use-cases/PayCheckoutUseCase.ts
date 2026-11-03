import { AppError } from '../entities/errors/AppError';
import { parsePaymentStatus, Payment, statusDetailOf } from '../entities/Payment';
import { IMerchantNotifier } from './ports/IMerchantNotifier';
import { IPaymentRepository } from './ports/IPaymentRepository';
import { IPreferenceRepository } from './ports/IPreferenceRepository';

export interface PayCheckoutResult {
  payment: Payment;
  /** False when the merchant did not acknowledge the notification; the payment stands anyway. */
  merchantNotified: boolean;
}

/**
 * The customer pays at the checkout link. The provider records the outcome and
 * tells the merchant; the merchant then reads the payment back with its token,
 * so it never trusts what the notification body says.
 */
export class PayCheckoutUseCase {
  constructor(
    private readonly preferences: IPreferenceRepository,
    private readonly payments: IPaymentRepository,
    private readonly notifier: IMerchantNotifier,
  ) {}

  async execute(input: { preferenceId: string; status: unknown }): Promise<PayCheckoutResult> {
    const status = parsePaymentStatus(input.status);
    const preference = await this.preferences.findById(input.preferenceId);
    if (!preference) throw new AppError('Checkout not found', 404);
    // One attempt per checkout: after a refusal the saga cancels the order, so
    // there is nothing left to pay.
    if (await this.payments.findByPreference(preference.id)) {
      throw new AppError('Checkout already paid', 409);
    }

    const payment = await this.payments.create({
      preferenceId: preference.id,
      clientId: preference.clientId,
      status,
      statusDetail: statusDetailOf(status),
      transactionAmount: preference.totalAmount,
      currencyId: preference.items[0].currencyId,
      externalReference: preference.externalReference,
    });
    const merchantNotified = await this.notifier.notify(preference.notificationUrl, payment.id);
    return { payment, merchantNotified };
  }
}
