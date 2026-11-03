import { createHmac, randomUUID } from 'node:crypto';
import { Logger } from 'pino';
import { IMerchantNotifier } from '../use-cases/ports/IMerchantNotifier';

const ATTEMPTS = 3;
const TIMEOUT_MS = 5_000;

export interface NotifierOptions {
  retryDelayMs?: number;
  fetchFn?: typeof fetch;
}

/**
 * Notifies the merchant the way Mercado Pago does: `data.id` and `type` in the
 * query string, and an `x-signature` header with an HMAC-SHA256 of
 * "id:<data.id>;request-id:<x-request-id>;ts:<ts>;" under the secret both
 * sides share. The merchant recomputes it to know the call came from here.
 */
export class SignedWebhookNotifier implements IMerchantNotifier {
  private readonly retryDelayMs: number;
  private readonly fetchFn: typeof fetch;

  constructor(
    private readonly secret: string,
    private readonly logger: Logger,
    options: NotifierOptions = {},
  ) {
    this.retryDelayMs = options.retryDelayMs ?? 500;
    this.fetchFn = options.fetchFn ?? fetch;
  }

  async notify(notificationUrl: string, paymentId: number): Promise<boolean> {
    const url = new URL(notificationUrl);
    url.searchParams.set('data.id', String(paymentId));
    url.searchParams.set('type', 'payment');
    const body = JSON.stringify({ action: 'payment.created', type: 'payment', data: { id: String(paymentId) } });

    for (let attempt = 1; attempt <= ATTEMPTS; attempt++) {
      try {
        const response = await this.fetchFn(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...this.signatureHeaders(String(paymentId)) },
          body,
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });
        if (response.ok) return true;
        this.logger.warn({ paymentId, attempt, status: response.status }, 'merchant refused the notification');
      } catch (err) {
        this.logger.warn({ paymentId, attempt, err }, 'merchant could not be reached');
      }
      if (attempt < ATTEMPTS) await new Promise((resolve) => setTimeout(resolve, this.retryDelayMs));
    }
    return false;
  }

  /** A new request id and timestamp per attempt, as each attempt is a new request. */
  private signatureHeaders(dataId: string): Record<string, string> {
    const requestId = randomUUID();
    const ts = String(Math.floor(Date.now() / 1000));
    const v1 = createHmac('sha256', this.secret).update(`id:${dataId};request-id:${requestId};ts:${ts};`).digest('hex');
    return { 'x-request-id': requestId, 'x-signature': `ts=${ts},v1=${v1}` };
  }
}
