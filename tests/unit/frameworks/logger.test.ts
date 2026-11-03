import { Writable } from 'node:stream';
import { buildLogger } from '../../../src/frameworks/logging/logger';

function capture(): { stream: Writable; lines: () => Record<string, unknown>[] } {
  const chunks: string[] = [];
  const stream = new Writable({ write(chunk, _enc, done) { chunks.push(chunk.toString()); done(); } });
  return { stream, lines: () => chunks.map((line) => JSON.parse(line)) };
}

describe('buildLogger', () => {
  it('writes JSON identifying the service', () => {
    const { stream, lines } = capture();

    buildLogger('info', stream).info('started');

    expect(lines()[0]).toMatchObject({ 'service.name': 'payment-service', msg: 'started' });
  });

  it('redacts the client secret and the access token', () => {
    const { stream, lines } = capture();

    buildLogger('info', stream).info({ client_secret: 's3cret', access_token: 'tok' }, 'token request');

    expect(lines()[0]).toMatchObject({ client_secret: '[Redacted]', access_token: '[Redacted]' });
  });

  it('drops events below the configured level', () => {
    const { stream, lines } = capture();

    buildLogger('warn', stream).info('not shown');

    expect(lines()).toHaveLength(0);
  });
});
