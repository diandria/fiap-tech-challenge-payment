import { randomBytes } from 'node:crypto';
import { IAccessTokenStore, IssuedToken } from '../use-cases/ports/IAccessTokenStore';

/** Six hours, the validity Mercado Pago gives its client credentials tokens. */
const VALIDITY_SECONDS = 21600;

/**
 * Tokens live in memory: one replica, and a restart only means the merchant
 * asks for a new token, which its client already does when one is refused.
 */
export class InMemoryAccessTokenStore implements IAccessTokenStore {
  private readonly tokens = new Map<string, { clientId: string; expiresAt: number }>();

  constructor(private readonly now: () => Date = () => new Date()) {}

  async issue(clientId: string): Promise<IssuedToken> {
    const token = randomBytes(32).toString('hex');
    this.tokens.set(token, { clientId, expiresAt: this.now().getTime() + VALIDITY_SECONDS * 1000 });
    return { token, expiresIn: VALIDITY_SECONDS };
  }

  async find(token: string): Promise<{ clientId: string } | null> {
    const entry = this.tokens.get(token);
    if (!entry) return null;
    if (this.now().getTime() >= entry.expiresAt) {
      this.tokens.delete(token);
      return null;
    }
    return { clientId: entry.clientId };
  }
}
