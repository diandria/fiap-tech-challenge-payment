import { Router } from 'express';
import { ProviderController } from '../../adapters/ProviderController';

export function providerRoutes(controller: ProviderController): Router {
  const router = Router();

  router.post('/oauth/token', (req, res, next) => controller.issueToken(req, res, next));

  return router;
}
