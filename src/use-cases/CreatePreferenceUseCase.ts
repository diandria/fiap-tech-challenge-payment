import { NewPreference, Preference, totalOf, validateNewPreference } from '../entities/Preference';
import { IPreferenceRepository } from './ports/IPreferenceRepository';

/** The merchant asks the provider to charge an amount; the customer pays it later, at the checkout link. */
export class CreatePreferenceUseCase {
  constructor(private readonly preferences: IPreferenceRepository) {}

  async execute(input: NewPreference): Promise<Preference> {
    validateNewPreference(input);
    return this.preferences.create({ ...input, totalAmount: totalOf(input.items) });
  }
}
