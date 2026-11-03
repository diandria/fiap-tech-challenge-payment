import { Application } from 'express';
import { Logger } from 'pino';
import { InMemoryAccessTokenStore } from '../adapters/InMemoryAccessTokenStore';
import { InMemoryPreferenceRepository } from '../adapters/InMemoryPreferenceRepository';
import { ProviderController } from '../adapters/ProviderController';
import { IssueAccessTokenUseCase } from '../use-cases/IssueAccessTokenUseCase';
import { CreatePreferenceUseCase } from '../use-cases/CreatePreferenceUseCase';
import { GetCheckoutUseCase } from '../use-cases/GetCheckoutUseCase';
import { ProviderConfig } from './config';
import { createApp } from './http/app';
import { providerRoutes } from './http/providerRoutes';

/** Wires the provider. The only place that knows every concrete class. */
export function composeApp(config: ProviderConfig, logger: Logger): Application {
  const tokens = new InMemoryAccessTokenStore();
  const preferences = new InMemoryPreferenceRepository();

  const controller = new ProviderController(
    {
      issueAccessToken: new IssueAccessTokenUseCase(config, tokens),
      createPreference: new CreatePreferenceUseCase(preferences),
      getCheckout: new GetCheckoutUseCase(preferences),
    },
    config.checkoutBaseUrl,
  );
  return createApp({ logger, routes: providerRoutes(controller, tokens) });
}
