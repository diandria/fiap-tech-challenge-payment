import { readProviderConfig, readServerConfig } from './frameworks/config';
import { buildLogger } from './frameworks/logging/logger';
import { composeApp } from './frameworks/compose';

const server = readServerConfig();
const logger = buildLogger(server.logLevel);
const app = composeApp(readProviderConfig(), logger);

app.listen(server.port, () => {
  logger.info({ port: server.port }, 'payment service listening');
});
