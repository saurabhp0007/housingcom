export const PUSH_PROVIDER = Symbol('PUSH_PROVIDER');

export interface PushMessage {
  title: string;
  body: string;
  /** Delivered to the app; `url` is the in-app route opened on tap. */
  data: { url?: string | null; type: string; [key: string]: unknown };
  /** Same key replaces an earlier notification on the device (e.g. one per chat thread). */
  collapseKey?: string;
}

export interface PushResult {
  sent: number;
  /** Tokens the provider says are dead; the caller forgets them. */
  invalidTokens: string[];
}

export interface PushProvider {
  send(tokens: string[], message: PushMessage): Promise<PushResult>;
}
