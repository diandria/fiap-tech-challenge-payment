import { Request, Response, NextFunction } from 'express';
import { Logger } from 'pino';
import { AppError } from '../../entities/errors/AppError';

/** The `type` express.json() gives a body it could not parse. */
const UNPARSABLE_BODY = 'entity.parse.failed';

export function errorMiddleware(logger: Logger) {
  return (err: Error & { type?: string }, _req: Request, res: Response, _next: NextFunction): void => {
    if (err instanceof AppError) {
      res.status(err.statusCode).json({ error: err.message });
      return;
    }
    if (err.type === UNPARSABLE_BODY) {
      res.status(400).json({ error: 'Invalid JSON body' });
      return;
    }
    // The message stays in the log: it may carry addresses or internals the
    // caller has no business seeing.
    logger.error({ err }, 'unexpected error');
    res.status(500).json({ error: 'Internal server error' });
  };
}
