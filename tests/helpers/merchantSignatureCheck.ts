import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * The check the Billing Service runs on every notification
 * (fiap-tech-challenge-billing, src/adapters/payments/verifyMercadoPagoSignature.ts),
 * repeated here so the tests prove a notification from this provider passes it.
 */
export function merchantAcceptsSignature(input: {
  xSignature: string | undefined;
  xRequestId: string | undefined;
  dataId: string | undefined;
  secret: string;
}): boolean {
  if (!input.xSignature) return false;
  const parts: Record<string, string> = {};
  for (const part of input.xSignature.split(',')) {
    const [key, value] = part.split('=', 2).map((piece) => piece?.trim());
    if (key && value) parts[key.toLowerCase()] = value;
  }
  const { ts, v1 } = parts;
  if (!ts || !/^\d+$/.test(ts) || !v1) return false;

  const manifest: string[] = [];
  if (input.dataId) manifest.push(`id:${input.dataId.trim()}`);
  if (input.xRequestId) manifest.push(`request-id:${input.xRequestId.trim()}`);
  manifest.push(`ts:${ts}`);
  const expected = createHmac('sha256', input.secret).update(`${manifest.join(';')};`).digest('hex');

  const received = Buffer.from(v1);
  const computed = Buffer.from(expected);
  return received.length === computed.length && timingSafeEqual(received, computed);
}
