import pino, { Logger } from 'pino';

/** A real logger that writes nothing, for tests that do not look at the logs. */
export function silentLogger(): Logger {
  return pino({ enabled: false });
}
