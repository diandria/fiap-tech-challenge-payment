import { AppError } from '../entities/errors/AppError';
import { Payment } from '../entities/Payment';
import { IPaymentRepository } from './ports/IPaymentRepository';

/** The merchant reads a payment after being notified. Another merchant's payment looks like one that does not exist. */
export class GetPaymentUseCase {
  constructor(private readonly payments: IPaymentRepository) {}

  async execute(input: { paymentId: string; clientId: string }): Promise<Payment> {
    const id = Number(input.paymentId);
    const payment = Number.isInteger(id) ? await this.payments.findById(id) : null;
    if (!payment || payment.clientId !== input.clientId) throw new AppError('Payment not found', 404);
    return payment;
  }
}
