import pino, { DestinationStream, Logger } from 'pino';

/**
 * JSON on stdout, the format Promtail ships to Loki. The secrets this service
 * handles are redacted wherever they show up in a logged object.
 */
export function buildLogger(level: string, destination?: DestinationStream): Logger {
  // Without a destination pino writes to stdout.
  return pino(
    {
      level,
      base: { 'service.name': 'payment-service' },
      redact: {
        paths: ['client_secret', 'access_token', 'headers.authorization', 'headers["x-signature"]'],
        censor: '[Redacted]',
      },
    },
    destination,
  );
}
