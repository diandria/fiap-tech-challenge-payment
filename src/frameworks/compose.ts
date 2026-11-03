import { Application } from 'express';
import { Logger } from 'pino';
import { InMemoryAccessTokenStore } from '../adapters/InMemoryAccessTokenStore';
import { InMemoryPreferenceRepository } from '../adapters/InMemoryPreferenceRepository';
import { InMemoryPaymentRepository } from '../adapters/InMemoryPaymentRepository';
import { SignedWebhookNotifier } from '../adapters/SignedWebhookNotifier';
import { ProviderController } from '../adapters/ProviderController';
import { IssueAccessTokenUseCase } from '../use-cases/IssueAccessTokenUseCase';
import { CreatePreferenceUseCase } from '../use-cases/CreatePreferenceUseCase';
import { GetCheckoutUseCase } from '../use-cases/GetCheckoutUseCase';
import { PayCheckoutUseCase } from '../use-cases/PayCheckoutUseCase';
import { GetPaymentUseCase } from '../use-cases/GetPaymentUseCase';
import { ProviderConfig } from './config';
import { createApp } from './http/app';
import { providerRoutes } from './http/providerRoutes';

/** Wires the provider. The only place that knows every concrete class. */
export function composeApp(config: ProviderConfig, logger: Logger): Application {
  const tokens = new InMemoryAccessTokenStore();
  const preferences = new InMemoryPreferenceRepository();
  const payments = new InMemoryPaymentRepository();
  const notifier = new SignedWebhookNotifier(config.webhookSecret, logger);

  const controller = new ProviderController(
    {
      issueAccessToken: new IssueAccessTokenUseCase(config, tokens),
      createPreference: new CreatePreferenceUseCase(preferences),
      getCheckout: new GetCheckoutUseCase(preferences, payments),
      payCheckout: new PayCheckoutUseCase(preferences, payments, notifier),
      getPayment: new GetPaymentUseCase(payments),
    },
    config.checkoutBaseUrl,
  );
  return createApp({ logger, routes: providerRoutes(controller, tokens) });
}
