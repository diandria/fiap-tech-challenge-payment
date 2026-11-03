import express, { Application, Router } from 'express';
import { Logger } from 'pino';
import { registry } from '../metrics/registry';
import { errorMiddleware } from './errorMiddleware';

export interface AppDependencies {
  logger: Logger;
  /** The provider's own routes; without them the app answers only health and metrics. */
  routes?: Router;
}

export function createApp({ logger, routes }: AppDependencies): Application {
  const app = express();
  app.disable('x-powered-by');
  app.use(express.json());

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
  });

  // No auth: Prometheus scrapes from inside the cluster.
  app.get('/metrics', async (_req, res) => {
    res.set('Content-Type', registry.contentType);
    res.end(await registry.metrics());
  });

  if (routes) app.use(routes);

  app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
  });
  app.use(errorMiddleware(logger));

  return app;
}
