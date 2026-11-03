import { readServerConfig } from '../../../src/frameworks/config';

describe('readServerConfig', () => {
  it('listens on 3000 when PORT is not set', () => {
    expect(readServerConfig({}).port).toBe(3000);
  });

  it('reads PORT and LOG_LEVEL', () => {
    expect(readServerConfig({ PORT: '3003', LOG_LEVEL: 'debug' })).toEqual({ port: 3003, logLevel: 'debug' });
  });

  it('refuses a PORT that is not a number', () => {
    expect(() => readServerConfig({ PORT: 'http' })).toThrow('PORT must be a number');
  });
});
