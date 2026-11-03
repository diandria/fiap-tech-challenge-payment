import { timingSafeEqual } from 'node:crypto';
import { AppError } from '../entities/errors/AppError';
import { IAccessTokenStore, IssuedToken } from './ports/IAccessTokenStore';

/** The one merchant this provider knows: the Billing Service. */
export interface RegisteredClient {
  clientId: string;
  clientSecret: string;
}

export interface TokenRequest {
  grantType: string | undefined;
  clientId: string | undefined;
  clientSecret: string | undefined;
}

/** Compares in constant time, so a wrong guess takes as long as an almost right one. */
function sameValue(received: string | undefined, expected: string): boolean {
  const a = Buffer.from(received ?? '');
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * OAuth 2.0 client credentials: the merchant trades its id and secret for a
 * short-lived token, and every later call carries the token instead of the
 * secret. Machine to machine, with no person involved.
 */
export class IssueAccessTokenUseCase {
  constructor(
    private readonly client: RegisteredClient,
    private readonly tokens: IAccessTokenStore,
  ) {}

  async execute(request: TokenRequest): Promise<IssuedToken> {
    if (request.grantType !== 'client_credentials') {
      throw new AppError('grant_type must be client_credentials', 400);
    }
    // Both checks always run, and the answer does not say which one failed.
    const validId = sameValue(request.clientId, this.client.clientId);
    const validSecret = sameValue(request.clientSecret, this.client.clientSecret);
    if (!validId || !validSecret) {
      throw new AppError('invalid client_id or client_secret', 400);
    }
    return this.tokens.issue(this.client.clientId);
  }
}
