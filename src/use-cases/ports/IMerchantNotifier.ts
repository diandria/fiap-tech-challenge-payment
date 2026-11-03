export interface IMerchantNotifier {
  /** Tells the merchant a payment happened. True when the merchant acknowledged it. */
  notify(notificationUrl: string, paymentId: number): Promise<boolean>;
}
