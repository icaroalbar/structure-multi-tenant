import { Inject, Injectable } from '@nestjs/common';

import type { JobMessage } from '../../domain/jobs/job-message';
import {
  IDEMPOTENCY_PORT,
  type IdempotencyPort
} from './ports/idempotency.port';

@Injectable()
export class ProcessJobUseCase {
  constructor(
    @Inject(IDEMPOTENCY_PORT)
    private readonly idempotencyPort: IdempotencyPort
  ) {}

  async execute(message: JobMessage): Promise<'processed' | 'duplicate'> {
    const idempotencyKey = `job:${message.tenantId}:${message.jobId}`;
    const reserved = await this.idempotencyPort.reserve(idempotencyKey, 3_600);

    if (!reserved) {
      return 'duplicate';
    }

    if (message.forceError) {
      throw new Error('Forced failure to route message to DLQ');
    }

    return 'processed';
  }
}
