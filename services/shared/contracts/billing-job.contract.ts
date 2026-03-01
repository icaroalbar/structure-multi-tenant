export interface BillingJobMessage {
  jobId: string;
  tenantId: string;
  customerId: string;
  amount: number;
  issuedAt: string;
}

export interface NestRmqEventEnvelope<TData> {
  pattern: string;
  data: TData;
}

export function createNestRmqEventEnvelope<TData>(
  pattern: string,
  data: TData
): NestRmqEventEnvelope<TData> {
  return {
    pattern,
    data
  };
}

export function assertBillingJobMessage(message: unknown): asserts message is BillingJobMessage {
  if (!message || typeof message !== 'object') {
    throw new Error('Invalid job message payload');
  }

  const candidate = message as Partial<BillingJobMessage>;

  if (typeof candidate.jobId !== 'string' || candidate.jobId.trim().length === 0) {
    throw new Error('jobId is required');
  }

  if (typeof candidate.tenantId !== 'string' || candidate.tenantId.trim().length === 0) {
    throw new Error('tenantId is required');
  }

  if (typeof candidate.customerId !== 'string' || candidate.customerId.trim().length === 0) {
    throw new Error('customerId is required');
  }

  if (typeof candidate.amount !== 'number' || !Number.isFinite(candidate.amount)) {
    throw new Error('amount must be a finite number');
  }

  if (typeof candidate.issuedAt !== 'string' || candidate.issuedAt.trim().length === 0) {
    throw new Error('issuedAt is required');
  }
}
