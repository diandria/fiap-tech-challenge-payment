import { Request, Response } from 'express';
import { bearerAuthMiddleware } from '../../../src/frameworks/http/bearerAuthMiddleware';
import { InMemoryAccessTokenStore } from '../../../src/adapters/InMemoryAccessTokenStore';

function requestWith(authorization?: string): Request {
  return { header: (name: string) => (name.toLowerCase() === 'authorization' ? authorization : undefined) } as unknown as Request;
}

async function run(authorization: string | undefined, tokens = new InMemoryAccessTokenStore()) {
  const res = { locals: {} } as Response;
  const next = jest.fn();
  await bearerAuthMiddleware(tokens)(requestWith(authorization), res, next);
  return { res, next };
}

describe('bearerAuthMiddleware', () => {
  it('lets a valid token through and records whose it is', async () => {
    const tokens = new InMemoryAccessTokenStore();
    const { token } = await tokens.issue('billing');

    const { res, next } = await run(`Bearer ${token}`, tokens);

    expect(next).toHaveBeenCalledWith();
    expect(res.locals.clientId).toBe('billing');
  });

  it.each([
    ['no Authorization header', undefined],
    ['a scheme other than Bearer', 'Basic YmlsbGluZzpzZWNyZXQ='],
    ['a token nobody issued', 'Bearer made-up'],
  ])('refuses %s with 401', async (_case, authorization) => {
    const { next } = await run(authorization);

    expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 401, message: 'invalid access token' }));
  });
});
