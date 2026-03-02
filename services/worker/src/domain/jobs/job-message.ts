import type { BillingJobMessage } from '../../../../shared/contracts/billing-job.contract';

export type JobMessage = BillingJobMessage & {
  forceError?: boolean;
};
