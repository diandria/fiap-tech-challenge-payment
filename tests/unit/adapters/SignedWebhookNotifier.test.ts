import pino from 'pino';
import { SignedWebhookNotifier } from '../../../src/adapters/SignedWebhookNotifier';
import { merchantWebhook } from '../../helpers/merchantWebhook';
import { merchantAcceptsSignature } from '../../helpers/merchantSignatureCheck';

const SECRET = 'webhook-secret';
const quiet = pino({ enabled: false });

describe('SignedWebhookNotifier', () => {
  it('posts a payment notification the merchant accepts as signed by this provider', async () => {
    const merchant = await merchantWebhook();
    try {
      const delivered = await new SignedWebhookNotifier(SECRET, quiet, { retryDelayMs: 0 }).notify(merchant.url, 1234567890);

      expect(delivered).toBe(true);
      const [notification] = merchant.received;
      expect(notification.url.searchParams.get('data.id')).toBe('1234567890');
      expect(notification.url.searchParams.get('type')).toBe('payment');
      expect(notification.body).toEqual({ action: 'payment.created', type: 'payment', data: { id: '1234567890' } });
      expect(merchantAcceptsSignature({
        xSignature: notification.headers['x-signature'] as string,
        xRequestId: notification.headers['x-request-id'] as string,
        dataId: notification.url.searchParams.get('data.id') ?? undefined,
        secret: SECRET,
      })).toBe(true);
    } finally {
      await merchant.close();
    }
  });

  it('produces a signature the merchant refuses when the secrets differ', async () => {
    const merchant = await merchantWebhook();
    try {
      await new SignedWebhookNotifier('another-secret', quiet, { retryDelayMs: 0 }).notify(merchant.url, 1234567890);

      const [notification] = merchant.received;
      expect(merchantAcceptsSignature({
        xSignature: notification.headers['x-signature'] as string,
        xRequestId: notification.headers['x-request-id'] as string,
        dataId: '1234567890',
        secret: SECRET,
      })).toBe(false);
    } finally {
      await merchant.close();
    }
  });

  it('tries again when the merchant fails, and stops at the first success', async () => {
    const merchant = await merchantWebhook([500, 503, 200]);
    try {
      const delivered = await new SignedWebhookNotifier(SECRET, quiet, { retryDelayMs: 0 }).notify(merchant.url, 1234567890);

      expect(delivered).toBe(true);
      expect(merchant.received).toHaveLength(3);
    } finally {
      await merchant.close();
    }
  });

  it('gives up after three failed attempts', async () => {
    const merchant = await merchantWebhook([500]);
    try {
      const delivered = await new SignedWebhookNotifier(SECRET, quiet, { retryDelayMs: 0 }).notify(merchant.url, 1234567890);

      expect(delivered).toBe(false);
      expect(merchant.received).toHaveLength(3);
    } finally {
      await merchant.close();
    }
  });

  it('gives up when the merchant cannot be reached at all', async () => {
    const merchant = await merchantWebhook();
    await merchant.close();

    const delivered = await new SignedWebhookNotifier(SECRET, quiet, { retryDelayMs: 0 }).notify(merchant.url, 1234567890);

    expect(delivered).toBe(false);
  });
});
