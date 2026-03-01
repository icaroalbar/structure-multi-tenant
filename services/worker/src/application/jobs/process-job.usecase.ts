import { Injectable } from '@nestjs/common';

import type { JobMessage } from '../../domain/jobs/job-message';
import { RedisIdempotencyService } from '../../infrastructure/cache/redis-idempotency.service';

@Injectable()
export class ProcessJobUseCase {
  constructor(private readonly redisIdempotencyService: RedisIdempotencyService) {}

  async execute(message: JobMessage): Promise<'processed' | 'duplicate'> {
    const idempotencyKey = `job:${message.tenantId}:${message.jobId}`;
    const reserved = await this.redisIdempotencyService.reserve(idempotencyKey, 3_600);

    if (!reserved) {
      return 'duplicate';
    }

    if (message.forceError) {
      throw new Error('Forced failure to route message to DLQ');
    }

    return 'processed';
  }
}
