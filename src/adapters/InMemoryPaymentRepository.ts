import { randomInt } from 'node:crypto';
import { NewPayment, Payment } from '../entities/Payment';
import { IPaymentRepository } from '../use-cases/ports/IPaymentRepository';

/**
 * In memory. Ids are random rather than sequential, so a restart does not hand
 * out ids the merchant already stored for other payments.
 */
export class InMemoryPaymentRepository implements IPaymentRepository {
  private readonly payments = new Map<number, Payment>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async create(payment: NewPayment): Promise<Payment> {
    let id: number;
    do {
      id = randomInt(1_000_000_000, 10_000_000_000);
    } while (this.payments.has(id));
    const stored: Payment = { ...payment, id, createdAt: this.now() };
    this.payments.set(id, stored);
    return stored;
  }

  async findById(id: number): Promise<Payment | null> {
    return this.payments.get(id) ?? null;
  }

  async findByPreference(preferenceId: string): Promise<Payment | null> {
    for (const payment of this.payments.values()) {
      if (payment.preferenceId === preferenceId) return payment;
    }
    return null;
  }
}
