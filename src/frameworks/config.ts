export interface ServerConfig {
  port: number;
  logLevel: string;
}

export function readServerConfig(env: Record<string, string | undefined> = process.env): ServerConfig {
  const port = Number(env.PORT ?? 3000);
  if (!Number.isInteger(port)) {
    throw new Error(`PORT must be a number, got "${env.PORT}"`);
  }
  return { port, logLevel: env.LOG_LEVEL ?? 'info' };
}

export interface ProviderConfig {
  clientId: string;
  clientSecret: string;
  /** Public address of this service, without a trailing slash: the checkout links start with it. */
  checkoutBaseUrl: string;
  /** Shared with the merchant: signs every payment notification. */
  webhookSecret: string;
}

/** The one merchant this provider serves: its credentials, the shared webhook secret, and this service's public address. Missing any is a deploy mistake. */
export function readProviderConfig(env: Record<string, string | undefined> = process.env): ProviderConfig {
  const missing = ['CLIENT_ID', 'CLIENT_SECRET', 'CHECKOUT_BASE_URL', 'WEBHOOK_SECRET'].filter((name) => !env[name]);
  if (missing.length > 0) {
    throw new Error(`missing ${missing.join(', ')}`);
  }
  return {
    clientId: env.CLIENT_ID as string,
    clientSecret: env.CLIENT_SECRET as string,
    checkoutBaseUrl: (env.CHECKOUT_BASE_URL as string).replace(/\/+$/, ''),
    webhookSecret: env.WEBHOOK_SECRET as string,
  };
}
