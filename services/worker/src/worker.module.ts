import { Module } from '@nestjs/common';

import { ProcessJobUseCase } from './application/jobs/process-job.usecase';
import { RedisIdempotencyService } from './infrastructure/cache/redis-idempotency.service';
import { RabbitMqTopologyService } from './infrastructure/messaging/rabbitmq-topology.service';
import { JobConsumer } from './interfaces/messages/job.consumer';

@Module({
  controllers: [JobConsumer],
  providers: [ProcessJobUseCase, RedisIdempotencyService, RabbitMqTopologyService]
})
export class WorkerModule {}
