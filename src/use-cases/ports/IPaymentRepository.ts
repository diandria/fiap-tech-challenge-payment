import { NewPayment, Payment } from '../../entities/Payment';

export interface IPaymentRepository {
  /** Stores the payment and gives it its id and creation date. */
  create(payment: NewPayment): Promise<Payment>;
  findById(id: number): Promise<Payment | null>;
  findByPreference(preferenceId: string): Promise<Payment | null>;
}
