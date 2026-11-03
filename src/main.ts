import { readServerConfig } from './frameworks/config';
import { buildLogger } from './frameworks/logging/logger';
import { createApp } from './frameworks/http/app';

const config = readServerConfig();
const logger = buildLogger(config.logLevel);
const app = createApp({ logger });

app.listen(config.port, () => {
  logger.info({ port: config.port }, 'payment service listening');
});
