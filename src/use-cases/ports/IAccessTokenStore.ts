export interface IssuedToken {
  token: string;
  /** Seconds until the token stops being accepted. */
  expiresIn: number;
}

export interface IAccessTokenStore {
  issue(clientId: string): Promise<IssuedToken>;
  /** Whose token this is, or null when it was never issued or has expired. */
  find(token: string): Promise<{ clientId: string } | null>;
}
