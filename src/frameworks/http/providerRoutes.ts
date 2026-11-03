import { Router } from 'express';
import { ProviderController } from '../../adapters/ProviderController';
import { IAccessTokenStore } from '../../use-cases/ports/IAccessTokenStore';
import { bearerAuthMiddleware } from './bearerAuthMiddleware';

export function providerRoutes(controller: ProviderController, tokens: IAccessTokenStore): Router {
  const router = Router();
  const merchantOnly = bearerAuthMiddleware(tokens);

  router.post('/oauth/token', (req, res, next) => controller.issueToken(req, res, next));
  router.post('/checkout/preferences', merchantOnly, (req, res, next) => controller.createPreference(req, res, next));
  router.get('/v1/payments/:paymentId', merchantOnly, (req, res, next) => controller.getPayment(req, res, next));

  // The customer's side: public, reached through the API Gateway. The checkout
  // id works like a payment link.
  router.get('/checkout/:preferenceId', (req, res, next) => controller.getCheckout(req, res, next));
  router.post('/checkout/:preferenceId/pay', (req, res, next) => controller.pay(req, res, next));

  return router;
}
