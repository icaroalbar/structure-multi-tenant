export const IDEMPOTENCY_PORT = Symbol('IDEMPOTENCY_PORT');

export interface IdempotencyPort {
  reserve(key: string, ttlSeconds: number): Promise<boolean>;
}
