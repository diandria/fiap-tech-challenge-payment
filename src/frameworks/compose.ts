import { Application } from 'express';
import { Logger } from 'pino';
import { InMemoryAccessTokenStore } from '../adapters/InMemoryAccessTokenStore';
import { ProviderController } from '../adapters/ProviderController';
import { IssueAccessTokenUseCase } from '../use-cases/IssueAccessTokenUseCase';
import { ProviderConfig } from './config';
import { createApp } from './http/app';
import { providerRoutes } from './http/providerRoutes';

/** Wires the provider. The only place that knows every concrete class. */
export function composeApp(config: ProviderConfig, logger: Logger): Application {
  const tokens = new InMemoryAccessTokenStore();
  const controller = new ProviderController(new IssueAccessTokenUseCase(config, tokens));
  return createApp({ logger, routes: providerRoutes(controller) });
}
