export const BILLING_PUBLISHER = Symbol('BILLING_PUBLISHER');

export interface BillingJobMessage {
  jobId: string;
  tenantId: string;
  customerId: string;
  amount: number;
  issuedAt: string;
}

export interface BillingPublisher {
  publish(message: BillingJobMessage): Promise<void>;
}
