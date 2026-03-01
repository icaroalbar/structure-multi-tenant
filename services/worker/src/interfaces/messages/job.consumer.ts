import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

import { ProcessJobUseCase } from '../../application/jobs/process-job.usecase';
import type { JobMessage } from '../../domain/jobs/job-message';
import { RABBITMQ_TOPOLOGY } from '../../infrastructure/messaging/rabbitmq.constants';

@Controller()
export class JobConsumer {
  constructor(private readonly processJobUseCase: ProcessJobUseCase) {}

  @MessagePattern(RABBITMQ_TOPOLOGY.routingKey)
  async consume(@Payload() message: JobMessage, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      await this.processJobUseCase.execute(message);
      channel.ack(originalMessage);
    } catch (error) {
      channel.nack(originalMessage, false, false);
      throw error;
    }
  }
}
