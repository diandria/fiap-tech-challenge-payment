import { Request, Response, NextFunction } from 'express';
import { IssueAccessTokenUseCase } from '../use-cases/IssueAccessTokenUseCase';

/** The provider's HTTP contract, shaped like the part of Mercado Pago the Billing Service calls. */
export class ProviderController {
  constructor(private readonly issueAccessToken: IssueAccessTokenUseCase) {}

  async issueToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body ?? {};
      const issued = await this.issueAccessToken.execute({
        grantType: body.grant_type,
        clientId: body.client_id,
        clientSecret: body.client_secret,
      });
      // Never live: this provider moves no real money, whatever test_token says.
      res.status(200).json({
        access_token: issued.token,
        token_type: 'Bearer',
        expires_in: issued.expiresIn,
        live_mode: false,
      });
    } catch (err) { next(err); }
  }
}
