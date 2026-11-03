import { NewPreference, Preference } from '../../entities/Preference';

export interface IPreferenceRepository {
  /** Stores the checkout and gives it its id and creation date. */
  create(preference: NewPreference & { totalAmount: number }): Promise<Preference>;
  findById(id: string): Promise<Preference | null>;
}
