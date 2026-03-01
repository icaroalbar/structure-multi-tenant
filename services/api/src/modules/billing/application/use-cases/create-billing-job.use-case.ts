import { Inject, Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import { BillingJobEntity } from '../../domain/entities/billing-job.entity';
import {
  BILLING_PUBLISHER,
  BillingPublisher,
} from '../../infrastructure/messaging/billing-publisher.port';

@Injectable()
export class CreateBillingJobUseCase {
  constructor(
    @Inject(BILLING_PUBLISHER)
    private readonly billingPublisher: BillingPublisher,
  ) {}

  async execute(input: {
    tenantId: string;
    customerId: string;
    amount: number;
  }): Promise<BillingJobEntity> {
    const job = new BillingJobEntity(
      randomUUID(),
      input.tenantId,
      input.customerId,
      input.amount,
      new Date(),
    );

    await this.billingPublisher.publish({
      jobId: job.id,
      tenantId: job.tenantId,
      customerId: job.customerId,
      amount: job.amount,
      issuedAt: job.createdAt.toISOString(),
    });

    return job;
  }
}
