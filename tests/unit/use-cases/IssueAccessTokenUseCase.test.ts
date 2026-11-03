import { IssueAccessTokenUseCase } from '../../../src/use-cases/IssueAccessTokenUseCase';
import { InMemoryAccessTokenStore } from '../../../src/adapters/InMemoryAccessTokenStore';

const client = { clientId: 'billing', clientSecret: 'billing-secret' };

describe('IssueAccessTokenUseCase', () => {
  it('issues a token for the registered client', async () => {
    const tokens = new InMemoryAccessTokenStore();
    const issue = new IssueAccessTokenUseCase(client, tokens);

    const issued = await issue.execute({ grantType: 'client_credentials', clientId: 'billing', clientSecret: 'billing-secret' });

    expect(issued.expiresIn).toBe(21600);
    expect(await tokens.find(issued.token)).toEqual({ clientId: 'billing' });
  });

  it('refuses a wrong secret', async () => {
    const issue = new IssueAccessTokenUseCase(client, new InMemoryAccessTokenStore());

    await expect(issue.execute({ grantType: 'client_credentials', clientId: 'billing', clientSecret: 'guess' }))
      .rejects.toMatchObject({ statusCode: 400, message: 'invalid client_id or client_secret' });
  });

  it('refuses a client it does not know', async () => {
    const issue = new IssueAccessTokenUseCase(client, new InMemoryAccessTokenStore());

    await expect(issue.execute({ grantType: 'client_credentials', clientId: 'someone', clientSecret: 'billing-secret' }))
      .rejects.toMatchObject({ statusCode: 400, message: 'invalid client_id or client_secret' });
  });

  it('refuses any grant other than client_credentials', async () => {
    const issue = new IssueAccessTokenUseCase(client, new InMemoryAccessTokenStore());

    await expect(issue.execute({ grantType: 'password', clientId: 'billing', clientSecret: 'billing-secret' }))
      .rejects.toMatchObject({ statusCode: 400, message: 'grant_type must be client_credentials' });
  });
});
