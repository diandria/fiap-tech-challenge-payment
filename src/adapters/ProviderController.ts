import { Request, Response, NextFunction } from 'express';
import { PreferenceItem } from '../entities/Preference';
import { IssueAccessTokenUseCase } from '../use-cases/IssueAccessTokenUseCase';
import { CreatePreferenceUseCase } from '../use-cases/CreatePreferenceUseCase';
import { GetCheckoutUseCase } from '../use-cases/GetCheckoutUseCase';
import { PayCheckoutUseCase } from '../use-cases/PayCheckoutUseCase';
import { GetPaymentUseCase } from '../use-cases/GetPaymentUseCase';

export interface ProviderUseCases {
  issueAccessToken: IssueAccessTokenUseCase;
  createPreference: CreatePreferenceUseCase;
  getCheckout: GetCheckoutUseCase;
  payCheckout: PayCheckoutUseCase;
  getPayment: GetPaymentUseCase;
}

interface ItemBody {
  title?: unknown;
  quantity?: unknown;
  unit_price?: unknown;
  currency_id?: unknown;
}

function toItems(items: unknown): PreferenceItem[] {
  if (!Array.isArray(items)) return [];
  return items.map((item: ItemBody) => ({
    title: item.title as string,
    quantity: item.quantity as number,
    unitPrice: item.unit_price as number,
    currencyId: item.currency_id as string,
  }));
}

/**
 * The provider's HTTP contract, shaped like the part of Mercado Pago the
 * Billing Service calls: snake_case on the wire, the domain's names inside.
 */
export class ProviderController {
  constructor(
    private readonly useCases: ProviderUseCases,
    /** Public address of this service, where the customer opens the checkout link. */
    private readonly checkoutBaseUrl: string,
  ) {}

  async issueToken(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body ?? {};
      const issued = await this.useCases.issueAccessToken.execute({
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

  async createPreference(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const body = req.body ?? {};
      const preference = await this.useCases.createPreference.execute({
        clientId: res.locals.clientId,
        items: toItems(body.items),
        externalReference: body.external_reference,
        notificationUrl: body.notification_url,
      });
      res.status(201).json({
        id: preference.id,
        init_point: `${this.checkoutBaseUrl}/checkout/${preference.id}`,
        external_reference: preference.externalReference,
        total_amount: preference.totalAmount,
        date_created: preference.createdAt.toISOString(),
      });
    } catch (err) { next(err); }
  }

  async getCheckout(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { preference, status } = await this.useCases.getCheckout.execute(req.params.preferenceId);
      res.status(200).json({
        id: preference.id,
        description: preference.items.map((item) => item.title).join(', '),
        total_amount: preference.totalAmount,
        currency_id: preference.items[0].currencyId,
        external_reference: preference.externalReference,
        status,
      });
    } catch (err) { next(err); }
  }

  async pay(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const { payment, merchantNotified } = await this.useCases.payCheckout.execute({
        preferenceId: req.params.preferenceId,
        status: req.body?.status,
      });
      res.status(201).json({ payment_id: payment.id, status: payment.status, merchant_notified: merchantNotified });
    } catch (err) { next(err); }
  }

  async getPayment(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const payment = await this.useCases.getPayment.execute({ paymentId: req.params.paymentId, clientId: res.locals.clientId });
      res.status(200).json({
        id: payment.id,
        status: payment.status,
        status_detail: payment.statusDetail,
        transaction_amount: payment.transactionAmount,
        currency_id: payment.currencyId,
        external_reference: payment.externalReference,
        date_created: payment.createdAt.toISOString(),
      });
    } catch (err) { next(err); }
  }
}
