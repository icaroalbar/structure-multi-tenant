import { Module } from '@nestjs/common';

import { ProcessJobUseCase } from './application/jobs/process-job.usecase';
import { IDEMPOTENCY_PORT } from './application/jobs/ports/idempotency.port';
import { RedisIdempotencyService } from './infrastructure/cache/redis-idempotency.service';
import { RabbitMqTopologyService } from './infrastructure/messaging/rabbitmq-topology.service';
import { JobConsumer } from './interfaces/messages/job.consumer';

@Module({
  controllers: [JobConsumer],
  providers: [
    ProcessJobUseCase,
    RedisIdempotencyService,
    {
      provide: IDEMPOTENCY_PORT,
      useExisting: RedisIdempotencyService
    },
    RabbitMqTopologyService
  ]
})
export class WorkerModule {}
