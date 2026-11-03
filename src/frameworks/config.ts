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
