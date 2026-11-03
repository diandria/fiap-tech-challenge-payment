import { createServer, IncomingMessage, Server } from 'node:http';
import { AddressInfo } from 'node:net';

export interface ReceivedNotification {
  url: URL;
  headers: IncomingMessage['headers'];
  body: unknown;
}

/**
 * A stand-in for the merchant's webhook route: records every notification and
 * answers with the next status in `statuses` (the last one repeats).
 */
export async function merchantWebhook(statuses: number[] = [200]): Promise<{
  url: string;
  received: ReceivedNotification[];
  close: () => Promise<void>;
}> {
  const received: ReceivedNotification[] = [];
  const server: Server = createServer((req, res) => {
    let raw = '';
    req.on('data', (chunk) => { raw += chunk; });
    req.on('end', () => {
      received.push({ url: new URL(req.url ?? '/', 'http://merchant'), headers: req.headers, body: raw ? JSON.parse(raw) : undefined });
      const status = statuses[Math.min(received.length - 1, statuses.length - 1)];
      res.writeHead(status).end();
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}/payments/notifications`,
    received,
    close: () => new Promise((resolve) => server.close(() => resolve())),
  };
}
