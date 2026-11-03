import { Request, Response, NextFunction } from 'express';
import { AppError } from '../../entities/errors/AppError';
import { IAccessTokenStore } from '../../use-cases/ports/IAccessTokenStore';

/**
 * Accepts only a token this provider issued and that has not expired, and
 * leaves the client it belongs to in `res.locals.clientId`.
 */
export function bearerAuthMiddleware(tokens: IAccessTokenStore) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const [scheme, token] = (req.header('authorization') ?? '').split(' ');
    const owner = scheme === 'Bearer' && token ? await tokens.find(token) : null;
    if (!owner) {
      next(new AppError('invalid access token', 401));
      return;
    }
    res.locals.clientId = owner.clientId;
    next();
  };
}
