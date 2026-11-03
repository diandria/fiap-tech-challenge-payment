import { InMemoryAccessTokenStore } from '../../../src/adapters/InMemoryAccessTokenStore';

describe('InMemoryAccessTokenStore', () => {
  it('finds the client a token was issued to', async () => {
    const tokens = new InMemoryAccessTokenStore();

    const { token } = await tokens.issue('billing');

    expect(await tokens.find(token)).toEqual({ clientId: 'billing' });
  });

  it('issues a different token each time', async () => {
    const tokens = new InMemoryAccessTokenStore();

    const first = await tokens.issue('billing');
    const second = await tokens.issue('billing');

    expect(first.token).not.toBe(second.token);
  });

  it('does not find a token it never issued', async () => {
    expect(await new InMemoryAccessTokenStore().find('made-up')).toBeNull();
  });

  it('stops finding a token once it expires', async () => {
    let now = new Date('2026-11-03T12:00:00Z');
    const tokens = new InMemoryAccessTokenStore(() => now);
    const { token, expiresIn } = await tokens.issue('billing');

    now = new Date(now.getTime() + expiresIn * 1000);

    expect(await tokens.find(token)).toBeNull();
  });
});
