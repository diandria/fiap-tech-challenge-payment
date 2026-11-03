import { randomUUID } from 'node:crypto';
import { NewPreference, Preference } from '../entities/Preference';
import { IPreferenceRepository } from '../use-cases/ports/IPreferenceRepository';

/** In memory, like every store of this provider: one replica, and a restart forgets open checkouts. */
export class InMemoryPreferenceRepository implements IPreferenceRepository {
  private readonly preferences = new Map<string, Preference>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async create(preference: NewPreference & { totalAmount: number }): Promise<Preference> {
    const stored: Preference = { ...preference, id: randomUUID(), createdAt: this.now() };
    this.preferences.set(stored.id, stored);
    return stored;
  }

  async findById(id: string): Promise<Preference | null> {
    return this.preferences.get(id) ?? null;
  }
}
