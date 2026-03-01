import type { BillingJobMessage } from '../../../../../../shared/contracts/billing-job.contract';

export const BILLING_PUBLISHER = Symbol('BILLING_PUBLISHER');
export type { BillingJobMessage };

export interface BillingPublisher {
  publish(message: BillingJobMessage): Promise<void>;
}
