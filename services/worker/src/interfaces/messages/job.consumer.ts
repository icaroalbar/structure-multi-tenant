import { Controller } from '@nestjs/common';
import { Ctx, MessagePattern, Payload, RmqContext } from '@nestjs/microservices';

import { ProcessJobUseCase } from '../../application/jobs/process-job.usecase';
import { InvalidJobMessageError } from '../../domain/jobs/invalid-job-message.error';
import type { JobMessage } from '../../domain/jobs/job-message';
import { RABBITMQ_TOPOLOGY } from '../../infrastructure/messaging/rabbitmq.constants';

@Controller()
export class JobConsumer {
  constructor(private readonly processJobUseCase: ProcessJobUseCase) {}

  @MessagePattern(RABBITMQ_TOPOLOGY.routingKey)
  async consume(@Payload() message: unknown, @Ctx() context: RmqContext): Promise<void> {
    const channel = context.getChannelRef();
    const originalMessage = context.getMessage();

    try {
      this.assertValidMessage(message);
      await this.processJobUseCase.execute(message);
      channel.ack(originalMessage);
    } catch (error) {
      channel.nack(originalMessage, false, false);
      throw error;
    }
  }

  private assertValidMessage(message: unknown): asserts message is JobMessage {
    if (!message || typeof message !== 'object') {
      throw new InvalidJobMessageError('Invalid job message payload');
    }

    const candidate = message as Partial<JobMessage>;

    if (typeof candidate.tenantId !== 'string' || candidate.tenantId.trim().length === 0) {
      throw new InvalidJobMessageError('tenantId is required');
    }

    if (typeof candidate.jobId !== 'string' || candidate.jobId.trim().length === 0) {
      throw new InvalidJobMessageError('jobId is required');
    }

    if (!Object.prototype.hasOwnProperty.call(candidate, 'payload')) {
      throw new InvalidJobMessageError('payload is required');
    }
  }
}
